"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsOverviewProps {
  totalRecommendations: number;
  avgConfidence: number;
  bestStock: string;
  bestReturn: number;
  activeModel: string;
  loading?: boolean;
}

export function StatsOverview({ totalRecommendations, avgConfidence, bestStock, bestReturn, activeModel, loading }: StatsOverviewProps) {
  const stats = [
    { label: "累计推荐", value: `${totalRecommendations} 只`, sub: "股票" },
    { label: "平均置信度", value: `${(avgConfidence * 100).toFixed(0)}%` },
    { label: "最佳推荐", value: bestStock, sub: `收益 ${(bestReturn * 100).toFixed(1)}%` },
    { label: "当前模型", value: activeModel, sub: "运行中" },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-3 bg-gray-200 rounded w-16" />
                <div className="h-6 bg-gray-200 rounded w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-gray-800">{stat.value}</p>
            {stat.sub && <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
