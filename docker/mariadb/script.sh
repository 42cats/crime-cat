#!/bin/sh

# 로깅 함수: 타임스탬프와 함께 메시지를 출력
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# ──────────────────────────────────────────────────────────────────────────────────
# (A) 디렉토리 권한 초기화 + "DB 존재 여부" 검사
# ──────────────────────────────────────────────────────────────────────────────────
prepare_environment() {
    log "데이터베이스 환경 준비 시작..."
    
    #이미 /var/lib/mysql/mysql 디렉토리가 있으면 -> DB가 존재한다고 판단
    if [ -d "/var/lib/mysql/mysql" ]; then
        log "데이터베이스가 이미 존재합니다. (초기화 스킵)"
        chown -R mysql:mysql /var/lib/mysql /run/mysqld
        chmod -R 750 /var/lib/mysql
        chmod -R 755 /run/mysqld
        return 0  # 함수 반환값 0은 "건너뛰기"
    fi
    
    # 이전 실행의 잔여물 정리
    if [ -d "/var/lib/mysql/mysql" ]; then
        log "기존 데이터베이스 디렉토리 정리 중..."
        rm -rf /var/lib/mysql/*
    fi
    
    # 디렉토리 권한 재설정
    chown -R mysql:mysql /var/lib/mysql /run/mysqld
    chmod -R 750 /var/lib/mysql
    chmod -R 755 /run/mysqld
    
    log "데이터베이스 환경 준비 완료"
    return 1  # 함수 반환값 1은 "초기화 필요"
}

# ──────────────────────────────────────────────────────────────────────────────────
# (B) 시스템 DB (mysql_install_db)를 이용한 기본 테이블 생성
# ──────────────────────────────────────────────────────────────────────────────────
initialize_system_db() {
    log "시스템 데이터베이스 초기화 시작..."
    
    mysql_install_db --user=mysql \
                     --datadir=/var/lib/mysql \
                     --rpm \
                     --auth-root-authentication-method=normal \
                     --skip-test-db
    
    if [ $? -ne 0 ]; then
        log "시스템 DB(mysql_install_db) 초기화 실패!"
        exit 1
    fi
    
    log "시스템 데이터베이스 초기화 완료"
}

# ──────────────────────────────────────────────────────────────────────────────────
# (C) init 폴더 안의 모든 템플릿 *.template.sql → .sql 치환 후 실행
# ──────────────────────────────────────────────────────────────────────────────────
run_all_sql_scripts() {
    log "SQL 초기화 스크립트(전체) 실행 시작..."

    # 1) 모든 *.template.sql → .sql 변환 (환경 변수 치환)
    for template in /var/lib/dbinit/*.template.sql; do
        # 만약 해당 디렉토리에 template 파일이 없으면 에러가 날 수 있으니 체크
        [ -f "$template" ] || continue

        output="${template%.template.sql}.sql"
        log "환경 변수 치환 중: $template -> $output"
        envsubst < "$template" > "$output"
    done

    # 2) 실제 SQL 실행 (치환된 .sql)
    for script in /var/lib/dbinit/*.sql; do
        [ -f "$script" ] || continue
        # 혹시 .template.sql이 남아있다면 제외 (이론상 위에서 이미 변환됨)
        if [[ "$script" != *.template.sql ]]; then
            log "실행 중: $script"
            mysql -u root < "$script"
            if [ $? -ne 0 ]; then
                log "SQL 스크립트 실행 실패: $script"
                exit 1
            fi
        fi
    done

    log "SQL 초기화 스크립트(전체) 실행 완료"
}

# ──────────────────────────────────────────────────────────────────────────────────
# (D) "01-create-databases.template.sql"만 실행하기
# ──────────────────────────────────────────────────────────────────────────────────
run_create_databases_script() {
    local tmpl="/var/lib/dbinit/01-create-databases.template.sql"
    local output="/var/lib/dbinit/01-create-databases.sql"

    if [ -f "$tmpl" ]; then
        log "단일 스크립트 실행: 01-create-databases.template.sql → .sql 변환 후 실행"
        envsubst < "$tmpl" > "$output"

        log "실행 중: $output"
        mysql -u root < "$output"
        if [ $? -ne 0 ]; then
            log "SQL 스크립트 실행 실패: $output"
            exit 1
        fi
    else
        log "파일이 없습니다: $tmpl (유저/비번 생성 스크립트가 없음)"
    fi
}

# ──────────────────────────────────────────────────────────────────────────────────
# (E) 메인 실행 (전체 흐름)
# ──────────────────────────────────────────────────────────────────────────────────
main() {
    log "MariaDB 초기화 프로세스 시작..."
    
    # 1) 환경 준비 + DB 존재 여부 확인
    prepare_environment
    PREPARE_RESULT=$?  # 0이면 "이미 DB 있음 -> 초기화 스킵", 1이면 "DB 없음 -> 초기화 필요"

    # 2) DB가 없으면 전체 초기화 진행
    #    (시스템 DB 생성 → mysqld 백그라운드 실행 → 모든 SQL 실행)
    if [ "$PREPARE_RESULT" -eq 1 ]; then
        log "DB가 없어 전체 초기화를 진행합니다..."
        
        # 시스템 DB(mysql_install_db)
        initialize_system_db

        # 임시로 mysqld 실행 후, SQL 스크립트 적용
        mysqld --user=mysql &
        sleep 2  # mysqld가 시작될 때까지 대기

        # init 폴더 모든 SQL 실행
        run_all_sql_scripts

        # 백그라운드 mysqld 종료
        pkill mysqld
        sleep 2
    else
        # 3) DB가 이미 존재하는 경우: 전체 초기화 X, 
        #    하지만 "01-create-databases.template.sql"은 실행(유저/비번/DB 생성 보장)
        log "DB가 이미 존재합니다. 초기화 스킵 후 '사용자/비번/DB 생성 스크립트'만 실행합니다..."

        mysqld --user=mysql &
        sleep 2

        # 01-create-databases.template.sql 만 실행
        run_create_databases_script

        # 백그라운드 mysqld 종료
        pkill mysqld
        sleep 2
    fi

    # 4) 마지막으로 서버를 정식 시작
    rm -f /etc/my.cnf.d/mariadb-server.cnf 
    log "MariaDB 서버를 시작합니다..."
    exec mysqld --user=mysql
}

# 스크립트 실행
main
