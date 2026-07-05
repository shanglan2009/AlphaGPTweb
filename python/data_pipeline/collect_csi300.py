"""沪深300数据采集 — 专为 GitHub Actions 优化"""
import os, sys, logging
from datetime import datetime, timedelta
import time

# 确保能找到同目录模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("csi300")

DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    logger.error("DATABASE_URL not set — 请在 GitHub Secrets 中配置")
    sys.exit(0)  # 优雅退出，不报错

from csi300_stocks import CSI300_STOCKS

def collect():
    import baostock as bs
    import psycopg2
    
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=14)).strftime("%Y-%m-%d")
    logger.info(f"CSI300: {start_date} ~ {end_date}, {len(CSI300_STOCKS)} stocks")
    
    bs.login()
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    total, errors = 0, 0
    
    for idx, (code, name) in enumerate(CSI300_STOCKS):
        try:
            parts = code.split(".")
            bsc = f"{parts[1].lower()}.{parts[0]}"
            rs = bs.query_history_k_data_plus(
                bsc, "date,open,high,low,close,preclose,volume,amount",
                start_date=start_date, end_date=end_date,
                frequency="d", adjustflag="2"
            )
            rows = []
            while rs.next():
                r = rs.get_row_data()
                if r[1]:
                    rows.append((
                        code, r[0],
                        float(r[1]), float(r[2]), float(r[3]),
                        float(r[4]), float(r[5]), float(r[6]), float(r[7])
                    ))
            if rows:
                for r in rows:
                    cur.execute(
                        "INSERT INTO daily_ohlcv VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING",
                        r
                    )
                total += len(rows)
            
            if (idx + 1) % 50 == 0:
                conn.commit()
                logger.info(f"  {idx+1}/{len(CSI300_STOCKS)} | {total} rows")
                
        except Exception as e:
            errors += 1
            if errors <= 3:
                logger.warning(f"  Skip {code} ({name}): {e}")
    
    conn.commit()
    bs.logout()
    cur.close(); conn.close()
    logger.info(f"Done: {total} rows, {errors} skips")

if __name__ == "__main__":
    collect()
