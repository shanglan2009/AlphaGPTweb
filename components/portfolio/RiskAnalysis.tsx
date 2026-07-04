"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskMetrics } from "@/lib/types";
import { formatPercent } from "@/lib/utils/number";

interface RiskAnalysisProps { metrics: RiskMetrics | null; loading?: boolean; }

export function RiskAnalysis({ metrics, loading }: RiskAnalysisProps) {
  if (loading) return <Card><CardHeader><CardTitle>风险分析</CardTitle></CardHeader><CardContent><div className="animate-pulse space-y-3"><div className="h-6 bg-gray-200 rounded" /><div className="h-6 bg-gray-200 rounded" /><div className="h-6 bg-gray-200 rounded" /></div></CardContent></Card>;
  if (!metrics) return <Card><CardHeader><CardTitle>风险分析</CardTitle></CardHeader><CardContent><p className="text-gray-400 text-center py-4">暂无风险数据</p></CardContent></Card>;

  const items = [
    { label: "95% VaR", value: formatPercent(metrics.var_95), desc: "单日最大可能亏损" },
    { label: "95% CVaR", value: formatPercent(metrics.cvar_95), desc: "极端情况平均亏损" },
    { label: "年化波动率", value: formatPercent(metrics.volatility), desc: "价格波动程度" },
    { label: "Beta 系数", value: metrics.beta.toFixed(2), desc: "相对大盘敏感度" },
    { label: "夏普比率", value: metrics.sharpe_ratio.toFixed(2), desc: "风险调整后收益" },
    { label: "最大回撤", value: formatPercent(metrics.max_drawdown), desc: "历史最大亏损幅度" },
    { label: "集中度 HHI", value: (metrics.concentration * 100).toFixed(0), desc: "持仓集中风险" },
  ];

  return (
    <Card>
      <CardHeader><CardTitle>⚠️ 风险分析</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
              <div><p className="text-sm font-medium text-gray-700">{item.label}</p><p className="text-xs text-gray-400">{item.desc}</p></div>
              <p className="text-sm font-bold text-gray-800">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
