import { format, parseISO, subDays, addDays, startOfMonth, endOfMonth } from "date-fns";
import { zhCN } from "date-fns/locale";

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
}

/**
 * 格式化日期为中文显示
 */
export function formatDateCN(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy年M月d日", { locale: zhCN });
}

/**
 * 获取最近的交易日（简化版：跳过周末）
 */
export function getLatestTradingDay(): string {
  const today = new Date();
  const day = today.getDay();
  if (day === 0) return formatDate(subDays(today, 2)); // 周日 -> 周五
  if (day === 6) return formatDate(subDays(today, 1)); // 周六 -> 周五
  // 如果在 15:30 之前，返回前一个交易日
  if (today.getHours() < 15 || (today.getHours() === 15 && today.getMinutes() < 30)) {
    if (day === 1) return formatDate(subDays(today, 3)); // 周一 -> 上周五
    return formatDate(subDays(today, 1));
  }
  return formatDate(today);
}

/**
 * 获取今日日期字符串
 */
export function getToday(): string {
  return formatDate(new Date());
}

/**
 * 获取月初日期
 */
export function getMonthStart(date?: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : (date || new Date());
  return formatDate(startOfMonth(d));
}

/**
 * 获取月末日期
 */
export function getMonthEnd(date?: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : (date || new Date());
  return formatDate(endOfMonth(d));
}

/**
 * 判断是否为周末
 */
export function isWeekend(date: string): boolean {
  const d = parseISO(date);
  return d.getDay() === 0 || d.getDay() === 6;
}
