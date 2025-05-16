// 게임 히스토리 관련 타입 정의

// Backend의 CheckPlayResponseDto 타입과 매칭
export interface CheckPlayResponseDto {
  hasPlayed: boolean;
}

// 기록 요청 관련 타입
export interface GameRecordRequest {
  gameThemeId: string;
  message: string;
}

export interface GameRecordResponse {
  success: boolean;
  message: string;
}

// 기존 요청 상태 타입
export interface ExistingRequest {
  gameThemeId: string;
  status: "pending" | "completed" | "cancelled";
}
