#!/bin/sh
set -e

###############################################################################
# 경로·환경 변수
###############################################################################
DATADIR="/var/lib/mysql"
SOCKET="/var/run/mysqld/mysqld.sock"
INITDIR="/var/lib/dbinit"                 # *.template.sql / *.sql 위치
MIGRATIONDIR="/var/lib/dbinit/migrations" # 마이그레이션 스크립트 위치
MYSQL_USER="mysql"

###############################################################################
# 로깅 함수
###############################################################################
log() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

###############################################################################
# 0. 디렉터리 준비 (소켓·데이터)
###############################################################################
prepare_dirs() {
  mkdir -p "$DATADIR" "$(dirname "$SOCKET")"
  chown -R "$MYSQL_USER":"$MYSQL_USER" "$DATADIR" "$(dirname "$SOCKET")"
  chmod 750 "$DATADIR"
  chmod 755 "$(dirname "$SOCKET")"
}

###############################################################################
# 1. DB 존재 여부 체크
###############################################################################
is_initialized() {
  [ -d "$DATADIR/mysql" ] && return 0 || return 1
}

###############################################################################
# 2. 시스템 테이블 초기화 (mariadb-install-db)
###############################################################################
init_system_db() {
  log "▶ 시스템 테이블 초기화 시작"
  mariadb-install-db \
      --user="$MYSQL_USER" \
      --datadir="$DATADIR" \
      --auth-root-authentication-method=normal \
      --skip-test-db
  log "✔ 시스템 테이블 초기화 완료"
}

###############################################################################
# 3. 임시 데몬 기동 + 준비 대기 + 종료
###############################################################################
start_temp_server() {
  log "▶ 임시 mariadbd 기동"
  mariadbd --user="$MYSQL_USER" \
           --datadir="$DATADIR" \
           --socket="$SOCKET" \
           --skip-networking &
}

wait_for_ready() {
  for i in $(seq 1 30); do
    mariadb-admin --socket="$SOCKET" --user=root ping --silent && return 0
    sleep 1
  done
  log "❌ mariadbd 준비 실패(30초 초과)"
  exit 1
}

stop_temp_server() {
  mariadb-admin --socket="$SOCKET" --user=root shutdown || true
  # 안전장치
  sleep 2
  pkill -f "mariadbd.*$SOCKET" || true
}

###############################################################################
# 4. SQL 실행 유틸
###############################################################################
run_sql() { mariadb --socket="$SOCKET" --user=root < "$1"; }

substitute_env() { envsubst < "$1" > "$2"; }

###############################################################################
# 5. init 디렉터리 처리
###############################################################################
run_all_sql_scripts() {
  log "▶ 초기화 SQL 실행 시작"
  # (1) *.template.sql -> .sql 치환
  for t in "$INITDIR"/*.template.sql; do
    [ -f "$t" ] || continue
    o="${t%.template.sql}.sql"
    log "   • envsubst: $(basename "$t")"
    substitute_env "$t" "$o"
  done
  # (2) .sql 실행
  for s in "$INITDIR"/*.sql; do
    case "$s" in *.template.sql) continue ;; esac
    [ -f "$s" ] || continue
    log "   • 실행: $(basename "$s")"
    run_sql "$s"
  done
  log "✔ 초기화 SQL 실행 완료"
}

run_create_databases_only() {
  t="$INITDIR/01-create-databases.template.sql"
  [ -f "$t" ] || { log "01-create-databases.template.sql 없음, 건너뜀"; return; }
  o="${t%.template.sql}.sql"
  substitute_env "$t" "$o"
  log "   • 실행: $(basename "$o")"
  run_sql "$o"
}

###############################################################################
# 6. 마이그레이션 처리 (신규 추가)
###############################################################################
run_migrations() {
  log "▶ 마이그레이션 실행 시작"
  # 마이그레이션 스크립트가 있는지 확인
  if [ -d "$MIGRATIONDIR" ] && [ -f "/script/migration.sh" ]; then
    chmod +x "/script/migration.sh"
    log "   • 마이그레이션 스크립트 실행"
    sh /script/migration.sh
  else
    log "   ⚠ 마이그레이션 디렉토리 또는 스크립트가 없음, 건너뜀"
  fi
  log "✔ 마이그레이션 실행 완료"
}

###############################################################################
# 7. 메인 흐름
###############################################################################
main() {
  log "=== MariaDB EntryPoint 시작 ==="
  prepare_dirs

  if is_initialized; then
    log "기존 데이터베이스 감지 → 전체 초기화 스킵"
    start_temp_server
    wait_for_ready
    run_create_databases_only         # 유저·비번·DB 재보증
    run_migrations                    # 마이그레이션 실행 (신규 추가)
    stop_temp_server
  else
    log "신규 컨테이너 → 전체 초깃값 적용"
    init_system_db
    start_temp_server
    wait_for_ready
    run_all_sql_scripts
    # 초기 데이터베이스 설정 후 마이그레이션 실행 (신규 추가)
    run_migrations
    stop_temp_server
  fi

  log "▶ 최종 mariadbd 실행"
  exec mariadbd --user="$MYSQL_USER" \
                --datadir="$DATADIR" \
                --socket="$SOCKET" \
                --port=3306 \
                --skip-networking=0  
}

main "$@"
