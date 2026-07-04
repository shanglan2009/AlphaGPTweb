"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QQBotConfig as QQBotConfigType } from "@/lib/types";
import { Bot, Save, AlertCircle, CheckCircle2 } from "lucide-react";

export function QQBotConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<Partial<QQBotConfigType>>({
    bot_qq: "",
    webhook_url: "",
    enabled: false,
    filter_min_confidence: 0.6,
    max_stocks_per_push: 5,
    push_schedule: { days: [1, 2, 3, 4, 5], time: "08:30", timezone: "Asia/Shanghai" },
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch("/api/qq-bot");
        const data = await res.json();
        if (data.success && data.data) setConfig(data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchConfig();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/qq-bot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
      const data = await res.json();
      setMessage(data.success ? { type: "success", text: "配置保存成功！" } : { type: "error", text: data.error || "保存失败" });
    } catch {
      setMessage({ type: "error", text: "网络错误，请重试" });
    }
    finally { setSaving(false); }
  }

  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const toggleDay = (day: number) => {
    const days = config.push_schedule?.days || [];
    const newDays = days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort();
    setConfig({ ...config, push_schedule: { ...config.push_schedule!, days: newDays } });
  };

  if (loading) {
    return <Card><CardHeader><CardTitle><Bot className="inline h-5 w-5 mr-2" />QQ机器人配置</CardTitle></CardHeader><CardContent><div className="animate-pulse space-y-4"><div className="h-10 bg-gray-200 rounded" /><div className="h-10 bg-gray-200 rounded" /><div className="h-10 bg-gray-200 rounded" /></div></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />QQ机器人配置</CardTitle>
        <CardDescription>配置 QQ 机器人用于推送每日荐股结果</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {message && (
          <Alert variant={message.type === "success" ? "default" : "destructive"}>
            {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div><Label>启用机器人</Label><p className="text-xs text-gray-400">开启后将按计划自动推送荐股</p></div>
          <Switch checked={config.enabled} onCheckedChange={(v) => setConfig({ ...config, enabled: v })} />
        </div>

        <div className="space-y-2">
          <Label>Webhook 地址</Label>
          <Input placeholder="https://qmsg.zendee.cn/send/your-key" value={config.webhook_url} onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })} />
          <p className="text-xs text-gray-400">支持 Qmsg 酱、Server酱 等推送平台</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>推送时间</Label>
            <Select value={config.push_schedule?.time} onValueChange={(v) => setConfig({ ...config, push_schedule: { ...config.push_schedule!, time: v || '08:30' } })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["08:00","08:15","08:30","08:45","09:00","15:30","16:00","20:00","21:00"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>每次最多推送</Label>
            <Input type="number" min={1} max={20} value={config.max_stocks_per_push} onChange={(e) => setConfig({ ...config, max_stocks_per_push: Number(e.target.value) })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>推送日</Label>
          <div className="flex gap-1.5 flex-wrap">
            {weekdays.map((name, i) => (
              <Button key={i} variant={config.push_schedule?.days?.includes(i) ? "default" : "outline"} size="sm" onClick={() => toggleDay(i)}>{name}</Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>最低置信度过滤</Label>
          <Select value={String(config.filter_min_confidence)} onValueChange={(v) => setConfig({ ...config, filter_min_confidence: Number(v || 0.6) })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">50% — 宽松</SelectItem>
              <SelectItem value="0.6">60% — 标准</SelectItem>
              <SelectItem value="0.7">70% — 严格</SelectItem>
              <SelectItem value="0.8">80% — 非常严格</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />{saving ? "保存中..." : "保存配置"}
        </Button>
      </CardContent>
    </Card>
  );
}
