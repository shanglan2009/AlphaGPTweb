"use client";

import { useEffect, useState } from "react";
import { StockTable } from "@/components/recommendations/StockTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyPick } from "@/lib/types";
import { getLatestTradingDay, formatDateCN } from "@/lib/utils/date";

export default function RecommendationsPage() {
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<DailyPick[]>([]);
  const [historyPicks, setHistoryPicks] = useState<DailyPick[]>([]);
  const today = getLatestTradingDay();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/recommendations/daily?date=${today}`);
        const data = await res.json();
        if (data.success) setPicks(data.data || []);

        const histRes = await fetch("/api/recommendations/history?limit=50");
        const histData = await histRes.json();
        if (histData.success) setHistoryPicks(histData.data || []);
      } catch (err) { console.error("Failed to fetch picks:", err); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📈 每日荐股</h1>
        <p className="text-sm text-gray-500 mt-1">AI 模型驱动的智能荐股，每日更新</p>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList>
          <TabsTrigger value="today">今日推荐 ({formatDateCN(today)})</TabsTrigger>
          <TabsTrigger value="history">历史推荐</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="mt-4">
          <StockTable picks={picks} loading={loading} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <StockTable picks={historyPicks} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
