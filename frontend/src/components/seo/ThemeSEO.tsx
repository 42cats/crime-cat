import { Helmet } from 'react-helmet-async';
import { defaultSEO } from './SEOProvider';

interface ThemeSEOProps {
  name: string;
  description: string;
  image?: string;
  url: string;
  category: string;
  location?: {
    name: string;
    address: string;
  };
  rating?: {
    value: number;
    count: number;
  };
  price?: {
    min: number;
    max: number;
    currency?: string;
  };
}

export function ThemeSEO({
  name,
  description,
  image = defaultSEO.image,
  url,
  category,
  location,
  rating,
  price
}: ThemeSEOProps) {
  const fullTitle = `${name} - ${category} | 미스터리 플레이스`;
  const pageUrl = `${defaultSEO.siteUrl}${url}`;
  const imageUrl = image.startsWith('http') ? image : `${defaultSEO.siteUrl}${image}`;

  // 구조화된 데이터 (Product/LocalBusiness)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": category === "방탈출" ? "LocalBusiness" : "Product",
    name: name,
    description: description,
    image: imageUrl,
    url: pageUrl,
    category: category,
    ...(location && {
      address: {
        "@type": "PostalAddress",
        name: location.name,
        streetAddress: location.address
      }
    }),
    ...(rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: rating.value,
        reviewCount: rating.count,
        bestRating: 5,
        worstRating: 1
      }
    }),
    ...(price && {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: price.currency || "KRW",
        lowPrice: price.min,
        highPrice: price.max
      }
    })
  };

  return (
    <Helmet>
      {/* 기본 메타 태그 */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={`${name} - ${category}`} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={pageUrl} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${name} - ${category}`} />
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