import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db/neon";
import { hasDatabase, mockQQBotConfig } from "@/lib/db/mock";

export async function GET() {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ success: true, data: mockQQBotConfig(), timestamp: new Date().toISOString() });
    }
    const sql = getSQL();
    const result = await sql`SELECT * FROM qq_bot_config ORDER BY id DESC LIMIT 1`;
    const rows = result as unknown as Record<string, unknown>[];
    if (rows.length > 0) {
      const r = rows[0];
      return NextResponse.json({ success: true, data: {
        id: String(r.id),
        bot_qq: r.bot_qq || "",
        qq_number: r.qq_number || r.bot_qq || "",
        webhook_url: r.webhook_url || "",
        qmsg_key: r.qmsg_key || "",
        enabled: Boolean(r.enabled),
        push_schedule: typeof r.push_schedule === "string" ? JSON.parse(r.push_schedule as string) : r.push_schedule,
        filter_min_confidence: Number(r.filter_min_confidence),
        max_stocks_per_push: Number(r.max_stocks_per_push),
      }, timestamp: new Date().toISOString() });
    }
    return NextResponse.json({ success: true, data: mockQQBotConfig(), timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ success: true, data: mockQQBotConfig(), timestamp: new Date().toISOString(), _mock: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!hasDatabase()) {
      return NextResponse.json({ success: true, data: { saved: true, message: "Mock模式" }, timestamp: new Date().toISOString() });
    }
    const sql = getSQL();
    const existing = await sql`SELECT id FROM qq_bot_config LIMIT 1`;
    const exRows = existing as unknown as Record<string, unknown>[];
    
    const pushSchedule = JSON.stringify(body.push_schedule || { days: [1,2,3,4,5], time: "08:30", timezone: "Asia/Shanghai" });
    
    if (exRows.length > 0) {
      await sql`
        UPDATE qq_bot_config SET
          bot_qq = ${body.qq_number || body.bot_qq || ""},
          qq_number = ${body.qq_number || ""},
          webhook_url = ${body.webhook_url || ""},
          qmsg_key = ${body.qmsg_key || ""},
          enabled = ${body.enabled ?? false},
          push_schedule = ${pushSchedule}::jsonb,
          filter_min_confidence = ${body.filter_min_confidence ?? 0.6},
          max_stocks_per_push = ${body.max_stocks_per_push ?? 5},
          updated_at = NOW()
        WHERE id = ${exRows[0].id}
      `;
    } else {
      await sql`
        INSERT INTO qq_bot_config (bot_qq, qq_number, webhook_url, qmsg_key, enabled, push_schedule, filter_min_confidence, max_stocks_per_push)
        VALUES (${body.qq_number || ""}, ${body.qq_number || ""}, ${body.webhook_url || ""}, ${body.qmsg_key || ""}, ${body.enabled ?? false}, ${pushSchedule}::jsonb, ${body.filter_min_confidence ?? 0.6}, ${body.max_stocks_per_push ?? 5})
      `;
    }
    return NextResponse.json({ success: true, data: { saved: true }, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
