import { PushStrategyConfig } from "@/components/settings/PushStrategyConfig";

export default function PushSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📢 推送策略配置</h1>
        <p className="text-sm text-gray-500 mt-1">管理多通道推送策略，确保荐股及时送达</p>
      </div>
      <PushStrategyConfig />
    </div>
  );
}
