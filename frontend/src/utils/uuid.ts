/**
 * UUID 생성 유틸리티
 * ActionConfig의 고유 식별자 생성을 위한 간단한 UUID v4 구현
 */

/**
 * 간단한 UUID v4 생성 함수
 * crypto.randomUUID()를 지원하지 않는 환경을 위한 폴백 포함
 */
export function generateUUID(): string {
  // 최신 브라우저의 crypto.randomUUID() 사용
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // 폴백: Math.random() 기반 UUID v4 생성
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 액션 ID 접두사를 포함한 UUID 생성
 * 디버깅과 로깅에 유용한 식별 가능한 ID 생성
 */
export function generateActionId(): string {
  const uuid = generateUUID();
  return `action_${uuid}`;
}

/**
 * UUID 유효성 검증
 * 기본 UUID v4 형식 검증
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * 액션 ID 유효성 검증
 * action_ 접두사를 포함한 ID 형식 검증
 */
export function isValidActionId(actionId: string): boolean {
  if (!actionId.startsWith('action_')) {
    return false;
  }
  const uuid = actionId.substring(7); // 'action_' 제거
  return isValidUUID(uuid);
}