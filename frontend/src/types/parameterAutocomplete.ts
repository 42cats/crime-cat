/**
 * 커맨드 파라미터 자동완성 시스템 타입 정의
 */

// 기본 자동완성 선택지
export interface AutocompleteChoice {
  name: string;          // 표시명
  value: string;         // 실제 값
  description?: string;  // 추가 설명
  icon?: string;         // 아이콘
  disabled?: boolean;    // 비활성화 상태
}

// 동적 자동완성 설정
export interface AutocompleteConfig {
  type: 'static' | 'dynamic' | 'guild_roles' | 'guild_channels' | 'guild_members' | 'automation_groups' | 'custom';
  endpoint?: string;           // 커스텀 API 엔드포인트
  dependencies?: string[];     // 다른 파라미터에 의존
  cacheKey?: string;          // 캐시 키
  cacheDuration?: number;     // 캐시 지속 시간 (초)
  searchable?: boolean;       // 검색 가능 여부
  multiple?: boolean;         // 다중 선택 허용
  minLength?: number;         // 최소 검색 길이
}

// 향상된 봇 커맨드 파라미터
export interface EnhancedBotCommandParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'user' | 'channel' | 'role' | 'choice';
  description: string;
  required: boolean;
  
  // 정적 선택지 (커맨드 정의 시점에 결정)
  choices?: AutocompleteChoice[];
  
  // 동적 자동완성 설정
  autocomplete?: AutocompleteConfig;
  
  // UI 렌더링 힌트
  ui?: {
    placeholder?: string;
    maxLength?: number;
    pattern?: string;
    validation?: string;
  };
  
  // 기존 호환성을 위한 필드들
  originalName?: string;
  fullName?: string;
  subcommand?: string;
  subcommandPath?: string;
}

// 파라미터 컨텍스트 (다른 파라미터 값들)
export interface ParameterContext {
  guildId: string;
  userId?: string;
  channelId?: string;
  [key: string]: any;
}

// 자동완성 응답 인터페이스
export interface AutocompleteResponse {
  success: boolean;
  choices: AutocompleteChoice[];
  total?: number;
  hasMore?: boolean;
  error?: string;
}

// 자동완성 요청 인터페이스
export interface AutocompleteRequest {
  commandName: string;
  parameterName: string;
  query?: string;
  context: ParameterContext;
  limit?: number;
  offset?: number;
}

// 파라미터 렌더링 타입
export type ParameterRenderType = 
  | 'input'           // 기본 텍스트 입력
  | 'select'          // 드롭다운 선택
  | 'autocomplete'    // 자동완성 입력
  | 'switch'          // 불린 토글
  | 'number'          // 숫자 입력
  | 'textarea'        // 멀티라인 텍스트
  | 'user_picker'     // 사용자 선택기
  | 'channel_picker'  // 채널 선택기
  | 'role_picker';    // 역할 선택기

// 파라미터 렌더링 설정
export interface ParameterRenderConfig {
  type: ParameterRenderType;
  component?: React.ComponentType<any>;
  props?: Record<string, any>;
}