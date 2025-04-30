const logger = require('../../utility/logger');
// Commands/api/messageMacro/messageMacro.js

/**
 * 메시지 매크로 API 요청 처리 모듈
 * 버튼과 연결된 콘텐츠 조회 및 관련 기능 제공
 */

const axios = require('axios');
const { formatApiError } = require('../../utility/logger');
// API 기본 설정
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';
const API_PREFIX = '/api/v1';
const API_TIMEOUT = 8000; // 8초

/**
 * 안전한 API 요청 전송 유틸리티 함수
 * @param {Object} options 요청 옵션
 * @returns {Promise<Object>} 응답 데이터
 * @throws {Error} 요청 실패 시 오류
 */
async function safeApiRequest(options) {
	const { method = 'GET', endpoint, params = {}, data = null, timeout = API_TIMEOUT } = options;

	try {
		// 요청 준비
		const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;
		const config = {
			method,
			url,
			params,
			data,
			timeout,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		};

		// 요청 디버그 로그
		console.debug(`🔄 API 요청: ${method} ${url}`, {
			params: Object.keys(params).length ? params : undefined,
			data: data ? '데이터 있음' : undefined
		});

		// 요청 전송
		const startTime = Date.now();
		const response = await axios(config);
		const responseTime = Date.now() - startTime;

		// 응답 디버그 로그
		console.debug(`✅ API 응답: ${response.status} (${responseTime}ms)`, {
			url,
			dataSize: response.data ? JSON.stringify(response.data).length : 0
		});

		return response.data;
	} catch (error) {
		// 오류 처리 및 분류
		logger.error(`❌ API 요청 실패: ${options.method} ${options.endpoint}`, formatApiError(error));

		// 오류 내용에 따라 적절한 오류 메시지 생성
		if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
			throw new Error(`서버 연결 실패: ${error.message}`);
		}

		if (error.response) {
			// 서버에서 응답이 왔지만 오류 상태 코드인 경우
			const status = error.response.status;
			const message = error.response.data?.message || error.response.data?.error || '알 수 없는 오류';

			if (status === 401 || status === 403) {
				throw new Error(`인증 오류: ${message}`);
			} else if (status === 404) {
				throw new Error(`리소스를 찾을 수 없습니다: ${message}`);
			} else if (status >= 500) {
				throw new Error(`서버 내부 오류: ${message}`);
			} else {
				throw new Error(`API 오류 (${status}): ${message}`);
			}
		}

		// 기타 오류
		throw new Error(`API 요청 실패: ${error.message}`);
	}
}


/**
 * 버튼 ID에 해당하는 콘텐츠 목록 조회
 * @param {string} buttonId 버튼 ID
 * @returns {Promise<Array>} 콘텐츠 목록
 * @throws {Error} 조회 실패 시 오류
 */
async function getContents(buttonId) {
	try {
		// 버튼 ID 검증
		if (!buttonId || typeof buttonId !== 'string') {
			throw new Error('유효하지 않은 버튼 ID입니다.');
		}

		// UUID 형식 검증 (간단한 검증)
		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(buttonId)) {
			throw new Error('유효하지 않은 버튼 ID 형식입니다.');
		}

		// API 요청
		const endpoint = `/messageMacros/buttons/${buttonId}/contents`;
		const response = await safeApiRequest({ endpoint });

		// 응답 검증
		if (!response || !Array.isArray(response)) {
			console.warn(`⚠️ 버튼 콘텐츠 조회 응답이 배열이 아님:`, response);
			return [];
		}

		// 유효한 콘텐츠만 필터링
		const validContents = response.filter(item =>
			item && (typeof item.text === 'string' || typeof item.channelId === 'string')
		);

		if (validContents.length === 0 && response.length > 0) {
			console.warn(`⚠️ 버튼에 유효한 콘텐츠가 없음. 원본 응답:`, response);
		}

		return validContents;
	} catch (error) {
		// 오류 로그 및 재전파
		logger.error(`❌ 버튼 콘텐츠 조회 실패 (버튼 ID: ${buttonId}):`, error);

		// 더 명확한 오류 메시지로 래핑
		const errorMessage = error.message || '콘텐츠 조회 중 오류가 발생했습니다.';
		throw new Error(`버튼 콘텐츠 조회 실패: ${errorMessage}`);
	}
}

/**
 * 버튼 및 콘텐츠 정보 캐싱 관리 (옵션)
 * 캐싱을 통해 API 요청 횟수를 줄이고 성능 향상
 */
const contentsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5분 캐시

/**
 * 캐시를 활용한 버튼 콘텐츠 조회
 * @param {string} buttonId 버튼 ID
 * @param {boolean} forceRefresh 캐시 무시 여부
 * @returns {Promise<Array>} 콘텐츠 목록
 */
async function getCachedContents(buttonId, forceRefresh = false) {
	// 캐시 확인
	const now = Date.now();
	const cacheKey = `btn_${buttonId}`;
	const cachedData = contentsCache.get(cacheKey);

	// 유효한 캐시가 있고 강제 갱신이 아닌 경우
	if (!forceRefresh && cachedData && cachedData.expiry > now) {
		return cachedData.data;
	}

	try {
		// 새로운 데이터 조회
		const contents = await getContents(buttonId);

		// 캐시 저장
		contentsCache.set(cacheKey, {
			data: contents,
			expiry: now + CACHE_TTL
		});

		return contents;
	} catch (error) {
		// 조회 실패 시 만료된 캐시라도 사용
		if (cachedData) {
			console.warn(`⚠️ 콘텐츠 조회 실패로 만료된 캐시 사용 (버튼 ID: ${buttonId})`);
			return cachedData.data;
		}

		// 캐시도 없으면 오류 전파
		throw error;
	}
}

// 일정 시간마다 오래된 캐시 정리
setInterval(() => {
	const now = Date.now();
	for (const [key, value] of contentsCache.entries()) {
		if (value.expiry < now) {
			contentsCache.delete(key);
		}
	}
}, 10 * 60 * 1000); // 10분마다 실행

// 모듈 내보내기
module.exports = {
	getContents,
	getCachedContents
};