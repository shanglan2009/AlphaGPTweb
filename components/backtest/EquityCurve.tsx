"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { EquityPoint } from "@/lib/types";

interface EquityCurveProps {
  data: EquityPoint[];
  loading?: boolean;
}

export function EquityCurve({ data, loading }: EquityCurveProps) {
  if (loading) return <Card><CardHeader><CardTitle>权益曲线</CardTitle></CardHeader><CardContent><div className="animate-pulse h-64 bg-gray-100 rounded" /></CardContent></Card>;
  if (!data.length) return null;

  return (
    <Card>
      <CardHeader><CardTitle>💰 权益曲线</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: unknown) => `${((v as number) / 10000).toFixed(0)}万`} />
            <Tooltip formatter={(value: unknown) => [`¥${(value as number).toLocaleString()}`, "权益"]} labelFormatter={(l) => `日期: ${l}`} />
            <defs><linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
            <Area type="monotone" dataKey="equity" stroke="#3b82f6" fill="url(#equityGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
