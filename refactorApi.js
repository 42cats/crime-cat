#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// API 파일 매핑 정의
const fileMappings = {
  // Auth 관련
  'authService.ts': 'auth/authService.ts',
  'permissionService.ts': 'auth/permissionService.ts',
  'userGrantedPermissionService.ts': 'auth/userGrantedPermissionService.ts',
  
  // Posts 관련
  'posts/postService.ts': 'posts/postService.ts',
  'boardPostService.ts': 'posts/boardPostService.ts',
  'userPostNotificationService.ts': 'posts/userPostNotificationService.ts',
  
  // Profile 관련
  'profile/detail.ts': 'profile/detail.ts',
  'userInfoService.ts': 'profile/userInfoService.ts',
  
  // Social - Follow
  'follow/index.ts': 'social/follow/index.ts',
  
  // Social - Search
  'searchUserService.ts': 'social/search/searchUserService.ts',
  'search/': 'social/search/',
  
  // Social - Notifications
  'notificationService.ts': 'social/notifications/notificationService.ts',
  'notifications/': 'social/notifications/',
  
  // Game 관련
  'gameHistoryService.ts': 'game/gameHistoryService.ts',
  'dailycheckService.ts': 'game/dailycheckService.ts',
  
  // Guild 관련
  'guildsService.ts': 'guild/guildsService.ts',
  'teamsService.ts': 'guild/teamsService.ts',
  'guild/': 'guild/',
  
  // Content 관련
  'themesService.ts': 'content/themesService.ts',
  'commandsService.ts': 'content/commandsService.ts',
  'noticesService.ts': 'content/noticesService.ts',
  
  // Stats 관련
  'statsService.ts': 'stats/statsService.ts',
  'mainstatsService.ts': 'stats/mainstatsService.ts',
  
  // External
  'naverMapService.ts': 'external/naverMapService.ts',
  
  // Others
  'couponService.ts': 'misc/couponService.ts',
  'messageButtonService.ts': 'misc/messageButtonService.ts',
  'messageMecro/': 'misc/messageMecro/',
  'explore/': 'misc/explore/',
  'hashtags/': 'misc/hashtags/',
  'userPost/': 'posts/userPost/',
};

// Index 파일 생성을 위한 폴더 목록
const foldersNeedingIndex = [
  'auth',
  'posts',
  'profile',
  'social/follow',
  'social/search',
  'social/notifications',
  'game',
  'guild',
  'content',
  'stats',
  'external',
  'misc'
];

const srcPath = '/Users/byeonsanghun/goinfre/crime-cat/frontend/src';
const apiPath = path.join(srcPath, 'api');

// 1. 새 폴더 구조 생성
function createFolderStructure() {
  console.log('Creating new folder structure...');
  
  foldersNeedingIndex.forEach(folder => {
    const folderPath = path.join(apiPath, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created folder: ${folder}`);
    }
  });
}

// 2. 파일 이동
function moveFiles() {
  console.log('\nMoving files to new structure...');
  
  Object.entries(fileMappings).forEach(([oldPath, newPath]) => {
    const sourcePath = path.join(apiPath, oldPath);
    const destPath = path.join(apiPath, newPath);
    
    if (fs.existsSync(sourcePath)) {
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // 폴더인 경우
      if (fs.statSync(sourcePath).isDirectory()) {
        // cp -r 명령어 사용
        const { execSync } = require('child_process');
        execSync(`cp -r "${sourcePath}" "${destDir}"`);
        console.log(`Moved folder: ${oldPath} -> ${newPath}`);
      } else {
        // 파일인 경우
        fs.renameSync(sourcePath, destPath);
        console.log(`Moved file: ${oldPath} -> ${newPath}`);
      }
    }
  });
}

// 3. Index 파일 생성
function createIndexFiles() {
  console.log('\nCreating index files...');
  
  const indexContents = {
    'auth': `export * from './authService';
export * from './permissionService';
export * from './userGrantedPermissionService';
`,
    'posts': `export * from './postService';
export * from './boardPostService';
export * from './userPostNotificationService';
`,
    'profile': `export * from './detail';
export * from './userInfoService';
`,
    'social/follow': `export * from './index';
`,
    'social/search': `export * from './searchUserService';
`,
    'social/notifications': `export * from './notificationService';
`,
    'game': `export * from './gameHistoryService';
export * from './dailycheckService';
`,
    'guild': `export * from './guildsService';
export * from './teamsService';
`,
    'content': `export * from './themesService';
export * from './commandsService';
export * from './noticesService';
`,
    'stats': `export * from './statsService';
export * from './mainstatsService';
`,
    'external': `export * from './naverMapService';
`,
  };
  
  Object.entries(indexContents).forEach(([folder, content]) => {
    const indexPath = path.join(apiPath, folder, 'index.ts');
    if (!fs.existsSync(indexPath)) {
      fs.writeFileSync(indexPath, content);
      console.log(`Created index file: ${folder}/index.ts`);
    }
  });
}

// 4. Import 경로 업데이트
function updateImports() {
  console.log('\nUpdating import paths in components...');
  
  // 모든 TypeScript 파일 찾기
  const files = glob.sync(path.join(srcPath, '**/*.{ts,tsx}'), {
    ignore: ['**/node_modules/**', '**/dist/**']
  });
  
  const importMappings = {
    // 기존 경로 -> 새 경로 매핑
    '@/api/authService': '@/api/auth',
    '@/api/permissionService': '@/api/auth',
    '@/api/userGrantedPermissionService': '@/api/auth',
    '@/api/boardPostService': '@/api/posts',
    '@/api/userPostNotificationService': '@/api/posts',
    '@/api/posts/postService': '@/api/posts',
    '@/api/userInfoService': '@/api/profile',
    '@/api/profile/detail': '@/api/profile',
    '@/api/searchUserService': '@/api/social/search',
    '@/api/notificationService': '@/api/social/notifications',
    '@/api/gameHistoryService': '@/api/game',
    '@/api/dailycheckService': '@/api/game',
    '@/api/guildsService': '@/api/guild',
    '@/api/teamsService': '@/api/guild',
    '@/api/themesService': '@/api/content',
    '@/api/commandsService': '@/api/content',
    '@/api/noticesService': '@/api/content',
    '@/api/statsService': '@/api/stats',
    '@/api/mainstatsService': '@/api/stats',
    '@/api/naverMapService': '@/api/external',
    '@/api/couponService': '@/api/misc',
    '@/api/messageButtonService': '@/api/misc',
  };
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // 각 import 매핑 적용
    Object.entries(importMappings).forEach(([oldImport, newImport]) => {
      const regex = new RegExp(`from\\s+['"]${oldImport}['"]`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `from '${newImport}'`);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`Updated imports in: ${path.relative(srcPath, file)}`);
    }
  });
}

// 5. 검증
function validateMigration() {
  console.log('\nValidating migration...');
  
  // TypeScript 컴파일 테스트
  const { execSync } = require('child_process');
  try {
    execSync('cd /Users/byeonsanghun/goinfre/crime-cat/frontend && npm run type-check', { stdio: 'inherit' });
    console.log('✅ TypeScript validation passed!');
  } catch (error) {
    console.error('❌ TypeScript validation failed. Please check for errors.');
  }
}

// 메인 실행 함수
async function main() {
  console.log('Starting API migration...\n');
  
  try {
    // 백업 생성
    console.log('Creating backup...');
    const backupPath = path.join(srcPath, 'api_backup');
    if (!fs.existsSync(backupPath)) {
      const { execSync } = require('child_process');
      execSync(`cp -r "${apiPath}" "${backupPath}"`);
      console.log('Backup created at: api_backup');
    }
    
    // 마이그레이션 실행
    createFolderStructure();
    moveFiles();
    createIndexFiles();
    updateImports();
    validateMigration();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('Note: Please run your tests to ensure everything works correctly.');
    console.log('If issues occur, restore from: api_backup');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('Please restore from backup if needed.');
  }
}

// 실행
if (require.main === module) {
  main();
}

module.exports = { main };
