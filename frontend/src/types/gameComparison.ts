// 게임 비교 관련 타입 정의

export { GameType } from './integratedGameHistory';

// 비교 정렬 옵션
export enum ComparisonSortOption {
  LATEST = "LATEST",
  OLDEST = "OLDEST",
  RECOMMENDATION = "RECOMMENDATION",
  VIEW_COUNT = "VIEW_COUNT",
  PLAY_COUNT = "PLAY_COUNT",
  PRICE_ASC = "PRICE_ASC",
  PRICE_DESC = "PRICE_DESC",
  DIFFICULTY_ASC = "DIFFICULTY_ASC",
  DIFFICULTY_DESC = "DIFFICULTY_DESC"
}

// 게임 비교 요청
export interface GameComparisonRequest {
  userIds: string[];
  gameType: GameType;
  operatingOnly?: boolean;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  minPlayers?: number;
  maxPlayers?: number;
  minDifficulty?: number;
  maxDifficulty?: number;
  sortBy?: ComparisonSortOption;
  page?: number;
  size?: number;
}

// 위치 정보
export interface LocationInfo {
  storeName: string;
  address: string;
  region: string;
}

// 미플레이 테마 정보
export interface UnplayedTheme {
  id: string;
  title: string;
  thumbnail?: string;
  summary?: string;
  gameType: GameType;
  
  // 공통 정보
  playersMin: number;
  playersMax: number;
  playTimeMin: number;
  playTimeMax: number;
  price: number;
  difficulty: number;
  tags?: string[];
  recommendations: number;
  views: number;
  totalPlayCount: number;
  
  // 크라임씬 전용
  guildName?: string;
  teamName?: string;
  
  // 방탈출 전용
  locations?: LocationInfo[];
  isOperating?: boolean;
  horrorLevel?: number;
  deviceRatio?: number;
  activityLevel?: number;
}

// 사용자별 플레이 통계
export interface UserPlayStats {
  userId: string;
  nickname: string;
  totalPlayCount: number;
  uniqueThemeCount: number;
  completionRate: number;
}

// 페이지 정보
export interface ComparisonPageInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// 게임 비교 응답
export interface GameComparisonResponse {
  unplayedThemes: UnplayedTheme[];
  userStatistics: Record<string, UserPlayStats>;
  totalThemeCount: number;
  commonUnplayedCount: number;
  pageInfo: ComparisonPageInfo;
}
