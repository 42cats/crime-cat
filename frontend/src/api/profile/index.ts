// 프로필 API 모듈 내보내기
export * from './types';
export * from './profile';
export * from './nickname';
export * from './badges';
export * from './notifications';
export * from './account';
export * from './themes';
export * from './detail';

/**
 * 프로필 관련 API 모듈
 * 
 * - 프로필 정보 조회 및 수정
 * - 닉네임 중복 체크
 * - 칭호(배지) 관리
 * - 알림 설정 관리
 * - 계정 관리 (탈퇴, 비밀번호 변경 등)
 * - 사용자 제작 테마 관리
 * 
 * 사용 예시:
 * ```typescript
 * import { getUserProfile, updateUserProfile, getUserThemes } from '@/api/profile';
 * 
 * // 프로필 정보 불러오기
 * const profile = await getUserProfile(userId);
 * 
 * // 프로필 정보 업데이트
 * const updatedProfile = await updateUserProfile(userId, {
 *   nickname: 'newNickname',
 *   bio: 'new bio',
 * });
 * 
 * // 사용자 제작 테마 불러오기
 * const themes = await getUserThemes(userId);
 * ```
 */
