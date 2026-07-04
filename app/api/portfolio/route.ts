import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, mockPortfolio } from "@/lib/db/mock";

export async function GET() {
  try {
    if (!hasDatabase()) {
      const data = mockPortfolio();
      return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() });
    }
    const { getSQL } = await import("@/lib/db/neon");
    const sql = getSQL();
    const result = await sql`SELECT * FROM portfolio_snapshots ORDER BY date DESC, weight DESC LIMIT 20`;
    const rows = result as unknown as Record<string, unknown>[];
    if (rows.length === 0) {
      const data = mockPortfolio();
      return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() });
    }
    const positions = rows.map((r) => ({
      id: String(r.id), stock_code: r.stock_code, stock_name: r.stock_name,
      weight: Number(r.weight), shares: Number(r.shares), entry_price: Number(r.entry_price),
      current_price: Number(r.current_price), market_value: Number(r.market_value),
      pnl: Number(r.pnl), pnl_pct: Number(r.pnl_pct), hold_days: Number(r.hold_days),
      industry: String(r.industry || ""),
    }));
    const totalValue = positions.reduce((s, p) => s + p.market_value, 0);
    const mockData = mockPortfolio();
    return NextResponse.json({ success: true, data: { positions, total_value: totalValue, risk_metrics: mockData.risk_metrics }, timestamp: new Date().toISOString() });
  } catch (error) {
    const data = mockPortfolio();
    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString(), _mock: true });
  }
}
