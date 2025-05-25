/**
 * 포스트 관련 유틸리티 함수들
 */

export interface ParsedContent {
  plainText: string;
  hashtags: string[];
  hasHashtags: boolean;
}

/**
 * 포스트 내용에서 해시태그와 일반 텍스트를 분리
 * @param content 원본 포스트 내용
 * @param serverHashtags 서버에서 제공된 해시태그 배열 (우선 사용)
 * @returns 파싱된 내용 객체
 */
export const parsePostContent = (
  content: string,
  serverHashtags?: string[]
): ParsedContent => {
  if (!content) {
    return {
      plainText: "",
      hashtags: [],
      hasHashtags: false,
    };
  }

  // 서버에서 해시태그를 제공한 경우 우선 사용
  if (serverHashtags && serverHashtags.length > 0) {
    let plainText = content;
    
    // 서버 해시태그들을 일반 텍스트에서 제거
    serverHashtags.forEach(tag => {
      const hashtagPattern = new RegExp(`#${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$|\\n)`, 'gi');
      plainText = plainText.replace(hashtagPattern, '').trim();
    });
    
    // 연속된 공백이나 줄바꿈 정리
    plainText = plainText.replace(/\s+/g, ' ').trim();
    
    return {
      plainText,
      hashtags: serverHashtags,
      hasHashtags: true,
    };
  }

  // 클라이언트에서 해시태그 추출
  const hashtagRegex = /#[\w가-힣]+/g;
  const hashtags = content.match(hashtagRegex) || [];
  
  // 해시태그 제거한 일반 텍스트
  let plainText = content.replace(hashtagRegex, '').trim();
  
  // 연속된 공백이나 줄바꿈 정리
  plainText = plainText.replace(/\s+/g, ' ').trim();
  
  // # 제거한 순수 해시태그만 반환
  const cleanHashtags = hashtags.map(tag => tag.substring(1));
  
  return {
    plainText,
    hashtags: cleanHashtags,
    hasHashtags: cleanHashtags.length > 0,
  };
};

/**
 * 텍스트를 지정된 길이로 자르고 말줄임표 추가
 * @param text 원본 텍스트
 * @param maxLength 최대 길이
 * @returns 잘린 텍스트
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * 줄바꿈을 공백으로 변환하고 텍스트 정리
 * @param text 원본 텍스트
 * @returns 정리된 텍스트
 */
export const normalizeText = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(/\r\n/g, ' ') // Windows 줄바꿈
    .replace(/\n/g, ' ')   // Unix 줄바꿈
    .replace(/\r/g, ' ')   // Mac 줄바꿈
    .replace(/\s+/g, ' ')  // 연속 공백 정리
    .trim();
};
