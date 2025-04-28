mkdir -p "$BACKUP_DIR"
chmod 755 "$BACKUP_DIR"
#!/bin/bash

# ======== [설정] ========
DB_CONTAINER_NAME="db"    # db 컨테이너 이름
DB_NAME="discord"             # 데이터베이스 이름
DB_USER="sabyun"                # 유저명
DB_PASSWORD="sabyun!"         # 비밀번호
BACKUP_DIR="/backup"          # 컨테이너 안에서의 경로
DATE=$(date +"%Y-%m-%d_%H-%M-%S")

# ======== [백업 실행] ========
# db 컨테이너 내부에서 mysqldump 실행 → 압축 저장
docker exec ${DB_CONTAINER_NAME} mysqldump -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} | gzip > ${BACKUP_DIR}/discord_backup_${DATE}.sql.gz

# ======== [오래된 백업 삭제] ========
find ${BACKUP_DIR} -name "*.sql.gz" -type f -mtime +7 -exec rm -f {} \;

# ======== [로그 남기기] ========
echo "[$(date +"%Y-%m-%d %H:%M:%S")] 백업 완료: discord_backup_${DATE}.sql.gz" >> ${BACKUP_DIR}/backup.log

