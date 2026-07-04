"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface WinRateCardProps {
  title: string;
  rate: number;
  total: number;
  wins: number;
  trend?: "up" | "down" | "stable";
  loading?: boolean;
}

export function WinRateCard({ title, rate, total, wins, trend, loading }: WinRateCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-gray-200 rounded w-20" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const trendIcon = trend === "up"
    ? <TrendingUp className="h-4 w-4 text-red-500" />
    : trend === "down"
    ? <TrendingDown className="h-4 w-4 text-green-500" />
    : <Minus className="h-4 w-4 text-gray-400" />;

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        {trendIcon}
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-3xl font-bold",
          rate >= 0.6 ? "text-red-500" : rate >= 0.5 ? "text-orange-500" : "text-gray-700"
        )}>
          {(rate * 100).toFixed(1)}%
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {wins} 胜 / {total} 推荐
        </p>
      </CardContent>
    </Card>
  );
}
