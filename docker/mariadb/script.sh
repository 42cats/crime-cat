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
  # 기존 디렉토리들 생성 및 권한 설정
  mkdir -p "$DATADIR" "$(dirname "$SOCKET")"
  # tmpfs가 마운트된 경우 권한 변경이 제한될 수 있으므로 try-catch 방식 사용
  chown -R "$MYSQL_USER":"$MYSQL_USER" "$DATADIR" "$(dirname "$SOCKET")" 2>/dev/null || true
  chmod 750 "$DATADIR" 2>/dev/null || true
  chmod 755 "$(dirname "$SOCKET")" 2>/dev/null || true
  
  # 마이그레이션용 임시 디렉토리 준비
  if [ ! -d "/tmp/migration_temp" ]; then
    mkdir -p "/tmp/migration_temp" 2>/dev/null || true
  fi
  if [ ! -d "/var/tmp" ]; then
    mkdir -p "/var/tmp" 2>/dev/null || true
  fi
  
  # tmpfs의 경우 chmod가 실패할 수 있으므로 에러 무시
  # Docker의 tmpfs 마운트가 uid/gid를 처리하므로 권한 변경 시도만 함
  log "디렉토리 권한 설정 시도..."
  if [ -w "/tmp/migration_temp" ]; then
    log "  /tmp/migration_temp: 쓰기 권한 확인됨"
  else
    log "  /tmp/migration_temp: 권한 제한됨 (tmpfs 마운트됨)"
  fi
}

###############################################################################
# 1. DB 및 테이블 존재 여부 체크
###############################################################################
is_initialized() {
  # 기존 디렉토리 체크는 유지
  [ -d "$DATADIR/mysql" ] || return 1
  
  # 테이블이 있는지 확인 (스키마 버전 테이블 확인)
  log "▶ 기존 테이블 존재 여부 확인 중"
  
  # 임시 서버 시작
  start_temp_server_silent
  wait_for_ready_silent
  
  # 테이블 존재 여부 확인
  TABLE_CHECK=$(mariadb --socket="$SOCKET" --user=root -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_DISCORD:-discord}';" --skip-column-names 2>/dev/null || echo "0")
  
  # 스키마 버전 테이블 확인
  SCHEMA_VERSION_EXISTS=$(mariadb --socket="$SOCKET" --user=root -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_DISCORD:-discord}' AND table_name='schema_version';" --skip-column-names 2>/dev/null || echo "0")
  
  # 임시 서버 종료
  stop_temp_server_silent
  
  # 테이블이 없거나 스키마 버전 테이블이 없으면 초기화 필요
  if [ "$TABLE_CHECK" -eq "0" ] || [ "$SCHEMA_VERSION_EXISTS" -eq "0" ]; then
    log "⚠ 테이블이 없거나 스키마 버전 테이블이 없음 → 테이블 초기화 필요"
    return 1
  fi
  
  log "✔ 기존 테이블 확인 완료 - 정상"
  return 0
}

# 테이블 체크용 임시 서버 (로그 없이 조용히 실행)
start_temp_server_silent() {
  mariadbd --user="$MYSQL_USER" \
           --datadir="$DATADIR" \
           --socket="$SOCKET" \
           --skip-networking >/dev/null 2>&1 &
}

wait_for_ready_silent() {
  for i in $(seq 1 50); do
    mariadb-admin --socket="$SOCKET" --user=root ping --silent >/dev/null 2>&1 && return 0
    sleep 0.5
  done
  return 1
}

stop_temp_server_silent() {
  mariadb-admin --socket="$SOCKET" --user=root shutdown >/dev/null 2>&1 || true
  sleep 2
  pkill -f "mariadbd.*$SOCKET" >/dev/null 2>&1 || true
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
  for i in $(seq 1 60); do
    mariadb-admin --socket="$SOCKET" --user=root ping --silent && return 0
    sleep 1
  done
  log "❌ mariadbd 준비 실패(60초 초과)"
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

substitute_env() {
  log "환경변수 치환: $1 -> $2 (DB_DISCORD=${DB_DISCORD}, DB_USER=${DB_USER}, DB_PASS=${DB_PASS})"
  envsubst < "$1" > "$2"
}

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
#    chmod +x "/script/migration.sh"
    log "   • 마이그레이션 스크립트 실행"
    
    # 환경 변수들을 migration.sh에 전달
    export DB_DISCORD DB_USER DB_PASS TEMP_DIR
    
    if sh /script/migration.sh; then
      log "✔ 마이그레이션 성공"
    else
      log "❌ 마이그레이션 실패"
      # 마이그레이션 실패해도 서비스는 계속 시작
      log "마이그레이션 실패했지만 서비스를 계속 시작합니다"
    fi
  else
    log "   ⚠ 마이그레이션 스크립트가 없음: /script/migration.sh"
  fi
  
  log "✔ 마이그레이션 실행 완료"
}

###############################################################################
# 7. 테이블만 초기화 (기존 DB는 있지만 테이블이 없는 경우)
###############################################################################
init_tables_only() {
  log "▶ 테이블만 초기화 시작 (기존 데이터베이스 유지)"
  
  # 테이블 템플릿 파일 처리 - 이 부분 추가
  for t in "$INITDIR"/02-create-tables*.template.sql "$INITDIR"/02b-create-tables*.template.sql; do
    [ -f "$t" ] || continue
    o="${t%.template.sql}.sql"
    log "   • envsubst: $(basename "$t")"
    substitute_env "$t" "$o"
  done
  
  # 테이블 SQL 실행
  for s in "$INITDIR"/02*-create-tables*.sql; do
    case "$s" in *.template.sql) continue ;; esac
    [ -f "$s" ] || continue
    log "   • 테이블 생성: $(basename "$s")"
    run_sql "$s"
  done
  
  # schema_version 테이블이 없으면 생성
  SCHEMA_EXISTS=$(mariadb --socket="$SOCKET" --user=root -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_DISCORD:-discord}' AND table_name='schema_version';" --skip-column-names 2>/dev/null || echo "0")
  
  if [ "$SCHEMA_EXISTS" -eq "0" ]; then
    if [ -f "$MIGRATIONDIR/schema_version.sql" ]; then
      log "   • 스키마 버전 테이블 생성"
      # 환경 변수 치환 추가
      TMP_SCHEMA="/tmp/schema_version.sql"
      substitute_env "$MIGRATIONDIR/schema_version.sql" "$TMP_SCHEMA"
      run_sql "$TMP_SCHEMA"
      rm -f "$TMP_SCHEMA"
    fi
  fi
  
  log "✔ 테이블 초기화 완료"
}

###############################################################################
# 8. 메인 흐름
###############################################################################
main() {
  log "=== MariaDB EntryPoint 시작 ==="
  prepare_dirs

  # 기본 시스템 DB가 있는지 확인
  if [ -d "$DATADIR/mysql" ]; then
    # 시스템 DB는 있지만 테이블이 없는지 확인
    if is_initialized; then
      log "정상 데이터베이스 및 테이블 감지 → 전체 초기화 스킵"
      start_temp_server
      wait_for_ready
      run_create_databases_only         # 유저·비번·DB 재보증
      run_migrations                    # 마이그레이션 실행
      stop_temp_server
    else
      log "데이터베이스는 있지만 테이블이 없음 → 테이블만 초기화"
      start_temp_server
      wait_for_ready
      run_create_databases_only         # 유저·비번·DB 재보증
      init_tables_only                  # 테이블만 초기화
      run_migrations                    # 마이그레이션 실행
      stop_temp_server
    fi
  else
    log "신규 컨테이너 → 전체 초깃값 적용"
    init_system_db
    start_temp_server
    wait_for_ready
    run_all_sql_scripts
    # 초기 데이터베이스 설정 후 마이그레이션 실행
    run_migrations
    stop_temp_server
  fi

  log "▶ 최종 mariadbd 실행"
  exec mariadbd --user="$MYSQL_USER" \
                --datadir="$DATADIR" \
                --socket="$SOCKET" \
                --port=3306 \
                --bind-address=0.0.0.0 \
                --skip-networking=0
}

main "$@"