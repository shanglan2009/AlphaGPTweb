"""每日定时任务 — 数据采集 + 荐股推理"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("daily_job")

def main():
    logger.info("========== 每日定时任务开始 ==========")

    # 1. 数据采集
    try:
        from data_pipeline.pipeline import run_pipeline
        run_pipeline()
    except Exception as e:
        logger.error(f"数据采集失败: {e}")

    # 2. 模型推理
    try:
        from model.inference import run_inference
        run_inference()
    except Exception as e:
        logger.error(f"模型推理失败: {e}")

    logger.info("========== 每日定时任务完成 ==========")

if __name__ == "__main__":
    main()
