// scripts/generate-sitemap-index.js
// 사이트맵 인덱스 파일 생성 (정적 + 동적 사이트맵 통합)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.DOMAIN || 'https://mystery-place.com';

// 사이트맵 목록 (정적 + 동적)
const sitemaps = [
  {
    loc: '/sitemap.xml', // 정적 사이트맵
    priority: 1.0
  },
  {
    loc: '/api/sitemap/themes.xml', // 테마 동적 사이트맵
    priority: 0.9
  },
  {
    loc: '/api/sitemap/game-themes.xml', // 게임테마 API 사이트맵 (NEW)
    priority: 0.9
  },
  {
    loc: '/api/sitemap/posts.xml', // 커뮤니티 게시글 동적 사이트맵
    priority: 0.8
  },
  {
    loc: '/api/sitemap/sns.xml', // SNS 게시물 동적 사이트맵
    priority: 0.7
  },
  {
    loc: '/api/sitemap/notices.xml', // 공지사항 동적 사이트맵
    priority: 0.7
  },
  {
    loc: '/api/sitemap/commands.xml', // 명령어 사이트맵 (NEW)
    priority: 0.6
  },
  {
    loc: '/api/sitemap/profiles.xml', // 프로필 동적 사이트맵
    priority: 0.6
  }
];

// 사이트맵 인덱스 생성
(() => {
  const now = new Date().toISOString();

  const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sitemap => `  <sitemap>
    <loc>${BASE_URL}${sitemap.loc}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>
`;

  const outputPath = path.join(__dirname, '../public/sitemap-index.xml');
  fs.writeFileSync(outputPath, sitemapIndexXml.trim() + '\n', 'utf-8');
  console.log(`✅ sitemap-index.xml 생성 완료 (${sitemaps.length}개 사이트맵)`);
  console.log(`📍 Google Search Console에 제출할 URL: ${BASE_URL}/sitemap-index.xml`);
})();