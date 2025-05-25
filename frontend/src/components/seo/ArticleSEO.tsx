import { Helmet } from 'react-helmet-async';
import { defaultSEO } from './SEOProvider';

interface ArticleSEOProps {
  title: string;
  description: string;
  author: {
    name: string;
    url?: string;
  };
  publishedTime: string;
  modifiedTime?: string;
  image?: string;
  url: string;
  tags?: string[];
  section?: string;
}

export function ArticleSEO({
  title,
  description,
  author,
  publishedTime,
  modifiedTime,
  image = defaultSEO.image,
  url,
  tags = [],
  section
}: ArticleSEOProps) {
  const fullTitle = `${title} | 미스터리 플레이스`;
  const pageUrl = `${defaultSEO.siteUrl}${url}`;
  const imageUrl = image.startsWith('http') ? image : `${defaultSEO.siteUrl}${image}`;

  // 구조화된 데이터 (Article)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    image: imageUrl,
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: {
      "@type": "Person",
      name: author.name,
      url: author.url ? `${defaultSEO.siteUrl}${author.url}` : undefined
    },
    publisher: {
      "@type": "Organization",
      name: "미스터리 플레이스",
      logo: {
        "@type": "ImageObject",
        url: `${defaultSEO.siteUrl}/images/logo.png`
      }
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl
    },
    keywords: tags.join(', ')
  };

  return (
    <Helmet>
      {/* 기본 메타 태그 */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="author" content={author.name} />
      
      {/* Open Graph Article */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={pageUrl} />
      <meta property="article:published_time" content={publishedTime} />
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      <meta property="article:author" content={author.name} />
      {section && <meta property="article:section" content={section} />}
      {tags.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      
      {/* 캐노니컬 URL */}
      <link rel="canonical" href={pageUrl} />
      
      {/* 구조화된 데이터 */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}