"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { WinRateHistory } from "@/lib/types";
import { formatPercent } from "@/lib/utils/number";
import { TrendingUp, Award, Target } from "lucide-react";

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<WinRateHistory[]>([]);
  const [summary, setSummary] = useState({ max_daily: 0, max_monthly: 0, cumulative: 0, total_picks: 0 });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/winrate?range=90");
        const data = await res.json();
        if (data.success && data.data) {
          setHistory(data.data);
          const h = data.data as WinRateHistory[];
          setSummary({
            max_daily: Math.max(...h.map((d) => d.daily_win_rate), 0),
            max_monthly: Math.max(...h.map((d) => d.monthly_win_rate), 0),
            cumulative: h.length > 0 ? h[h.length - 1].cumulative_win_rate : 0,
            total_picks: h.reduce((s, d) => s + d.total_picks, 0),
          });
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📜 历史胜率</h1>
        <p className="text-sm text-gray-500 mt-1">追踪 AI 模型的长期胜率表现</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500 flex items-center gap-2"><Award className="h-4 w-4" />最高日胜率</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-500">{formatPercent(summary.max_daily)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500 flex items-center gap-2"><TrendingUp className="h-4 w-4" />最高月胜率</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-500">{formatPercent(summary.max_monthly)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500 flex items-center gap-2"><Target className="h-4 w-4" />累计胜率</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{formatPercent(summary.cumulative)}</p><p className="text-xs text-gray-400 mt-1">共 {summary.total_picks} 次推荐</p></CardContent>
        </Card>
      </div>

      <PerformanceChart data={history} loading={loading} />
    </div>
  );
}
