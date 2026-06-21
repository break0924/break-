# AI 世界杯预测官

“AI 世界杯预测官”是一个个人级微信小程序 MVP，提供 AI 每日推荐、AI 赛前分析、世界杯挑战赛和会员内容解锁能力。产品定位是足球内容阅读、数据分析和娱乐积分活动，会员支付仅用于购买 AI 分析内容服务。

## 功能说明

- AI 每日推荐：每天展示 3 场精选比赛，免费用户查看简版内容，会员查看完整理由。
- AI 赛前分析：每场比赛一份 AI 报告，包含状态、交锋、球员、伤停、战术、概率、比分倾向和风险提示。
- 世界杯挑战赛：用户提交冠军、四强、金靴、单场方向和比分预测，开赛后锁定，赛果录入后计算积分。
- 会员内容解锁：世界杯通行证暂定 59 元，用于解锁完整 AI 内容、历史命中率和高级榜单。

## 合规声明

本项目只提供足球数据分析、AI 内容生成、娱乐挑战积分和会员内容服务。支付链路仅用于会员内容服务购买，不提供赛事交易、资金账户、结果收益、代理服务、票据服务、奖励返还或推广收益能力。AI 内容仅供阅读参考，比赛结果存在不确定性。

## 技术栈

- 前端：uni-app + Vue3 + TypeScript
- 后端：NestJS + TypeScript
- 数据库：PostgreSQL
- ORM：Prisma
- 缓存：Redis
- 支付：微信支付 JSAPI，仅用于会员内容服务
- AI：OpenAI API，本地可启用 mock 模式

## 目录结构

```text
.
├── admin/                  # 可选管理端占位目录
├── backend/                # NestJS API
│   ├── prisma/             # schema、migration、seed
│   └── src/                # 业务模块
├── frontend/               # uni-app 微信小程序
├── docs/                   # 启动、审核、合规、审计文档
├── scripts/                # 本地初始化脚本
├── docker-compose.yml      # PostgreSQL、Redis、API、可选 Admin
└── .env.example            # 环境变量模板
```

## 环境准备

- Node.js 18+
- Docker Desktop
- 微信开发者工具
- OpenAI API Key，可选；本地默认 `AI_MOCK_MODE=true`
- 微信支付商户配置，生产环境需要

复制环境变量：

```bash
cp .env.example backend/.env
```

## GitHub 与微信小程序上传流程

当前微信小程序源码位于 `frontend/`，使用 uni-app 编译。不要直接上传根目录，也不要上传历史占位目录 `miniapp/`。

### 1. 拉取项目后安装依赖

```bash
cd frontend
npm install
```

如果网络环境导致安装卡住，可以先确认 `package-lock.json` 存在，并在网络恢复后重试：

```bash
npm install
```

### 2. 本地 H5 预览

```bash
cd frontend
npm run dev
```

默认启动 H5 预览。需要指定端口时：

```bash
npm run dev:h5 -- --host 127.0.0.1 --port 5174
```

### 3. 构建微信小程序

```bash
cd frontend
npm run build
```

等价于：

```bash
npm run build:mp-weixin
```

构建成功后，微信开发者工具导入目录：

```text
frontend/dist/build/mp-weixin
```

该目录会包含 `app.json`、页面文件和自动生成的 `project.config.json`。

### 4. AppID 配置

开源仓库中不要提交真实 AppSecret、支付密钥或私钥。上传前只需要配置小程序 AppID：

- 推荐：在 `frontend/src/manifest.json` 的 `mp-weixin.appid` 填入真实小程序 AppID，然后重新执行 `npm run build`。
- 或者：微信开发者工具导入 `frontend/dist/build/mp-weixin` 后，在工具内选择真实 AppID。

`WECHAT_APP_SECRET`、微信支付 API v3 Key、商户私钥、OpenAI API Key 等只能放在服务端环境变量中，不要写入前端源码或提交到 GitHub。

### 5. GitHub 提交建议

提交源码和配置模板即可，以下内容不应提交：

- `node_modules/`
- `frontend/dist/`
- `.env`、`.env.local`、`backend/.env`
- 微信支付证书、私钥、`.pem`、`.p12`、`.pfx`
- `project.private.config.json`
- 日志、缓存和临时文件

## 本地启动

初始化数据库并写入示例数据：

```bash
chmod +x scripts/init-db.sh
./scripts/init-db.sh
```

启动后端：

```bash
cd backend
../.tools/bin/npm run start:dev
```

启动小程序 H5 预览：

```bash
cd frontend
../.tools/bin/npm install
VITE_API_BASE_URL=http://localhost:3000/api ../.tools/bin/npm run dev:h5 -- --host 127.0.0.1 --port 5173
```

构建微信小程序：

```bash
cd frontend
../.tools/bin/npm run build:mp-weixin
```

用微信开发者工具导入：

```text
frontend/dist/build/mp-weixin
```

## 数据库迁移

开发环境：

```bash
cd backend
../.tools/bin/npm run prisma:migrate -- --name init
../.tools/bin/npm run seed
```

生产或 Docker 环境：

```bash
cd backend
../.tools/bin/npm exec prisma migrate deploy
../.tools/bin/npm run seed
```

## AI 报告生成

本地默认 mock：

```env
AI_MOCK_MODE=true
```

启用 OpenAI：

```env
AI_MOCK_MODE=false
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

定时任务会在北京时间每天 09:00 生成当日预测版本和公开归档草稿，并在 09:05 发布公开归档。也可以调用后台生成接口：

```bash
curl -X POST http://localhost:3000/api/admin/ai/daily-recommendations/regenerate \
  -H 'Content-Type: application/json' \
  -d '{"date":"2026-06-12"}'
```

### 预测版本刷新机制

系统会把每次刷新保存为追加版本，不覆盖旧预测：

- 09:00：生成当天所有未开赛比赛的 `DAILY` 版本。
- 18:00：生成当天所有未开赛比赛的 `EVENING` 版本，重点复核伤停、赔率、新闻和积分榜变化。
- 赛前 90 分钟：每 5 分钟扫描一次，将即将开赛且尚未生成临场版本的比赛保存为 `PRE_MATCH` 版本。
- 比赛开始后：该场赛前预测锁定，不再生成或修改赛前预测。
- 比赛结束后：赛果同步或手动修正会回填 `actualResult`、`hitStatus`、方向/比分/总进球命中结果。

手动补跑：

```bash
curl -X POST http://localhost:3000/api/admin/predictions/refresh-versions \
  -H 'Content-Type: application/json' \
  -d '{"predictionType":"EVENING","date":"2026-06-12"}'
```

查看历史版本：

```bash
curl "http://localhost:3000/api/admin/predictions/versions?matchId=match_id"
```

## AI预测调度

预测任务统一使用 `APP_TIMEZONE=Asia/Shanghai`。为了适配北美赛程在中国时间凌晨、清晨和上午开赛，当前 V2 调度采用“前一天生成发布 + 临赛补刷新 + 赛前锁定 + 临场变量快照”：

- 每天 18:00 生成次日 `00:00-23:59` 全部比赛预测草稿。
- 每天 20:00 自动发布次日全部预测。
- 定时扫描进入赛前 6 小时窗口的比赛，追加一条 `PRE_MATCH_6H` 预测版本。
- 定时扫描进入赛前 90 分钟窗口的比赛，追加一条 `PRE_MATCH_90M` 最终预测版本。
- V2 模型会读取结构化赛前变量：伤停影响、首发稳定性、小组出线动机、天气/场地影响、旅行与恢复压力，并保存到 `prediction_feature_snapshots`。
- 后台可通过 `POST /api/admin/matches/:id/prematch-context` 更新单场 V2 赛前变量。
- 开赛前 30 分钟自动锁定该场预测，锁定后不覆盖原始归档内容；补充信息只能写入 `prediction_corrections.correctionNote`。
- 比赛结束后由结果同步任务每小时拉取赛果，并幂等结算 AI预测命中、挑战赛积分和排行榜。
- `/api/predictions/stats` 会单独返回高信心场次与谨慎场次的命中统计，便于运营期筛选和复盘。

关键环境变量：

```env
APP_TIMEZONE=Asia/Shanghai
PREDICTION_GENERATE_CRON=0 18 * * *
PREDICTION_PUBLISH_CRON=0 20 * * *
PREDICTION_LOCK_MINUTES=30
PREDICTION_REFRESH_HOURS_BEFORE=6
PREDICTION_FINAL_REFRESH_MINUTES_BEFORE=90
PREDICTION_DUE_SCAN_CRON=*/10 * * * *
PREDICTION_LOCK_SCAN_CRON=* * * * *
RESULT_SYNC_CRON=0 * * * *
```

幂等策略：

- `prediction_archives` 通过 `matchId + promptVersion + engineModelVersion + isMemberContent` 防止重复生成主归档。
- `prediction_versions` 通过 `matchId + predictionType + refreshStage` 防止重复生成 6 小时版和 90 分钟版。
- 发布任务只处理 `DRAFT`，已发布预测不会重复发布。
- 锁定任务只处理 `predictionLockedAt IS NULL` 的比赛，并给归档和版本写入 `lockedAt`。
- 结算任务通过 `prediction_settlements.predictionArchiveId` 的唯一键幂等 upsert。

本次调度补充的 Prisma 字段：

- `Match.predictionLockAt`：计划锁定时间，默认按开赛前 30 分钟计算。
- `Match.predictionLockedAt`：实际锁定时间。
- `PredictionArchive.lockedAt`：归档锁定时间。
- `PredictionVersion.refreshStage`：版本阶段，例如 `DAILY`、`EVENING`、`PRE_MATCH_6H`、`PRE_MATCH_90M`。
- `PredictionVersion.scheduledFor`：该版本对应的比赛开赛时间。
- `PredictionVersion.lockedAt`：版本锁定时间。

## 比赛结果同步

后端通过 `ScheduleModule.forRoot()` 启用定时任务。个人项目默认采用低成本同步策略，所有时间按 `Asia/Shanghai` 执行：

- 每小时同步一次，Cron `0 * * * *`。
- 每天凌晨 2 点补同步前一天全部比赛，Cron `0 2 * * *`。
- 同步今日全部比赛。
- 同步正在进行的比赛。
- 处理已结束但尚未结算的本地比赛。

同步流程：

```text
同步比赛结果
更新 Match
更新赛果
结算 AI预测
结算挑战赛积分
刷新排行榜
```

关键环境变量：

```env
RESULT_SYNC_ENABLE=true
RESULT_SYNC_TIMEZONE=Asia/Shanghai
RESULT_SYNC_CRON=0 * * * *
RESULT_SYNC_BACKFILL_CRON=0 2 * * *
FOOTBALL_DATA_TIMEOUT_MS=10000
FOOTBALL_DATA_RETRIES=3
FOOTBALL_DATA_PROVIDERS=API_FOOTBALL,SPORTMONKS,MANUAL
```

说明：

- 同步日志保存到 `result_sync_logs`。
- 同步日志兼容运维字段：`matchId`、`provider`、`syncStatus`、`rawPayload`、`syncedAt`、`retryCount`。
- 每场比赛每个数据源的最后同步结果保存到 `match_results.syncedAt`。
- 每场比赛的最新同步时间保存到 `Match.lastSyncedAt`。
- 后台状态页的最后同步时间来自最近一条同步日志。
- AI预测结算通过 `prediction_settlements` 幂等 upsert。
- 挑战赛积分只处理未结算预测；手动重算时可强制刷新。
- 第三方 API 请求超时为 10 秒，失败后最多自动重试 3 次。
- 主数据源失败或返回空结果时，会自动切换备用数据源。

## 每日自动刷新闭环

为避免首页、推荐页出现“接下来 0 场”的过期状态，后端新增统一的每日刷新任务。它会复用现有赛程、预测、结算模块，把运营期最关键的动作串成一条幂等链路：

```text
刷新未来 14 天赛程
更新比赛动态状态
生成并发布近期未开赛预测
结算已有比分的已结束比赛
刷新历史命中率统计
```

默认执行时间均为北京时间：

- 每天 00:10 执行主刷新：`JOBS_DAILY_REFRESH_CRON=10 0 * * *`
- 每天 06:00 执行补刷新：`JOBS_DAILY_REFRESH_SUPPLEMENT_CRON=0 6 * * *`
- 每小时执行状态刷新和结算：`JOBS_HOURLY_STATUS_CRON=0 * * * *`

管理接口：

```bash
# 手动触发完整每日刷新
curl -X POST "http://localhost:3000/api/admin/jobs/daily-refresh" \
  -H "Authorization: Bearer <admin_jwt>"

# 查看最近一次任务状态
curl "http://localhost:3000/api/admin/jobs/status" \
  -H "Authorization: Bearer <admin_jwt>"
```

任务说明：

- `daily-refresh` 会读取未来 14 天比赛；有第三方数据源时优先更新真实数据，没有数据时 demo/fallback 环境会自动滚动生成未来演示赛程，避免本地验收时每天手动改数据。
- 预测生成只处理近期日期，已存在公开预测不会重复生成；如比赛已进入锁定窗口，仍遵守预测锁定规则。
- 动态状态按 `kickoffAt` 计算：未开始、进行中、已结束；有比分的已结束比赛会自动进入结算和归档统计。
- `/api/predictions/today` 优先返回今天未结束比赛；今天没有可展示比赛时，返回未来最近一批未开赛比赛，并带上 `displayDate`、`nextAvailableDate` 和 `source`。

关键环境变量：

```env
JOBS_ENABLE=true
JOBS_DAILY_REFRESH_CRON=10 0 * * *
JOBS_DAILY_REFRESH_SUPPLEMENT_CRON=0 6 * * *
JOBS_HOURLY_STATUS_CRON=0 * * * *
JOBS_DEMO_FALLBACK_ENABLE=true
APP_TIMEZONE=Asia/Shanghai
```

### 球队具体情况数据

赛前分析不应只依赖固定模板。当前后端在 `FootballDataService.getPreMatchContext(externalMatchId)` 中预留了最低成本的数据接入层，优先使用普通 HTTP 请求读取 `API-Football`，失败后可按 `FOOTBALL_DATA_PROVIDERS` 切换备用源。

优先接入字段：

- `fixtures`：比赛时间、状态、双方外部 ID。
- `teams/statistics`：球队近期胜平负、进球、失球、零封和 form 字符串。
- `fixtures/lineups` + `injuries`：首发确认状态、缺阵球员和轮换风险。
- `odds`：主胜、平局、客胜赔率，去水后隐含概率和大小球盘口。

这些字段会作为赛前特征输入，用于生成每场专属分析：球队标签、强弱点、比赛节奏、推荐方向原因、比分候选原因和本场专属风险。赔率只作为概率校准特征，不直接照搬为结论。

### 漏预测补救

比赛详情页打开后，如果没有找到按 `matchId` 关联的公开预测，会调用：

```bash
POST /api/admin/predictions/check-missing
```

补救规则：

- 距离开赛超过 30 分钟且无预测：自动补生成并发布。
- 距离开赛不足 30 分钟：不再生成，页面显示“本场未纳入预测”。
- 后台可按日期补生成：`POST /api/admin/predictions/generate-by-date`。
- 后台可按比赛补生成：`POST /api/admin/predictions/generate-by-match/:matchId`。

### 每日巡检清单

- 08:00 查看 `/api/admin/result-sync/dashboard`，确认最近一次同步状态为成功。
- 08:05 查看今日比赛列表，确认 `lastSyncedAt` 正常更新。
- 08:10 查看 `/api/predictions/today`，确认今日有公开预测。
- 每场开赛前 2 小时抽查比赛详情页，确认没有空白预测。
- 每场结束后 1 小时内检查赛果、AI命中结算、挑战赛积分是否完成。
- 每晚 20:10 检查次日预测是否已发布。
- 检查失败日志 `result_sync_logs.errorMessage`，必要时手动同步单场：`POST /api/admin/matches/:id/sync-result`。

## 微信支付配置

生产环境需要配置：

- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- `WECHAT_MCH_ID`
- `WECHAT_PAY_SERIAL_NO`
- `WECHAT_PAY_API_V3_KEY`
- `WECHAT_PAY_PRIVATE_KEY_PATH`
- `WECHAT_PAY_NOTIFY_URL`
- `WECHAT_PAY_PLATFORM_PUBLIC_KEY`

私钥建议以文件形式挂载，例如：

```env
WECHAT_PAY_PRIVATE_KEY_PATH=/app/certs/apiclient_key.pem
```

支付成功后由 `/api/wechat-pay/notify` 回调开通会员内容权益。

## Docker 部署

启动数据库、缓存和 API：

```bash
docker compose up -d postgres redis api
```

启动可选 Admin 占位服务：

```bash
docker compose --profile admin up -d admin
```

首次部署后执行 seed：

```bash
docker compose exec api npm run seed
```

## 文档

- [项目审计](docs/PROJECT_AUDIT.md)
- [本地启动教程](docs/LOCAL_DEV.md)
- [微信小程序上线前检查清单](docs/WECHAT_MINIPROGRAM_CHECKLIST.md)
- [合规文案](docs/COMPLIANCE.md)
