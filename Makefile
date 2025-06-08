.PHONY: build up down clean fclean logs help create_dirs copy_env dev prod update_config

# 출력용 색상 정의 
BLUE	= \033[0;34m
GREEN	= \033[0;32m
RED	    = \033[0;31m
YELLOW  = \033[1;33m
NC	    = \033[0m # 색상 초기화

# 디렉토리 경로 정의
DB_DATA_DIR  = database/mariadb/data
DB_BASE_DIR  = database
FRONT_BASE_DIR  = frontend/dist
IMAGE_DATA_DIR = images
AVATAR_DIR = images/avatars/
GAME_THEME_DIR = images/gamethemes/
MIGRATION_DIR = docker/mariadb/db/migrations
BACKUP_DIR = backup/$(shell date +%Y%m%d_%H%M%S)
NGINX_CONF_DIR = docker/nginx/conf/http.d
# SMTP_DATA_DIR = smtp/data (Cloudflare Email Routing 사용으로 불필요)
# SMTP_CONFIG_DIR = smtp/config (Cloudflare Email Routing 사용으로 불필요)

# 기본 타겟 설정
.DEFAULT_GOAL := help

# config 서브모듈 자동 등록 및 업데이트
update_config:
	@if [ ! -d "config" ] || [ -z "$$(ls -A config 2>/dev/null)" ]; then \
		echo "${YELLOW}config 서브모듈이 없거나 비어 있습니다. 등록 또는 초기화 중...${NC}"; \
		git submodule add git@github.com:42cats/config.git config || true; \
	fi
	@git submodule update --init --recursive --remote

# 디렉토리 생성
create_dirs:
	@echo "${BLUE}필요한 디렉토리 확인 및 생성 중...${NC}"
	@for dir in $(DB_DATA_DIR) $(FRONT_BASE_DIR) ${IMAGE_DATA_DIR} ${AVATAR_DIR} ${GAME_THEME_DIR} ${NGINX_CONF_DIR}; do \
		if [ ! -d $$dir ]; then \
			echo "${YELLOW}디렉토리 생성 중: $$dir${NC}"; \
			mkdir -p $$dir; \
			chmod 755 $$dir || true; \
		else \
			echo "${GREEN}디렉토리가 이미 존재합니다: $$dir${NC}"; \
			chmod 755 $$dir || true; \
		fi; \
	done

# 환경변수 파일 복사 (루트 + frontend + backend + bot)
copy_env:
	@echo "${BLUE}.env 파일을 하위 디렉토리로 복사 중...${NC}"
	@cp .env frontend/.env
	@cp .env backend/backend/.env
	@cp .env bot/.env
	@echo "${GREEN}복사 완료: .env → frontend/.env, backend/.env, bot/.env${NC}"

# 개발 환경 설정
local: create_dirs update_config prepare_migration
	@echo "${BLUE}개발 환경 설정 중 (config/.env.local → .env)...${NC}"
	@cp config/.env.local .env
	@cp config/dockercompose/docker-compose.local.yaml docker-compose.yaml
	@cp config/nginx/local.nginx.conf docker/nginx/conf/http.d/nginx.conf
	@$(MAKE) copy_env

	@mkdir -p docker/nginx/certs

	@openssl req -x509 -nodes -days 365 \
		-newkey rsa:2048 \
		-keyout docker/nginx/certs/dev.crimecat.org-key.pem \
		-out docker/nginx/certs/dev.crimecat.org.pem \
		-subj "/C=KR/ST=Seoul/L=Seoul/O=CrimeCat/OU=Dev/CN=dev.crimecat.org" > /dev/null 2>&1
	@echo "${GREEN}✅ self-signed 인증서 생성 완료: docker/nginx/certs/dev.crimecat.org*.pem${NC}"

	@echo "${BLUE}서비스 시작 전 백업 생성...${NC}"
	@$(MAKE) backup || true

	@$(MAKE) up

	@echo "${BLUE}마이그레이션 실행 중...${NC}"
	@$(MAKE) migrate || true

	@echo "${GREEN}로컬 환경으로 전환 완료!${NC}"
	@echo "${YELLOW}문제 발생 시 'make rollback RESTORE_DIR=$(BACKUP_DIR)' 명령으로 롤백 가능${NC}"

dev: update_config prepare_migration
	@echo "${BLUE}개발 환경 설정 중 (config/.env.dev → .env)...${NC}"
	@cp config/.env.dev .env
	@cp config/dockercompose/docker-compose.dev.yaml docker-compose.yaml
	@cp config/nginx/dev.nginx.conf docker/nginx/conf/http.d/nginx.conf
	@$(MAKE) copy_env

	@mkdir -p docker/nginx/certs

	@echo "${BLUE}서비스 시작 전 백업 생성...${NC}"
	@$(MAKE) backup || true

	@$(MAKE) up

	@echo "${BLUE}마이그레이션 실행 중...${NC}"
	@$(MAKE) migrate || true

	@echo "${GREEN}개발 환경으로 전환 완료!${NC}"
	@echo "${YELLOW}문제 발생 시 'make rollback RESTORE_DIR=$(BACKUP_DIR)' 명령으로 롤백 가능${NC}"

# 특정 서비스만 다시 빌드하고 띄우기
target:
	@if [ -z "$(filter-out $@,$(MAKECMDGOALS))" ]; then \
		echo "${RED}⚠️  서비스 이름을 지정해야 합니다. 예시: make target spring-backend${NC}"; \
		exit 1; \
	else \
		echo "${BLUE}$(filter-out $@,$(MAKECMDGOALS)) 서비스를 빌드하고 실행합니다...${NC}"; \
		docker compose up -d --build $(filter-out $@,$(MAKECMDGOALS)); \
	fi

# 마이그레이션 스크립트 준비
prepare_migration:
	@echo "${BLUE}마이그레이션 디렉토리 준비 중...${NC}"
	@mkdir -p $(MIGRATION_DIR)
	@if [ ! -f "$(MIGRATION_DIR)/schema_version.sql" ]; then \
		echo "${YELLOW}스키마 버전 테이블 스크립트 생성 중...${NC}"; \
		cp docker/mariadb/db/schema_version.sql $(MIGRATION_DIR)/schema_version.sql || true; \
	fi
	@echo "${GREEN}마이그레이션 환경 준비 완료${NC}"

# 마이그레이션 명령어
migrate:
	@echo "${BLUE}데이터베이스 마이그레이션 실행...${NC}"
	@# 컨테이너가 동작 중이고 migration.sh 파일이 존재하는지 확인
	@if docker ps | grep -q cat_db; then \
		if docker exec cat_db ls /script/migration.sh > /dev/null 2>&1; then \
			docker exec -it cat_db /bin/sh -c "chmod +x /script/migration.sh && /script/migration.sh"; \
		else \
			echo "${RED}마이그레이션 스크립트를 찾을 수 없습니다: /script/migration.sh${NC}"; \
			docker exec -it cat_db ls -la /script/; \
		fi \
	else \
		echo "${RED}cat_db 컨테이너가 실행 중이지 않습니다${NC}"; \
	fi
	@echo "${GREEN}마이그레이션 완료${NC}"

# 백업 명령어
backup:
	@echo "${BLUE}데이터베이스 백업 생성 중...${NC}"
	@mkdir -p $(BACKUP_DIR)
	@if docker ps | grep -q cat_db; then \
		docker exec cat_db /bin/sh -c "mysqldump -u\$${DB_USER} -p\$${DB_PASS} \$${DB_DISCORD} > /tmp/backup.sql" || true; \
		docker cp cat_db:/tmp/backup.sql $(BACKUP_DIR)/backup.sql || true; \
		echo "${GREEN}백업 완료: $(BACKUP_DIR)/backup.sql${NC}"; \
	else \
		echo "${YELLOW}cat_db 컨테이너가 실행 중이지 않아 백업을 건너뜁니다${NC}"; \
	fi

# 롤백 명령어
rollback:
	@if [ -z "$(RESTORE_DIR)" ]; then \
		echo "${RED}롤백할 백업 디렉토리를 지정해야 합니다. 예: make rollback RESTORE_DIR=backup/20230101_120000${NC}"; \
		exit 1; \
	fi; \
	echo "${BLUE}$(RESTORE_DIR)/backup.sql에서 데이터베이스 복원 중...${NC}"; \
	if [ ! -f "$(RESTORE_DIR)/backup.sql" ]; then \
		echo "${RED}백업 파일이 존재하지 않습니다: $(RESTORE_DIR)/backup.sql${NC}"; \
		exit 1; \
	fi; \
	if ! docker ps | grep -q cat_db; then \
		echo "${RED}cat_db 컨테이너가 실행 중이지 않습니다${NC}"; \
		exit 1; \
	fi; \
	docker cp $(RESTORE_DIR)/backup.sql cat_db:/tmp/restore.sql; \
	docker exec cat_db /bin/sh -c "mysql -u\$${DB_USER} -p\$${DB_PASS} \$${DB_DISCORD} < /tmp/restore.sql"; \
	echo "${GREEN}롤백 완료${NC}"

# 새 마이그레이션 생성 명령어
new-migration:
	@if [ -z "$(VERSION)" ]; then \
		echo "${RED}버전을 지정해야 합니다. 예: make new-migration VERSION=1.1.0 DESC=add_new_table${NC}"; \
		exit 1; \
	fi; \
	if [ -z "$(DESC)" ]; then \
		echo "${RED}설명을 지정해야 합니다. 예: make new-migration VERSION=1.1.0 DESC=add_new_table${NC}"; \
		exit 1; \
	fi; \
	echo "${BLUE}새 마이그레이션 생성: V$(VERSION)_$(DESC).sql${NC}"; \
	mkdir -p $(MIGRATION_DIR)/V$(VERSION); \
	echo "-- Migration: V$(VERSION)_$(DESC).sql\n-- Created: $(shell date '+%Y-%m-%d %H:%M:%S')\n\nUSE \$${DB_DISCORD};\n\n-- 여기에 마이그레이션 SQL을 작성하세요\n\n" > $(MIGRATION_DIR)/V$(VERSION)/V$(VERSION)_$(DESC).sql; \
	echo "${GREEN}마이그레이션 파일 생성 완료: $(MIGRATION_DIR)/V$(VERSION)/V$(VERSION)_$(DESC).sql${NC}"

# 운영 환경 설정 (마이그레이션 관련 업데이트)
prod: update_config prepare_migration
	@echo "${BLUE}운영 환경 설정 중 (config/.env.prod → .env)...${NC}"
	@cp config/.env.prod .env
	@cp config/dockercompose/docker-compose.prod.yaml docker-compose.yaml
	@cp config/nginx/prod.nginx.conf docker/nginx/conf/http.d/nginx.conf
	@$(MAKE) copy_env

	@echo "${BLUE}서비스 재시작 전 백업 생성...${NC}"
	@$(MAKE) backup || true

	@echo "${BLUE}서비스 재시작 중...${NC}"
	@$(MAKE) up

	@echo "${BLUE}마이그레이션 실행 중...${NC}"
	@$(MAKE) migrate || true

	@echo "${BLUE}PROD용 DNS 레코드 설정 중...${NC}"
	@cd mail && ./setup-dns-prod.sh || true

	@echo "${GREEN}운영 환경으로 전환 완료!${NC}"
	@echo "${YELLOW}문제 발생 시 'make rollback RESTORE_DIR=$(BACKUP_DIR)' 명령으로 롤백 가능${NC}"

# 도움말 표시
help:
	@echo "${BLUE}사용 가능한 명령어:${NC}"
	@echo "${GREEN}make dev${NC}     - 개발 환경 구성 및 실행"
	@echo "${GREEN}make prod${NC}    - 운영 환경 구성 및 실행"
	@echo "${GREEN}make build${NC}   - Docker 이미지 빌드"
	@echo "${GREEN}make up${NC}      - 모든 서비스 시작"
	@echo "${GREEN}make up [서비스명]${NC} - 특정 서비스만 시작"
	@echo "${GREEN}make down${NC}    - 서비스 중지"
	@echo "${GREEN}make clean${NC}   - 컨테이너와 볼륨 제거"
	@echo "${GREEN}make fclean${NC}  - 모든 Docker 리소스 제거"
	@echo "${GREEN}make logs${NC}    - 로그 보기"
	@echo "${GREEN}make migrate${NC} - DB 마이그레이션 실행"
	@echo "${GREEN}make backup${NC}  - DB 백업 생성"
	@echo "${GREEN}make rollback RESTORE_DIR=백업경로${NC} - DB 롤백"
	@echo "${GREEN}make new-migration VERSION=1.x.x DESC=설명${NC} - 새 마이그레이션 생성"

# Docker 이미지 빌드
build: create_dirs
	@echo "${BLUE}Docker 이미지 빌드 중...${NC}"
	docker compose build

# 컨테이너 시작
up: create_dirs
	@echo "${BLUE}서비스 시작 중...${NC}"
	@if [ "$(filter-out $@,$(MAKECMDGOALS))" = "" ]; then \
		echo "${GREEN}모든 서비스를 시작합니다...${NC}"; \
		docker compose up -d --build; \
	else \
		echo "${GREEN}$(filter-out $@,$(MAKECMDGOALS)) 서비스를 시작합니다...${NC}"; \
		docker compose up -d --build $(filter-out $@,$(MAKECMDGOALS)); \
	fi
	@echo "${GREEN}서비스가 시작되었습니다. 'make logs'로 로그를 확인하세요${NC}"

# 컨테이너 중지
down:
	@echo "${BLUE}서비스 중지 중...${NC}"
	docker compose down

# 재시작
re: clean
	make build
	make up
	make logs

# 컨테이너와 볼륨 제거
clean:
	@echo "${RED}컨테이너와 볼륨을 제거합니다...${NC}"
	docker compose down -v

# 전체 Docker 리소스 제거
fclean: clean
	@echo "${RED}모든 Docker 리소스(볼륨, 이미지, 네트워크, 빌드캐시)를 제거합니다...${NC}"
	# 남은 컨테이너/네트워크 강제 종료 및 삭제
	-docker system prune -af --volumes
	# 수동으로 모든 로컬 이미지 삭제
	-docker rmi -f $$(docker images -q) || true
	# 빌드 캐시까지 완전 삭제 (Docker 20.10+ 버전 지원)
	-docker builder prune -af || true
	# 직접 만든 디렉토리 삭제
	rm -rf $(DB_BASE_DIR)
	@echo "${GREEN}🧹 전체 Docker 리소스 정리 완료!${NC}"


# 로그 보기
logs:
	@echo "${BLUE}로그 확인 중...${NC}"
	docker compose logs -f

# 서비스 이름을 인자로 받기 위한 규칙
%:
	@:
