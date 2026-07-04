import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db/neon";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const sql = getSQL();
    const result = await sql`SELECT * FROM daily_picks ORDER BY date DESC, rank ASC LIMIT ${limit}`;
    const rows = result as unknown as Record<string, unknown>[];
    const data = rows.map((r) => ({
      id: String(r.id), date: String(r.date).slice(0, 10),
      stock_code: r.stock_code, stock_name: r.stock_name,
      predicted_return: Number(r.predicted_return), confidence: Number(r.confidence),
      rank: Number(r.rank), reason: String(r.reason || ""),
      model_version: String(r.model_version || "v1"), created_at: String(r.created_at || ""),
    }));
    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error), data: [], timestamp: new Date().toISOString() }, { status: 200 });
  }
}
