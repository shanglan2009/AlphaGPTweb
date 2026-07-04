import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, mockBacktestResult } from "@/lib/db/mock";

export async function GET(req: NextRequest) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ success: true, data: [mockBacktestResult({ strategy_name: "AlphaGPT-v1", start_date: "2024-01-01", end_date: "2024-12-31" })], timestamp: new Date().toISOString() });
    }
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);
    const { getSQL } = await import("@/lib/db/neon");
    const sql = getSQL();
    const result = await sql`SELECT * FROM backtest_results ORDER BY created_at DESC LIMIT ${limit}`;
    const rows = result as unknown as Record<string, unknown>[];
    const data = rows.map((r) => ({
      id: String(r.id), strategy_name: r.strategy_name,
      start_date: String(r.start_date).slice(0, 10), end_date: String(r.end_date).slice(0, 10),
      total_return: Number(r.total_return), annual_return: Number(r.annual_return),
      sharpe_ratio: Number(r.sharpe_ratio), max_drawdown: Number(r.max_drawdown),
      win_rate: Number(r.win_rate), total_trades: Number(r.total_trades),
      winning_trades: Number(r.winning_trades), avg_return_per_trade: Number(r.avg_return_per_trade),
      equity_curve: typeof r.equity_curve === "string" ? JSON.parse(r.equity_curve as string) : r.equity_curve,
      monthly_returns: typeof r.monthly_returns === "string" ? JSON.parse(r.monthly_returns as string) : r.monthly_returns,
      created_at: String(r.created_at || ""),
    }));
    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ success: true, data: [], timestamp: new Date().toISOString() });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!hasDatabase()) {
      const result = mockBacktestResult(body);
      return NextResponse.json({ success: true, data: result, timestamp: new Date().toISOString(), _mock: true });
    }
    const { getSQL } = await import("@/lib/db/neon");
    const result = mockBacktestResult(body);
    const sql = getSQL();
    await sql`
      INSERT INTO backtest_results (strategy_name, start_date, end_date, total_return, annual_return, sharpe_ratio, max_drawdown, win_rate, total_trades, winning_trades, avg_return_per_trade, equity_curve, monthly_returns, params_json)
      VALUES (${result.strategy_name}, ${result.start_date}::date, ${result.end_date}::date, ${result.total_return}, ${result.annual_return}, ${result.sharpe_ratio}, ${result.max_drawdown}, ${result.win_rate}, ${result.total_trades}, ${result.winning_trades}, ${result.avg_return_per_trade}, ${JSON.stringify(result.equity_curve)}, '[]', ${JSON.stringify(body)})
    `;
    return NextResponse.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (error) {
    const result = mockBacktestResult({});
    return NextResponse.json({ success: true, data: result, timestamp: new Date().toISOString(), _mock: true });
  }
}
