// 应用常量

export const APP_NAME = "AlphaGPTweb";
export const APP_DESCRIPTION = "AI 驱动的 A 股智能荐股系统";

// 市场
export const MARKETS = {
  SH: "上海",
  SZ: "深圳",
  BJ: "北京",
} as const;

// 胜率相关
export const MIN_CONFIDENCE_DEFAULT = 0.6;
export const TOP_N_DEFAULT = 10;
export const HOLD_DAYS_DEFAULT = 1;
export const STOP_LOSS_DEFAULT = -0.05;   // -5%
export const TAKE_PROFIT_DEFAULT = 0.10;  // +10%

// 推送渠道
export const PUSH_CHANNELS = ["qq", "email", "webhook"] as const;

// 页面路由
export const ROUTES = {
  HOME: "/",
  RECOMMENDATIONS: "/recommendations",
  BACKTEST: "/backtest",
  PORTFOLIO: "/portfolio",
  HISTORY: "/history",
  SETTINGS: "/settings",
  SETTINGS_PUSH: "/settings/push",
} as const;

// 导航菜单
export const NAV_ITEMS = [
  { label: "仪表盘", href: ROUTES.HOME, icon: "LayoutDashboard" },
  { label: "每日荐股", href: ROUTES.RECOMMENDATIONS, icon: "TrendingUp" },
  { label: "回测系统", href: ROUTES.BACKTEST, icon: "BarChart3" },
  { label: "持仓分析", href: ROUTES.PORTFOLIO, icon: "PieChart" },
  { label: "历史胜率", href: ROUTES.HISTORY, icon: "History" },
  { label: "系统设置", href: ROUTES.SETTINGS, icon: "Settings" },
] as const;

// API 端点
export const API = {
  DAILY_PICKS: "/recommendations/daily",
  PICK_HISTORY: "/recommendations/history",
  BACKTEST: "/backtest",
  PORTFOLIO: "/portfolio",
  WINRATE: "/winrate",
  SETTINGS: "/settings",
  QQ_BOT: "/qq-bot",
} as const;
