#!/bin/sh
# 把当前最新提交的短 hash 和提交时间写进 prototype/shared/version.js（原型版本章，CMD-1012-07）。
# 由 .git/hooks/post-commit 在每次提交后自动调用；也可以手动跑：bash dev/stamp-version.sh
cd "$(dirname "$0")/.." || exit 0
H=$(git rev-parse --short HEAD 2>/dev/null) || exit 0
T=$(git log -1 --format=%cd --date=format:'%Y-%m-%d %H:%M' 2>/dev/null)
printf '/* 原型版本章：最新提交的短 hash + 提交时间（dev/stamp-version.sh 由 post-commit 钩子自动写入，不要手改） */\nvar GMC_BUILD = {h:"%s", t:"%s"};\n' "$H" "$T" > prototype/shared/version.js
