// 크롤러 감지 유틸리티
export const isCrawler = (userAgent: string): boolean => {
  const crawlerPatterns = [
    // 검색 엔진 봇
    /googlebot/i,
    /bingbot/i,
    /slurp/i, // Yahoo
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /whatsapp/i,
    /slackbot/i,
    /telegrambot/i,
    /discordbot/i,
    /pinterestbot/i,
    /redditbot/i,
    
    // SEO 도구
    /ahrefsbot/i,
    /semrushbot/i,
    /dotbot/i,
    /mj12bot/i,
    
    // 기타 봇
    /bot|crawler|spider|scraper/i
  ];

  return crawlerPatterns.some(pattern => pattern.test(userAgent));
};

// 프리렌더링이 필요한 경로인지 확인
export const needsPrerendering = (pathname: string): boolean => {
  const dynamicRoutes = [
    /^\/themes\/[^/]+\/[^/]+$/, // /themes/category/id
    /^\/community\/[^/]+\/[^/]+$/, // /community/boardType/id
    /^\/profile\/[^/]+$/, // /profile/userId
    /^\/sns\/post\/[^/]+$/, // /sns/post/postId
  ];

  return dynamicRoutes.some(pattern => pattern.test(pathname));
};

// 메타 태그 프리페치
export const prefetchMetaTags = async (pathname: string): Promise<void> => {
  if (!needsPrerendering(pathname)) return;

  try {
    // 경로에 따라 적절한 API 호출
    if (pathname.startsWith('/themes/')) {
      const id = pathname.split('/').pop();
      // API 호출하여 메타데이터 가져오기
    } else if (pathname.startsWith('/profile/')) {
      const userId = pathname.split('/').pop();
      // API 호출하여 프로필 데이터 가져오기
    }
    // ... 다른 경로들도 추가
  } catch (error) {
    console.error('메타 태그 프리페치 실패:', error);
  }
};