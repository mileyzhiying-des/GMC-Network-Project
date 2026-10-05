# GMC Network — 原型

印尼-韩国医美跨境协作平台的交互原型。设计师通过和 Claude 对话修改原型，浏览器实时刷新；完成后和开发者一起部署。

- 原型：`prototype/` 下多个入口页（login / in / owner / kr / booking），共用 `prototype/shared/`（2026-10-05 起由单文件拆分而来，见 CLAUDE.md「结构拆分」）
- 业务规则：`docs/`（Notion「GMC Network」的离线快照，Notion 是唯一信源）
- Claude 的工作规则：`CLAUDE.md`

## 第一次要装什么、之后怎么打开（不写代码的人看这里）

**只需要装一次：Node.js**（https://nodejs.org ，下载 LTS 版本，一路"下一步"安装）。

**之后每次：双击项目文件夹里的 `start.command`。**
- 第一次双击，Mac 可能提示"无法打开，因为来自身份不明的开发者"：右键点 `start.command` → 选「打开」→ 再点「打开」，之后就能直接双击。如果提示没有执行权限，在终端里运行一次 `chmod +x start.command`。
- 它会自动安装依赖（只有第一次、需要联网，约一两分钟）、启动本地服务器，并用浏览器打开登录页 http://localhost:3000/login.html 。
- 用完后关掉弹出的终端窗口即可停止。
- 注意：拆分之后页面**不能直接双击 html 文件打开**，必须通过 `start.command`（或 `npm run dev`）启动的本地服务器访问。
- 演示数据存在浏览器里，几个标签页之间实时同步；想回到初始演示数据，登录页点「重置演示数据」。

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
- **静态托管**：`npm run build` 后把 `dist/` 上传到任意静态托管（Nginx、Netlify、Vercel、S3 等），把根路径指向 `login.html`
