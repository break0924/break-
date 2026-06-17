# 世界杯AI预测官上线前审计报告

审计时间：2026-06-17  
项目路径：`/Users/a1-6/Documents/Codex/2026-06-08/new-chat`  
审计范围：GitHub remote、`frontend`、`backend`、`cloudfunctions`、`cloudbase`、UniApp 小程序构建、NestJS 后端构建、Prisma、微信云托管/云开发配置、微信支付、会员系统、AI 分析、预测统计与比分候选模型统计。

## 验证结果

| 项目 | 结果 |
| --- | --- |
| GitHub remote | 通过，`origin` fetch/push 均为 `https://github.com/break0924/break-.git` |
| `frontend` | 存在 UniApp/Vue3 项目，`npm run build` 通过，产物在 `frontend/dist/build/mp-weixin` |
| `backend` | 存在 NestJS 项目，`npm run build` 通过 |
| `cloudfunctions` | 存在 `homeData`、`predictions`、`matches`、`member`、`invite`、`admin`、`resultSync` 等云函数；未检测到各函数独立 `package.json` |
| `cloudbase` | 存在数据库初始化和索引文档，`cloudbaserc.json` 存在但仍有占位配置 |
| UniApp 小程序构建 | 通过，提示 Sass legacy API deprecation，不阻断构建 |
| NestJS 后端构建 | 通过 |
| Prisma 配置 | `npx prisma validate` 通过，数据源为 PostgreSQL，`DATABASE_URL` 来自环境变量 |
| 微信云托管部署配置 | 后端有 `backend/Dockerfile`，但仓库根 `render.yaml` 仍是旧 Python 服务配置；未发现微信云托管专用服务 YAML |
| 微信支付/会员系统 | 模块存在，但生产配置和身份校验存在阻断风险 |
| AI 分析模块 | 模块存在，支持 OpenAI 和 mock 模式；生产默认/配置需强制校验 |
| 预测统计/比分候选统计 | 后端与云函数均有实现，但口径不一致 |

## P0 问题清单

1. 微信登录身份可被客户端伪造，生产不可上线。
   - 证据：`backend/src/users/dto/login.dto.ts` 要求客户端传 `openId`；`backend/src/users/users.controller.ts` 的 `POST /auth/wechat-login` 直接调用 `usersService.login(dto)`；`frontend/src/stores/auth.ts` 用 `dev_${loginResult.code}` 构造 openId。
   - 影响：任意客户端可伪造 openId 登录、覆盖用户资料，并可能影响会员权益、订单和个人数据边界。
   - 建议：后端接收 `uni.login` code，使用 `WECHAT_APP_ID`/`WECHAT_APP_SECRET` 服务端换取 openid/session_key，禁止客户端传 openId。

2. 微信小程序正式 appid 未配置，当前产物不能作为正式小程序上传。
   - 证据：`frontend/src/manifest.json` 中 `mp-weixin.appid` 为空；`miniapp/project.config.json` 中 `appid` 为 `touristappid`。
   - 影响：正式小程序上传、登录、支付、云开发环境绑定都无法按真实主体运行。
   - 建议：配置正式小程序 appid，并确保构建产物 `frontend/dist/build/mp-weixin/project.config.json` 使用正式 appid。

3. 生产 API/云环境仍可能指向本地或占位配置。
   - 证据：`frontend/src/api/http.ts` 默认 `http://localhost:3000/api`；`cloudbaserc.json` 使用 `{{CLOUDBASE_ENV_ID}}`；`cloudbaserc.json` 的 `RESULT_SYNC_API_URL` 为空；`backend/.env.example` 的支付回调为 `https://your-domain.com/api/wechat-pay/notify`。
   - 影响：线上小程序无法访问本机接口；云函数部署目标不确定；赛果同步只能扫本地数据库状态，不能拉取外部赛果。
   - 建议：上线构建必须显式注入 `VITE_API_BASE_URL` 或 `VITE_DATA_SOURCE=cloudbase` 与 `VITE_CLOUDBASE_ENV`，并替换 CloudBase envId、支付回调域名和赛果同步 URL。

4. 微信支付未配置时会退回 mock 支付，生产缺少强制失败保护。
   - 证据：`backend/src/wechat-pay/wechat-pay.service.ts` 的 `createJsapiOrder` 在 `isConfigured()` 为 false 时直接返回 `mock_prepay_*` 和 `mock_pay_sign`，没有按 `NODE_ENV=production` 阻断。
   - 影响：生产支付配置缺失时仍会生成 mock 下单响应，前端和订单链路可能表现为可支付但无法真实完成闭环，造成会员购买事故。
   - 建议：生产环境缺少任一微信支付配置时直接抛错；启动时校验 `WECHAT_MCH_ID`、证书序列号、API v3 key、商户私钥、notify URL、平台公钥。

## P1 问题清单

1. 支付回调未校验通知金额、商户号、appid、交易类型和订单金额一致性。
   - 证据：`membership.service.ts` 的 `activateByPaymentNotification` 只判断 `trade_state === 'SUCCESS'`、查找 `out_trade_no`，并检查本地订单金额 `> 0`，未比对 `resource.amount.total`、`mchid`、`appid` 等字段。
   - 影响：一旦回调数据异常或配置串环境，可能错误开通会员。
   - 建议：比对通知金额等于订单金额、appid/mchid 等于配置、payer openid 与订单用户 openId 一致，并记录异常回调。

2. 会员续费会从支付时间重新计算，未叠加已有有效期。
   - 证据：`activateMembershipOrder` 使用 `paidAt + plan.durationDays` 直接写入 `membershipExpireAt`。
   - 影响：会员未过期时续费可能损失剩余有效期。
   - 建议：从 `max(currentExpireAt, paidAt)` 开始叠加时长。

3. AI 分析生产模式缺少启动级配置保护。
   - 证据：`AiService` 中只要没有 `OPENAI_API_KEY` 或 `AI_MOCK_MODE=true` 就返回 mock 内容；`.env.example` 默认 `AI_MOCK_MODE=true`。
   - 影响：线上可能展示 mock AI 分析，损害产品可信度。
   - 建议：生产环境强制 `AI_MOCK_MODE=false` 且 `OPENAI_API_KEY` 存在；保留 mock 仅用于本地/演示。

4. 后端与 CloudBase 预测统计口径不一致。
   - 证据：NestJS `PredictionsService.getStats()` 基于 `prediction_settlements`，并计算 `scoreCandidateHitRate`、`totalGoalsRangeHitRate`；CloudBase `common/home.js` 基于 `prediction_archives.settlement` 文档字段计算，`currentHitStreak`/`bestHitStreak` 直接等于命中数，不是真正连续命中。
   - 影响：同一产品在后端 API 与云函数数据源下展示的命中率、连胜、比分候选命中率可能不一致。
   - 建议：统一统计服务和数据模型；CloudBase 若继续使用，应补齐与 NestJS 同等口径。

5. 比分候选模型未把候选命中持久化到 `PredictionSettlement`。
   - 证据：Prisma `PredictionSettlement` 只有 `hitResult`、`hitScore`、`hitTotalGoals`；候选比分命中率由 `originalContent`/`featureSnapshot.modelOutput` 运行时反查计算。
   - 影响：统计依赖历史 JSON 结构，模型输出字段变化会影响历史复盘。
   - 建议：增加持久字段，如 `hitScoreCandidate`、`hitScoreReference`、`hitTotalGoalsRange`，结算时写入。

6. 微信云托管部署配置不完整。
   - 证据：后端只有 `backend/Dockerfile`；根目录 `render.yaml` 配置的是 `friends-texas-holdem` Python 服务和 `server.py`；未检测到微信云托管服务声明文件。
   - 影响：一键部署目标不明确，可能部署到错误服务。
   - 建议：补充微信云托管服务配置和部署文档，确认镜像构建上下文、端口、环境变量、迁移命令。

## P2 问题清单

1. CORS 当前为 `origin: true`。
   - 证据：`backend/src/main.ts` 中 `app.enableCors({ origin: true, credentials: true })`。
   - 影响：生产安全边界较宽。
   - 建议：生产限制为小程序/管理端实际域名。

2. UniApp 构建有 Sass legacy JS API deprecation 警告。
   - 证据：`npm run build` 输出多条 `DEPRECATION WARNING [legacy-js-api]`。
   - 影响：当前不阻断构建，但未来 Sass 2.0 可能受影响。
   - 建议：跟进依赖升级或 Sass API 兼容。

3. 云函数没有独立依赖声明。
   - 证据：`cloudfunctions/*` 下未发现 `package.json`。
   - 影响：当前只用内置能力可运行；后续新增依赖时部署容易遗漏。
   - 建议：明确云函数运行时和依赖策略。

4. `backend/.env` 存在于工作区且包含开发默认配置。
   - 证据：本地文件包含 `JWT_SECRET=dev_change_me_to_a_long_random_value`、`AI_MOCK_MODE=true`、空微信支付配置。
   - 影响：若误提交或误用于生产，会造成配置风险。
   - 建议：确认 `.gitignore` 覆盖 `.env`，生产只通过密钥管理/环境变量注入。

5. `frontend` 与 `miniapp` 双小程序目录并存，入口容易混淆。
   - 证据：UniApp 正式构建产物来自 `frontend/dist/build/mp-weixin`，同时根目录还有 `miniapp/project.config.json` 占位项目。
   - 影响：开发者可能导入错误目录。
   - 建议：上线文档明确只导入 UniApp 构建产物，或移除/归档占位 `miniapp`。

## 构建与命令记录

```text
git remote -v
origin  https://github.com/break0924/break-.git (fetch)
origin  https://github.com/break0924/break-.git (push)

cd frontend && npm run build
DONE Build complete.

cd backend && npm run build
nest build 成功

cd backend && npx prisma validate
The schema at prisma/schema.prisma is valid
```

## 上线结论

当前代码可以完成本地构建，但不建议直接上线。至少需要先关闭 P0：真实微信登录换 openid、正式小程序 appid 和线上 API/CloudBase 环境、生产支付配置强制校验。P1 中的支付金额校验、统计口径统一和云托管部署配置也建议在正式收费和公开运营前完成。
