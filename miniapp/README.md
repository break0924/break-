# miniapp 目录说明

当前项目的微信小程序源码在 `frontend/`，由 uni-app 编译生成微信开发者工具可导入的目录。

请不要把 `miniapp/` 作为正式上传目录。正式流程如下：

```bash
cd frontend
npm install
npm run build
```

然后用微信开发者工具导入：

```text
frontend/dist/build/mp-weixin
```

上传前请在 `frontend/src/manifest.json` 的 `mp-weixin.appid` 中填入真实微信小程序 AppID，或在微信开发者工具导入后选择对应 AppID。

本目录只保留为历史兼容占位，避免误导旧路径使用者。
