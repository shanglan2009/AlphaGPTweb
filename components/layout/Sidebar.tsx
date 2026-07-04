"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  PieChart,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bot,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  BarChart3: <BarChart3 className="h-5 w-5" />,
  PieChart: <PieChart className="h-5 w-5" />,
  History: <History className="h-5 w-5" />,
  Settings: <Settings className="h-5 w-5" />,
};

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
        isOpen ? "w-56" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-gray-200">
        {isOpen && (
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-blue-600">
            <Bot className="h-6 w-6" />
            <span>AlphaGPT</span>
          </Link>
        )}
        {!isOpen && (
          <Link href="/" className="mx-auto">
            <Bot className="h-6 w-6 text-blue-600" />
          </Link>
        )}
        <button
          onClick={onToggle}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {NAV_ITEMS.map((item: typeof NAV_ITEMS[number]) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <span className="flex-shrink-0">
                {iconMap[item.icon] || <LayoutDashboard className="h-5 w-5" />}
              </span>
              {isOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {isOpen && (
        <div className="p-3 border-t border-gray-200 text-xs text-gray-400">
          <p>AlphaGPTweb v1.0</p>
          <p>AI 智能荐股系统</p>
        </div>
      )}
    </aside>
  );
}
