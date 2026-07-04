import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db/neon";

export async function GET() {
  try {
    const sql = getSQL();
    const result = await sql`SELECT * FROM push_strategy ORDER BY channel`;
    const rows = result as unknown as Record<string, unknown>[];
    const data = rows.map((r) => ({
      id: String(r.channel), channel: r.channel, enabled: Boolean(r.enabled),
      daily_push_time: r.daily_push_time, min_confidence: Number(r.min_confidence),
      max_stocks_per_push: Number(r.max_stocks_per_push),
      push_on_market_open: Boolean(r.push_on_market_open),
      push_on_market_close: Boolean(r.push_on_market_close),
      template: String(r.template || ""),
    }));
    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error), data: [], timestamp: new Date().toISOString() }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sql = getSQL();
    await sql`
      INSERT INTO push_strategy (channel, enabled, daily_push_time, min_confidence, max_stocks_per_push, push_on_market_open, push_on_market_close, template, updated_at)
      VALUES (${body.channel}, ${body.enabled}, ${body.daily_push_time}, ${body.min_confidence}, ${body.max_stocks_per_push}, ${body.push_on_market_open}, ${body.push_on_market_close}, ${body.template}, NOW())
      ON CONFLICT (channel) DO UPDATE SET enabled=EXCLUDED.enabled, daily_push_time=EXCLUDED.daily_push_time, min_confidence=EXCLUDED.min_confidence, max_stocks_per_push=EXCLUDED.max_stocks_per_push, push_on_market_open=EXCLUDED.push_on_market_open, push_on_market_close=EXCLUDED.push_on_market_close, template=EXCLUDED.template, updated_at=NOW()
    `;
    return NextResponse.json({ success: true, data: { saved: true }, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
