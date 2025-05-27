// 사이트맵 생성을 위한 유틸리티
export interface SitemapEntry {
    url: string;
    lastmod?: string;
    changefreq?:
        | "always"
        | "hourly"
        | "daily"
        | "weekly"
        | "monthly"
        | "yearly"
        | "never";
    priority?: number;
}

export function generateSitemapXML(entries: SitemapEntry[]): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
    .map(
        (entry) => `  <url>
    <loc>${entry.url}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ""}
    ${entry.priority ? `<priority>${entry.priority}</priority>` : ""}
  </url>`
    )
    .join("\n")}
</urlset>`;

    return xml;
}

// 정적 페이지 URL 목록
export const staticPages: SitemapEntry[] = [
    {
        url: "https://mystery-place.com//",
        changefreq: "daily",
        priority: 1.0,
    },
    {
        url: "https://mystery-place.com//themes/크라임씬",
        changefreq: "daily",
        priority: 0.9,
    },
    {
        url: "https://mystery-place.com//themes/방탈출",
        changefreq: "daily",
        priority: 0.9,
    },
    {
        url: "https://mystery-place.com//themes/머더미스터리",
        changefreq: "daily",
        priority: 0.9,
    },
    {
        url: "https://mystery-place.com//community/question",
        changefreq: "hourly",
        priority: 0.8,
    },
    {
        url: "https://mystery-place.com//community/chat",
        changefreq: "hourly",
        priority: 0.8,
    },
    {
        url: "https://mystery-place.com//community/creator",
        changefreq: "daily",
        priority: 0.8,
    },
    {
        url: "https://mystery-place.com//notices",
        changefreq: "weekly",
        priority: 0.7,
    },
    {
        url: "https://mystery-place.com//sns/explore",
        changefreq: "hourly",
        priority: 0.8,
    },
    {
        url: "https://mystery-place.com//terms",
        changefreq: "monthly",
        priority: 0.5,
    },
    {
        url: "https://mystery-place.com//privacy",
        changefreq: "monthly",
        priority: 0.5,
    },
    {
        url: "https://mystery-place.com//contact",
        changefreq: "monthly",
        priority: 0.6,
    },
];

// 동적 페이지를 추가하는 함수 (API 호출 후 사용)
export function generateDynamicEntries(
    themes: Array<{ id: string; category: string; updatedAt: string }>,
    posts: Array<{ id: string; type: string; updatedAt: string }>,
    profiles: Array<{ userId: string; updatedAt: string }>
): SitemapEntry[] {
    const entries: SitemapEntry[] = [];

    // 테마 페이지
    themes.forEach((theme) => {
        entries.push({
            url: `https://mystery-place.com//themes/${theme.category}/${theme.id}`,
            lastmod: theme.updatedAt,
            changefreq: "weekly",
            priority: 0.7,
        });
    });

    // 게시글 페이지
    posts.forEach((post) => {
        entries.push({
            url: `https://mystery-place.com//community/${post.type}/${post.id}`,
            lastmod: post.updatedAt,
            changefreq: "monthly",
            priority: 0.6,
        });
    });

    // 프로필 페이지
    profiles.forEach((profile) => {
        entries.push({
            url: `https://mystery-place.com//profile/${profile.userId}`,
            lastmod: profile.updatedAt,
            changefreq: "weekly",
            priority: 0.5,
        });
    });

    return entries;
}
