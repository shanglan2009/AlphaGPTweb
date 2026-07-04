import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, mockDailyPicks } from "@/lib/db/mock";
import { cacheGet, cacheSet } from "@/lib/db/redis";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

    if (!hasDatabase()) {
      const data = mockDailyPicks(date);
      return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() });
    }

    const cacheKey = "daily_picks:" + date;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached, timestamp: new Date().toISOString() });
    }

    const { getSQL } = await import("@/lib/db/neon");
    const sql = getSQL();
    const result = await sql`SELECT * FROM daily_picks WHERE date = ${date}::date ORDER BY rank ASC LIMIT 20`;
    const rows = result as unknown as Record<string, unknown>[];
    const data = rows.map((r) => ({
      id: String(r.id), date: String(r.date).slice(0, 10),
      stock_code: r.stock_code, stock_name: r.stock_name,
      predicted_return: Number(r.predicted_return), confidence: Number(r.confidence),
      rank: Number(r.rank), reason: String(r.reason || ""),
      model_version: String(r.model_version || "v1"), created_at: String(r.created_at || ""),
    }));

    if (data.length === 0) {
      const mockData = mockDailyPicks(date);
      await cacheSet(cacheKey, mockData, 3600);
      return NextResponse.json({ success: true, data: mockData, timestamp: new Date().toISOString() });
    }

    await cacheSet(cacheKey, data, 3600);
    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    const data = mockDailyPicks();
    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString(), _mock: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ success: true, data: { count: 0, message: "Mock模式，数据未持久化" }, timestamp: new Date().toISOString() });
    }
    const body = await req.json();
    const { date, picks } = body;
    if (!date || !picks?.length) {
      return NextResponse.json({ success: false, error: "缺少必要的日期或荐股数据" }, { status: 400 });
    }
    const { getSQL } = await import("@/lib/db/neon");
    const sql = getSQL();
    for (const p of picks) {
      await sql`
        INSERT INTO daily_picks (date, stock_code, stock_name, predicted_return, confidence, rank, reason, model_version)
        VALUES (${date}::date, ${p.stock_code}, ${p.stock_name}, ${p.predicted_return}, ${p.confidence}, ${p.rank}, ${p.reason || ""}, ${p.model_version || "v1"})
        ON CONFLICT (date, stock_code) DO UPDATE SET predicted_return=EXCLUDED.predicted_return, confidence=EXCLUDED.confidence, rank=EXCLUDED.rank
      `;
    }
    return NextResponse.json({ success: true, data: { count: picks.length }, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
