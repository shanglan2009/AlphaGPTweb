"""沪深300数据采集"""
import os, sys, logging, traceback

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("csi300")

def main():
    logger.info("=== CSI300 数据采集启动 ===")
    
    # 检查环境
    DATABASE_URL = os.getenv("DATABASE_URL", "")
    if not DATABASE_URL:
        logger.warning("DATABASE_URL 未配置，跳过采集")
        return
    
    # 导入依赖
    try:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from csi300_stocks import CSI300_STOCKS
        import baostock as bs
        import psycopg2
        from datetime import datetime, timedelta
    except Exception as e:
        logger.error(f"导入失败: {e}\n{traceback.format_exc()}")
        sys.exit(1)
    
    logger.info(f"依赖就绪, {len(CSI300_STOCKS)} 只沪深300成分股")
    
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=14)).strftime("%Y-%m-%d")
    
    # 连接数据库
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT 1")
        logger.info(f"数据库连接成功, 采集 {start_date} ~ {end_date}")
    except Exception as e:
        logger.error(f"数据库连接失败: {e}")
        sys.exit(1)
    
    # 登录 baostock
    try:
        lg = bs.login()
        logger.info(f"baostock: {lg.error_msg}")
    except Exception as e:
        logger.error(f"baostock 登录失败: {e}")
        cur.close(); conn.close()
        sys.exit(1)
    
    total, errors, success = 0, 0, 0
    
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
                if r[1] and r[1] != '':
                    rows.append((code, r[0], float(r[1]), float(r[2]), float(r[3]), float(r[4]), float(r[5]), float(r[6]), float(r[7])))
            if rows:
                for r in rows:
                    cur.execute("INSERT INTO daily_ohlcv VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING", r)
                total += len(rows)
                success += 1
        except Exception as e:
            errors += 1
            if errors <= 3:
                logger.warning(f"  {code} {name}: {e}")
        
        if (idx + 1) % 50 == 0:
            conn.commit()
            logger.info(f"  进度: {idx+1}/{len(CSI300_STOCKS)} | 成功 {success} 只 | {total} 行")
    
    conn.commit()
    bs.logout()
    cur.close(); conn.close()
    logger.info(f"=== 采集完成: {success} 只股票, {total} 行数据, {errors} 失败 ===")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.error(f"未捕获异常: {e}\n{traceback.format_exc()}")
        sys.exit(1)
