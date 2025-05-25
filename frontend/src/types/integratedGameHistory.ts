// 통합 게임 기록 관련 타입 정의

// 게임 타입 열거형
export enum GameType {
  CRIMESCENE = "CRIMESCENE",
  ESCAPE_ROOM = "ESCAPE_ROOM",
  MURDER_MYSTERY = "MURDER_MYSTERY",
  REALWORLD = "REALWORLD"
}

// 성공 상태 필터 (방탈출 전용)
export enum SuccessStatusFilter {
  ALL = "ALL",
  SUCCESS_ONLY = "SUCCESS_ONLY",
  FAIL_ONLY = "FAIL_ONLY",
  PARTIAL_ONLY = "PARTIAL_ONLY"
}

// 정렬 옵션 - 백엔드 IntegratedGameHistoryFilterRequest.SortOption과 일치
export enum SortOption {
  PLAY_DATE = "PLAY_DATE",      // 플레이 날짜
  CREATED_AT = "CREATED_AT",     // 기록 생성일
  THEME_NAME = "THEME_NAME",     // 테마명
  GUILD_NAME = "GUILD_NAME",     // 길드명 (크라임씬)
  STORE_NAME = "STORE_NAME",     // 매장명 (방탈출)
  CLEAR_TIME = "CLEAR_TIME",     // 클리어 시간 (방탈출)
  DIFFICULTY = "DIFFICULTY",     // 난이도 평가
  FUN_RATING = "FUN_RATING",     // 재미 평가
  STORY_RATING = "STORY_RATING"  // 스토리 평가
}

// 정렬 방향
export enum SortDirection {
  ASC = "ASC",
  DESC = "DESC"
}

// 통합 게임 기록 필터 요청
export interface IntegratedGameHistoryFilterRequest {
  gameType?: GameType;
  keyword?: string;
  isWin?: boolean;
  startDate?: string;
  endDate?: string;
  hasTheme?: boolean;
  
  // 방탈출 전용 필터
  successStatus?: SuccessStatusFilter;
  minClearTime?: number;
  maxClearTime?: number;
  minDifficulty?: number;
  maxDifficulty?: number;
  minFunRating?: number;
  maxFunRating?: number;
  minStoryRating?: number;
  maxStoryRating?: number;
  
  // 정렬 및 페이징
  sortBy?: SortOption;
  sortDirection?: SortDirection;
  page?: number;
  size?: number;
}

// 게임별 통계
export interface GameTypeStats {
  total: number;
  unique: number;
  winCount: number;
  winRate: number;
}

// 전체 통계
export interface GameStatistics {
  crimeScene: GameTypeStats;
  escapeRoom: GameTypeStats;
  totalPlayCount: number;
  totalUniqueThemes: number;
}

// 페이지 정보
export interface PageInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  hasNext: boolean;
  hasPrevious: boolean;
  sortBy?: string;
  sortDirection?: string;
}

// 방탈출 성공 상태 (기존 enum 재사용)
export enum SuccessStatus {
  SUCCESS = "SUCCESS",
  FAIL = "FAIL",
  PARTIAL = "PARTIAL"
}

// 방탈출 기록 상세 응답
export interface EscapeRoomHistoryDetailResponse {
  // 기본 정보
  id: string;
  escapeRoomThemeId: string;
  escapeRoomThemeTitle: string;
  escapeRoomLocationId: string;
  escapeRoomLocationName: string;
  userId: string;
  userNickname: string;
  userAvatarUrl?: string;
  successStatus: SuccessStatus;
  clearTime?: number;
  formattedClearTime?: string;
  difficultyRating?: number;
  difficultyRatingStars?: number;
  teamSize?: number;
  hintCount?: number;
  funRating?: number;
  funRatingStars?: number;
  storyRating?: number;
  storyRatingStars?: number;
  memo?: string;
  playDate: string;
  isSpoiler?: boolean;
  createdAt: string;
  updatedAt: string;
  isAuthor?: boolean;
  
  // 테마 상세 정보
  themeThumbnail?: string;
  themeSummary?: string;
  themePrice?: number;
  themeDifficulty?: number;
  themeTags?: string[];
  
  // 매장 정보
  storeName?: string;
  storeAddress?: string;
  storeRegion?: string;
  storePhone?: string;
  
  // 추가 통계
  isFirstPlay?: boolean;
  playCountForTheme?: number;
}

// 크라임씬 게임 기록 (기존 타입 재사용)
export interface UserGameHistoryDto {
  id: string;
  userId: string;
  userNickname: string;
  userAvatarUrl?: string;
  crimesceneThemeId?: string;
  crimesceneThemeTitle?: string;
  guildId?: string;
  guildName?: string;
  isWin: boolean;
  playDate: string;
  memo?: string;
  isSpoiler: boolean;
  createdAt: string;
  updatedAt: string;
  isAuthor?: boolean;
}

// 통합 게임 기록 응답
export interface IntegratedGameHistoryResponse {
  crimeSceneHistories: UserGameHistoryDto[];
  escapeRoomHistories: EscapeRoomHistoryDetailResponse[];
  statistics: GameStatistics;
  pageInfo: PageInfo;
}
