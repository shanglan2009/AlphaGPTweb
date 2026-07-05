import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db/neon";
import { hasDatabase, mockDailyPicks, mockWinRate } from "@/lib/db/mock";

export async function POST(req: NextRequest) {
  try {
    const { sendQQMessage, formatStockPushMessage } = await import("@/lib/push/qq");

    // 获取 QQ 配置
    let config: { qq_number: string; qmsg_key: string; webhook_url?: string; enabled: boolean };
    
    if (hasDatabase()) {
      const sql = getSQL();
      const result = await sql`SELECT * FROM qq_bot_config ORDER BY id DESC LIMIT 1` as unknown as Record<string, unknown>[];
      if (result.length > 0) {
        const r = result[0];
        config = {
          qq_number: String(r.bot_qq || ""),
          qmsg_key: String(r.qmsg_key || ""),
          webhook_url: String(r.webhook_url || ""),
          enabled: Boolean(r.enabled),
        };
      } else {
        return NextResponse.json({ success: false, error: "未配置 QQ 机器人" });
      }
    } else {
      return NextResponse.json({ success: false, error: "数据库未连接，无法发送推送" });
    }

    if (!config.enabled) {
      return NextResponse.json({ success: false, error: "QQ 推送未启用" });
    }

    // 获取今日荐股
    const today = new Date().toISOString().slice(0, 10);
    let picks;
    let winRate;

    try {
      const sql = getSQL();
      const pickResult = await sql`SELECT * FROM daily_picks WHERE date = ${today}::date ORDER BY rank ASC LIMIT 5` as unknown as Record<string, unknown>[];
      picks = pickResult.map((r: Record<string, unknown>) => ({
        rank: Number(r.rank), stock_name: String(r.stock_name), stock_code: String(r.stock_code),
        predicted_return: Number(r.predicted_return), confidence: Number(r.confidence), reason: String(r.reason || ""),
      }));

      const wrResult = await sql`SELECT * FROM win_rate_cache ORDER BY date DESC LIMIT 1` as unknown as Record<string, unknown>[];
      winRate = wrResult.length > 0
        ? { daily: Number(wrResult[0].daily_win_rate), monthly: Number(wrResult[0].monthly_win_rate) }
        : { daily: 0.55, monthly: 0.52 };
    } catch {
      picks = mockDailyPicks().slice(0, 5).map(p => ({
        rank: p.rank, stock_name: p.stock_name, stock_code: p.stock_code,
        predicted_return: p.predicted_return, confidence: p.confidence, reason: p.reason,
      }));
      winRate = { daily: 0.55, monthly: 0.52 };
    }

    const message = formatStockPushMessage(picks, winRate);
    const result = await sendQQMessage(config, { content: message });

    return NextResponse.json({ success: result.success, data: { message, result }, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
