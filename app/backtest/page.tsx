"use client";

import { useState } from "react";
import { BacktestForm } from "@/components/backtest/BacktestForm";
import { BacktestResultView } from "@/components/backtest/BacktestResult";
import { EquityCurve } from "@/components/backtest/EquityCurve";
import { BacktestParams, BacktestResult } from "@/lib/types";

export default function BacktestPage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  async function handleRun(params: BacktestParams) {
    setRunning(true);
    try {
      const res = await fetch("/api/backtest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) });
      const data = await res.json();
      if (data.success) setResult(data.data);
    } catch (err) { console.error("Backtest failed:", err); }
    finally { setRunning(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">🔬 回测系统</h1>
        <p className="text-sm text-gray-500 mt-1">基于历史数据验证策略有效性，优化胜率</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1"><BacktestForm onRun={handleRun} running={running} /></div>
        <div className="lg:col-span-2 space-y-6">
          <BacktestResultView result={result} loading={running} />
          <EquityCurve data={result?.equity_curve || []} loading={running} />
        </div>
      </div>
    </div>
  );
}
