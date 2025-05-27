#!/bin/bash

echo "========================================="
echo "Starting pre-build checks..."
echo "========================================="

# 색상 코드 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 작업 디렉토리 설정
WORK_DIR="/app"
TEMP_DIR="/tmp/build-temp"

# 임시 디렉토리 생성
echo -e "${YELLOW}Creating temporary build directory...${NC}"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# 소스 파일들을 임시 디렉토리로 복사
echo -e "${YELLOW}Copying source files to temporary directory...${NC}"
cp -r "$WORK_DIR/." "$TEMP_DIR/"

# 임시 디렉토리로 이동
cd "$TEMP_DIR"

# 에러 카운트
error_count=0
fixed_count=0

# 1. 파일 무결성 체크 및 수정
echo -e "${YELLOW}Checking and fixing file integrity...${NC}"
find "$TEMP_DIR/src" -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" 2>/dev/null | while read file; do
    # 파일이 비어있는지 체크
    if [ ! -s "$file" ]; then
        echo -e "${RED}Empty file detected: ${file#$TEMP_DIR/}${NC}"
        continue
    fi
    
    # 파일이 제대로 끝나는지 확인 (마지막 문자가 개행인지)
    if [ -n "$(tail -c 1 "$file" 2>/dev/null)" ]; then
        echo >> "$file"
        fixed_count=$((fixed_count + 1))
    fi
    
    # 파일이 중간에 잘렸는지 확인 (불완전한 태그 체크)
    last_line=$(tail -n 1 "$file" 2>/dev/null)
    if echo "$last_line" | grep -E '<[^>]*$' >/dev/null 2>&1; then
        echo -e "${RED}File appears to be truncated: ${file#$TEMP_DIR/}${NC}"
        error_count=$((error_count + 1))
    fi
done

# 2. 파일 인코딩 정규화 (BOM 제거, CRLF -> LF)
echo -e "${YELLOW}Normalizing file encodings...${NC}"
find "$TEMP_DIR/src" -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" 2>/dev/null | while read file; do
    # BOM 제거
    if head -c 3 "$file" 2>/dev/null | grep -q $'\xef\xbb\xbf'; then
        sed -i '1s/^\xEF\xBB\xBF//' "$file"
        fixed_count=$((fixed_count + 1))
    fi
    
    # CRLF -> LF
    if file "$file" 2>/dev/null | grep -q "CRLF"; then
        dos2unix "$file" 2>/dev/null || sed -i 's/\r$//' "$file"
        fixed_count=$((fixed_count + 1))
    fi
    
    # NULL 문자 제거
    if grep -q $'\x00' "$file" 2>/dev/null; then
        tr -d '\000' < "$file" > "$file.tmp" && mv "$file.tmp" "$file"
        fixed_count=$((fixed_count + 1))
    fi
done

# 3. 원본 디렉토리의 node_modules와 package-lock.json을 심볼릭 링크로 연결
echo -e "${YELLOW}Creating symbolic links for node_modules...${NC}"
if [ -d "$WORK_DIR/node_modules" ]; then
    ln -sf "$WORK_DIR/node_modules" "$TEMP_DIR/node_modules"
fi
if [ -f "$WORK_DIR/package-lock.json" ]; then
    ln -sf "$WORK_DIR/package-lock.json" "$TEMP_DIR/package-lock.json"
fi

# 4. 특정 문제 파일 체크
problem_file="$TEMP_DIR/src/components/profile/GameHistoryListItem.tsx"
if [ -f "$problem_file" ]; then
    echo -e "${YELLOW}Checking problematic file: ${problem_file#$TEMP_DIR/}${NC}"
    
    file_size=$(wc -c < "$problem_file" 2>/dev/null || echo 0)
    line_count=$(wc -l < "$problem_file" 2>/dev/null || echo 0)
    
    if [ "$file_size" -lt 3000 ] || [ "$line_count" -lt 100 ]; then
        echo -e "${RED}File appears to be corrupted or truncated!${NC}"
        echo "File size: $file_size bytes, Lines: $line_count"
        
        # 원본에서 복사 시도
        original_file="$WORK_DIR/src/components/profile/GameHistoryListItem.tsx"
        if [ -f "$original_file" ] && [ -s "$original_file" ]; then
            echo -e "${YELLOW}Attempting to restore from original...${NC}"
            cp "$original_file" "$problem_file"
            echo -e "${GREEN}File restored from original${NC}"
        fi
    fi
fi

echo "========================================="
if [ $error_count -eq 0 ]; then
    echo -e "${GREEN}Pre-build checks completed!${NC}"
    echo -e "${GREEN}Fixed $fixed_count issues in temporary copy${NC}"
else
    echo -e "${YELLOW}Pre-build checks completed with $error_count warnings${NC}"
    echo -e "${GREEN}Fixed $fixed_count issues in temporary copy${NC}"
fi
echo "========================================="

# 작업 디렉토리를 임시 디렉토리로 설정
export WORK_DIR="$TEMP_DIR"

# 정리는 entrypoint.sh에서 수행
exit 0