"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BacktestResult as BtResult } from "@/lib/types";
import { formatPercent, formatMoney, getChangeColor } from "@/lib/utils/number"
import { cn } from "@/lib/utils";

interface BacktestResultProps {
  result: BtResult | null;
  loading?: boolean;
}

export function BacktestResultView({ result, loading }: BacktestResultProps) {
  if (loading) {
    return <Card><CardHeader><CardTitle>回测结果</CardTitle></CardHeader><CardContent><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-2/3" /><div className="grid grid-cols-3 gap-4"><div className="h-20 bg-gray-200 rounded" /><div className="h-20 bg-gray-200 rounded" /><div className="h-20 bg-gray-200 rounded" /></div></div></CardContent></Card>;
  }
  if (!result) {
    return <Card><CardHeader><CardTitle>回测结果</CardTitle></CardHeader><CardContent><p className="text-gray-400 text-center py-8">配置参数后点击"开始回测"</p></CardContent></Card>;
  }

  const metrics = [
    { label: "总收益率", value: formatPercent(result.total_return), color: getChangeColor(result.total_return).split(" ")[0] },
    { label: "年化收益", value: formatPercent(result.annual_return), color: getChangeColor(result.annual_return).split(" ")[0] },
    { label: "夏普比率", value: result.sharpe_ratio.toFixed(2) },
    { label: "最大回撤", value: formatPercent(result.max_drawdown), color: "text-red-500" },
    { label: "胜率", value: formatPercent(result.win_rate) },
    { label: "总交易", value: `${result.total_trades} 笔` },
  ];

  return (
    <Card>
      <CardHeader><CardTitle>📊 回测结果：{result.strategy_name}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((m, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500">{m.label}</p>
              <p className={`text-lg font-bold ${m.color || "text-gray-700"}`}>{m.value}</p>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400">
          回测区间：{result.start_date} → {result.end_date} | 胜率：{(result.win_rate * 100).toFixed(1)}% ({result.winning_trades}/{result.total_trades})
        </div>
      </CardContent>
    </Card>
  );
}
