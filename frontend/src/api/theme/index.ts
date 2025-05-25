/**
 * 테마 관련 API 모음
 */

// 테마 광고 서비스
export * from '../admin/themeAdsService';

// 테마 기본 서비스
export * from '../content/themesService';

// 방탈출 테마 관련
export type { 
    EscapeRoomHistory,
    EscapeRoomHistoryInput,
    EscapeRoomHistoryStats,
    EscapeRoomHistoryPage,
    EscapeRoomComment,
    EscapeRoomCommentInput,
    EscapeRoomCommentPage
} from '@/lib/types';
