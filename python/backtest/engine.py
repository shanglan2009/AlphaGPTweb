"""回测引擎"""
import numpy as np
from typing import List, Dict, Tuple
from dataclasses import dataclass


@dataclass
class BacktestConfig:
    initial_capital: float = 100000
    top_n: int = 5
    hold_days: int = 1
    stop_loss: float = -0.05
    take_profit: float = 0.10
    commission: float = 0.0003  # 万三佣金


@dataclass
class Trade:
    date: str
    stock_code: str
    action: str  # "buy" | "sell"
    price: float
    shares: int
    amount: float
    pnl: float = 0
    pnl_pct: float = 0


def run_backtest(
    picks_by_date: Dict[str, List[Dict]],
    price_data: Dict[str, Dict[str, float]],
    config: BacktestConfig = None
) -> dict:
    """执行回测"""
    if config is None:
        config = BacktestConfig()

    capital = config.initial_capital
    positions = {}  # {code: {shares, entry_price}}
    trades = []
    equity_curve = []
    wins = []
    monthly_returns = {}

    dates = sorted(picks_by_date.keys())

    for date_idx, date in enumerate(dates):
        picks = picks_by_date[date][:config.top_n]

        # 卖出持仓
        for code in list(positions.keys()):
            pos = positions[code]
            if date_idx >= len(dates) - 1:
                continue
            next_date = dates[date_idx + 1]
            if code in price_data and next_date in price_data[code]:
                exit_price = price_data[code][next_date]
                pnl = (exit_price - pos["entry_price"]) * pos["shares"]
                pnl_pct = (exit_price - pos["entry_price"]) / pos["entry_price"]

                trades.append(Trade(date, code, "sell", exit_price, pos["shares"],
                                    exit_price * pos["shares"], pnl, pnl_pct))
                capital += exit_price * pos["shares"]
                wins.append(pnl_pct > 0)
                del positions[code]

        # 买入推荐
        if picks:
            per_stock = capital * 0.95 / len(picks)
            for pick in picks:
                code = pick["stock_code"]
                if code in price_data and date in price_data[code]:
                    price = price_data[code][date]
                    shares = int(per_stock / price / 100) * 100
                    if shares >= 100:
                        cost = price * shares * (1 + config.commission)
                        positions[code] = {"shares": shares, "entry_price": price}
                        capital -= cost
                        trades.append(Trade(date, code, "buy", price, shares, cost))

        # 记录权益
        portfolio_value = capital
        for code, pos in positions.items():
            if date in price_data.get(code, {}):
                portfolio_value += price_data[code][date] * pos["shares"]
        equity_curve.append({"date": date, "equity": portfolio_value})

        # 月度统计
        month = date[:7]
        if month not in monthly_returns:
            monthly_returns[month] = {"trades": 0, "wins": 0}
        monthly_returns[month]["trades"] += len(picks)

    # 计算指标
    total_return = (equity_curve[-1]["equity"] - config.initial_capital) / config.initial_capital if equity_curve else 0
    win_rate = sum(wins) / len(wins) if wins else 0
    total_trades = len(wins)

    # 最大回撤
    peak = config.initial_capital
    max_dd = 0
    for point in equity_curve:
        peak = max(peak, point["equity"])
        dd = (peak - point["equity"]) / peak
        max_dd = max(max_dd, dd)

    # 年化
    if equity_curve:
        days = len(equity_curve)
        annual_return = (1 + total_return) ** (252 / days) - 1
        vals = np.array([p["equity"] for p in equity_curve])
        daily_rets = np.diff(vals) / (vals[:-1] + 1e-9)
        sharpe = np.mean(daily_rets) / (np.std(daily_rets) + 1e-9) * np.sqrt(252)
    else:
        annual_return = 0
        sharpe = 0

    return {
        "total_return": float(total_return),
        "annual_return": float(annual_return),
        "sharpe_ratio": float(sharpe),
        "max_drawdown": float(max_dd),
        "win_rate": float(win_rate),
        "total_trades": total_trades,
        "winning_trades": int(sum(wins)),
        "equity_curve": equity_curve,
        "monthly_returns": [{"month": m, "trades": d["trades"], "wins": d["wins"]}
                            for m, d in monthly_returns.items()],
    }
