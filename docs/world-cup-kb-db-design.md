# 2026 FIFA World Cup Knowledge Base Design

## 目标

本知识库用于赛事资料展示、AI 分析上下文和 RAG 检索，不用于购彩、充值、支付或兑奖。

## JSON 文件

- `teams.json`: 参赛球队或官方待确认占位球队。
- `players.json`: 球员名单。当前保留标准结构，生产环境应从 FIFA 官方 squad 数据刷新。
- `groups.json`: 12 个小组结构。
- `matches.json`: 104 场比赛结构。未核验赛程以占位形式标记。
- `stadiums.json`: 16 个承办球场。
- `host_cities.json`: 16 个承办城市区域。
- `world_cup_history.json`: 历届世界杯历史摘要。
- `facts.json`: 赛事事实和合规说明。

## 标准字段

每个实体尽量包含：

- `id`: 稳定业务 ID。
- `image_url`: 图片字段。
- `flag_url`: 国旗字段，实体无国旗时为 `null`。
- `introduction`: 面向展示的介绍。
- `source_url`: 来源 URL。
- `is_official`: 是否已按官方来源核验。
- `last_verified_at`: 数据核验时间。
- `raw`: 原始扩展数据。
- `rag`: RAG 检索块，包含 `title`、`summary`、`keywords`、`content`。

## Prisma 表

新增独立知识库表：

- `WorldCupTeam`
- `WorldCupPlayer`
- `WorldCupGroup`
- `WorldCupMatch`
- `WorldCupStadium`
- `WorldCupHostCity`
- `WorldCupHistory`
- `WorldCupFact`

这些表和现有竞彩业务表解耦，避免把未核验的知识库占位数据误当成真实业务赛程。

## 导入策略

`apps/api/prisma/seed.ts` 会：

1. 初始化后台管理员。
2. 读取 `apps/api/prisma/knowledge-base/*.json`。
3. 按外键顺序 upsert：
   - Host cities
   - Stadiums
   - Groups
   - Teams
   - Players
   - Matches
   - World Cup history
   - Facts

## 生产数据刷新建议

当前文件为可导入 KB 基线。由于 2026 世界杯赛程、分组和球员名单需要按官方动态发布更新，生产环境建议增加：

- FIFA 官方数据源 adapter。
- 数据源抓取时间和 checksum。
- `is_official=false` 记录禁止进入用户推荐结论。
- AI 分析 prompt 只使用 `is_official=true` 或人工审核后的记录。
