# 部署到 Render

## 1. 准备仓库
把当前项目推到 GitHub 仓库。

## 2. 在 Render 新建 Web Service
- 连接你的 GitHub 仓库
- 选择这个项目
- Runtime 选 `Python`
- Render Web Service 需要监听 `0.0.0.0`
- 默认端口使用 `PORT`，通常是 `10000`

## 3. 使用本仓库里的配置
- `render.yaml` 会告诉 Render 用 `python3 server.py` 启动
- `server.py` 已经默认监听 `0.0.0.0`

## 4. 部署后访问
Render 会给你一个 `https://xxx.onrender.com` 地址。
把这个地址填到前端分享链接和微信小程序的 `apiBase` 里。

## 5. 微信扫码进房
- 分享二维码会指向你的公网地址
- 手机微信扫码后能直接打开房间
- 小程序真机测试时，把 `apiBase` 改成这个公网 HTTPS 地址

## 6. 额外建议
- 如果房间数据要长期保留，后续建议把 `data/rooms.json` 换成数据库或 Redis
- Render 免费实例可能有冷启动，适合内测，不适合高并发长久在线
