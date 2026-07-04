"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PortfolioPosition } from "@/lib/types";

const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

interface AllocationChartProps { positions: PortfolioPosition[]; loading?: boolean; }

export function AllocationChart({ positions, loading }: AllocationChartProps) {
  if (loading) return <Card><CardHeader><CardTitle>持仓分布</CardTitle></CardHeader><CardContent><div className="animate-pulse h-64 bg-gray-100 rounded" /></CardContent></Card>;
  if (!positions.length) return <Card><CardHeader><CardTitle>持仓分布</CardTitle></CardHeader><CardContent><p className="text-gray-400 text-center py-8">暂无数据</p></CardContent></Card>;

  const data = positions.map((p) => ({ name: p.stock_name, value: +(p.weight * 100).toFixed(2), code: p.stock_code }));

  return (
    <Card>
      <CardHeader><CardTitle>🥧 持仓分布</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${(name || "").slice(0, 4)} ${value}%`}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(value: unknown) => `${value}%`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
