"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PushStrategy } from "@/lib/types";
import { Bell, Save, AlertCircle, CheckCircle2 } from "lucide-react";

export function PushStrategyConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [strategies, setStrategies] = useState<PushStrategy[]>([
    { id: "qq", channel: "qq", enabled: false, daily_push_time: "08:30", min_confidence: 0.6, max_stocks_per_push: 5, push_on_market_open: true, push_on_market_close: false, template: "今日AI荐股：\n{stocks}\n\n胜率统计：日胜率 {daily_win_rate}，月胜率 {monthly_win_rate}" },
    { id: "email", channel: "email", enabled: false, daily_push_time: "08:30", min_confidence: 0.6, max_stocks_per_push: 5, push_on_market_open: false, push_on_market_close: true, template: "AlphaGPT 每日荐股报告\n\n{stocks}\n\n日胜率: {daily_win_rate} | 月胜率: {monthly_win_rate}" },
    { id: "webhook", channel: "webhook", enabled: false, daily_push_time: "08:30", min_confidence: 0.6, max_stocks_per_push: 10, push_on_market_open: true, push_on_market_close: true, template: "{stocks}" },
  ]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.success && data.data?.length) setStrategies(data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  async function handleSave(channel: string) {
    setSaving(true);
    setMessage(null);
    const strategy = strategies.find((s) => s.id === channel);
    try {
      const res = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(strategy) });
      const data = await res.json();
      setMessage(data.success ? { type: "success", text: `${channel} 策略保存成功！` } : { type: "error", text: data.error || "保存失败" });
    } catch {
      setMessage({ type: "error", text: "网络错误" });
    }
    finally { setSaving(false); }
  }

  const updateStrategy = (id: string, updates: Partial<PushStrategy>) => {
    setStrategies((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s));
  };

  const channelLabels: Record<string, string> = { qq: "QQ 推送", email: "邮件推送", webhook: "Webhook 推送" };

  if (loading) {
    return <div className="space-y-4">{["qq","email","webhook"].map((ch) => (
      <Card key={ch}><CardHeader><CardTitle><Bell className="inline h-4 w-4 mr-2" />{channelLabels[ch]}</CardTitle></CardHeader><CardContent><div className="animate-pulse space-y-3"><div className="h-8 bg-gray-200 rounded" /><div className="h-8 bg-gray-200 rounded" /></div></CardContent></Card>
    ))}</div>;
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type === "success" ? "default" : "destructive"}>
          {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {strategies.map((strategy) => (
        <Card key={strategy.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" />{channelLabels[strategy.id]}</CardTitle>
                <CardDescription>配置 {channelLabels[strategy.id]} 推送策略</CardDescription>
              </div>
              <Switch checked={strategy.enabled} onCheckedChange={(v) => updateStrategy(strategy.id, { enabled: v })} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>推送时间</Label>
                <Select value={strategy.daily_push_time} onValueChange={(v) => updateStrategy(strategy.id, { daily_push_time: v || '08:30' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["08:00","08:15","08:30","08:45","15:30","16:00","20:00"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>最低置信度</Label>
                <Select value={String(strategy.min_confidence)} onValueChange={(v) => updateStrategy(strategy.id, { min_confidence: Number(v || 0.6) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">50%</SelectItem><SelectItem value="0.6">60%</SelectItem><SelectItem value="0.7">70%</SelectItem><SelectItem value="0.8">80%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>最多推送数</Label>
                <Input type="number" min={1} max={20} value={strategy.max_stocks_per_push} onChange={(e) => updateStrategy(strategy.id, { max_stocks_per_push: Number(e.target.value) })} />
              </div>
              <div className="space-y-2 flex flex-col gap-2">
                <div className="flex items-center justify-between"><Label>开盘前推送</Label><Switch checked={strategy.push_on_market_open} onCheckedChange={(v) => updateStrategy(strategy.id, { push_on_market_open: v })} /></div>
                <div className="flex items-center justify-between"><Label>收盘后推送</Label><Switch checked={strategy.push_on_market_close} onCheckedChange={(v) => updateStrategy(strategy.id, { push_on_market_close: v })} /></div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>推送模板</Label>
              <Textarea rows={3} value={strategy.template} onChange={(e) => updateStrategy(strategy.id, { template: e.target.value })} placeholder="使用 {stocks}, {daily_win_rate}, {monthly_win_rate} 占位符" />
            </div>
            <Button onClick={() => handleSave(strategy.id)} disabled={saving} size="sm"><Save className="h-4 w-4 mr-2" />保存 {channelLabels[strategy.id]}</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
