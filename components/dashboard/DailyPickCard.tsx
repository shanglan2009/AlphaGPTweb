"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/utils/number";

interface DailyPickItem {
  rank: number;
  stock_code: string;
  stock_name: string;
  predicted_return: number;
  confidence: number;
  reason: string;
}

interface DailyPickCardProps {
  picks: DailyPickItem[];
  loading?: boolean;
}

export function DailyPickCard({ picks, loading }: DailyPickCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">今日荐股</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!picks.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">今日荐股</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 text-center py-6">暂无推荐数据</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">📊 今日荐股 TOP {picks.length}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {picks.map((pick) => (
            <div
              key={pick.rank}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  pick.rank <= 3 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
                )}>
                  {pick.rank}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {pick.stock_name}
                    <span className="text-gray-400 ml-1.5 text-xs">{pick.stock_code}</span>
                  </p>
                  <p className="text-xs text-gray-400 truncate max-w-40">{pick.reason}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-sm font-semibold",
                  pick.predicted_return > 0 ? "text-red-500" : "text-green-500"
                )}>
                  {formatPercent(pick.predicted_return)}
                </p>
                <Badge variant="outline" className="text-xs">
                  置信 {pick.confidence.toFixed(0)}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
