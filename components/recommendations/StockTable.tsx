"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/utils/number";
import { DailyPick } from "@/lib/types";
import { Search } from "lucide-react";

interface StockTableProps {
  picks: DailyPick[];
  loading?: boolean;
}

export function StockTable({ picks, loading }: StockTableProps) {
  const [search, setSearch] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState("all");

  const filtered = picks.filter((p) => {
    if (search && !p.stock_name.includes(search) && !p.stock_code.includes(search)) return false;
    if (confidenceFilter === "high" && p.confidence < 0.8) return false;
    if (confidenceFilter === "medium" && (p.confidence < 0.6 || p.confidence >= 0.8)) return false;
    if (confidenceFilter === "low" && p.confidence >= 0.6) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="搜索股票名称或代码..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={confidenceFilter} onValueChange={(v) => setConfidenceFilter(v || "all")}>
          <SelectTrigger className="w-40"><SelectValue placeholder="置信度" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="high">高 ≥80%</SelectItem>
            <SelectItem value="medium">中 60-80%</SelectItem>
            <SelectItem value="low">低 &lt;60%</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">排名</TableHead>
              <TableHead>股票名称</TableHead>
              <TableHead>代码</TableHead>
              <TableHead className="text-right">预测收益</TableHead>
              <TableHead className="text-right">置信度</TableHead>
              <TableHead>推荐理由</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => (
                <TableCell key={j}><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
              ))}</TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-8">暂无匹配的荐股数据</TableCell></TableRow>
            ) : filtered.map((pick) => (
              <TableRow key={pick.id} className="hover:bg-gray-50">
                <TableCell><span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", pick.rank <= 3 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500")}>{pick.rank}</span></TableCell>
                <TableCell className="font-medium">{pick.stock_name}</TableCell>
                <TableCell className="text-gray-500 font-mono text-sm">{pick.stock_code}</TableCell>
                <TableCell className={cn("text-right font-semibold", pick.predicted_return > 0 ? "text-red-500" : "text-green-500")}>{formatPercent(pick.predicted_return)}</TableCell>
                <TableCell className="text-right"><Badge variant={pick.confidence >= 0.8 ? "default" : pick.confidence >= 0.6 ? "secondary" : "outline"}>{(pick.confidence * 100).toFixed(0)}%</Badge></TableCell>
                <TableCell className="text-sm text-gray-500 max-w-48 truncate">{pick.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
