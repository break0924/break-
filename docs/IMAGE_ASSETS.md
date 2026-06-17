# 图片资源系统

## 资源目录结构

```text
frontend/src/static/
├── flags/
│   ├── AR.svg
│   ├── BR.svg
│   ├── DE.svg
│   ├── ES.svg
│   ├── FR.svg
│   ├── GB-ENG.svg
│   └── default.svg
├── icons/
│   ├── ai-report.svg
│   ├── badge-level.svg
│   ├── badge-points.svg
│   ├── daily-pick.svg
│   ├── hit-rate.svg
│   ├── placeholder.svg
│   ├── ranking.svg
│   └── trophy.svg
└── images/
    ├── hero-stadium.svg
    ├── member-card.svg
    ├── schedule-flow.svg
    └── share-poster-bg.svg
```

构建后访问路径保持为：

- `/static/images/...`
- `/static/flags/...`
- `/static/icons/...`

## 图片清单

| 文件 | 用途 | 建议尺寸 | 格式 |
| --- | --- | --- | --- |
| `/static/images/hero-stadium.svg` | 首页世界杯氛围 Banner，原创足球场夜景，不含官方标识 | 1200x520 | SVG，生产可导出 WebP |
| `/static/images/schedule-flow.svg` | 赛程安排流程图，小组赛到决赛 | 1100x360 | SVG |
| `/static/images/share-poster-bg.svg` | 挑战赛分享海报背景 | 900x1200 | SVG，生产可导出 WebP |
| `/static/images/member-card.svg` | 会员权益卡片背景 | 900x360 | SVG，生产可导出 WebP |
| `/static/flags/{countryCode}.svg` | 国家国旗 | 96x64 | SVG |
| `/static/flags/default.svg` | 国旗缺失兜底 | 96x64 | SVG |
| `/static/icons/trophy.svg` | 排行榜入口/挑战赛视觉 | 96x96 | SVG |
| `/static/icons/badge-points.svg` | 积分徽章 | 96x96 | SVG |
| `/static/icons/badge-level.svg` | 用户等级徽章 | 96x96 | SVG |
| `/static/icons/ai-report.svg` | 高级 AI 报告权益 | 96x96 | SVG |
| `/static/icons/daily-pick.svg` | 每日精选权益 | 96x96 | SVG |
| `/static/icons/hit-rate.svg` | 历史命中率权益 | 96x96 | SVG |
| `/static/icons/ranking.svg` | 高级榜单权益 | 96x96 | SVG |
| `/static/icons/placeholder.svg` | 图片加载失败兜底 | 96x96 | SVG |

当前环境缺少可用的 WebP 转换工具，已先使用轻量 SVG 保证微信小程序可运行。生产交付时，可由设计工具或 CI 将 `hero-stadium.svg`、`share-poster-bg.svg`、`member-card.svg` 导出为 WebP，并保持组件路径不变或追加 WebP 优先级。

## 前端组件封装

- `frontend/src/components/media/AppImage.vue`
  - 统一使用 `lazy-load`
  - 统一 `@error` 失败兜底
  - 默认兜底 `/static/icons/placeholder.svg`

- `frontend/src/components/media/TeamFlag.vue`
  - 根据球队 `countryCode` 自动显示国旗
  - 无 `countryCode` 时通过 `fifaCode` 推断
  - 缺失时显示 `/static/flags/default.svg`

- `frontend/src/components/media/MatchVisualCard.vue`
  - 今日推荐和比赛列表共用
  - 展示双方国旗、VS、比赛时间、AI 信心指数

## 已修改页面

- `frontend/src/pages/index/index.vue`
  - 首页主题 Banner
  - 比赛视觉卡片
  - 赛程安排流程图

- `frontend/src/pages/today/index.vue`
  - 今日推荐卡片加入双方国旗、VS、比赛时间和 AI 信心指数

- `frontend/src/pages/match-detail/index.vue`
  - 详情页加入双方国旗

- `frontend/src/pages/challenge/index.vue`
  - 加入挑战赛海报背景、积分徽章、等级徽章、排行榜视觉图标

- `frontend/src/pages/membership/index.vue`
  - 加入会员权益卡片和权益图标

## 国旗映射表

```ts
[
  { fifaCode: 'ARG', countryCode: 'AR', name: '阿根廷' },
  { fifaCode: 'FRA', countryCode: 'FR', name: '法国' },
  { fifaCode: 'BRA', countryCode: 'BR', name: '巴西' },
  { fifaCode: 'ENG', countryCode: 'GB-ENG', name: '英格兰' },
  { fifaCode: 'ESP', countryCode: 'ES', name: '西班牙' },
  { fifaCode: 'GER', countryCode: 'DE', name: '德国' }
]
```

映射实现位置：

- `frontend/src/utils/assets.ts`
- `backend/prisma/schema.prisma`
- `backend/src/matches/dto/create-team.dto.ts`
- `backend/prisma/seed.ts`

## 图片加载失败兜底逻辑

```vue
<AppImage
  :src="imageUrl"
  fallback="/static/icons/placeholder.svg"
  mode="aspectFill"
  lazy
/>
```

`AppImage` 会在 `@error` 触发后自动切换到 fallback。国旗组件额外使用 `/static/flags/default.svg` 作为兜底。

## 合规边界

已避免使用：

- 官方赛事 Logo
- 官方吉祥物
- 官方奖杯照片
- 球队官方队徽
- 未授权球员照片

当前使用内容：

- 国家国旗
- 原创足球场插画
- 原创流程图
- 原创图标
- 原创会员和挑战赛背景
