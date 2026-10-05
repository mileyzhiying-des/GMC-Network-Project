import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const keepPageScript = fs.readFileSync(path.join(rootDir, 'dev', 'keep-page.js'), 'utf8');

// Dev-only: after an auto-reload, return to the page the designer was looking at.
// Inserted before the *last* </body>: the prototype's JS contains '</body>' inside
// strings, so Vite's normal injectTo: 'body' would land inside a JS string.
const keepCurrentPage = {
  name: 'gmc-keep-current-page',
  apply: 'serve',
  transformIndexHtml(html) {
    const at = html.lastIndexOf('</body>');
    if (at === -1) return html;
    return `${html.slice(0, at)}<script>\n${keepPageScript}</script>\n${html.slice(at)}`;
  },
};

// 共享脚本是 classic script（全局函数/变量，不是 ES module），Vite 不会打包它们：构建时原样复制到 dist/shared/
const copySharedScripts = {
  name: 'gmc-copy-shared',
  apply: 'build',
  closeBundle() {
    fs.cpSync(path.join(rootDir, 'prototype', 'shared'), path.join(rootDir, 'dist', 'shared'), { recursive: true });
  },
};

export default defineConfig({
  root: path.join(rootDir, 'prototype'),
  plugins: [keepCurrentPage, copySharedScripts],
  build: {
    outDir: path.join(rootDir, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: ['login', 'in', 'owner', 'kr', 'booking'].map((n) => path.join(rootDir, 'prototype', n + '.html')),
    },
  },
});
