/**
 * 다양한 URL 유효성 검사 함수
 */

/**
 * 인스타그램 URL 유효성 검사
 * @param url 검사할 URL
 * @returns 유효성 여부
 */
export const validateInstagramUrl = (url: string): boolean => {
  if (!url) return false;
  const instagramRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/([a-zA-Z0-9_.]+)\/?.*$/i;
  return instagramRegex.test(url);
};

/**
 * 트위터/X URL 유효성 검사 
 * @param url 검사할 URL
 * @returns 유효성 여부
 */
export const validateTwitterUrl = (url: string): boolean => {
  if (!url) return false;
  const twitterRegex = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/?.*$/i;
  return twitterRegex.test(url);
};

/**
 * Discord/카카오톡 URL 유효성 검사
 * @param url 검사할 URL
 * @returns 유효성 여부
 */
export const validateDiscordUrl = (url: string): boolean => {
  if (!url) return false;
  // Discord 초대 링크 형식
  const discordRegex = /^(https?:\/\/)?(www\.)?(discord\.gg\/|discord\.com\/invite\/)[a-zA-Z0-9-]+\/?.*$/i;
  // 카카오톡 오픈채팅 링크 형식
  const kakaoRegex = /^(https?:\/\/)?(www\.)?(open\.kakao\.com\/o\/|open\.kakao\.com\/)[a-zA-Z0-9-]+\/?.*$/i;
  return discordRegex.test(url) || kakaoRegex.test(url);
};
