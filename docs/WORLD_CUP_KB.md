# 2026 World Cup Knowledge Base

本项目的世界杯知识库用于三类场景：

- 初始化基础数据：球队、球员、分组、赛程、场馆、主办城市。
- 支撑 AI 赛前分析：为 OpenAI Prompt / RAG 提供结构化上下文。
- 支撑前端展示：所有实体包含 `imageUrl`，球队、球员、城市、场馆包含 `flagUrl` 或可回退国旗字段。

合规边界：知识库只服务足球数据分析、AI 内容生成、挑战赛积分和会员内容解锁，不包含任何交易型玩法或收益承诺。

## 文件结构

```text
backend/prisma/worldcup-kb/
  generate-worldcup-kb.mjs
  teams.json
  players.json
  groups.json
  matches.json
  stadiums.json
  host_cities.json
  world_cup_history.json
  facts.json

backend/prisma/
  seed-worldcup-kb.ts
  seed.ts
```

## 数据文件

| 文件 | 数量 | 用途 |
| --- | ---: | --- |
| `teams.json` | 48 | 球队、分组、国旗、球队介绍 |
| `players.json` | 109 | 重点球员、位置、所属球队、AI 分析上下文 |
| `groups.json` | 12 | 小组结构、球队列表、分组说明 |
| `matches.json` | 104 | 72 场小组赛槽位 + 32 场淘汰赛槽位 |
| `stadiums.json` | 16 | 承办场馆、城市、容量、图片 |
| `host_cities.json` | 16 | 主办城市、国家、时区、场馆列表 |
| `world_cup_history.json` | 22 | 历届冠军、亚军、主办地、决赛比分 |
| `facts.json` | 6 | 赛制、视觉合规、AI 风险提示等事实卡 |

说明：淘汰赛对阵在小组排名产生前为 `TBD`，保存在知识库文档中；只有具备双方球队和开赛时间的比赛会导入业务 `Match` 表。

## 标准字段

所有 JSON 实体尽量保持以下字段：

```ts
type KnowledgeBaseEntity = {
  id: string;
  name?: string;
  title?: string;
  imageUrl?: string | null;
  flagUrl?: string | null;
  worldCupIntro: string;
  ragText: string;
  tags: string[];
};
```

球队额外字段：

```ts
type TeamEntity = KnowledgeBaseEntity & {
  fifaCode: string;
  countryCode: string;
  name: string;
  nameEn: string;
  groupCode: string;
  groupName: string;
  confederation: string;
  seedOrder: number;
  badgeUrl: null;
  officialAssetPolicy: string;
};
```

比赛额外字段：

```ts
type MatchEntity = KnowledgeBaseEntity & {
  matchNo: number;
  externalId: string;
  stage:
    | 'GROUP'
    | 'ROUND_OF_32'
    | 'ROUND_OF_16'
    | 'QUARTER_FINAL'
    | 'SEMI_FINAL'
    | 'THIRD_PLACE'
    | 'FINAL';
  groupCode?: string | null;
  homeTeamFifaCode?: string | null;
  awayTeamFifaCode?: string | null;
  kickoffAt?: string | null;
  stadiumId?: string | null;
  hostCityId?: string | null;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';
};
```

## 数据库设计

现有业务表继续承担小程序核心功能：

- `Team`：球队主数据，新增 `countryCode`，保留 `fifaCode` 唯一约束和 `flagUrl`。
- `Player`：重点球员，新增 `@@unique([teamId, name])`，支持重复 seed 时幂等更新。
- `Match`：可被预测、可生成 AI 报告的正式比赛，`MatchStage` 已支持 `ROUND_OF_32`。

新增 RAG 文档表：

```prisma
model KnowledgeBaseDocument {
  id            String   @id @default(cuid())
  sourceKey     String   @unique
  type          String
  title         String
  summary       String?
  content       Json
  imageUrl      String?
  flagUrl       String?
  embeddingText String
  tags          String[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([type])
  @@map("knowledge_base_documents")
}
```

### RAG 使用建议

1. 使用 `type` 和 `tags` 做第一层过滤，例如 `type = "team"`、`tags has "ARG"`。
2. 将 `embeddingText` 送入向量库或 OpenAI Embeddings。
3. Prompt 中引用 `content` 的结构化字段，避免只依赖自然语言摘要。
4. AI 输出必须保留风险提示，并明确内容仅作足球数据分析参考。

## 生成和导入

重新生成 JSON：

```bash
cd backend
npm run kb:generate
```

生成 Prisma Client：

```bash
cd backend
npm run prisma:generate
```

初始化数据库：

```bash
cd backend
npm run prisma:migrate
npm run seed
```

只重新导入世界杯知识库：

```bash
cd backend
npm run seed:kb
```

如果数据库已经应用过旧版初始化迁移，请新建追加 migration，而不是直接改线上已应用 migration。

## 图片字段约定

- 国旗：`/static/flags/{countryCode}.svg`
- 球队图：`/static/images/worldcup-kb/teams/{fifaCode}.webp`
- 场馆图：`/static/images/worldcup-kb/stadiums/{slug}.webp`
- 城市图：`/static/images/worldcup-kb/cities/{slug}.webp`
- 比赛图：`/static/images/worldcup-kb/matches/{matchNo}.webp`

不使用官方赛事 Logo、官方吉祥物、官方奖杯照片、球队官方队徽或未经授权的球员照片。球员图片字段默认 `null`，前端应使用原创剪影或占位图。

## 维护流程

1. 官方赛程、开球时间、场馆或晋级球队更新后，先修改 `generate-worldcup-kb.mjs` 的源数据。
2. 执行 `npm run kb:generate`。
3. 执行 `npm run seed:kb` 导入数据库。
4. 对 AI 报告重新生成任务做灰度验证。
5. 上线前检查敏感词和图片授权。
