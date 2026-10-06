#!/bin/bash
# 提交前检查（2026-10-05 拆分后版本）：函数清单对比、JS 语法、DOM id 缺失
# 用法：bash dev/check.sh            （和 HEAD 里的 shared/*.js 对比函数清单）
cd "$(dirname "$0")/.." || exit 1
FILES="rules i18n ui data store admin boot-in"
: > /tmp/before.txt; : > /tmp/after.txt
for f in $FILES; do
  git show HEAD:prototype/shared/$f.js 2>/dev/null | grep -o "^function [A-Za-z0-9_]*" >> /tmp/before.txt
  grep -o "^function [A-Za-z0-9_]*" prototype/shared/$f.js >> /tmp/after.txt
done
sort -o /tmp/before.txt /tmp/before.txt; sort -o /tmp/after.txt /tmp/after.txt
echo "removed: $(comm -23 /tmp/before.txt /tmp/after.txt | tr '\n' ' ')"
echo "added: $(comm -13 /tmp/before.txt /tmp/after.txt | tr '\n' ' ')"
echo "duplicate functions: $(sort /tmp/after.txt | uniq -d | tr '\n' ' ')"
for f in $FILES; do node --check prototype/shared/$f.js > /dev/null 2>&1 && echo "syntax ok: $f" || echo "SYNTAX ERROR: $f"; done
python3 - <<'PY'
import re, glob
base = 'prototype/'
js = ''.join(open(f, encoding='utf-8').read() for f in glob.glob(base + 'shared/*.js'))
html = ''.join(open(f, encoding='utf-8').read() for f in glob.glob(base + '*.html'))
ids = set(re.findall(r'id="([^"]+)"', html))
used = set(re.findall(r"getElementById\('([^']+)'\)", js))
miss = [u for u in used if u not in ids and not u.startswith(('hold-', 'mgmt-', 'pcs-', 'att-', 'cf-'))]
print('missing DOM ids:', miss)
PY
