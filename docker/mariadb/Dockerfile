# 기본 이미지 선택
FROM alpine:latest

# 환경 변수 설정
ENV MYSQL_DATA_DIR=/var/lib/mysql \
    MYSQL_LOG_DIR=/var/log/mysql \
    MYSQL_RUN_DIR=/run/mysqld

# 필요한 패키지 설치 및 디렉토리 설정을 단일 레이어로 결합
RUN apk update && apk upgrade && \
    apk add --no-cache \
        mariadb \
        mariadb-client \
        mariadb-server-utils \
        gettext \
        coreutils && \
    # 필요한 디렉토리 생성
    mkdir -p /var/lib/dbinit \
             /var/lib/dbinit/migrations \
             /etc/my.cnf.d \
             ${MYSQL_RUN_DIR} \
             ${MYSQL_LOG_DIR} \
             ${MYSQL_DATA_DIR} \
             /script \
             /tmp/migration_temp \
             /var/tmp && \
    # 권한 설정
    chown -R mysql:mysql ${MYSQL_RUN_DIR} \
                        ${MYSQL_LOG_DIR} \
                        ${MYSQL_DATA_DIR} \
                        /var/lib/dbinit \
                        /tmp/migration_temp \
                        /var/tmp && \
    chmod 755 ${MYSQL_LOG_DIR} \
              ${MYSQL_DATA_DIR} \
              /tmp/migration_temp \
              /var/tmp

# 설정 파일과 스크립트를 한 번에 복사
COPY docker/mariadb/db/init /var/lib/dbinit/
COPY docker/mariadb/db/config /etc/my.cnf.d
COPY docker/mariadb/script.sh /script/script.sh

# 마이그레이션 스크립트와 디렉토리 복사 (신규 추가)
COPY docker/mariadb/db/migrations /var/lib/dbinit/migrations/
COPY docker/mariadb/migration.sh /script/migration.sh

# 스크립트 권한 설정 및 소유권 변경
RUN chown -R mysql:mysql /var/lib/dbinit/ \
                        /etc/my.cnf.d \
                        /script/ && \
    chmod +x /var/lib/dbinit/*.* 2>/dev/null || true && \
    chmod +x /script/script.sh && \
    chmod +x /script/migration.sh

# 볼륨 설정
VOLUME ["${MYSQL_DATA_DIR}", "${MYSQL_LOG_DIR}"]

# 상태 확인 설정
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD mysqladmin ping -h localhost || exit 1

# MariaDB 포트 노출
EXPOSE 3306

# 실행 사용자 설정 (mysql 사용자로 변경)
USER mysql

# 엔트리포인트 설정
ENTRYPOINT ["/script/script.sh"]