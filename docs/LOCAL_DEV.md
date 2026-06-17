# 本地启动教程

## 1. 安装依赖

后端：

```bash
cd backend
../.tools/bin/npm install
```

前端：

```bash
cd frontend
../.tools/bin/npm install
```

如果没有使用项目内置 npm，可替换为系统 `npm`。

## 2. 准备环境变量

```bash
cp .env.example backend/.env
```

本地可保持：

```env
AI_MOCK_MODE=true
DATABASE_URL=postgresql://worldcup:worldcup@localhost:5432/ai_worldcup?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379
API_BASE_URL=http://localhost:3000/api
```

## 3. 启动数据库和缓存

```bash
docker compose up -d postgres redis
```

如果本机没有 Docker，也可以使用已有 PostgreSQL 和 Redis，只要 `backend/.env` 中的连接信息正确即可。

## 4. 执行 Prisma migration

```bash
cd backend
../.tools/bin/npm run prisma:generate
../.tools/bin/npm run prisma:migrate -- --name init
```

已有生产数据库请使用：

```bash
cd backend
../.tools/bin/npm exec prisma migrate deploy
```

## 5. 执行 seed

```bash
cd backend
../.tools/bin/npm run seed
```

Seed 会写入：

- 默认球队数据
- 示例比赛数据
- 示例 AI 报告
- 示例每日推荐
- 示例挑战赛配置
- 管理员账号 `admin_local`
- 世界杯通行证会员套餐

## 6. 启动后端

```bash
cd backend
../.tools/bin/npm run start:dev
```

健康检查：

```bash
curl http://localhost:3000/api/health
```

## 7. 启动小程序

H5 预览：

```bash
cd frontend
VITE_API_BASE_URL=http://localhost:3000/api ../.tools/bin/npm run dev:h5 -- --host 127.0.0.1 --port 5173
```

微信小程序构建：

```bash
cd frontend
VITE_API_BASE_URL=https://your-domain.com/api ../.tools/bin/npm run build:mp-weixin
```

微信开发者工具导入：

```text
frontend/dist/build/mp-weixin
```

## 8. 启动管理后台

当前管理后台为可选占位服务，主要用于部署拓扑预留：

```bash
docker compose --profile admin up -d admin
```

访问：

```text
http://localhost:8088
```

MVP 的管理能力目前通过后端接口完成，例如重新生成 AI 报告、重新生成每日推荐、录入赛果和录入挑战赛最终结果。
