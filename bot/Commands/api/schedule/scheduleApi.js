// Commands/api/schedule/scheduleApi.js

/**
 * Discord 봇 일정 관리 API 클라이언트
 * 백엔드 /bot/v1/schedule/** API와 통신
 */

const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const BEARER_TOKEN = process.env.DISCORD_CLIENT_SECRET;
const API_PREFIX = '/bot/v1';
const API_TIMEOUT = 10000; // 10초
const API_BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

console.log("📅 Schedule API 초기화:", {
    API_BASE_URL,
    API_PREFIX,
    BEARER_TOKEN: BEARER_TOKEN ? '설정됨' : '없음'
});

/**
 * 안전한 API 요청 전송 유틸리티 함수
 */
async function safeApiRequest(options) {
    const { method = 'GET', endpoint, params = {}, data = null, timeout = API_TIMEOUT } = options;

    try {
        const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;
        console.log("📅 Schedule API 호출: " + url);

        const config = {
            method,
            url,
            params,
            data,
            timeout,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${BEARER_TOKEN}`
            }
        };

        console.debug(`🔄 일정 API 요청: ${method} ${url}`, {
            params: Object.keys(params).length ? params : undefined,
            data: data ? '데이터 있음' : undefined
        });

        const startTime = Date.now();
        const response = await axios(config);
        const responseTime = Date.now() - startTime;

        console.debug(`✅ 일정 API 응답: ${response.status} (${responseTime}ms)`);
        return response.data;

    } catch (error) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            throw new Error(`서버 연결 실패: ${error.message}`);
        }

        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || error.response.data?.error || '알 수 없는 오류';

            if (status === 401 || status === 403) {
                throw new Error(`인증 오류: ${message}`);
            } else if (status === 404) {
                throw new Error(`사용자 정보를 찾을 수 없습니다`);
            } else if (status >= 500) {
                throw new Error(`서버 내부 오류: ${message}`);
            } else {
                throw new Error(`API 오류 (${status}): ${message}`);
            }
        }

        throw new Error(`API 요청 실패: ${error.message}`);
    }
}

/**
 * 사용자의 등록된 iCal 일정 조회 (개월 옵션 지원)
 * @param {string} discordSnowflake Discord 사용자 Snowflake ID
 * @param {number} months 조회할 개월 수 (기본값: 3)
 * @returns {Promise<Object>} 내일정 응답 데이터
 */
async function getMySchedule(discordSnowflake, months = 3) {
    try {
        if (!discordSnowflake || typeof discordSnowflake !== 'string') {
            throw new Error('유효하지 않은 Discord 사용자 ID입니다.');
        }

        if (!months || months < 1 || months > 12) {
            throw new Error('조회 기간은 1-12개월 사이여야 합니다.');
        }

        const endpoint = `/schedule/user/${discordSnowflake}/my-schedule`;
        const response = await safeApiRequest({
            endpoint,
            params: { months }
        });

        console.log(`📅 내일정 조회 성공: ${discordSnowflake}, ${months}개월, 총 ${response.totalEvents}개 일정`);
        return response;

    } catch (error) {
        console.error(`❌ 내일정 조회 실패: ${discordSnowflake}`, error.message);
        throw error;
    }
}

/**
 * 입력된 일정과 사용자 일정의 교차 체크 (개월 옵션 지원)
 * @param {string} discordSnowflake Discord 사용자 Snowflake ID
 * @param {string} inputDates 입력된 날짜 문자열 (예: "10월 1 2 3 4")
 * @param {number} months 조회할 개월 수 (기본값: 3)
 * @returns {Promise<Object>} 교차체크 응답 데이터
 */
async function checkScheduleOverlap(discordSnowflake, inputDates, months = 3) {
    try {
        if (!discordSnowflake || typeof discordSnowflake !== 'string') {
            throw new Error('유효하지 않은 Discord 사용자 ID입니다.');
        }

        if (!inputDates || typeof inputDates !== 'string') {
            throw new Error('날짜 입력이 필요합니다. 예: "10월 1 2 3 4"');
        }

        if (!months || months < 1 || months > 12) {
            throw new Error('조회 기간은 1-12개월 사이여야 합니다.');
        }

        const endpoint = `/schedule/user/${discordSnowflake}/check-overlap`;
        const response = await safeApiRequest({
            method: 'POST',
            endpoint,
            data: { inputDates, months }
        });

        console.log(`🔍 일정 교차체크 성공: ${discordSnowflake}, ${months}개월, ${response.totalMatches}개 일치`);
        return response;

    } catch (error) {
        console.error(`❌ 일정 교차체크 실패: ${discordSnowflake}`, error.message);
        throw error;
    }
}

/**
 * 사용자 캘린더 캐시 강제 갱신
 * @param {string} discordSnowflake Discord 사용자 Snowflake ID
 * @returns {Promise<string>} 갱신 완료 메시지
 */
async function refreshUserCache(discordSnowflake) {
    try {
        if (!discordSnowflake || typeof discordSnowflake !== 'string') {
            throw new Error('유효하지 않은 Discord 사용자 ID입니다.');
        }

        const endpoint = `/schedule/user/${discordSnowflake}/refresh-cache`;
        const response = await safeApiRequest({
            method: 'POST',
            endpoint
        });

        console.log(`🔄 캐시 갱신 성공: ${discordSnowflake}`);
        return response; // 백엔드에서 문자열로 응답

    } catch (error) {
        console.error(`❌ 캐시 갱신 실패: ${discordSnowflake}`, error.message);
        throw error;
    }
}

/**
 * Discord 사용자 에러 메시지 포맷팅
 * @param {Error} error 에러 객체
 * @returns {string} 사용자 친화적 에러 메시지
 */
function formatUserErrorMessage(error) {
    const message = error.message || '알 수 없는 오류가 발생했습니다';

    if (message.includes('사용자를 찾을 수 없습니다')) {
        return '🚫 Discord 계정 인증이 필요합니다. 먼저 웹사이트에서 Discord 로그인을 해주세요.';
    }

    if (message.includes('회원가입이 필요합니다')) {
        return '📝 웹사이트에서 먼저 회원가입을 해주세요.\n🔗 https://mystery-place.com';
    }

    if (message.includes('캘린더를 등록해주세요')) {
        return '📅 iCal 캘린더 등록이 필요합니다.\n웹사이트 → 설정 → 캘린더 관리에서 Google/Apple 캘린더를 연결해주세요.';
    }

    if (message.includes('iCalendar 파싱에 실패했습니다') || message.includes('모든 캘린더 파싱 실패')) {
        return '⚠️ 일부 캘린더에 문제가 있어요.\n\n' +
            '💡 **해결방법:**\n' +
            '• `/일정갱신` 명령어로 새로고침 시도\n' +
            '• 웹사이트에서 캘린더 설정 확인\n' +
            '• Google/Apple 캘린더의 공유 설정 확인\n\n' +
            '🔗 대부분 캘린더 URL 만료나 권한 문제입니다.';
    }

    if (message.includes('날짜 형식이 올바르지 않습니다')) {
        return '📋 올바른 날짜 형식으로 입력해주세요.\n예시: `/일정체크 10월 1 2 3 4` 또는 `/일정체크 8월 28 29, 9월 3 4`';
    }

    if (message.includes('서버 연결 실패')) {
        return '🔧 서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }

    if (message.includes('캘린더 URL을 찾을 수 없습니다') || message.includes('404')) {
        return '🔗 캘린더 링크에 문제가 있어요!\n\n' +
            '**원인:** 캘린더 URL이 만료되거나 공유 설정이 변경됨\n\n' +
            '💡 **해결방법:**\n' +
            '1. 웹사이트 → 설정 → 캘린더 관리\n' +
            '2. 문제가 있는 캘린더 삭제 후 재등록\n' +
            '3. Google/Apple 캘린더 공유 설정 "공개" 확인';
    }

    return `❌ 오류가 발생했습니다: ${message}`;
}

module.exports = {
    getMySchedule,
    checkScheduleOverlap,
    refreshUserCache,
    formatUserErrorMessage
};