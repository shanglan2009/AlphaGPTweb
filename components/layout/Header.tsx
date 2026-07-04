"use client";

import { Menu, Bell, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getToday } from "@/lib/utils/date";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden sm:block">
          <h2 className="text-sm font-medium text-gray-600">
            📅 {getToday()} 交易日
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* 胜率快捷显示 */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">日胜率</span>
            <span className="font-semibold text-red-500">--</span>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-1">
            <span className="text-gray-500">月胜率</span>
            <span className="font-semibold text-red-500">--</span>
          </div>
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full" />
        </Button>

        <Button variant="ghost" size="icon">
          <Sun className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
