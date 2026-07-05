import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { sendQQMessage } = await import("@/lib/push/qq");
    const body = await req.json();
    const { qq_number, qmsg_key, webhook_url } = body;

    if (!qmsg_key && !webhook_url) {
      return NextResponse.json({ success: false, error: "请填写 Qmsg酱 Key 或 Webhook URL" });
    }

    const config = {
      qq_number: qq_number || "",
      qmsg_key: qmsg_key || "",
      webhook_url: webhook_url || "",
      enabled: true,
    };

    const result = await sendQQMessage(config, {
      content: "🧪 AlphaGPTweb 推送测试\n\n如果你收到这条消息，说明 QQ 推送配置成功！\n\n⏰ " + new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
    });

    return NextResponse.json({ success: result.success, data: result, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
