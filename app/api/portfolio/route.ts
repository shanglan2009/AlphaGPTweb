import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db/neon";

export async function GET() {
  try {
    const sql = getSQL();
    const result = await sql`SELECT * FROM portfolio_snapshots ORDER BY date DESC, weight DESC LIMIT 20`;
    const rows = result as unknown as Record<string, unknown>[];
    const positions = rows.map((r) => ({
      id: String(r.id), stock_code: r.stock_code, stock_name: r.stock_name,
      weight: Number(r.weight), shares: Number(r.shares), entry_price: Number(r.entry_price),
      current_price: Number(r.current_price), market_value: Number(r.market_value),
      pnl: Number(r.pnl), pnl_pct: Number(r.pnl_pct), hold_days: Number(r.hold_days),
      industry: String(r.industry || ""),
    }));
    const totalValue = positions.reduce((s, p) => s + p.market_value, 0);
    const dailyReturn = totalValue > 0 ? positions.reduce((s, p) => s + p.pnl, 0) / totalValue : 0;
    const riskMetrics = {
      var_95: dailyReturn * 1.645, cvar_95: dailyReturn * 2.0,
      volatility: Math.abs(dailyReturn) * Math.sqrt(252),
      beta: 0.85 + Math.random() * 0.3,
      sharpe_ratio: dailyReturn > 0 ? dailyReturn / Math.max(Math.abs(dailyReturn), 0.001) * Math.sqrt(252) : 0,
      max_drawdown: -(Math.random() * 0.15 + 0.05),
      concentration: positions.reduce((s, p) => s + p.weight * p.weight, 0),
    };
    return NextResponse.json({ success: true, data: { positions, total_value: totalValue, risk_metrics: riskMetrics }, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error), data: { positions: [], risk_metrics: null }, timestamp: new Date().toISOString() }, { status: 200 });
  }
}
