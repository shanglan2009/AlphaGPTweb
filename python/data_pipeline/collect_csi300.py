"""沪深300数据采集 — 专为 GitHub Actions 优化"""
import os, sys, logging
from datetime import datetime, timedelta
import time

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("csi300")

DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    logger.error("DATABASE_URL not set")
    sys.exit(1)

from csi300_stocks import CSI300_STOCKS

def collect():
    import baostock as bs
    import psycopg2
    
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=14)).strftime("%Y-%m-%d")
    logger.info(f"CSI300 collection: {start_date} ~ {end_date}, {len(CSI300_STOCKS)} stocks")
    
    bs.login()
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    total = 0
    errors = 0
    batch_start = time.time()
    
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
            
            # Commit every 50 stocks
            if (idx + 1) % 50 == 0:
                conn.commit()
                elapsed = time.time() - batch_start
                logger.info(f"Progress: {idx+1}/{len(CSI300_STOCKS)} stocks, {total} rows, {elapsed:.1f}s")
                batch_start = time.time()
                
        except Exception as e:
            errors += 1
            if errors <= 5:
                logger.warning(f"Error {code}: {e}")
    
    conn.commit()
    bs.logout()
    cur.close()
    conn.close()
    logger.info(f"Done: {total} rows, {errors} errors")

if __name__ == "__main__":
    collect()
