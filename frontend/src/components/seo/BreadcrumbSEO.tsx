import { Helmet } from 'react-helmet-async';
import { defaultSEO } from './SEOProvider';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSEOProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbSEO({ items }: BreadcrumbSEOProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${defaultSEO.siteUrl}${item.url}`
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}