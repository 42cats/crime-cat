// 사이트맵 생성을 위한 유틸리티
export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function generateSitemapXML(entries: SitemapEntry[]): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
    ${entry.priority ? `<priority>${entry.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;
  
  return xml;
}

// 정적 페이지 URL 목록
export const staticPages: SitemapEntry[] = [
  {
    url: 'https://crimecat.org/',
    changefreq: 'daily',
    priority: 1.0
  },
  {
    url: 'https://crimecat.org/themes/크라임씬',
    changefreq: 'daily',
    priority: 0.9
  },
  {
    url: 'https://crimecat.org/themes/방탈출',
    changefreq: 'daily',
    priority: 0.9
  },
  {
    url: 'https://crimecat.org/themes/머더미스터리',
    changefreq: 'daily',
    priority: 0.9
  },
  {
    url: 'https://crimecat.org/community/question',
    changefreq: 'hourly',
    priority: 0.8
  },
  {
    url: 'https://crimecat.org/community/chat',
    changefreq: 'hourly',
    priority: 0.8
  },
  {
    url: 'https://crimecat.org/community/creator',
    changefreq: 'daily',
    priority: 0.8
  },
  {
    url: 'https://crimecat.org/notices',
    changefreq: 'weekly',
    priority: 0.7
  },
  {
    url: 'https://crimecat.org/sns/explore',
    changefreq: 'hourly',
    priority: 0.8
  },
  {
    url: 'https://crimecat.org/terms',
    changefreq: 'monthly',
    priority: 0.5
  },
  {
    url: 'https://crimecat.org/privacy',
    changefreq: 'monthly',
    priority: 0.5
  },
  {
    url: 'https://crimecat.org/contact',
    changefreq: 'monthly',
    priority: 0.6
  }
];

// 동적 페이지를 추가하는 함수 (API 호출 후 사용)
export function generateDynamicEntries(
  themes: Array<{ id: string; category: string; updatedAt: string }>,
  posts: Array<{ id: string; type: string; updatedAt: string }>,
  profiles: Array<{ userId: string; updatedAt: string }>
): SitemapEntry[] {
  const entries: SitemapEntry[] = [];

  // 테마 페이지
  themes.forEach(theme => {
    entries.push({
      url: `https://crimecat.org/themes/${theme.category}/${theme.id}`,
      lastmod: theme.updatedAt,
      changefreq: 'weekly',
      priority: 0.7
    });
  });

  // 게시글 페이지
  posts.forEach(post => {
    entries.push({
      url: `https://crimecat.org/community/${post.type}/${post.id}`,
      lastmod: post.updatedAt,
      changefreq: 'monthly',
      priority: 0.6
    });
  });

  // 프로필 페이지
  profiles.forEach(profile => {
    entries.push({
      url: `https://crimecat.org/profile/${profile.userId}`,
      lastmod: profile.updatedAt,
      changefreq: 'weekly',
      priority: 0.5
    });
  });

  return entries;
}