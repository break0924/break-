# 项目审计

## 项目结构

当前核心目录完整：

- `backend`: NestJS API、Prisma schema、migration、seed、Dockerfile。
- `frontend`: uni-app + Vue3 + TypeScript 小程序。
- `docs`: 本地启动、上线检查、合规文案和审计文档。
- `scripts`: 数据库初始化脚本。
- `admin`: 可选管理端占位服务。

历史原型目录仍存在：

- `miniapp`
- `static`
- `server.py`

这些目录不是当前 MVP 主链路，后续如不再使用，建议迁移备份后从部署范围中移除。

## 缺失文件检查

已补齐：

- `.env.example`
- `docker-compose.yml`
- `backend/Dockerfile`
- `backend/.dockerignore`
- `scripts/init-db.sh`
- `docs/LOCAL_DEV.md`
- `docs/WECHAT_MINIPROGRAM_CHECKLIST.md`
- `docs/COMPLIANCE.md`
- `docs/PROJECT_AUDIT.md`
- `admin/index.html`

## 未实现或待增强模块

- 正式管理后台：当前为可选占位服务，MVP 管理能力通过后端接口完成。
- 微信真实登录换取 OpenID：前端目前保留本地开发写法，生产前应由后端通过 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET` 完成 code 换取 OpenID。
- 赛程数据自动同步：当前使用 seed 示例数据和手动创建接口，生产前建议接入可信赛程数据源。
- 实时伤停与阵容数据：AI 报告 Prompt 已预留字段，但当前 seed 数据不含实时源。
- 管理接口权限：当前部分管理接口尚未统一加 Admin guard，生产前应限制为管理员。

## 前后端接口一致性

已核对一致：

- `POST /api/auth/wechat-login`
- `GET /api/me`
- `GET /api/teams`
- `GET /api/matches`
- `GET /api/matches/:id`
- `GET /api/matches/:id/ai-report`
- `GET /api/recommendations/today`
- `GET /api/membership/status`
- `GET /api/membership/plans`
- `POST /api/membership/orders`
- `GET /api/membership/orders/:id/status`
- `GET /api/challenge`
- `POST /api/challenge/match-predictions`
- `POST /api/challenge/tournament-pick`
- `GET /api/challenge/leaderboard`
- `GET /api/challenge/my-score`

已修正：

- 前端 API 基础地址支持 `VITE_API_BASE_URL`，并保留本地 storage 覆盖。

## 环境变量检查

已补齐模板变量：

- `DATABASE_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- `WECHAT_MCH_ID`
- `WECHAT_PAY_SERIAL_NO`
- `WECHAT_PAY_API_V3_KEY`
- `WECHAT_PAY_PRIVATE_KEY_PATH`
- `API_BASE_URL`
- `ADMIN_BASE_URL`

兼容保留：

- `REDIS_URL`
- `WECHAT_PAY_NOTIFY_URL`
- `WECHAT_PAY_PRIVATE_KEY`
- `WECHAT_PAY_PLATFORM_PUBLIC_KEY`

## 数据库模型与代码一致性

已核对：

- 会员订单模型与支付回调服务一致。
- AI 报告模型与前端展示字段一致。
- 每日推荐模型与前端列表字段一致。
- 挑战赛单场预测、赛事预测、积分榜模型与后端服务一致。

已增强：

- Seed 脚本现在写入球队、比赛、AI 报告、每日推荐、挑战赛配置、会员套餐和管理员账号。
- 微信支付服务支持从 `WECHAT_PAY_PRIVATE_KEY_PATH` 读取商户私钥。

## 上线前修改建议

1. 为后台生成、赛果录入、赛季结果录入接口增加管理员鉴权。
2. 将微信登录从本地 openId 模式改为后端 code 换取 OpenID。
3. 将生产 API 域名写入小程序合法域名配置。
4. 在生产环境配置微信支付回调 HTTPS 地址和平台公钥。
5. 接入正式赛程、球队、球员、伤停与赛果数据源。
