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

// Backend의 WebHistoryAddResponseDto와 매칭
export interface GameRecordResponse {
  message: string; // "이미 처리되었습니다." | "처리중입니다." | "요청이 발송되었습니다."
}
