export interface FilterValues {
  priceMin: string;
  priceMax: string;
  playerMin: string;
  playerMax: string;
  playtimeMin: string;
  playtimeMax: string;
  difficultyMin: string;
  difficultyMax: string;
}

export interface EscapeRoomFilterValues {
  priceMin: string;
  priceMax: string;
  playerMin: string;
  playerMax: string;
  playtimeMin: string;
  playtimeMax: string;
  difficultyMin: string;
  difficultyMax: string;
  horrorMin: string;
  horrorMax: string;
  deviceMin: string;
  deviceMax: string;
  activityMin: string;
  activityMax: string;
  isOperating: string;
  selectedGenres: string[];
  selectedLocations: string[];
}

// 공통 필터 인터페이스
export type ThemeFilterValues = FilterValues | EscapeRoomFilterValues;
