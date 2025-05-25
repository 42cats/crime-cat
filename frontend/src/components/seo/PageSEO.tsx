import { Helmet } from 'react-helmet-async';
import { defaultSEO } from './SEOProvider';

interface PageSEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  canonicalUrl?: string;
  structuredData?: object;
}

export function PageSEO({
  title,
  description = defaultSEO.description,
  keywords = defaultSEO.keywords,
  image = defaultSEO.image,
  url,
  type = 'website',
  noindex = false,
  canonicalUrl,
  structuredData
}: PageSEOProps) {
  const pageTitle = title || defaultSEO.title;
  const fullTitle = title ? `${title} | 미스터리 플레이스` : defaultSEO.title;
  const pageUrl = url ? `${defaultSEO.siteUrl}${url}` : defaultSEO.siteUrl;
  const imageUrl = image.startsWith('http') ? image : `${defaultSEO.siteUrl}${image}`;

  return (
    <Helmet>
      {/* 기본 메타 태그 */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={defaultSEO.author} />
      
      {/* 캐노니컬 URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* 검색 엔진 인덱싱 */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph 태그 */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content="미스터리 플레이스" />
      <meta property="og:locale" content="ko_KR" />
      
      {/* Twitter Card 태그 */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:site" content={defaultSEO.twitterHandle} />
      <meta name="twitter:creator" content={defaultSEO.twitterHandle} />
      
      {/* 구조화된 데이터 */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}