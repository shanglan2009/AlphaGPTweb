// ========== Stock Types ==========

export interface StockBasic {
  ts_code: string;       // e.g. "000001.SZ"
  symbol: string;        // e.g. "000001"
  name: string;          // e.g. "平安银行"
  area: string;
  industry: string;
  market: "SH" | "SZ" | "BJ";
  list_date: string;
}

export interface DailyOHLCV {
  ts_code: string;
  trade_date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  pre_close: number;
  change: number;        // 涨跌额
  pct_chg: number;       // 涨跌幅 %
  vol: number;           // 成交量（手）
  amount: number;        // 成交额（千元）
}

// ========== Recommendation Types ==========

export interface DailyPick {
  id: string;
  date: string;          // 推荐日期 YYYY-MM-DD
  stock_code: string;
  stock_name: string;
  predicted_return: number;  // 预测收益率
  confidence: number;        // 置信度 0-1
  rank: number;              // 排名
  reason: string;            // 推荐理由
  model_version: string;
  created_at: string;
}

export interface PickOutcome {
  id: string;
  pick_id: string;
  date: string;
  stock_code: string;
  predicted_return: number;
  actual_return: number;  // T+1 实际收益率
  is_win: boolean;         // T+1 涨幅 > 0
  is_month_win: boolean;
  next_day_open: number;
  next_day_close: number;
  next_day_pct_chg: number;
}

// ========== Win Rate Types ==========

export interface WinRateData {
  date: string;
  daily_win_rate: number;      // 日胜率
  monthly_win_rate: number;    // 月胜率
  total_picks: number;
  wins: number;
  month_picks: number;
  month_wins: number;
}

export interface WinRateHistory {
  date: string;
  daily_win_rate: number;
  monthly_win_rate: number;
  cumulative_win_rate: number; // 累计胜率
  total_picks: number;
  wins: number;
}

// ========== Backtest Types ==========

export interface BacktestParams {
  strategy_name: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  top_n: number;           // 每日选取前 N 只
  hold_days: number;       // 持有天数
  stop_loss_pct: number;   // 止损比例
  take_profit_pct: number; // 止盈比例
  model_version: string;
}

export interface BacktestResult {
  id: string;
  strategy_name: string;
  start_date: string;
  end_date: string;
  total_return: number;       // 总收益率
  annual_return: number;      // 年化收益率
  sharpe_ratio: number;       // 夏普比率
  max_drawdown: number;       // 最大回撤
  win_rate: number;           // 胜率
  total_trades: number;
  winning_trades: number;
  avg_return_per_trade: number;
  equity_curve: EquityPoint[];
  monthly_returns: MonthlyReturn[];
  created_at: string;
}

export interface EquityPoint {
  date: string;
  equity: number;
  return_pct: number;
}

export interface MonthlyReturn {
  month: string;       // YYYY-MM
  return_pct: number;
  trades: number;
  win_rate: number;
}

// ========== Portfolio Types ==========

export interface PortfolioPosition {
  id: string;
  stock_code: string;
  stock_name: string;
  weight: number;          // 持仓权重
  shares: number;          // 持仓数量
  entry_price: number;     // 入场价格
  current_price: number;   // 当前价格
  market_value: number;    // 市值
  pnl: number;             // 盈亏金额
  pnl_pct: number;         // 盈亏比例
  hold_days: number;       // 持有天数
  industry: string;
}

export interface PortfolioSnapshot {
  date: string;
  total_value: number;
  total_pnl: number;
  total_pnl_pct: number;
  positions: PortfolioPosition[];
  risk_metrics: RiskMetrics;
}

export interface RiskMetrics {
  var_95: number;           // 95% VaR
  cvar_95: number;          // 95% CVaR
  volatility: number;       // 年化波动率
  beta: number;             // Beta 系数
  sharpe_ratio: number;     // 夏普比率
  max_drawdown: number;     // 最大回撤
  concentration: number;    // 集中度 (HHI)
}

// ========== Settings Types ==========

export interface QQBotConfig {
  id: string;
  bot_qq: string;
  webhook_url: string;
  enabled: boolean;
  push_schedule: PushSchedule;
  filter_min_confidence: number;  // 最低置信度过滤
  max_stocks_per_push: number;    // 每次推送最大股票数
}

export interface PushSchedule {
  days: number[];        // 0=周日, 1=周一, ... 6=周六
  time: string;          // HH:MM
  timezone: string;      // Asia/Shanghai
}

export interface PushStrategy {
  id: string;
  channel: "qq" | "email" | "webhook";
  enabled: boolean;
  daily_push_time: string;      // HH:MM
  min_confidence: number;       // 最低置信度阈值
  max_stocks_per_push: number;
  push_on_market_open: boolean; // 开盘前推送
  push_on_market_close: boolean;// 收盘后推送
  template: string;             // 推送模板
}

// ========== Model Types ==========

export interface ModelVersion {
  version: string;
  trained_at: string;
  daily_win_rate: number;
  monthly_win_rate: number;
  total_picks: number;
  is_active: boolean;
  metrics: ModelMetrics;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  sharpe_ratio: number;
  max_drawdown: number;
}

// ========== API Response Types ==========

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  page_size: number;
}
