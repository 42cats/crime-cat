import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOConfig {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  canonicalUrl?: string;
}

export const useSEO = (config: SEOConfig) => {
  const location = useLocation();
  const baseUrl = 'https://mystery-place.com';
  
  useEffect(() => {
    // 기본 메타 태그 설정
    const defaultTitle = '미스터리 플레이스 - 추리 게임 커뮤니티';
    const defaultDescription = '크라임씬, 방탈출, 머더미스터리 등 다양한 추리 게임을 즐기고 공유하는 커뮤니티';
    const defaultImage = `${baseUrl}/content/image/logo_bg.png`;

    // title
    document.title = config.title 
      ? `${config.title} | ${defaultTitle}`
      : defaultTitle;

    // description
    updateMetaTag('name', 'description', config.description || defaultDescription);
    
    // keywords
    if (config.keywords && config.keywords.length > 0) {
      updateMetaTag('name', 'keywords', config.keywords.join(', '));
    }

    // canonical URL
    const canonicalUrl = config.canonicalUrl || `${baseUrl}${location.pathname}`;
    updateLinkTag('canonical', canonicalUrl);

    // Open Graph 태그
    updateMetaTag('property', 'og:title', config.title || defaultTitle);
    updateMetaTag('property', 'og:description', config.description || defaultDescription);
    updateMetaTag('property', 'og:image', config.image || defaultImage);
    updateMetaTag('property', 'og:url', canonicalUrl);
    updateMetaTag('property', 'og:type', config.type || 'website');
    updateMetaTag('property', 'og:site_name', '미스터리 플레이스');
    updateMetaTag('property', 'og:locale', 'ko_KR');

    // Twitter Card 태그
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', config.title || defaultTitle);
    updateMetaTag('name', 'twitter:description', config.description || defaultDescription);
    updateMetaTag('name', 'twitter:image', config.image || defaultImage);

    // Article 관련 태그 (게시글인 경우)
    if (config.type === 'article') {
      if (config.author) {
        updateMetaTag('property', 'article:author', config.author);
      }
      if (config.publishedTime) {
        updateMetaTag('property', 'article:published_time', config.publishedTime);
      }
      if (config.modifiedTime) {
        updateMetaTag('property', 'article:modified_time', config.modifiedTime);
      }
    }

    // 구조화된 데이터 (JSON-LD)
    updateJsonLd(generateJsonLd(config, canonicalUrl));

  }, [location.pathname, config]);
};

// 메타 태그 업데이트 헬퍼 함수
function updateMetaTag(attrName: string, attrValue: string, content: string) {
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
}

// 링크 태그 업데이트 헬퍼 함수
function updateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`);
  
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  
  element.setAttribute('href', href);
}

// JSON-LD 업데이트 헬퍼 함수
function updateJsonLd(jsonLd: object) {
  let scriptElement = document.querySelector('script[type="application/ld+json"]');
  
  if (!scriptElement) {
    scriptElement = document.createElement('script');
    scriptElement.setAttribute('type', 'application/ld+json');
    document.head.appendChild(scriptElement);
  }
  
  scriptElement.textContent = JSON.stringify(jsonLd);
}

// JSON-LD 생성 함수
function generateJsonLd(config: SEOConfig, url: string): object {
  const baseStructure = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '미스터리 플레이스',
    url: 'https://mystery-place.com',
  };

  if (config.type === 'article') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: config.title,
      description: config.description,
      image: config.image,
      author: {
        '@type': 'Person',
        name: config.author || '미스터리 플레이스',
      },
      datePublished: config.publishedTime,
      dateModified: config.modifiedTime || config.publishedTime,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
    };
  }

  if (config.type === 'profile') {
    return {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: config.title,
      description: config.description,
      image: config.image,
      url: url,
    };
  }

  return baseStructure;
}

export default useSEO;