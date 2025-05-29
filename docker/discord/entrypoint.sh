#!/bin/sh

# 로그 출력 기능 추가
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 시작 메시지
log "디스코드 봇 컨테이너 시작"

# 로그 디렉토리 생성
mkdir -p logs
log "로그 디렉토리 생성 완료"

# nodemon 전역 설치
log "nodemon 설치 중..."
npm install -g nodemon
log "nodemon 설치 완료"

# ytdlp 최신버전 업데이트
log "yt-dlp 업데이트 중..."
python3 -m pip install --no-cache-dir --break-system-packages -U yt-dlp
log "yt-dlp 업데이트 완료"

# 프로젝트 의존성 설치
log "npm 패키지 설치 중..."
npm install
log "npm 패키지 설치 완료"

# # nodemon 설정 파일 생성
# log "nodemon 설정 파일 생성 중..."
# cat > nodemon.json << EOF
# {
#   "watch": ["Commands", "Events", "Response", "main.js", "deploy.js"],
#   "ext": "js,json",
#   "exec": "node main.js",
#   "delay": 0.5,
#   "legacyWatch": true,
#   "verbose": true,
#   "exitcrash": true,
#   "ignore": [
#     ".git",
#     "node_modules/**/node_modules",
#     "logs",
#     "*.log"
#   ],
#   "events": {
#     "restart": "echo \"[$(date '+%Y-%m-%d %H:%M:%S')] 봇이 변경사항으로 인해 재시작됩니다.\"",
#     "crash": "echo \"[$(date '+%Y-%m-%d %H:%M:%S')] 봇이 충돌했습니다. 자동으로 재시작합니다.\""
#   },
#   "env": {
#     "NODE_ENV": "development"
#   }
# }
# EOF
# log "nodemon 설정 파일 생성 완료"

# # 오류 처리 코드 임시 파일 생성
# log "오류 처리 코드 생성 중..."
# cat > error-handlers.js << EOF
# // 처리되지 않은 예외 처리
# process.on('uncaughtException', (err) => {
#   console.error('[UNCAUGHT EXCEPTION]', err);
  
#   // 시스템 메시지 삭제 오류 처리 (50021)
#   if (err.code === 50021) {
#     console.log('[INFO] 시스템 메시지 관련 오류입니다. 무시하고 계속 진행합니다.');
#     return; // 프로세스 유지
#   }
  
#   // 치명적이지 않은 오류는 여기서 처리하고 계속 실행
#   console.log('[RECOVERY] 오류가 발생했지만 봇은 계속 실행됩니다.');
  
#   // 오류를 로그 파일에 기록
#   const fs = require('fs');
#   const logDir = './logs';
  
#   // 로그 디렉토리가 없으면 생성
#   if (!fs.existsSync(logDir)) {
#     fs.mkdirSync(logDir, { recursive: true });
#   }
  
#   const logFile = \`\${logDir}/error-\${new Date().toISOString().replace(/:/g, '-')}.log\`;
#   fs.appendFileSync(
#     logFile, 
#     \`[\${new Date().toISOString()}] \${err.stack || err}\n\`,
#     { encoding: 'utf8' }
#   );
# });

# // 처리되지 않은 Promise 거부 처리
# process.on('unhandledRejection', (reason, promise) => {
#   console.error('[UNHANDLED REJECTION] Promise 처리 실패:', reason);
  
#   // Discord API 오류 처리
#   if (reason && reason.code === 50021) {
#     console.log('[INFO] 시스템 메시지 관련 API 오류입니다. 무시하고 계속 진행합니다.');
#     return; // 프로세스 유지
#   }
  
#   // 오류 정보 출력 (디버깅용)
#   console.error('[DEBUG] 거부된 Promise:', promise);
# });
# EOF
# log "오류 처리 코드 생성 완료"

# # main.js 파일 수정 (오류 처리 코드 추가)
# if [ -f "main.js" ]; then
#   log "main.js 파일에 오류 처리 코드 추가 중..."
  
#   # 오류 처리 코드를 파일 상단에 추가하는 임시 파일 생성
#   cat error-handlers.js > main.js.new
#   cat main.js >> main.js.new
  
#   # 임시 파일을 원래 파일로 이동
#   mv main.js.new main.js
#   log "main.js 파일 수정 완료"
# else
#   log "main.js 파일을 찾을 수 없습니다. 오류 처리 코드를 추가하지 않습니다."
# fi

# # 임시 파일 삭제
# rm -f error-handlers.js
# log "임시 파일 정리 완료"

# deploy.js 실행
log "deploy.js 실행 중..."
node deploy.js
deploy_exit_code=$?

if [ $deploy_exit_code -ne 0 ]; then
  log "경고: deploy.js가 오류 코드 $deploy_exit_code로 종료되었지만 계속 진행합니다."
else
  log "deploy.js 실행 완료"
fi

# 환경 변수 설정
export NODE_OPTIONS="--max-old-space-size=2048"
log "메모리 제한을 2GB로 설정했습니다"

# 봇 시작 전 메시지
log "디스코드 봇을 시작합니다..."
log "로그 출력을 시작합니다. (종료하려면 Ctrl+C)"
echo "=========================================================="

# main.js를 nodemon으로 포그라운드에서 실행
# --exitcrash 옵션 추가하여 충돌 시 자동 재시작 보장
exec nodemon --legacy-watch --exitcrash main.js