#!/bin/bash
# 一键启动：双击这个文件即可（Mac）。会自动安装依赖、启动本地服务器、并用浏览器打开登录页。
# 关闭方法：关掉弹出的终端窗口（或在窗口里按 Ctrl+C）。
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "没有找到 Node.js。请先安装：https://nodejs.org （下载 LTS 版本，安装后重新双击本文件）"
  read -n 1 -s -r -p "按任意键关闭…"
  exit 1
fi

PORT_VALUE=$(grep -E '^PORT=' .env 2>/dev/null | head -1 | cut -d= -f2)
PORT_VALUE=${PORT_VALUE:-3000}
URL="http://localhost:${PORT_VALUE}/login.html"

# 服务器已经在运行：只打开浏览器
if curl -s "http://localhost:${PORT_VALUE}/api/health" >/dev/null 2>&1; then
  echo "============================================================"
  echo "服务器已经在运行，直接帮你打开登录页：$URL"
  echo "（不用重复启动；测试期间请勿关闭原来的服务器窗口）"
  echo "============================================================"
  open "$URL"
  sleep 2
  exit 0
fi

# 第一次运行：安装依赖
if [ ! -d node_modules ]; then
  echo "第一次运行，正在安装依赖（需要联网，约一两分钟）…"
  npm install || { echo "安装失败，请把上面的报错发给我。"; read -n 1 -s -r -p "按任意键关闭…"; exit 1; }
fi

# 等服务器起来后自动打开浏览器
( for i in $(seq 1 30); do
    if curl -s "http://localhost:${PORT_VALUE}/api/health" >/dev/null 2>&1; then open "$URL"; break; fi
    sleep 1
  done ) &

echo ""
echo "============================================================"
echo "  服务器地址：http://localhost:${PORT_VALUE}   （登录页：$URL）"
echo "  ⚠️  测试期间请勿关闭此窗口！关闭后新页面会打不开。"
echo "  （要关闭服务器：在本窗口按 Ctrl+C）"
echo "============================================================"
echo ""
npm run dev
