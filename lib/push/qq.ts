/** QQ 推送服务 — 支持 Qmsg酱 / 自定义 Webhook */

interface PushConfig {
  qq_number: string;
  qmsg_key: string;       // Qmsg酱 key
  webhook_url?: string;   // 自定义 webhook（可选）
  enabled: boolean;
}

interface PushMessage {
  content: string;
  qq?: string;  // 指定接收 QQ，默认使用配置的 QQ
}

/**
 * 通过 Qmsg酱 发送 QQ 消息
 * Qmsg酱文档: https://qmsg.zendee.cn/api.html
 */
async function sendViaQmsg(config: PushConfig, message: PushMessage): Promise<boolean> {
  const targetQQ = message.qq || config.qq_number;
  const url = `https://qmsg.zendee.cn/send/${config.qmsg_key}`;
  
  const params = new URLSearchParams({
    msg: message.content,
    qq: targetQQ,
  });

  const res = await fetch(`${url}?${params.toString()}`);
  const data = await res.json() as { success: boolean; reason?: string };
  
  if (!data.success) {
    console.error(`Qmsg push failed: ${data.reason}`);
    return false;
  }
  return true;
}

/**
 * 通过自定义 Webhook 发送
 */
async function sendViaWebhook(webhookUrl: string, message: PushMessage): Promise<boolean> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message.content, qq: message.qq }),
  });
  return res.ok;
}

/**
 * 发送 QQ 推送消息
 */
export async function sendQQMessage(config: PushConfig, message: PushMessage): Promise<{ success: boolean; error?: string }> {
  if (!config.enabled) {
    return { success: false, error: "推送未启用" };
  }

  try {
    // 主通道: Qmsg酱
    if (config.qmsg_key) {
      const ok = await sendViaQmsg(config, message);
      if (ok) return { success: true };
    }

    // 备用通道: 自定义 Webhook
    if (config.webhook_url) {
      const ok = await sendViaWebhook(config.webhook_url, message);
      if (ok) return { success: true };
    }

    return { success: false, error: "所有推送通道均失败" };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

/**
 * 格式化荐股推送消息
 */
export function formatStockPushMessage(
  picks: Array<{ rank: number; stock_name: string; stock_code: string; predicted_return: number; confidence: number; reason: string }>,
  winRate: { daily: number; monthly: number }
): string {
  const lines = [
    "📊 AlphaGPT 每日荐股",
    "",
  ];

  for (const p of picks.slice(0, 5)) {
    const arrow = p.predicted_return > 0 ? "📈" : "📉";
    lines.push(`${arrow} #${p.rank} ${p.stock_name}(${p.stock_code.replace(/\.(SH|SZ|BJ)$/, "")})`);
    lines.push(`   预测: ${(p.predicted_return * 100).toFixed(1)}%  置信: ${(p.confidence * 100).toFixed(0)}%`);
    lines.push(`   ${p.reason}`);
    lines.push("");
  }

  lines.push("━━━━━━━━━━━━━━━━");
  lines.push(`📅 日胜率: ${(winRate.daily * 100).toFixed(0)}%  |  月胜率: ${(winRate.monthly * 100).toFixed(0)}%`);
  lines.push(`⏰ ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`);

  return lines.join("\n");
}
