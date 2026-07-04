"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BacktestParams } from "@/lib/types";
import { getLatestTradingDay } from "@/lib/utils/date";
import { Play, Loader2 } from "lucide-react";

interface BacktestFormProps {
  onRun: (params: BacktestParams) => void;
  running: boolean;
}

export function BacktestForm({ onRun, running }: BacktestFormProps) {
  const today = getLatestTradingDay();
  const [params, setParams] = useState<BacktestParams>({
    strategy_name: "AlphaGPT-v1",
    start_date: "2024-01-01",
    end_date: today,
    initial_capital: 100000,
    top_n: 5,
    hold_days: 1,
    stop_loss_pct: -0.05,
    take_profit_pct: 0.10,
    model_version: "v1",
  });

  const handleChange = (field: keyof BacktestParams, value: string | number) => {
    setParams((prev: BacktestParams) => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">回测参数配置</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>策略名称</Label>
            <Input value={params.strategy_name} onChange={(e) => handleChange("strategy_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>模型版本</Label>
            <Select value={params.model_version} onValueChange={(v) => handleChange("model_version", v || "v1")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="v1">v1</SelectItem>
                <SelectItem value="v2">v2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>开始日期</Label>
            <Input type="date" value={params.start_date} onChange={(e) => handleChange("start_date", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>结束日期</Label>
            <Input type="date" value={params.end_date} onChange={(e) => handleChange("end_date", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>初始资金</Label>
            <Input type="number" value={params.initial_capital} onChange={(e) => handleChange("initial_capital", Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>每日选股数</Label>
            <Input type="number" min={1} max={20} value={params.top_n} onChange={(e) => handleChange("top_n", Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>持有天数</Label>
            <Input type="number" min={1} max={30} value={params.hold_days} onChange={(e) => handleChange("hold_days", Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>止损 (%)</Label>
            <Input type="number" step="0.01" min={-0.5} max={0} value={params.stop_loss_pct} onChange={(e) => handleChange("stop_loss_pct", Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>止盈 (%)</Label>
            <Input type="number" step="0.01" min={0} max={1} value={params.take_profit_pct} onChange={(e) => handleChange("take_profit_pct", Number(e.target.value))} />
          </div>
        </div>
        <Button className="w-full" onClick={() => onRun(params)} disabled={running}>
          {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
          {running ? "回测中..." : "开始回测"}
        </Button>
      </CardContent>
    </Card>
  );
}
