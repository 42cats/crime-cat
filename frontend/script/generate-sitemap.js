// scripts/generate-sitemap.js

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BASE_URL = process.env.DOMAIN || 'https://mystery-place.com';

// 정적 경로만 관리 (SPA 특성상 크롤러가 접근 가능한 주요 페이지)
const staticPaths = [
	'/', // 메인
	'/themes/crimescene',
	'/themes/escape_room',
	'/themes/머더미스터리',
	// '/themes/realworld', // 아직 미개발
	'/community/question',
	'/community/chat',
	'/community/creator',
	'/sns/explore',
	'/sns/feed',
	'/notices',
	'/commands',
	'/terms',
	'/privacy',
	'/contact',
	'/donate',
	'/login',
	'/dashboard', // 공개 접근 가능한 대시보드 메인
	'/profile', // 프로필 메인 페이지
];

const getPageMeta = (url) => {
	if (url === '/') return { changefreq: 'daily', priority: 1.0 };
	if (url.startsWith('/community/post/')) return { changefreq: 'hourly', priority: 0.7 };
	if (url.startsWith('/community') || url.startsWith('/sns')) return { changefreq: 'hourly', priority: 0.8 };
	if (url.startsWith('/themes')) return { changefreq: 'daily', priority: 0.9 };
	if (url === '/commands') return { changefreq: 'weekly', priority: 0.6 };
	if (url === '/notices') return { changefreq: 'weekly', priority: 0.7 };
	if (url === '/terms' || url === '/privacy' || url === '/donate') return { changefreq: 'monthly', priority: 0.5 };
	return { changefreq: 'monthly', priority: 0.6 };
};

// 동적 콘텐츠는 별도 시스템에서 관리하므로 제거
// async function fetchDynamicCommunityUrls() {
// 	try {
// 		const response = await axios.get(COMMUNITY_API);
// 		const posts = response.data;
// 		return posts.map(post => `/community/post/${post.slug || post.id}`);
// 	} catch (err) {
// 		console.error('❌ 커뮤니티 API 로드 실패:', err.message);
// 		return [];
// 	}
// }

// 정적 사이트맵 생성 (빌드 시 실행)
(() => {
	const now = new Date().toISOString().split('T')[0];

	const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPaths.map((urlPath) => {
		const { changefreq, priority } = getPageMeta(urlPath);
		return `  <url>
    <loc>${BASE_URL}${urlPath}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
	}).join('\n')}
</urlset>
`;

	const outputPath = path.join(__dirname, '../public/sitemap.xml');
	fs.writeFileSync(outputPath, sitemapXml.trim() + '\n', 'utf-8');
	console.log(`✅ 정적 sitemap.xml 생성 완료 (${staticPaths.length}개 경로)`);
	console.log(`📍 동적 콘텐츠는 /api/sitemap/* 엔드포인트에서 관리됩니다.`);
})();
