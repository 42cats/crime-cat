# 프론트엔드 개발 가이드

## 🎯 빠른 시작
```bash
npm run dev      # 개발 서버 시작 (포트: 5173)
npm run build    # 프로덕션 빌드
npm run typecheck # TypeScript 타입 체크
```

**권장 개발 환경**: VS Code + Vite + React DevTools

## 🏗️ 아키텍처
- [React 구조](architecture/react-structure.md) - 컴포넌트, 훅, 상태관리
- [TypeScript 설정](architecture/typescript-config.md) - 타입 안전성, 인터페이스
- [스타일링 시스템](architecture/styling-system.md) - Tailwind CSS, shadcn/ui
- [라우팅 구조](architecture/routing-structure.md) - React Router, 페이지 구성

## ⚙️ 핵심 기능
- [일정 관리 UI](features/schedule-ui.md) ⭐ **최신 완성 (v2.0)**
- [사용자 인터페이스](features/user-interface.md) - 로그인, 프로필, 대시보드
- [게시판 시스템](features/board-system.md) - CRUD, 댓글, 해시태그
- [반응형 디자인](features/responsive-design.md) - 모바일 퍼스트, 적응형 레이아웃

## 🔧 컴포넌트 개발
- [shadcn/ui 가이드](components/shadcn-ui-guide.md) - UI 컴포넌트 라이브러리
- [공통 컴포넌트](components/common-components.md) - 재사용 가능한 컴포넌트
- [폼 컴포넌트](components/form-components.md) - React Hook Form 통합
- [레이아웃 컴포넌트](components/layout-components.md) - 페이지 레이아웃 구조

## 🚀 API 연동
- [API 클라이언트](api-integration/api-client.md) ⚠️ **필수 패턴**
- [React Query](api-integration/react-query.md) - 서버 상태 관리
- [에러 처리](api-integration/error-handling.md) - API 에러 처리 전략
- [캐싱 전략](api-integration/caching-strategy.md) - 클라이언트 사이드 캐싱

## 🎨 디자인 시스템
- [Tailwind 설정](design-system/tailwind-config.md) - CSS 프레임워크 설정
- [색상 시스템](design-system/color-system.md) - Crime-Cat 브랜드 색상
- [타이포그래피](design-system/typography.md) - 폰트, 텍스트 스타일
- [아이콘 시스템](design-system/icon-system.md) - Lucide React 아이콘

## 🔧 개발 도구
- [Vite 설정](development/vite-config.md) - 번들러 설정 및 최적화
- [ESLint/Prettier](development/code-quality.md) - 코드 품질 도구
- [개발 워크플로우](development/workflow.md) - Git, PR, 배포 프로세스
- [디버깅](development/debugging.md) - React DevTools, 브라우저 도구

## 🆘 문제 해결
- [공통 에러](troubleshooting/common-errors.md) - TypeScript, React 에러
- [성능 최적화](troubleshooting/performance.md) - 번들 크기, 렌더링 최적화
- [빌드 이슈](troubleshooting/build-issues.md) - Vite, TypeScript 빌드 문제

## 📊 기술 스택

### Core
- **React 18** + **TypeScript 5**
- **Vite** (빌드 도구)
- **React Router** (라우팅)

### UI & Styling
- **Tailwind CSS** (스타일링)
- **shadcn/ui** (컴포넌트 라이브러리)
- **Lucide React** (아이콘)

### 상태 관리
- **@tanstack/react-query** (서버 상태)
- **React Hook Form** (폼 상태)
- **zustand** (클라이언트 상태 - 필요시)

### 개발 도구
- **TypeScript** (타입 안전성)
- **ESLint + Prettier** (코드 품질)
- **React DevTools** (디버깅)

## 🎯 개발 규칙

### 필수 규칙
1. **API Client 사용**: 모든 API 호출은 `apiClient` 사용 필수
2. **TypeScript 엄격 모드**: 모든 타입 정의 필수
3. **컴포넌트 패턴**: 함수형 컴포넌트 + 커스텀 훅
4. **반응형 디자인**: 모바일 퍼스트 접근법
5. **접근성**: WCAG 2.1 AA 준수

### 코드 스타일
```typescript
// ✅ 올바른 컴포넌트 패턴
interface Props {
  data: CalendarEvent[];
  onSelect: (event: CalendarEvent) => void;
}

export default function CalendarComponent({ data, onSelect }: Props) {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => calendarService.getEvents()
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorComponent error={error} />;

  return (
    <div className="grid gap-4 p-4">
      {events?.map(event => (
        <EventCard 
          key={event.id} 
          event={event} 
          onClick={() => onSelect(event)}
        />
      ))}
    </div>
  );
}
```

## 🔄 최신 업데이트 내용

### v2.0 완성 기능 (2025-08-28)
1. **PersonalCalendar 컴포넌트**: 다중 캘린더 시각화 완성
2. **ICSTooltip 최적화**: 20ms 응답속도, 87% 성능 개선
3. **캘린더 관리 UI**: iCal 동기화, 색상 설정 완성
4. **반응형 디자인**: 모든 기기 완벽 지원
5. **API 통합**: React Query + apiClient 패턴 확립

### 진행 예정 (Phase 8-10)
- 이중 추천 시스템 UI 구현
- 이벤트 상세 모달 개발
- 성능 최적화 및 번들 크기 최적화

## 🔗 연관 서비스
- [백엔드 API 연동](../backend/api/rest-controllers.md)
- [Discord 봇 UI 연동](../discord-bot/ui-integration/frontend-bridge.md)
- [공통 API 계약](../shared/api-contracts.md)
- [배포 가이드](../shared/deployment.md)