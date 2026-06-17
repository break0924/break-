# AI世界杯预测官前端

这是 uni-app + Vue3 + TypeScript 项目。

不要直接打开 `frontend/index.html`，它需要 Vite/uni-app dev server 编译。

## H5 预览

```bash
cd frontend
../.tools/bin/npm run dev:h5 -- --host 127.0.0.1 --port 5173
```

浏览器打开：

```text
http://127.0.0.1:5173/
```

## 微信小程序构建

```bash
cd frontend
../.tools/bin/npm run build:mp-weixin
```

然后用微信开发者工具导入：

```text
frontend/dist/build/mp-weixin
```
