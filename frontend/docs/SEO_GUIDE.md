# SEO 구현 가이드

## 설치 완료
- `react-helmet-async` 설치 완료
- SEO 컴포넌트 구조 생성 완료
- robots.txt, sitemap.xml 생성 완료

## 사용 방법

### 1. 일반 페이지 SEO 적용

```tsx
import { PageSEO } from '@/components/seo';

function MyPage() {
  return (
    <>
      <PageSEO
        title="페이지 제목"
        description="페이지 설명 (150자 이내 권장)"
        url="/my-page"
        image="/images/page-image.jpg" // 선택사항
      />
      {/* 페이지 컨텐츠 */}
    </>
  );
}
```

### 2. 게시글 페이지 SEO 적용

```tsx
import { ArticleSEO } from '@/components/seo';

function PostDetail({ post }) {
  return (
    <>
      <ArticleSEO
        title={post.title}
        description={post.summary}
        author={{
          name: post.author.name,
          url: `/profile/${post.author.id}`
        }}
        publishedTime={post.createdAt}
        modifiedTime={post.updatedAt}
        url={`/community/${post.type}/${post.id}`}
        tags={post.tags}
        section={post.category}
        image={post.thumbnail}
      />
      {/* 게시글 컨텐츠 */}
    </>
  );
}
```

### 3. 테마 페이지 SEO 적용

```tsx
import { ThemeSEO } from '@/components/seo';

function ThemeDetail({ theme }) {
  return (
    <>
      <ThemeSEO
        name={theme.name}
        description={theme.description}
        image={theme.image}
        url={`/themes/${theme.category}/${theme.id}`}
        category={theme.category}
        location={{
          name: theme.locationName,
          address: theme.address
        }}
        rating={{
          value: theme.rating,
          count: theme.reviewCount
        }}
        price={{
          min: theme.minPrice,
          max: theme.maxPrice
        }}
      />
      {/* 테마 상세 컨텐츠 */}
    </>
  );
}
```

### 4. Breadcrumb 적용

```tsx
import { BreadcrumbSEO } from '@/components/seo';

function CategoryPage() {
  const breadcrumbs = [
    { name: '홈', url: '/' },
    { name: '테마', url: '/themes' },
    { name: '방탈출', url: '/themes/방탈출' }
  ];

  return (
    <>
      <BreadcrumbSEO items={breadcrumbs} />
      {/* 페이지 컨텐츠 */}
    </>
  );
}
```

## 주요 페이지별 SEO 적용 예시

### 테마 목록 페이지 (ThemeList.tsx)
```tsx
<PageSEO
  title={`${category} 테마 목록`}
  description={`최신 ${category} 테마 정보와 리뷰를 확인하세요. 지역별, 난이도별 검색과 예약 정보를 제공합니다.`}
  url={`/themes/${category}`}
/>
```

### 커뮤니티 게시판 (QuestionBoard.tsx)
```tsx
<PageSEO
  title="질문 게시판"
  description="크라임씬, 방탈출, 머더미스터리에 대한 질문과 답변을 나누는 공간입니다."
  url="/community/question"
/>
```

### 프로필 페이지 (ProfilePage.tsx)
```tsx
<PageSEO
  title={`${user.nickname}님의 프로필`}
  description={`${user.nickname}님의 활동 내역과 게임 기록을 확인하세요.`}
  url={`/profile/${user.id}`}
  type="profile"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "Person",
    "name": user.nickname,
    "url": `https://crimecat.org/profile/${user.id}`,
    "image": user.profileImage
  }}
/>
```

## 체크리스트

- [x] SEOProvider를 App.tsx에 추가
- [x] robots.txt 생성
- [x] sitemap.xml 생성
- [x] SEO 컴포넌트 구조 생성
- [ ] 각 페이지에 적절한 SEO 컴포넌트 적용
- [ ] 동적 사이트맵 생성 API 연동
- [ ] 이미지 최적화 (lazy loading, webp 지원)
- [ ] 성능 최적화 (Core Web Vitals)

## 추가 권장사항

1. **이미지 최적화**
   - 모든 이미지에 alt 텍스트 추가
   - 적절한 이미지 크기 사용
   - lazy loading 적용

2. **링크 최적화**
   - 내부 링크는 상대 경로 사용
   - 외부 링크는 rel="noopener noreferrer" 추가

3. **성능 최적화**
   - 번들 크기 최소화
   - 코드 스플리팅 적용
   - 캐싱 전략 수립

4. **모니터링**
   - Google Search Console 등록
   - Google Analytics 설정
   - 성능 모니터링 도구 연동