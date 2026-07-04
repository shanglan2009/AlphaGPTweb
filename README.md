# AlphaGPTweb — AI 荐股系统

基于深度学习的 A 股智能荐股系统，以**胜率**为核心优化目标，支持每日荐股、回测、持仓分析和自我迭代。

## 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **存储**: Upstash Redis (缓存) + Neon PostgreSQL (持久化)
- **ML 引擎**: Python (AlphaGPT 架构适配 A 股)
- **定时任务**: GitHub Actions
- **部署**: Vercel

## 快速开始

```bash
# 安装前端依赖
npm install

# 安装 Python 依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入必要的 API Key

# 启动开发服务器
npm run dev
```

## 项目结构

```
├── app/                     # Next.js App Router 页面
│   ├── page.tsx            # 仪表盘首页
│   ├── recommendations/    # 每日荐股
│   ├── backtest/           # 回测系统
│   ├── portfolio/          # 持仓分析
│   ├── history/            # 历史胜率
│   ├── settings/           # QQ机器人 + 推送配置
│   └── api/                # API Routes
├── components/             # React 组件
├── lib/                    # 工具库（类型、DB客户端等）
├── python/                 # Python ML 脚本
│   ├── data_pipeline/      # 数据采集管线
│   ├── model/              # AI 模型（AlphaGPT 架构）
│   ├── backtest/           # 回测引擎
│   └── scheduler/          # 定时任务脚本
├── .github/workflows/      # GitHub Actions 定时任务
└── public/                 # 静态资源
```

## 胜率定义

- **日胜率** = 当日推荐股票中 T+1 收盘涨幅 > 0 的比例
- **月胜率** = 当月所有推荐股票中 T+1 收盘涨幅 > 0 的比例

## 自我迭代机制

1. 每周自动使用新数据重训练模型
2. 记录每个模型版本的胜率表现
3. 新模型胜率超过旧模型时自动切换
4. 保留历史模型用于回测对比
