/** Mock 数据 — 数据库不可用时自动回退 */

import { DailyPick, BacktestResult, PortfolioPosition, RiskMetrics, WinRateData, WinRateHistory, PushStrategy, QQBotConfig } from "@/lib/types";
import { getLatestTradingDay, formatDate } from "@/lib/utils/date";

/** 检测数据库是否可用 */
export function hasDatabase(): boolean {
  return !!process.env.DATABASE_URL;
}

const MOCK_STOCKS = [
  { code: "000001.SZ", name: "平安银行", industry: "银行" },
  { code: "600519.SH", name: "贵州茅台", industry: "白酒" },
  { code: "000858.SZ", name: "五粮液", industry: "白酒" },
  { code: "601318.SH", name: "中国平安", industry: "保险" },
  { code: "600036.SH", name: "招商银行", industry: "银行" },
  { code: "000333.SZ", name: "美的集团", industry: "家电" },
  { code: "600276.SH", name: "恒瑞医药", industry: "医药" },
  { code: "002415.SZ", name: "海康威视", industry: "安防" },
  { code: "600900.SH", name: "长江电力", industry: "电力" },
  { code: "300750.SZ", name: "宁德时代", industry: "新能源" },
  { code: "601012.SH", name: "隆基绿能", industry: "光伏" },
  { code: "002594.SZ", name: "比亚迪", industry: "汽车" },
  { code: "688981.SH", name: "中芯国际", industry: "芯片" },
  { code: "600030.SH", name: "中信证券", industry: "券商" },
  { code: "601899.SH", name: "紫金矿业", industry: "矿业" },
];

const REASONS = [
  "量价齐升，突破20日均线，MACD金叉",
  "估值低位，北向资金连续3日净流入",
  "行业景气度回升，业绩超预期概率大",
  "技术面底部放量，RSI超卖反弹信号",
  "政策利好驱动，板块轮动受益标的",
  "机构调研密集，盈利预测上调",
  "低估值高股息，防御性配置首选",
  "产能扩张落地，市场份额提升",
];

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** 每日荐股 Mock */
export function mockDailyPicks(date?: string): DailyPick[] {
  const today = date || getLatestTradingDay();
  const dayNum = parseInt(today.replace(/-/g, ""), 10);
  const rng = seededRandom(dayNum);

  return MOCK_STOCKS.slice(0, 12).map((s, i) => {
    const predictedReturn = (rng() * 0.1 - 0.01) * (i < 6 ? 1 : -0.3);
    const confidence = 0.55 + rng() * 0.4;
    return {
      id: "mock-" + today + "-" + s.code,
      date: today,
      stock_code: s.code,
      stock_name: s.name,
      predicted_return: Math.round(predictedReturn * 10000) / 10000,
      confidence: Math.round(confidence * 100) / 100,
      rank: i + 1,
      reason: pick(REASONS, rng),
      model_version: "v1",
      created_at: new Date().toISOString(),
    };
  }).sort((a, b) => b.predicted_return - a.predicted_return)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

/** 胜率 Mock */
export function mockWinRate(date?: string): WinRateData {
  const today = date || getLatestTradingDay();
  const dayNum = parseInt(today.replace(/-/g, ""), 10);
  const rng = seededRandom(dayNum);
  const totalPicks = 10 + Math.floor(rng() * 5);
  const dailyWR = 0.45 + rng() * 0.35;
  return {
    date: today,
    daily_win_rate: Math.round(dailyWR * 10000) / 10000,
    monthly_win_rate: Math.round((0.48 + rng() * 0.28) * 10000) / 10000,
    total_picks: totalPicks,
    wins: Math.floor(totalPicks * dailyWR),
    month_picks: 120 + Math.floor(rng() * 40),
    month_wins: 55 + Math.floor(rng() * 35),
  };
}

/** 胜率历史 Mock */
export function mockWinRateHistory(range: number = 30): WinRateHistory[] {
  const results: WinRateHistory[] = [];
  let cumWins = 0, cumTotal = 0;
  for (let i = range; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const dateStr = formatDate(d);
    const dayNum = parseInt(dateStr.replace(/-/g, ""), 10);
    const rng = seededRandom(dayNum);
    const dailyWR = 0.45 + rng() * 0.35;
    const total = 8 + Math.floor(rng() * 7);
    const wins = Math.floor(total * dailyWR);
    cumWins += wins;
    cumTotal += total;
    results.push({
      date: dateStr,
      daily_win_rate: Math.round(dailyWR * 10000) / 10000,
      monthly_win_rate: Math.round((0.46 + rng() * 0.3) * 10000) / 10000,
      cumulative_win_rate: cumTotal > 0 ? Math.round((cumWins / cumTotal) * 10000) / 10000 : 0,
      total_picks: total,
      wins: wins,
    });
  }
  return results;
}

/** 回测结果 Mock */
export function mockBacktestResult(params: Record<string, unknown>): BacktestResult {
  const startDate = (params.start_date as string) || "2024-01-01";
  const endDate = (params.end_date as string) || getLatestTradingDay();
  const rng = seededRandom(parseInt(startDate.replace(/-/g, ""), 10));
  const totalReturn = 0.05 + rng() * 0.45;
  const winRate = 0.48 + rng() * 0.3;
  const totalTrades = 80 + Math.floor(rng() * 150);
  const equityCurve: { date: string; equity: number; return_pct: number }[] = [];
  const startD = new Date(startDate);
  const endD = new Date(endDate);
  const days = Math.min(Math.ceil((endD.getTime() - startD.getTime()) / 86400000), 250);
  let equity = 100000;
  for (let i = 0; i <= days; i++) {
    const d = new Date(startD);
    d.setDate(d.getDate() + i);
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      equity *= (1 + (rng() - 0.48) * 0.025);
    }
    equityCurve.push({ date: d.toISOString().slice(0, 10), equity: Math.round(equity * 100) / 100, return_pct: 0 });
  }
  return {
    id: "mock-bt-" + Date.now(),
    strategy_name: (params.strategy_name as string) || "AlphaGPT-v1",
    start_date: startDate, end_date: endDate,
    total_return: Math.round(totalReturn * 10000) / 10000,
    annual_return: Math.round((totalReturn * (252 / Math.max(days, 1))) * 10000) / 10000,
    sharpe_ratio: Math.round((0.8 + rng() * 2.5) * 100) / 100,
    max_drawdown: -Math.round((0.05 + rng() * 0.18) * 10000) / 10000,
    win_rate: Math.round(winRate * 10000) / 10000,
    total_trades: totalTrades,
    winning_trades: Math.floor(totalTrades * winRate),
    avg_return_per_trade: Math.round((totalReturn / Math.max(totalTrades, 1)) * 10000) / 10000,
    equity_curve: equityCurve,
    monthly_returns: [],
    created_at: new Date().toISOString(),
  };
}

/** 持仓 Mock */
export function mockPortfolio(): { positions: PortfolioPosition[]; total_value: number; risk_metrics: RiskMetrics } {
  const rng = seededRandom(20240115);
  const positions: PortfolioPosition[] = MOCK_STOCKS.slice(0, 6).map((s, i) => {
    const entry = 10 + rng() * 200;
    const current = entry * (1 + (rng() - 0.45) * 0.15);
    const weight = [0.25, 0.20, 0.18, 0.15, 0.12, 0.10][i];
    const shares = Math.floor((100000 * weight) / entry / 100) * 100;
    const marketValue = shares * current;
    const pnl = marketValue - shares * entry;
    return {
      id: "pos-" + s.code, stock_code: s.code, stock_name: s.name,
      weight, shares, entry_price: Math.round(entry * 100) / 100,
      current_price: Math.round(current * 100) / 100,
      market_value: Math.round(marketValue * 100) / 100,
      pnl: Math.round(pnl * 100) / 100,
      pnl_pct: Math.round(((current - entry) / entry) * 10000) / 10000,
      hold_days: 5 + Math.floor(rng() * 30),
      industry: s.industry,
    };
  });
  const totalValue = positions.reduce((s, p) => s + p.market_value, 0);
  const dailyReturn = positions.reduce((s, p) => s + p.pnl, 0) / Math.max(totalValue, 1);
  return {
    positions,
    total_value: Math.round(totalValue * 100) / 100,
    risk_metrics: {
      var_95: Math.round(dailyReturn * 1.645 * 10000) / 10000,
      cvar_95: Math.round(dailyReturn * 2.0 * 10000) / 10000,
      volatility: Math.round(Math.abs(dailyReturn) * Math.sqrt(252) * 10000) / 10000,
      beta: Math.round((0.85 + rng() * 0.3) * 100) / 100,
      sharpe_ratio: Math.round((dailyReturn > 0 ? 1.2 : 0.3) * 100) / 100,
      max_drawdown: -Math.round((0.05 + rng() * 0.1) * 10000) / 10000,
      concentration: Math.round(positions.reduce((s, p) => s + p.weight * p.weight, 0) * 10000) / 10000,
    },
  };
}

/** 推送策略 Mock */
export function mockPushStrategies(): PushStrategy[] {
  return [
    { id: "qq", channel: "qq", enabled: false, daily_push_time: "08:30", min_confidence: 0.6, max_stocks_per_push: 5, push_on_market_open: true, push_on_market_close: false, template: "今日AI荐股：\n{stocks}\n\n胜率统计：日胜率 {daily_win_rate}，月胜率 {monthly_win_rate}" },
    { id: "email", channel: "email", enabled: false, daily_push_time: "08:30", min_confidence: 0.6, max_stocks_per_push: 5, push_on_market_open: false, push_on_market_close: true, template: "AlphaGPT 每日荐股报告\n\n{stocks}\n\n日胜率: {daily_win_rate} | 月胜率: {monthly_win_rate}" },
    { id: "webhook", channel: "webhook", enabled: false, daily_push_time: "08:30", min_confidence: 0.6, max_stocks_per_push: 10, push_on_market_open: true, push_on_market_close: true, template: "{stocks}" },
  ];
}

/** QQ 机器人配置 Mock */
export function mockQQBotConfig(): QQBotConfig {
  return {
    id: "default", bot_qq: "", webhook_url: "", enabled: false,
    push_schedule: { days: [1, 2, 3, 4, 5], time: "08:30", timezone: "Asia/Shanghai" },
    filter_min_confidence: 0.6, max_stocks_per_push: 5,
  };
}
