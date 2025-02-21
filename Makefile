.PHONY: build up down clean fclean logs help create_dirs copy_init_files

# 출력용 색상 정의 
BLUE	= \033[0;34m
GREEN= \033[0;32m
RED	 = \033[0;31m
YELLOW  = \033[1;33m
NC	  = \033[0m # 색상 초기화

# 디렉토리 경로 정의
DB_DATA_DIR  = database/mariadb/data
DB_BASE_DIR  = database

# 기본 타겟 설정
.DEFAULT_GOAL := help

# 디렉토리 생성 및 SQL 파일 복사
create_dirs: copy_init_files
	@echo "${BLUE}필요한 디렉토리 확인 및 생성 중...${NC}"
	@for dir in $(DB_DATA_DIR); do \
			if [ ! -d $$dir ]; then \
					echo "${YELLOW}디렉토리 생성 중: $$dir${NC}"; \
					mkdir -p $$dir; \
					chmod 777 $$dir; \
			else \
					echo "${GREEN}디렉토리가 이미 존재합니다: $$dir${NC}"; \
			fi \
	done

# 도움말 표시
help:
	@echo "${BLUE}사용 가능한 명령어:${NC}"
	@echo "${GREEN}make build${NC}	- Docker 이미지 빌드"
	@echo "${GREEN}make up${NC}	- 모든 서비스 시작"
	@echo "${GREEN}make up [서비스명]${NC} - 특정 서비스만 시작 (예: make up discord)"
	@echo "${GREEN}make down${NC}	 - 서비스 중지"
	@echo "${GREEN}make clean${NC}	- 컨테이너와 볼륨 제거"
	@echo "${GREEN}make fclean${NC}- 모든 Docker 리소스 제거"
	@echo "${GREEN}make logs${NC}	 - 로그 보기"

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
			docker compose up -d --build discord-app; \
	fi
	@echo "${GREEN}서비스가 시작되었습니다. 'make logs'로 로그를 확인하세요${NC}"

# 컨테이너 중지
down:
	@echo "${BLUE}서비스 중지 중...${NC}"
	docker compose down

# 재시작 명령어
re: clean
	make build
	make up
	make logs

# 컨테이너와 볼륨 제거
clean:
	@echo "${RED}컨테이너와 볼륨을 제거합니다...${NC}"
	docker compose down -v

# 모든 Docker 리소스 제거
fclean: clean
	@echo "${RED}모든 Docker 리소스를 제거합니다...${NC}"
	docker volume prune -f
	rm -rf $(DB_BASE_DIR)

# 로그 보기
logs:
	@echo "${BLUE}로그 확인 중...${NC}"
	docker compose logs -f

# 서비스 이름을 인자로 받기 위한 규칙
%:
	@:
