"""数据管线主脚本 — 采集A股日线数据并存入数据库"""
import sys
import os
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

try:
    import pandas as pd
    import requests
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    logger.warning("pandas 未安装，部分功能不可用")

try:
    import tushare as ts
    HAS_TUSHARE = True
except ImportError:
    HAS_TUSHARE = False
    logger.warning("tushare 未安装，将使用 baostock + 腾讯备用源")

try:
    import baostock as bs
    HAS_BAOSTOCK = True
except ImportError:
    HAS_BAOSTOCK = False


def get_stock_list() -> list[dict]:
    """获取A股股票列表"""
    stocks = []

    # Try baostock first (free, no API key needed)
    if HAS_BAOSTOCK:
        try:
            bs.login()
            rs = bs.query_stock_basic()
            while rs.next():
                row = rs.get_row_data()
                stocks.append({
                    "ts_code": row[0],
                    "symbol": row[0].split(".")[1] if "." in row[0] else row[0],
                    "name": row[1],
                    "industry": "",
                    "market": row[0].split(".")[1][:2] if "." in row[0] else "",
                })
            bs.logout()
            logger.info(f"从 baostock 获取 {len(stocks)} 只股票")
        except Exception as e:
            logger.error(f"baostock 股票列表获取失败: {e}")

    # Try Tushare
    if not stocks and HAS_TUSHARE:
        try:
            from data_pipeline.config import TUSHARE_TOKEN
            pro = ts.pro_api(TUSHARE_TOKEN)
            df = pro.stock_basic(exchange="", list_status="L", fields="ts_code,symbol,name,area,industry,market,list_date")
            stocks = df.to_dict("records")
            logger.info(f"从 Tushare 获取 {len(stocks)} 只股票")
        except Exception as e:
            logger.error(f"Tushare 股票列表获取失败: {e}")

    return stocks


def fetch_daily_data(stock_codes: list[str], start_date: str, end_date: str) -> list[dict]:
    """获取日线OHLCV数据"""
    data = []

    if HAS_BAOSTOCK:
        try:
            bs.login()
            for code in stock_codes[:100]:  # 限频，分批处理
                sp = code.split(".")
                bs_code = f"{sp[1].lower()}.{sp[0]}"
                rs = bs.query_history_k_data_plus(
                    bs_code, "date,code,open,high,low,close,preclose,volume,amount",
                    start_date=start_date, end_date=end_date, frequency="d", adjustflag="2"
                )
                while rs.next():
                    row = rs.get_row_data()
                    data.append({
                        "ts_code": code, "trade_date": row[0],
                        "open": float(row[2]), "high": float(row[3]),
                        "low": float(row[4]), "close": float(row[5]),
                        "pre_close": float(row[6]), "vol": float(row[7]),
                        "amount": float(row[8]),
                    })
            bs.logout()
            logger.info(f"从 baostock 获取 {len(data)} 条日线数据")
        except Exception as e:
            logger.error(f"baostock 日线获取失败: {e}")

    return data


def save_to_neon(data: list[dict], table: str):
    """保存数据到 Neon PostgreSQL"""
    if not DATABASE_URL:
        logger.warning("DATABASE_URL 未设置，跳过数据库写入")
        return

    try:
        import psycopg2
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        if table == "daily_ohlcv":
            cur.execute("""
                CREATE TABLE IF NOT EXISTS daily_ohlcv (
                    ts_code VARCHAR(20), trade_date DATE, open DOUBLE PRECISION,
                    high DOUBLE PRECISION, low DOUBLE PRECISION, close DOUBLE PRECISION,
                    pre_close DOUBLE PRECISION, vol DOUBLE PRECISION, amount DOUBLE PRECISION,
                    PRIMARY KEY (ts_code, trade_date)
                )
            """)

            for d in data:
                cur.execute("""
                    INSERT INTO daily_ohlcv VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (ts_code, trade_date) DO UPDATE SET
                        open=EXCLUDED.open, high=EXCLUDED.high, low=EXCLUDED.low,
                        close=EXCLUDED.close, pre_close=EXCLUDED.pre_close,
                        vol=EXCLUDED.vol, amount=EXCLUDED.amount
                """, (d["ts_code"], d["trade_date"], d["open"], d["high"], d["low"],
                      d["close"], d["pre_close"], d["vol"], d["amount"]))

        conn.commit()
        cur.close()
        conn.close()
        logger.info(f"写入 {len(data)} 条数据到 Neon")
    except Exception as e:
        logger.error(f"Neon 写入失败: {e}")


def run_pipeline():
    """执行完整数据管线"""
    logger.info("========== 开始数据采集管线 ==========")
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")

    # 1. 获取股票列表
    stocks = get_stock_list()
    if not stocks:
        logger.error("无法获取股票列表，管线终止")
        return

    # 2. 获取日线数据
    stock_codes = [s["ts_code"] for s in stocks]
    daily_data = fetch_daily_data(stock_codes, start_date, end_date)

    # 3. 保存到数据库
    if daily_data:
        from data_pipeline.config import DATABASE_URL
        save_to_neon(daily_data, "daily_ohlcv")

    logger.info(f"========== 管线完成: {len(stocks)} 只股票, {len(daily_data)} 条日线 ==========")


if __name__ == "__main__":
    run_pipeline()
