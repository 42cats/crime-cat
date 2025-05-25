import { HelmetProvider } from 'react-helmet-async';
import { ReactNode } from 'react';

interface SEOProviderProps {
  children: ReactNode;
}

// SEO 관련 기본 설정
export const defaultSEO = {
  title: '미스터리 플레이스',
  titleTemplate: '%s | 미스터리 플레이스 - 범죄 현장 수사 전문 커뮤니티',
  description: '미스터리 플레이스는 크라임씬 이라는 게임플레이를 위한 정보와 머더미스터리, 방탈출에 대한 정보 제공을 전문으로 합니다.',
  keywords: '크라임씬, 범죄 현장, 법의학, 포렌식, 범죄 심리, 수사 기법, 사건 분석, 크라임캣, CrimeCat, 머더미스터리, 방탈출, 보드게임',
  siteUrl: 'https://crimecat.org',
  image: '/images/crimecat-og-image.png',
  author: 'Mystery Place Team',
  twitterHandle: '@crimecat'
};

export function SEOProvider({ children }: SEOProviderProps) {
  return (
    <HelmetProvider>
      {children}
    </HelmetProvider>
  );
}