"""A股特征工程 — 适配 AlphaGPT 架构"""
import numpy as np
import pandas as pd
from typing import Dict


class AShareFeatures:
    """A股专用特征计算器（继承 AlphaGPT 的因子设计理念）"""

    FEATURE_NAMES = [
        "return_1d",      # 1日收益率
        "return_5d",      # 5日收益率
        "return_20d",     # 20日收益率
        "volatility_5d",  # 5日波动率
        "volatility_20d", # 20日波动率
        "volume_ratio",   # 量比
        "turnover_rate",  # 换手率（近似）
        "rsi_14",         # RSI
        "macd",           # MACD
        "bb_position",    # 布林带位置
        "ma_gap",         # 价格与均线偏离
        "liquidity",      # 流动性（成交额）
        "buy_sell_pressure", # 买卖压力
        "momentum",       # 动量
        "reversal_signal",# 反转信号
        "industry_rank",  # 行业排名
    ]

    @staticmethod
    def compute(data: Dict[str, np.ndarray]) -> np.ndarray:
        """计算16维特征矩阵 [features x seq_len]"""
        close = data["close"]
        volume = data["volume"]
        high = data["high"]
        low = data["low"]
        open_ = data["open"]

        def roll(arr, n):
            return np.roll(arr, n)

        features = []

        # 1-3: 多期收益率
        for window in [1, 5, 20]:
            ret = (close - roll(close, window)) / (roll(close, window) + 1e-9)
            features.append(AShareFeatures._robust_norm(ret))

        # 4-5: 波动率
        for window in [5, 20]:
            ret = np.log(close / (roll(close, 1) + 1e-9))
            ret[0] = 0
            vol = np.array([np.std(ret[max(0, i-window+1):i+1]) for i in range(len(ret))])
            features.append(AShareFeatures._robust_norm(vol))

        # 6: 量比
        vol_ma5 = np.convolve(volume, np.ones(5)/5, mode="same")
        vol_ratio = volume / 
