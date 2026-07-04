"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PerformanceChartProps {
  data: Array<{
    date: string;
    daily_win_rate: number;
    monthly_win_rate: number;
  }>;
  loading?: boolean;
}

export function PerformanceChart({ data, loading }: PerformanceChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">胜率走势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-64 bg-gray-100 rounded" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    daily: +(d.daily_win_rate * 100).toFixed(1),
    monthly: +(d.monthly_win_rate * 100).toFixed(1),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">📈 胜率走势</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              formatter={(value: unknown) => `${value}%`}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="daily"
              name="日胜率"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="monthly"
              name="月胜率"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
