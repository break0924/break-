# Static Resource Manifest

微信小程序构建后，本目录会被复制为 `/static`。

## 目录结构

```text
static/
├── images/   # 页面大图、Banner、流程图、海报背景
├── flags/    # 国家国旗 SVG
└── icons/    # 功能图标、徽章、兜底图
```

## 前端引用方式

统一从 `src/utils/assets.ts` 获取资源路径：

```ts
import { IMAGE_ASSETS, ICON_ASSETS, flagSrcForTeam } from '@/utils/assets';
```

页面图片使用 `AppImage`，默认开启懒加载和失败兜底：

```vue
<AppImage :src="IMAGE_ASSETS.heroStadium" mode="aspectFill" />
```

球队国旗使用 `TeamFlag`：

```vue
<TeamFlag :team="match.homeTeam" />
```

比赛推荐视觉卡片使用 `MatchVisualCard`：

```vue
<MatchVisualCard :match="item.match" :confidence="item.confidenceIndex" />
```

## 资源清单入口

结构化清单位于：

```text
frontend/src/utils/assets.ts
```

包含：

- `IMAGE_RESOURCE_LIST`
- `FLAG_RESOURCE_LIST`
- `ICON_RESOURCE_LIST`
- `STATIC_RESOURCE_LIST`
- `FLAG_MAPPING`
