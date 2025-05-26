/**
 * Jackson 타입 정보가 포함된 응답을 일반 JSON으로 변환
 */
export function parseJacksonResponse<T = unknown>(data: unknown): T {
  if (!data) return data as T;

  // 배열 형식 처리: ["java.util.Collections$UnmodifiableRandomAccessList", [...]]
  if (Array.isArray(data) && data.length === 2 && typeof data[0] === 'string' && data[0].includes('java.')) {
    return parseJacksonResponse<T>(data[1]);
  }

  // 객체에서 @class 필드 제거 및 재귀적 처리
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map(item => parseJacksonResponse(item)) as T;
    }

    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (key !== '@class') {
        cleaned[key] = parseJacksonResponse(value);
      }
    }
    return cleaned as T;
  }

  return data as T;
}