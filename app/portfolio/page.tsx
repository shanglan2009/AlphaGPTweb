"use client";

import { useEffect, useState } from "react";
import { PositionList } from "@/components/portfolio/PositionList";
import { RiskAnalysis } from "@/components/portfolio/RiskAnalysis";
import { AllocationChart } from "@/components/portfolio/AllocationChart";
import { PortfolioPosition, RiskMetrics } from "@/lib/types";

export default function PortfolioPage() {
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/portfolio");
        const data = await res.json();
        if (data.success) {
          setPositions(data.data?.positions || []);
          setRiskMetrics(data.data?.risk_metrics || null);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">💼 持仓分析</h1>
        <p className="text-sm text-gray-500 mt-1">实时持仓监控与风险管理</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PositionList positions={positions} loading={loading} />
          <AllocationChart positions={positions} loading={loading} />
        </div>
        <div><RiskAnalysis metrics={riskMetrics} loading={loading} /></div>
      </div>
    </div>
  );
}
