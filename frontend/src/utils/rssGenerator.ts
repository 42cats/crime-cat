// RSS 피드 생성 유틸리티
export interface RSSItem {
    title: string;
    description: string;
    link: string;
    guid: string;
    pubDate: string;
    author?: string;
    category?: string;
}

export function generateRSSFeed(items: RSSItem[]): string {
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>미스터리 플레이스 - 최신 소식</title>
    <link>https://mystery-place.com/</link>
    <description>크라임씬, 방탈출, 머더미스터리 게임의 최신 정보와 커뮤니티 소식</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://mystery-place.com//rss.xml" rel="self" type="application/rss+xml"/>
    ${items
        .map(
            (item) => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <description><![CDATA[${item.description}]]></description>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.guid}</guid>
      <pubDate>${new Date(item.pubDate).toUTCString()}</pubDate>
      ${item.author ? `<author>${item.author}</author>` : ""}
      ${item.category ? `<category>${item.category}</category>` : ""}
    </item>`
        )
        .join("")}
  </channel>
</rss>`;

    return rss;
}
