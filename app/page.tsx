"use client";

import { useEffect, useState } from "react";
import { WinRateCard } from "@/components/dashboard/WinRateCard";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { DailyPickCard } from "@/components/dashboard/DailyPickCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { WinRateData, DailyPick } from "@/lib/types";
import { getLatestTradingDay } from "@/lib/utils/date";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [winRate, setWinRate] = useState<WinRateData | null>(null);
  const [dailyPicks, setDailyPicks] = useState<DailyPick[]>([]);
  const [historyData, setHistoryData] = useState<Array<{ date: string; daily_win_rate: number; monthly_win_rate: number }>>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const today = getLatestTradingDay();

        // Fetch daily picks
        const picksRes = await fetch(`/api/recommendations/daily?date=${today}`);
        const picksData = await picksRes.json();
        if (picksData.success) {
          setDailyPicks(picksData.data || []);
        }

        // Fetch win rate
        const wrRes = await fetch(`/api/winrate?date=${today}`);
        const wrData = await wrRes.json();
        if (wrData.success) {
          setWinRate(wrData.data);
        }

        // Fetch history for chart (last 30 days)
        const histRes = await fetch("/api/winrate?range=30");
        const histData = await histRes.json();
        if (histData.success && histData.data) {
          setHistoryData(histData.data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📊 仪表盘</h1>
        <p className="text-sm text-gray-500 mt-1">
          实时胜率监控与每日荐股概览
        </p>
      </div>

      {/* Win Rate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <WinRateCard
          title="📅 今日日胜率"
          rate={winRate?.daily_win_rate ?? 0}
          total={winRate?.total_picks ?? 0}
          wins={winRate?.wins ?? 0}
          loading={loading}
        />
        <WinRateCard
          title="📆 本月月胜率"
          rate={winRate?.monthly_win_rate ?? 0}
          total={winRate?.month_picks ?? 0}
          wins={winRate?.month_wins ?? 0}
          loading={loading}
        />
      </div>

      {/* Stats Overview */}
      <StatsOverview
        totalRecommendations={dailyPicks.length}
        avgConfidence={dailyPicks.length > 0
          ? dailyPicks.reduce((sum, p) => sum + p.confidence, 0) / dailyPicks.length
          : 0}
        bestStock={dailyPicks[0]?.stock_name || "--"}
        bestReturn={dailyPicks[0]?.predicted_return || 0}
        activeModel={dailyPicks[0]?.model_version || "v1"}
        loading={loading}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Picks */}
        <div className="lg:col-span-1">
          <DailyPickCard
            picks={dailyPicks.slice(0, 10).map((p, i) => ({
              rank: i + 1,
              stock_code: p.stock_code,
              stock_name: p.stock_name,
              predicted_return: p.predicted_return,
              confidence: p.confidence * 100,
              reason: p.reason,
            }))}
            loading={loading}
          />
        </div>

        {/* Win Rate Chart */}
        <div className="lg:col-span-2">
          <PerformanceChart data={historyData} loading={loading} />
        </div>
      </div>

      {/* Model Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">🤖 模型自我迭代</h3>
        <p className="text-xs text-blue-600">
          系统每周自动使用新数据重训练模型，并对比新旧模型胜率。当新模型胜率超过旧模型时自动切换。
          当前运行模型版本记录所有推荐和胜率数据，用于持续优化。
        </p>
      </div>
    </div>
  );
}
