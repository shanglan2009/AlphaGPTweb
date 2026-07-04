import { QQBotConfig } from "@/components/settings/QQBotConfig";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">⚙️ 系统设置</h1>
        <p className="text-sm text-gray-500 mt-1">QQ机器人配置与系统管理</p>
      </div>
      <QQBotConfig />
    </div>
  );
}
