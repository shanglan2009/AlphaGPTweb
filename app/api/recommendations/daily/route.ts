import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db/neon";
import { cacheGet, cacheSet } from "@/lib/db/redis";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const cacheKey = `daily_picks:${date}`;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached, timestamp: new Date().toISOString() });
    }
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
    await cacheSet(cacheKey, data, 3600);
    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error), data: [], timestamp: new Date().toISOString() }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, picks } = body;
    if (!date || !picks?.length) {
      return NextResponse.json({ success: false, error: "缺少必要的日期或荐股数据" }, { status: 400 });
    }
    const sql = getSQL();
    for (const pick of picks) {
      await sql`
        INSERT INTO daily_picks (date, stock_code, stock_name, predicted_return, confidence, rank, reason, model_version)
        VALUES (${date}::date, ${pick.stock_code}, ${pick.stock_name}, ${pick.predicted_return}, ${pick.confidence}, ${pick.rank}, ${pick.reason || ""}, ${pick.model_version || "v1"})
        ON CONFLICT (date, stock_code) DO UPDATE SET predicted_return=EXCLUDED.predicted_return, confidence=EXCLUDED.confidence, rank=EXCLUDED.rank, reason=EXCLUDED.reason, model_version=EXCLUDED.model_version
      `;
    }
    return NextResponse.json({ success: true, data: { count: picks.length }, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
