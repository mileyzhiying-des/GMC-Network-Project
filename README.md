# GMC Network — 原型

印尼-韩国医美跨境协作平台的交互原型。设计师通过和 Claude 对话修改原型，浏览器实时刷新；完成后和开发者一起部署。

- 原型：`prototype/gmc-network-prototype.html`（单文件）
- 业务规则：`docs/`（Notion「GMC Network」的离线快照，Notion 是唯一信源）
- Claude 的工作规则：`CLAUDE.md`

## 设计师

1. 在这个文件夹里打开 Claude Code。
2. 对 Claude 说「ishni boshladik」，Claude 会自己启动服务器并打开浏览器。
3. 用自己的话描述要改什么（也可以发截图或 Figma 链接）。
4. 结束时说「tugatdik」。

## 开发者

```bash
npm install
npm run dev      # 开发：http://localhost:3000（Express 内嵌 Vite，保存即刷新）
npm run build    # 生产构建 → dist/（纯静态文件）
npm start        # 用 Express 提供 dist/（PORT，默认 3000）
```

### 部署

- **Docker**：`docker build -t gmc-network . && docker run -p 3000:3000 gmc-network`
- **Node**：`npm ci && npm run build && npm start`
- **静态托管**：`npm run build` 后把 `dist/` 上传到任意静态托管（Nginx、Netlify、Vercel、S3 等），把根路径指向 `gmc-network-prototype.html`
