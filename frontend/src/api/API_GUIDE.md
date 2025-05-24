# API 분석 가이드

## 분석 결과

### 1. 백엔드 게임테마 검색/필터링 구조

#### 백엔드 엔드포인트 (GameThemePublicController.java)
- **방탈출 테마 조회**: `GET /api/v1/public/themes/escape-room`
- **필터 파라미터** (GetGameThemesFilter):
  - `category`: 테마 카테고리 (CRIMESCENE, ESCAPE_ROOM, MURDER_MYSTERY, REALWORLD)
  - `limit`: 페이지당 아이템 수 (기본값: 9)
  - `page`: 페이지 번호 (0부터 시작)
  - `sort`: 정렬 기준 (GameThemeSortType)
  - `keyword`: 검색어
  - `ranges`: 범위 필터 리스트
    - `playerMin/playerMax`: 인원 범위
    - `priceMin/priceMax`: 가격 범위
    - `playtimeMin/playtimeMax`: 플레이시간 범위
    - `difficultyMin/difficultyMax`: 난이도 범위

#### 검색 로직 (GameThemeService.java)
- Specification 패턴을 사용한 동적 쿼리 구성
- 키워드 검색, 카테고리 필터, 범위 필터 적용
- 페이지네이션 및 정렬 지원

### 2. 프론트엔드 문제점

#### 2.1 themesService.ts 문제
- `getEscapeRoomThemes()` 메서드가 정의되어 있지 않음
- 현재는 `getThemes()` 메서드만 있으며, 이는 범용 메서드임

#### 2.2 EscapeRoomListPage.tsx 문제
- 존재하지 않는 `themesService.getEscapeRoomThemes()` 호출
- 필터링 파라미터가 백엔드 API와 매칭되지 않음
- SearchFilters 인터페이스와 백엔드 필터 구조 불일치

#### 2.3 태그 중복 입력 문제
- EscapeRoomFilters.tsx의 `addTag` 함수에서 중복 체크는 하고 있음
- 그러나 백엔드 API는 태그 필터링을 지원하지 않는 것으로 보임
- 태그는 UI에서만 관리되고 실제 필터링에는 사용되지 않을 가능성

### 3. 해결 방안

#### 3.1 themesService.ts 수정
```typescript
// getEscapeRoomThemes 메서드 추가
getEscapeRoomThemes: async (params: {
    type: string;
    page: number;
    size: number;
    sort: string;
    // 기타 필터 파라미터 추가
}): Promise<ThemePage> => {
    // getThemes 메서드를 활용하거나 직접 구현
    return themesService.getThemes(
        "ESCAPE_ROOM",
        params.size,
        params.page,
        params.sort,
        "", // keyword
        {} // filters
    );
}
```

#### 3.2 필터 파라미터 매칭
프론트엔드 필터를 백엔드 API 구조에 맞게 변환:
- `query` → `keyword`
- `difficulty` → `difficultyMin/difficultyMax`
- `priceRange` → `priceMin/priceMax`
- `participantRange` → `playerMin/playerMax`
- `durationRange` → `playtimeMin/playtimeMax`
- `sortBy` → `sort` (값 매핑 필요)

#### 3.3 태그 기능 개선
- 백엔드에서 태그 필터링을 지원하지 않는다면, 프론트엔드에서 제거하거나
- 백엔드에 태그 필터링 기능 추가 요청

### 4. 추가 확인 필요 사항
- GameThemeSortType enum 값 확인
- 방탈출 테마 전용 필터 (horrorMin/Max, deviceMin/Max, activityMin/Max) 백엔드 지원 여부
- 운영 상태(isOperating) 및 지역(location) 필터 백엔드 지원 여부