import { neon } from "@neondatabase/serverless";

let sql: ReturnType<typeof neon> | null = null;

export function getSQL() {
  if (!sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL 环境变量未设置");
    }
    sql = neon(url);
  }
  return sql;
}

// 初始化数据库表
export async function initDatabase(): Promise<void> {
  const s = getSQL();

  await s`
    CREATE TABLE IF NOT EXISTS daily_picks (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      stock_code VARCHAR(20) NOT NULL,
      stock_name VARCHAR(50) NOT NULL,
      predicted_return DOUBLE PRECISION NOT NULL,
      confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
      rank INTEGER NOT NULL,
      reason TEXT DEFAULT '',
      model_version VARCHAR(20) DEFAULT 'v1',
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(date, stock_code)
    )
  `;

  await s`
    CREATE TABLE IF NOT EXISTS pick_outcomes (
      id SERIAL PRIMARY KEY,
      pick_id INTEGER REFERENCES daily_picks(id),
      date DATE NOT NULL,
      stock_code VARCHAR(20) NOT NULL,
      predicted_return DOUBLE PRECISION,
      actual_return DOUBLE PRECISION,
      is_win BOOLEAN DEFAULT FALSE,
      is_month_win BOOLEAN DEFAULT FALSE,
      next_day_open DOUBLE PRECISION,
      next_day_close DOUBLE PRECISION,
      next_day_pct_chg DOUBLE PRECISION,
      UNIQUE(date, stock_code)
    )
  `;

  await s`
    CREATE TABLE IF NOT EXISTS win_rate_cache (
      date DATE PRIMARY KEY,
      daily_win_rate DOUBLE PRECISION DEFAULT 0,
      monthly_win_rate DOUBLE PRECISION DEFAULT 0,
      total_picks INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      month_picks INTEGER DEFAULT 0,
      month_wins INTEGER DEFAULT 0
    )
  `;

  await s`
    CREATE TABLE IF NOT EXISTS backtest_results (
      id SERIAL PRIMARY KEY,
      strategy_name VARCHAR(100) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_return DOUBLE PRECISION,
      annual_return DOUBLE PRECISION,
      sharpe_ratio DOUBLE PRECISION,
      max_drawdown DOUBLE PRECISION,
      win_rate DOUBLE PRECISION,
      total_trades INTEGER DEFAULT 0,
      winning_trades INTEGER DEFAULT 0,
      avg_return_per_trade DOUBLE PRECISION,
      equity_curve JSONB DEFAULT '[]',
      monthly_returns JSONB DEFAULT '[]',
      params_json JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await s`
    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      stock_code VARCHAR(20) NOT NULL,
      stock_name VARCHAR(50),
      weight DOUBLE PRECISION DEFAULT 0,
      shares DOUBLE PRECISION DEFAULT 0,
      entry_price DOUBLE PRECISION,
      current_price DOUBLE PRECISION,
      market_value DOUBLE PRECISION,
      pnl DOUBLE PRECISION DEFAULT 0,
      pnl_pct DOUBLE PRECISION DEFAULT 0,
      hold_days INTEGER DEFAULT 0,
      industry VARCHAR(50),
      UNIQUE(date, stock_code)
    )
  `;

  await s`
    CREATE TABLE IF NOT EXISTS qq_bot_config (
      id SERIAL PRIMARY KEY,
      bot_qq VARCHAR(20),
      webhook_url TEXT NOT NULL,
      enabled BOOLEAN DEFAULT FALSE,
      push_schedule JSONB DEFAULT '{"days":[1,2,3,4,5],"time":"08:30","timezone":"Asia/Shanghai"}',
      filter_min_confidence DOUBLE PRECISION DEFAULT 0.6,
      max_stocks_per_push INTEGER DEFAULT 5,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await s`
    CREATE TABLE IF NOT EXISTS push_strategy (
      id SERIAL PRIMARY KEY,
      channel VARCHAR(20) NOT NULL DEFAULT 'qq',
      enabled BOOLEAN DEFAULT FALSE,
      daily_push_time VARCHAR(5) DEFAULT '08:30',
      min_confidence DOUBLE PRECISION DEFAULT 0.6,
      max_stocks_per_push INTEGER DEFAULT 5,
      push_on_market_open BOOLEAN DEFAULT TRUE,
      push_on_market_close BOOLEAN DEFAULT FALSE,
      template TEXT DEFAULT '今日AI荐股：\n{stocks}\n\n胜率统计：日胜率 {daily_win_rate}，月胜率 {monthly_win_rate}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(channel)
    )
  `;

  await s`
    CREATE TABLE IF NOT EXISTS model_versions (
      version VARCHAR(20) PRIMARY KEY,
      trained_at TIMESTAMP DEFAULT NOW(),
      daily_win_rate DOUBLE PRECISION DEFAULT 0,
      monthly_win_rate DOUBLE PRECISION DEFAULT 0,
      total_picks INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT FALSE,
      metrics JSONB DEFAULT '{}'
    )
  `;

  console.log("✓ 数据库表初始化完成");
}
