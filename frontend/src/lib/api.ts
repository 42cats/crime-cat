// Java Spring 백엔드용 기본 API 클라이언트 설정
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1"; // 기본 API 주소
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || "30000"); // 타임아웃 설정 (기본 30초)

/**
 * apiClient: GET, POST, PUT, DELETE 메서드를 포함한 통신 클라이언트
 * 각 요청은 fetch + AbortController로 일정 시간 초과 시 자동 중단
 */
export const apiClient = {
  /**
   * GET 요청 - 데이터를 조회할 때 사용
   * @param endpoint - 호출할 API 경로 (ex: /users)
   * @returns 응답 데이터를 제네릭 타입으로 반환
   */
  get: async <T>(endpoint: string): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT); // 타임아웃 설정
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`); // 에러 처리
      }

      return await response.json(); // JSON 응답 반환
    } finally {
      clearTimeout(timeoutId); // 타임아웃 클리어
    }
  },

  /**
   * POST 요청 - 새로운 리소스를 생성할 때 사용
   * @param endpoint - API 경로
   * @param data - 요청 본문에 담을 JSON 객체
   * @returns 응답 데이터를 반환
   */
  post: async <T>(endpoint: string, data: any): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data), // 요청 본문
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /**
   * PUT 요청 - 기존 리소스를 수정할 때 사용
   * @param endpoint - API 경로
   * @param data - 수정할 데이터 객체
   * @returns 응답 데이터를 반환
   */
  put: async <T>(endpoint: string, data: any): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /**
   * DELETE 요청 - 리소스를 삭제할 때 사용
   * @param endpoint - API 경로
   * @returns 삭제 후 응답 데이터 반환
   */
  delete: async <T>(endpoint: string): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
