"""数据管线配置"""
import os
from dotenv import load_dotenv

load_dotenv()

# 存储后端
STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "csv")
DATA_DIR = os.getenv("DATA_DIR", "./data")

# 数据库
DATABASE_URL = os.getenv("DATABASE_URL", "")
MARKET_DB_HOST = os.getenv("MARKET_DB_HOST", "localhost")
MARKET_DB_PORT = int(os.getenv("MARKET_DB_PORT", "5432"))
MARKET_DB_NAME = os.getenv("MARKET_DB_NAME", "market")
MARKET_DB_USER = os.getenv("MARKET_DB_USER", "postgres")
MARKET_DB_PASSWORD = os.getenv("MARKET_DB_PASSWORD", "")

# API Keys
TUSHARE_TOKEN = os.getenv("TUSHARE_TOKEN", "")
TICKFLOW_API_KEY = os.getenv("TICKFLOW_API_KEY", "")

# A股交易时间
MARKET_OPEN = "09:30"
MARKET_CLOSE = "15:00"
TIMEZONE = "Asia/Shanghai"
