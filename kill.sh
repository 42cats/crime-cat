#!/bin/bash

# 종료할 프로세스 이름
PROCESS_NAME="node main.js"

# 해당 프로세스 PID 찾기
PIDS=$(ps aux | grep "$PROCESS_NAME" | grep -v grep | awk '{print $2}')

if [ -z "$PIDS" ]; then
  echo "⚠️ 프로세스 '$PROCESS_NAME' 를 찾을 수 없습니다."
else
  echo "🛑 다음 PID를 종료합니다: $PIDS"
  kill -9 $PIDS
  echo "✅ 종료 완료"
fi

