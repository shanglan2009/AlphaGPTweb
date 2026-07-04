"""模型推理脚本 — 每日生成荐股"""
import sys
import os
import json
import logging
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

try:
    import psycopg2
    HAS_PG = True
except ImportError:
    HAS_PG = False

DATABASE_URL = os.getenv("DATABASE_URL", "")


def load_model():
    """加载模型（简化版：使用多因子评分）"""
    return {"version": "v1", "type": "multi_factor"}


def score_stocks(daily_data: dict) -> list[dict]:
    """
    多因子评分模型
    因子权重可通过胜率反馈自动调整
    """
    if not HAS_NUMPY:
        return []

    weights = {
        "momentum_5d": 0.20,
        "momentum_20d": 0.10,
        "volatility_5d": -0.15,
        "volume_ratio": 0.15,
        "rsi": 0.10,
        "trend_strength": 0.15,
        "reversal": 0.05,
        "liquidity": 0.10,
    }

    scores = []
    for code, data in daily_data.items():
        close = np.array(data.get("close", []))
        volume = np.array(data.get("volume", []))
        if len(close) < 20:
            continue

        mom_5 = (close[-1] - close[-6]) / (close[-6] + 1e-9) if len(close) >= 6 else 0
        mom_20 = (close[-1] - close[-21]) / (close[-21] + 1e-9) if len(close) >= 21 else 0
        rets = np.diff(close[-6:]) / (close[-7:-1] + 1e-9) if len(close) >= 7 else [0]
        vol_5 = np.std(rets) if len(rets) > 0 else 0
        vol_ma5 = np.mean(volume[-6:-1]) if len(volume) >= 6 else volume[-1] + 1e-9
        vol_ratio = min(volume[-1] / (vol_ma5 + 1e-9), 5)
        rsi = compute_rsi(close)
        trend = compute_trend(close)
        reversal = detect_reversal(close)
        liquidity = np.log1p(volume[-1] * close[-1])

        total = (
            weights["momentum_5d"] * mom_5 +
            weights["momentum_20d"] * mom_20 +
            weights["volatility_5d"] * vol_5 +
            weights["volume_ratio"] * (vol_ratio - 1) +
            weights["rsi"] * ((rsi - 50) / 50) +
            weights["trend_strength"] * trend +
            weights["reversal"] * reversal +
            weights["liquidity"] * (liquidity / 1e6)
        )

        confidence = min(max(abs(total) / 0.3, 0.5), 0.95)
        predicted_return = np.clip(total * 0.01, -0.1, 0.1)

        scores.append({
            "stock_code": code,
            "stock_name": data.get("name", code),
            "predicted_return": float(predicted_return),
            "confidence": float(confidence),
            "reason": f"动量:{mom_5:.2%} 量比:{vol_ratio:.1f} RSI:{rsi:.0f}",
            "model_version": "v1",
        })

    return sorted(scores, key=lambda x: x["predicted_return"], reverse=True)


def compute_rsi(close: np.ndarray, period: int = 14) -> float:
    if len(close) < period + 1:
        return 50.0
    delta = np.diff(close)
    gains = np.where(delta > 0, delta, 0)
    losses = np.where(delta < 0, -delta, 0)
    avg_gain = np.mean(gains[-period:])
    avg_loss = np.mean(losses[-period:])
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100 - 100 / (1 + rs)


def compute_trend(close: np.ndarray) -> float:
    if len(close) < 20:
        return 0
    x = np.arange(20)
    y = close[-20:]
    slope = np.polyfit(x, y, 1)[0]
    return float(np.tanh(slope / (close[-20] + 1e-9) * 100))


def detect_reversal(close: np.ndarray) -> float:
    if len(close) < 3:
        return 0
    yesterday = (close[-2] - close[-3]) / (close[-3] + 1e-9)
    return 1.0 if yesterday < -0.02 and close[-1] > close[-2] else 0.0


def run_inference():
    """执行每日推理"""
    logger.info("========== 开始每日荐股推理 ==========")

    if HAS_PG and DATABASE_URL:
        try:
            conn = psycopg2.connect(DATABASE_URL)
            cur = conn.cursor()
            cur.execute("""
                SELECT ts_code, trade_date, close, volume
                FROM daily_ohlcv
                WHERE trade_date >= CURRENT_DATE - INTERVAL '60 days'
                ORDER BY ts_code, trade_date
            """)
            rows = cur.fetchall()
            daily_data = {}
            for r in rows:
                if r[0] not in daily_data:
                    daily_data[r[0]] = {"close": [], "volume": [], "name": r[0]}
                daily_data[r[0]]["close"].append(float(r[2]))
                daily_data[r[0]]["volume"].append(float(r[3]))
            cur.close()
            conn.close()
            logger.info(f"加载 {len(daily_data)} 只股票数据")
        except Exception as e:
            logger.error(f"数据库加载失败: {e}")
            daily_data = {}
    else:
        logger.warning("无数据库连接，使用模拟数据")
        daily_data = {}

    picks = score_stocks(daily_data)
    picks = [{"rank": i+1, **p} for i, p in enumerate(picks[:20])]

    today = datetime.now().strftime("%Y-%m-%d")

    if HAS_PG and DATABASE_URL:
        try:
            conn = psycopg2.connect(DATABASE_URL)
            cur = conn.cursor()
            for p in picks:
                cur.execute("""
                    INSERT INTO daily_picks (date, stock_code, stock_name, predicted_return, confidence, rank, reason, model_version)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (date, stock_code) DO UPDATE SET
                        predicted_return=EXCLUDED.predicted_return,
                        confidence=EXCLUDED.confidence,
                        rank=EXCLUDED.rank
                """, (today, p["stock_code"], p["stock_name"], p["predicted_return"],
                      p["confidence"], p["rank"], p["reason"], p["model_version"]))
            conn.commit()
            cur.close()
            conn.close()
            logger.info(f"保存 {len(picks)} 条荐股结果")
        except Exception as e:
            logger.error(f"保存结果失败: {e}")

    output_path = Path(__file__).parent.parent / "data" / f"picks_{today}.json"
    output_path.parent.mkdir(exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(picks, f, ensure_ascii=False, indent=2)
    logger.info(f"结果输出到 {output_path}")

    print("\n" + "=" * 60)
    print(f"  AlphaGPTweb 每日荐股 — {today}")
    print("=" * 60)
    for p in picks[:5]:
        print(f"  #{p['rank']} {p['stock_name']:6s} ({p['stock_code']:12s}) "
              f"预测收益: {p['predicted_return']:+.2%}  置信度: {p['confidence']:.0%}")


if __name__ == "__main__":
    run_inference()
