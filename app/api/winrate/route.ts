import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db/neon";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const range = Number(searchParams.get("range")) || 30;
    const sql = getSQL();

    if (date) {
      const result = await sql`SELECT * FROM win_rate_cache WHERE date = ${date}::date LIMIT 1`;
      const rows = result as unknown as Record<string, unknown>[];
      if (rows.length > 0) {
        const r = rows[0];
        return NextResponse.json({ success: true, data: {
          date: String(r.date).slice(0, 10), daily_win_rate: Number(r.daily_win_rate),
          monthly_win_rate: Number(r.monthly_win_rate), total_picks: Number(r.total_picks),
          wins: Number(r.wins), month_picks: Number(r.month_picks), month_wins: Number(r.month_wins),
        }, timestamp: new Date().toISOString() });
      }
      return NextResponse.json({ success: true, data: null, timestamp: new Date().toISOString() });
    }

    const result = await sql`SELECT * FROM win_rate_cache ORDER BY date DESC LIMIT ${range}`;
    const rows = result as unknown as Record<string, unknown>[];
    const reversed = [...rows].reverse();
    const data = reversed.map((r) => {
      return {
        date: String(r.date).slice(0, 10),
        daily_win_rate: Number(r.daily_win_rate),
        monthly_win_rate: Number(r.monthly_win_rate),
        cumulative_win_rate: 0,
        total_picks: Number(r.total_picks),
        wins: Number(r.wins),
      };
    });
    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error), data: [], timestamp: new Date().toISOString() }, { status: 200 });
  }
}
