# 世界杯竞彩辅助小程序

合规定位：赛事信息、模拟方案、理论奖金计算和 AI 辅助分析工具。不提供在线购买、充值、支付、兑奖或真实投注订单能力。

## 技术栈

- 微信小程序
- Node.js NestJS
- PostgreSQL
- Prisma

## 目录

- `apps/api`: NestJS API 服务
- `apps/miniapp`: 微信小程序
- `apps/uniapp`: uni-app 微信小程序前端
- `apps/admin-web`: 后台管理端
- `packages/shared`: 前后端共享类型
- `outputs`: 阶段设计文档
- `docs/api.http`: 接口手工联调脚本

## 本地开发

需要先准备：

- Node.js 22+
- pnpm
- Docker

```bash
pnpm install
docker compose up -d
pnpm prisma:generate
pnpm prisma:migrate
pnpm --filter @wc-assistant/api seed
pnpm dev:api
```

也可以使用初始化脚本：

```bash
bash scripts/bootstrap.sh
```

Seed 后默认后台账号：

- 用户名：`admin`
- 密码：`admin12345`

后台管理端：

```bash
pnpm dev:admin
```

默认访问：

- API: `http://localhost:3000/api/v1`
- 后台管理端: `http://localhost:5173`
- 小程序: 使用微信开发者工具打开 `apps/miniapp`
- uni-app 微信小程序: `pnpm dev:uniapp:mp-weixin` 后用微信开发者工具打开 `apps/uniapp/dist/dev/mp-weixin`

## 已实现的一期接口

- `GET /api/v1/matches`: 赛程列表
- `GET /api/v1/matches/:id`: 比赛详情
- `GET /api/v1/matches/:id/analysis`: 已发布 AI 分析
- `POST /api/v1/calculator/prize`: 理论奖金计算
- `POST /api/v1/simulation/plans`: 创建模拟方案
- `POST /api/v1/admin/auth/login`: 后台登录
- `POST /api/v1/admin/teams`: 后台新增球队
- `POST /api/v1/admin/matches`: 后台新增比赛
- `POST /api/v1/admin/matches/:matchId/odds`: 后台录入赔率
- `POST /api/v1/admin/matches/:matchId/analysis/generate`: 生成 AI 分析草稿
- `PATCH /api/v1/admin/analysis/:id/publish`: 发布 AI 分析
- `PATCH /api/v1/admin/analysis/:id/reject`: 驳回 AI 分析
- `GET /api/v1/admin/audit-logs`: 查询审计日志

## 安全和合规说明

- 后台接口统一要求 JWT，登录接口除外。
- 管理员密码使用 scrypt 哈希存储。
- 模拟方案不是订单，不接入支付、充值、购买或兑奖。
- 理论奖金计算仅保存演算快照，不代表真实可兑奖金额。
