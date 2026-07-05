"""沪深300 荐股推理 — 基于真实日线数据的多因子评分"""
import os, sys, logging
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("inference")

DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    logger.error("DATABASE_URL not set")
    sys.exit(0)

import numpy as np
import psycopg2
from data_pipeline.csi300_stocks import CSI300_MAP

def compute_rsi(close, period=14):
    if len(close) < period + 1: return 50.0
    delta = np.diff(close)
    gains = np.where(delta > 0, delta, 0)
    losses = np.where(delta < 0, -delta, 0)
    avg_gain = np.mean(gains[-period:])
    avg_loss = np.mean(losses[-period:])
    if avg_loss == 0: return 100.0
    return 100 - 100 / (1 + avg_gain / avg_loss)

def compute_trend(close):
    if len(close) < 20: return 0
    n = min(20, len(close))
    x = np.arange(n)
    y = close[-n:]
    slope = np.polyfit(x, y, 1)[0]
    return float(np.tanh(slope / (abs(close[-n]) + 1e-9) * 100))

def score(close, volume):
    c = np.array(close); v = np.array(volume)
    if len(c) < 20: return None
    mom5 = (c[-1]-c[-6])/(c[-6]+1e-9) if len(c)>=6 else 0
    mom20 = (c[-1]-c[-21])/(c[-21]+1e-9) if len(c)>=21 else 0
    rets = np.diff(c[-6:])/(c[-7:-1]+1e-9) if len(c)>=7 else [0]
    vol5 = np.std(rets) if len(rets)>0 else 0
    vol_ma5 = np.mean(v[-6:-1]) if len(v)>=6 else v[-1]+1e-9
    vol_ratio = min(v[-1]/(vol_ma5+1e-9), 5)
    rsi = compute_rsi(c)
    trend = compute_trend(c)
    rev = 1.0 if len(c)>=3 and (c[-2]-c[-3])/(c[-3]+1e-9)<-0.02 and c[-1]>c[-2] else 0
    w = {"m5":.20,"m20":.10,"v5":-.15,"vr":.15,"rsi":.10,"tr":.15,"rv":.05,"liq":.10}
    total = w["m5"]*mom5 + w["m20"]*mom20 + w["v5"]*vol5 + w["vr"]*(vol_ratio-1) + w["rsi"]*((rsi-50)/50) + w["tr"]*trend + w["rv"]*rev + w["liq"]*(np.log1p(v[-1]*c[-1])/1e6)
    return {"predicted_return":float(round(np.clip(total*0.01,-0.1,0.1),4)),"confidence":float(round(min(max(abs(total)/0.3,0.5),0.95),2)),"reason":f"动量:{mom5:.1%} 量比:{vol_ratio:.1f} RSI:{rsi:.0f}"}

def run():
    logger.info("=== CSI300 荐股推理 ===")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    today = datetime.now().strftime("%Y-%m-%d")
    cur.execute("DELETE FROM daily_picks WHERE date = %s::date", (today,))
    
    cur.execute("SELECT ts_code, trade_date, close, vol FROM daily_ohlcv WHERE trade_date >= CURRENT_DATE - INTERVAL '60 days' ORDER BY ts_code, trade_date")
    stock_data = {}
    for code, dt, cl, vol in cur.fetchall():
        if code not in stock_data: stock_data[code] = {"close":[],"volume":[]}
        stock_data[code]["close"].append(float(cl))
        stock_data[code]["volume"].append(float(vol))
    logger.info(f"Loaded {len(stock_data)} stocks")
    
    results = []
    for code, data in stock_data.items():
        s = score(data["close"], data["vol"])
        if s:
            name = CSI300_MAP.get(code, code)
            results.append({"stock_code":code,"stock_name":name,**s,"model_version":"v1"})
    
    results.sort(key=lambda x: x["predicted_return"], reverse=True)
    for i, r in enumerate(results[:20]):
        cur.execute("INSERT INTO daily_picks (date, stock_code, stock_name, predicted_return, confidence, rank, reason, model_version) VALUES (%s::date,%s,%s,%s,%s,%s,%s,%s)",(today,r["stock_code"],r["stock_name"],r["predicted_return"],r["confidence"],i+1,r["reason"],r["model_version"]))
    
    conn.commit(); cur.close(); conn.close()
    
    print("\n"+"="*60)
    print(f"  AlphaGPTweb 沪深300荐股 — {today}")
    print("="*60)
    for i, r in enumerate(results[:10]):
        print(f"  #{i+1:2d} {r['stock_name']:8s} ({r['stock_code']:12s})  {r['predicted_return']:+.2%}  置信:{r['confidence']:.0%}")
    logger.info(f"Done: {len(results)} scored, TOP 20 saved")

if __name__ == "__main__":
    run()
