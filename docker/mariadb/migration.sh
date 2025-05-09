#!/bin/sh
# migration.sh - 데이터베이스 마이그레이션 스크립트

# 환경 변수 (컨테이너 환경에서 전달됨)
DB_NAME=${DB_DISCORD}
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}
MIGRATION_DIR="/var/lib/dbinit/migrations"
TEMP_DIR="/tmp/migration_temp"
SOCKET="/var/run/mysqld/mysqld.sock"

# 로깅 함수
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# 임시 디렉토리 생성
mkdir -p "${TEMP_DIR}"

# 환경 변수 대체 함수
substitute_env() {
  local input_file=$1
  local output_file=$2
  log "환경변수 치환: $input_file -> $output_file"
  envsubst < "$input_file" > "$output_file"
}

# 소켓을 통한 MySQL 연결
mysql_connect() {
  if [ -S "$SOCKET" ]; then
    # 소켓이 존재하면 소켓을 통해 연결
    mariadb --socket="$SOCKET" --user=root "$@"
  else
    # 소켓이 없으면 TCP/IP를 통해 연결 시도
    mariadb -h localhost -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" "$@"
  fi
}

# 스키마 버전 테이블 생성 및 초기화
create_version_table() {
  log "스키마 버전 테이블 확인/생성"
  
  # 테이블 존재 여부 확인
  local exists=$(mysql_connect -e "
  SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_schema = '$DB_NAME' 
  AND table_name = 'schema_version';" --skip-column-names 2>/dev/null || echo "0")
  
  if [ "$exists" = "0" ]; then
    log "schema_version 테이블 생성"
    
    # 스키마 버전 파일을 환경 변수로 대체
    if [ -f "$MIGRATION_DIR/schema_version.sql" ]; then
      local temp_sql="${TEMP_DIR}/schema_version.sql"
      substitute_env "$MIGRATION_DIR/schema_version.sql" "$temp_sql"
      
      # 실행
      mysql_connect < "$temp_sql"
      
      # 임시 파일 삭제
      rm -f "$temp_sql"
    else
      # 파일이 없으면 직접 생성
      mysql_connect "$DB_NAME" << EOF
      CREATE TABLE IF NOT EXISTS schema_version (
        id INT AUTO_INCREMENT PRIMARY KEY,
        version VARCHAR(50) NOT NULL,
        description VARCHAR(200) NOT NULL, 
        type VARCHAR(20) NOT NULL,
        script VARCHAR(1000) NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        installed_by VARCHAR(100) NOT NULL,
        installed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time INT NOT NULL,
        success BOOLEAN NOT NULL
      );
      
      -- 초기 버전 등록 (기존 스키마를 1.0.0으로 간주)
      INSERT INTO schema_version 
      (version, description, type, script, checksum, installed_by, execution_time, success)
      VALUES 
      ('1.0.0', 'initial schema', 'SQL', 'V1.0.0_init.sql', 'initial', 'system', 0, 1);
EOF
    fi
  fi
}

# 현재 DB 버전 가져오기
get_current_version() {
  local version=$(mysql_connect "$DB_NAME" -e "
  SELECT version FROM schema_version 
  WHERE success = 1 
  ORDER BY id DESC LIMIT 1;" --skip-column-names 2>/dev/null || echo "0.0.0")
  
  echo $version
}

# 비교 가능한 버전 숫자로 변환 (1.2.3 -> 1002003)
normalize_version() {
  local version=$1
  # 최대 3자리 숫자 지원 (백만 단위)
  local major=$(echo $version | cut -d. -f1)
  local minor=$(echo $version | cut -d. -f2 2>/dev/null || echo "0")
  local patch=$(echo $version | cut -d. -f3 2>/dev/null || echo "0")
  
  echo $((major * 1000000 + minor * 1000 + patch))
}

# 마이그레이션 실행
run_migration() {
  create_version_table
  
  local current_version=$(get_current_version)
  local current_norm=$(normalize_version $current_version)
  
  log "현재 DB 버전: $current_version (normalized: $current_norm)"
  
  # 버전 디렉토리가 존재하는지 확인
  if [ ! -d "$MIGRATION_DIR" ]; then
    log "마이그레이션 디렉토리가 없습니다: $MIGRATION_DIR"
    mkdir -p $MIGRATION_DIR
    log "마이그레이션 디렉토리 생성됨: $MIGRATION_DIR"
    return 0
  fi
  
  # 버전 디렉토리 가져오기 (정렬된 상태로)
  local version_dirs=$(find $MIGRATION_DIR -maxdepth 1 -type d -name "V*" | sort -V)
  if [ -z "$version_dirs" ]; then
    log "적용할 마이그레이션이 없습니다"
    return 0
  fi
  
  for version_dir in $version_dirs; do
    local version=$(basename $version_dir | sed 's/V//')
    local version_norm=$(normalize_version $version)
    
    # 현재 버전보다 높은 버전만 실행
    if [ $version_norm -gt $current_norm ]; then
      log "버전 $version으로 마이그레이션 중..."
      
      # 디렉토리 내 모든 SQL 파일을 정렬된 순서로 실행
      local sql_files=$(find $version_dir -name "*.sql" | sort)
      if [ -z "$sql_files" ]; then
        log "버전 $version에 적용할 SQL 파일이 없습니다"
        continue
      fi
      
      for sql_file in $sql_files; do
        local script_name=$(basename $sql_file)
        local temp_sql_file="${TEMP_DIR}/${script_name}"
        local description=$(echo $script_name | sed "s/V${version}_//" | sed "s/.sql//")
        
        # 환경변수 대체
        substitute_env "$sql_file" "$temp_sql_file"
        local checksum=$(md5sum $temp_sql_file | cut -d ' ' -f 1)
        
        log "적용 중: $script_name"
        local start_time=$(date +%s)
        
        # 환경변수가 대체된 임시 SQL 파일 실행
        mysql_connect "$DB_NAME" < "$temp_sql_file"
        local success=$?
        
        local end_time=$(date +%s)
        local execution_time=$((end_time - start_time))
        
        if [ $success -eq 0 ]; then
          log "성공: $script_name (${execution_time}초)"
        else
          log "실패: $script_name (${execution_time}초)"
        fi
        
        # 버전 테이블 업데이트
        mysql_connect "$DB_NAME" << EOF
        INSERT INTO schema_version 
        (version, description, type, script, checksum, installed_by, execution_time, success)
        VALUES 
        ('$version', '$description', 'SQL', '$script_name', '$checksum', 'migration_script', $execution_time, $success);
EOF

        # 임시 파일 삭제
        rm -f "$temp_sql_file"
      done
      
      log "버전 $version 마이그레이션 완료"
    else
      log "버전 $version은 이미 적용되었거나 현재 버전보다 낮습니다. 건너뜁니다."
    fi
  done
}

# 메인 함수
main() {
  log "=== 데이터베이스 마이그레이션 시작 ==="
  run_migration
  log "=== 데이터베이스 마이그레이션 완료 ==="
  
  # 임시 디렉토리 정리
  rm -rf "${TEMP_DIR}"
}

main "$@"