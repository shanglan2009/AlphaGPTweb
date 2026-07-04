import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db/neon";

export async function GET() {
  try {
    const sql = getSQL();
    const result = await sql`SELECT * FROM qq_bot_config ORDER BY id DESC LIMIT 1`;
    const rows = result as unknown as Record<string, unknown>[];
    if (rows.length > 0) {
      const r = rows[0];
      return NextResponse.json({ success: true, data: {
        id: String(r.id), bot_qq: r.bot_qq, webhook_url: r.webhook_url,
        enabled: Boolean(r.enabled),
        push_schedule: typeof r.push_schedule === "string" ? JSON.parse(r.push_schedule as string) : r.push_schedule,
        filter_min_confidence: Number(r.filter_min_confidence),
        max_stocks_per_push: Number(r.max_stocks_per_push),
      }, timestamp: new Date().toISOString() });
    }
    return NextResponse.json({ success: true, data: null, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error), data: null, timestamp: new Date().toISOString() }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sql = getSQL();
    const existing = await sql`SELECT id FROM qq_bot_config LIMIT 1`;
    const exRows = existing as unknown as Record<string, unknown>[];
    if (exRows.length > 0) {
      await sql`UPDATE qq_bot_config SET webhook_url=${body.webhook_url}, enabled=${body.enabled}, push_schedule=${JSON.stringify(body.push_schedule)}, filter_min_confidence=${body.filter_min_confidence}, max_stocks_per_push=${body.max_stocks_per_push}, updated_at=NOW() WHERE id=${exRows[0].id}`;
    } else {
      await sql`INSERT INTO qq_bot_config (webhook_url, enabled, push_schedule, filter_min_confidence, max_stocks_per_push) VALUES (${body.webhook_url}, ${body.enabled}, ${JSON.stringify(body.push_schedule)}, ${body.filter_min_confidence}, ${body.max_stocks_per_push})`;
    }
    return NextResponse.json({ success: true, data: { saved: true }, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
