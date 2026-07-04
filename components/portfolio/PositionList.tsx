"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PortfolioPosition } from "@/lib/types";
import { formatPercent, formatMoney, getChangeColor } from "@/lib/utils/number"
import { cn } from "@/lib/utils";

interface PositionListProps { positions: PortfolioPosition[]; loading?: boolean; }

export function PositionList({ positions, loading }: PositionListProps) {
  if (loading) return <div className="border rounded-lg p-4"><div className="animate-pulse space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-200 rounded" />)}</div></div>;
  if (!positions.length) return <div className="border rounded-lg p-8 text-center text-gray-400">暂无持仓数据</div>;

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>股票</TableHead><TableHead>行业</TableHead><TableHead className="text-right">权重</TableHead><TableHead className="text-right">入场价</TableHead><TableHead className="text-right">现价</TableHead><TableHead className="text-right">市值</TableHead><TableHead className="text-right">盈亏</TableHead><TableHead className="text-right">持有天数</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((p) => (
            <TableRow key={p.id} className="hover:bg-gray-50">
              <TableCell><span className="font-medium">{p.stock_name}</span><span className="text-gray-400 ml-1.5 text-xs font-mono">{p.stock_code}</span></TableCell>
              <TableCell className="text-gray-500 text-sm">{p.industry || "--"}</TableCell>
              <TableCell className="text-right">{(p.weight * 100).toFixed(1)}%</TableCell>
              <TableCell className="text-right font-mono text-sm">{p.entry_price?.toFixed(2)}</TableCell>
              <TableCell className="text-right font-mono text-sm">{p.current_price?.toFixed(2)}</TableCell>
              <TableCell className="text-right">{formatMoney(p.market_value)}</TableCell>
              <TableCell className={cn("text-right font-semibold", getChangeColor(p.pnl_pct).split(" ")[0])}>{formatPercent(p.pnl_pct)}</TableCell>
              <TableCell className="text-right text-sm text-gray-500">{p.hold_days} 天</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
