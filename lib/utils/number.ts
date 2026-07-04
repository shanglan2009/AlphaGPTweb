/**
 * 格式化百分比
 */
export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(decimals)}%`;
}

/**
 * 格式化数字（带千分位）
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * 格式化金额（带单位）
 */
export function formatMoney(value: number): string {
  if (Math.abs(value) >= 1e8) {
    return `${(value / 1e8).toFixed(2)} 亿`;
  }
  if (Math.abs(value) >= 1e4) {
    return `${(value / 1e4).toFixed(2)} 万`;
  }
  return formatNumber(value);
}

/**
 * 获取涨跌颜色类名
 */
export function getChangeColor(value: number): string {
  if (value > 0) return "text-red-500";
  if (value < 0) return "text-green-500";
  return "text-gray-500";
}

/**
 * 获取涨跌背景色类名
 */
export function getChangeBgColor(value: number): string {
  if (value > 0) return "bg-red-50 text-red-600";
  if (value < 0) return "bg-green-50 text-green-600";
  return "bg-gray-50 text-gray-600";
}
