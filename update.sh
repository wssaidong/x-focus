#!/bin/bash
# Focus - 定时更新热点 JSON 文件
# 添加到 crontab: */10 * * * * /Users/cai/code/focus/update.sh

CDIR="$(dirname "$0")"
cd "$CDIR"

SOURCES=(
  "36kr:36kr hot --type renqi --limit 8 -f json"
  "v2ex:v2ex hot --limit 8 -f json"
  "stackoverflow:stackoverflow hot --limit 8 -f json"
  "tieba:tieba hot --limit 8 -f json"
  "lobsters:lobsters hot --limit 8 -f json"
)

for entry in "${SOURCES[@]}"; do
  key="${entry%%:*}"
  cmd="${entry##*:}"
  echo "$(date '+%Y-%m-%d %H:%M:%S') Updating $key..."
  opencli $cmd 2>/dev/null > "${key}.json.tmp"
  if [ $? -eq 0 ]; then
    mv "${key}.json.tmp" "${key}.json"
    echo "  $key updated ($(wc -c < "${key}.json") bytes)"
  else
    rm -f "${key}.json.tmp"
    echo "  $key failed"
  fi
done

echo "$(date '+%Y-%m-%d %H:%M:%S') Done."