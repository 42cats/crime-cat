#!/bin/sh
# entrypoint.sh - 빌드 전용 스크립트

echo "========================================="
echo "Frontend Build Process Started"
echo "========================================="

# 빌드 전 체크 스크립트 실행
echo "Step 1: Running pre-build checks..."
. /pre-build-check.sh

# 작업 디렉토리 설정 (pre-build-check.sh에서 설정한 임시 디렉토리 사용)
if [ -n "$WORK_DIR" ] && [ -d "$WORK_DIR" ]; then
    cd "$WORK_DIR"
    echo "Working in temporary directory: $WORK_DIR"
else
    # 폴백: 원본 디렉토리 사용
    cd /app
    WORK_DIR="/app"
fi

# 의존성 설치 (이미 심볼릭 링크로 연결되어 있으면 스킵)
echo "Step 2: Installing dependencies..."
if [ ! -d "$WORK_DIR/node_modules" ] || [ ! -L "$WORK_DIR/node_modules" ]; then
    npm install
else
    echo "Using existing node_modules via symbolic link"
fi

# 빌드 실행
echo "Step 3: Building frontend..."
npm run build

# 빌드 결과 확인
if [ $? -eq 0 ]; then
    echo "========================================="
    echo "✅ Build completed successfully!"
    echo "========================================="
    
    # 빌드 결과물을 원본 디렉토리로 복사
    if [ -d "$WORK_DIR/dist" ] && [ "$WORK_DIR" != "/app" ]; then
        echo "Copying build output to original directory..."
        rm -rf /app/dist
        cp -r "$WORK_DIR/dist" /app/
        
        # 빌드 결과물 정보
        echo "Build output location: /app/dist"
        echo "Total files: $(find /app/dist -type f | wc -l)"
        echo "Total size: $(du -sh /app/dist | cut -f1)"
    fi
    
    # 임시 디렉토리 정리
    if [ "$WORK_DIR" != "/app" ] && [ -d "$WORK_DIR" ]; then
        echo "Cleaning up temporary directory..."
        rm -rf "$WORK_DIR"
    fi
    
    echo "========================================="
    echo "✨ Build process completed and cleaned up!"
    echo "========================================="
else
    echo "========================================="
    echo "❌ Build failed!"
    echo "========================================="
    
    # 실패해도 임시 디렉토리 정리
    if [ "$WORK_DIR" != "/app" ] && [ -d "$WORK_DIR" ]; then
        echo "Cleaning up temporary directory..."
        rm -rf "$WORK_DIR"
    fi
    
    exit 1
fi