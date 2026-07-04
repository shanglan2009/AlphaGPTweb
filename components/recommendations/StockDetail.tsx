"use client";

import { DailyPick, PickOutcome } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPercent, getChangeColor } from "@/lib/utils/number";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StockDetailProps {
  pick: DailyPick;
  outcome?: PickOutcome;
}

export function StockDetail({ pick, outcome }: StockDetailProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{pick.stock_name}</CardTitle>
              <p className="text-sm text-gray-500 font-mono">{pick.stock_code}</p>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">排名 #{pick.rank}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">预测收益</p>
              <p className={cn("text-lg font-bold", getChangeColor(pick.predicted_return))}>{formatPercent(pick.predicted_return)}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">置信度</p>
              <p className="text-lg font-bold text-blue-600">{(pick.confidence * 100).toFixed(0)}%</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">模型版本</p>
              <p className="text-lg font-bold text-gray-700">{pick.model_version}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">推荐理由</p>
            <p className="text-sm text-gray-700">{pick.reason || "基于多因子模型综合评分"}</p>
          </div>
          {outcome && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-600 mb-2">T+1 实际表现</p>
              <div className="flex items-center gap-4">
                {outcome.is_win ? <TrendingUp className="h-8 w-8 text-red-500" /> : <TrendingDown className="h-8 w-8 text-green-500" />}
                <div>
                  <p className={cn("text-lg font-bold", getChangeColor(outcome.actual_return))}>{formatPercent(outcome.actual_return)}</p>
                  <p className="text-xs text-gray-400">开盘 {outcome.next_day_open?.toFixed(2)} → 收盘 {outcome.next_day_close?.toFixed(2)}</p>
                </div>
                <Badge variant={outcome.is_win ? "default" : "destructive"}>{outcome.is_win ? "✓ 胜" : "✗ 负"}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
