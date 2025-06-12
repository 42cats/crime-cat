import axios from 'axios';
import { apiConfig } from '@/config/apiConfig';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

class SitemapService {
  private baseUrl = 'https://mystery-place.com';
  private apiBase = apiConfig.baseURL;

  // 동적 테마 URL 가져오기
  async getThemeUrls(): Promise<SitemapUrl[]> {
    try {
      const categories = ['crimescene', 'escape_room', '머더미스터리'];
      const urls: SitemapUrl[] = [];

      for (const category of categories) {
        const response = await axios.get(`${this.apiBase}/public/themes`, {
          params: { category, page: 1, size: 1000 }
        });

        const themes = response.data.content || [];
        themes.forEach((theme: any) => {
          urls.push({
            loc: `${this.baseUrl}/themes/${category}/${theme.id}`,
            lastmod: theme.updatedAt || new Date().toISOString(),
            changefreq: 'weekly',
            priority: 0.8
          });
        });
      }

      return urls;
    } catch (error) {
      console.error('테마 URL 가져오기 실패:', error);
      return [];
    }
  }

  // 동적 게시글 URL 가져오기
  async getPostUrls(): Promise<SitemapUrl[]> {
    try {
      const boardTypes = ['question', 'chat', 'creator'];
      const urls: SitemapUrl[] = [];

      for (const boardType of boardTypes) {
        const response = await axios.get(`${this.apiBase}/public/posts`, {
          params: { boardType, page: 1, size: 100 }
        });

        const posts = response.data.content || [];
        posts.forEach((post: any) => {
          urls.push({
            loc: `${this.baseUrl}/community/${boardType}/${post.id}`,
            lastmod: post.updatedAt || new Date().toISOString(),
            changefreq: 'daily',
            priority: 0.7
          });
        });
      }

      return urls;
    } catch (error) {
      console.error('게시글 URL 가져오기 실패:', error);
      return [];
    }
  }

  // 프로필 URL 가져오기 (활성 사용자만)
  async getProfileUrls(): Promise<SitemapUrl[]> {
    try {
      const response = await axios.get(`${this.apiBase}/public/web_users/active`, {
        params: { page: 1, size: 500 }
      });

      const users = response.data.content || [];
      return users.map((user: any) => ({
        loc: `${this.baseUrl}/profile/${user.id}`,
        lastmod: user.updatedAt || new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.6
      }));
    } catch (error) {
      console.error('프로필 URL 가져오기 실패:', error);
      return [];
    }
  }

  // SNS 게시물 URL 가져오기
  async getSnsPostUrls(): Promise<SitemapUrl[]> {
    try {
      const response = await axios.get(`${this.apiBase}/public/user-posts`, {
        params: { page: 1, size: 200, isPublic: true }
      });

      const posts = response.data.content || [];
      return posts.map((post: any) => ({
        loc: `${this.baseUrl}/sns/post/${post.id}`,
        lastmod: post.updatedAt || new Date().toISOString(),
        changefreq: 'hourly',
        priority: 0.6
      }));
    } catch (error) {
      console.error('SNS 게시물 URL 가져오기 실패:', error);
      return [];
    }
  }

  // 사이트맵 XML 생성
  generateXml(urls: SitemapUrl[]): string {
    const urlElements = urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
  }

  // 사이트맵 인덱스 생성
  generateIndexXml(sitemaps: string[]): string {
    const sitemapElements = sitemaps.map(sitemap => `  <sitemap>
    <loc>${this.baseUrl}${sitemap}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapElements}
</sitemapindex>`;
  }
}

export const sitemapService = new SitemapService();