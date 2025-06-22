// Commands/api/automation/automationApi.js

/**
 * 버튼 자동화 시스템 API 클라이언트
 * 백엔드 API와 통신하여 자동화 관련 작업 수행
 */

const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const BEARER_TOKEN = process.env.DISCORD_CLIENT_SECRET;
const API_PREFIX = '/bot/v1';
const API_TIMEOUT = 10000; // 10초
const API_BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

console.log("🔧 Automation API 초기화:", {
    API_BASE_URL,
    API_PREFIX,
    BEARER_TOKEN: BEARER_TOKEN ? '설정됨' : '없음'
});

/**
 * 안전한 API 요청 전송 유틸리티 함수
 * @param {Object} options 요청 옵션
 * @returns {Promise<Object>} 응답 데이터
 * @throws {Error} 요청 실패 시 오류
 */
async function safeApiRequest(options) {
    const { method = 'GET', endpoint, params = {}, data = null, timeout = API_TIMEOUT } = options;

    try {
        const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;
        console.log("call url = " + url);
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

        console.debug(`🔄 자동화 API 요청: ${method} ${url}`, {
            params: Object.keys(params).length ? params : undefined,
            data: data ? '데이터 있음' : undefined
        });

        const startTime = Date.now();
        const response = await axios(config);
        const responseTime = Date.now() - startTime;

        console.debug(`✅ 자동화 API 응답: ${response.status} (${responseTime}ms)`);

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
                throw new Error(`리소스를 찾을 수 없습니다`);
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
 * 길드의 버튼 자동화 그룹 목록 조회 (기존 API - 웹용)
 * @param {string} guildId Discord 길드 ID
 * @returns {Promise<Array>} 그룹 목록
 */
async function getGroups(guildId) {
    try {
        if (!guildId || typeof guildId !== 'string') {
            throw new Error('유효하지 않은 길드 ID입니다.');
        }

        const endpoint = `/automations/groups/${guildId}`;
        const response = await safeApiRequest({ endpoint });

        if (!Array.isArray(response)) {
            console.warn('⚠️ 그룹 목록 응답이 배열이 아님:', response);
            return [];
        }

        return response.map(group => ({
            id: group.id,
            name: group.name || '이름 없음',
            description: group.description || '',
            isActive: group.isActive !== false,
            buttonCount: group.buttonCount || 0,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt
        }));
    } catch (error) {
        console.error('그룹 목록 조회 오류:', error);
        throw new Error(`그룹 목록 조회 실패: ${error.message}`);
    }
}

/**
 * 길드의 버튼 그룹 목록 조회 (봇 전용 API - 오토컴플릿용)
 * @param {string} guildId Discord 길드 ID
 * @returns {Promise<Array>} 간소화된 그룹 목록 (id, name, buttonCount)
 */
async function getButtonGroups(guildId) {
    try {
        console.log("🚀 getButtonGroups 호출 - guildId:", guildId);
        
        if (!guildId || typeof guildId !== 'string') {
            throw new Error('유효하지 않은 길드 ID입니다.');
        }

        const endpoint = `/guilds/${guildId}/button-groups`;
        console.log("📍 API 엔드포인트:", endpoint);
        
        const response = await safeApiRequest({ endpoint });
        console.log("📨 API 응답:", JSON.stringify(response, null, 2));

        // MessageDto 구조에서 실제 데이터 추출
        const groups = response.innerDto || response.data || response;

        if (!Array.isArray(groups)) {
            console.warn('⚠️ 버튼 그룹 목록 응답이 배열이 아님:', groups);
            return [];
        }

        const result = groups
            .filter(group => group.isActive !== false) // 활성화된 그룹만
            .map(group => ({
                id: group.id,
                name: group.name || '이름 없음',
                buttonCount: group.buttonCount || 0
            }));
            
        console.log("✅ 필터링된 그룹 목록:", result);
        return result;
    } catch (error) {
        console.error('❌ 버튼 그룹 목록 조회 오류:', error);
        console.error('에러 스택:', error.stack);
        throw new Error(`버튼 그룹 목록 조회 실패: ${error.message}`);
    }
}

/**
 * 특정 버튼 그룹 정보 조회 (봇 전용)
 * @param {string} guildId Discord 길드 ID  
 * @param {string} groupId 버튼 그룹 ID
 * @returns {Promise<Object>} 버튼 그룹 상세 정보
 */
async function getButtonGroup(guildId, groupId) {
    try {
        console.log("🚀 getButtonGroup 호출 - guildId:", guildId, "groupId:", groupId);
        
        if (!guildId || typeof guildId !== 'string') {
            throw new Error('유효하지 않은 길드 ID입니다.');
        }

        if (!groupId || typeof groupId !== 'string') {
            throw new Error('유효하지 않은 그룹 ID입니다.');
        }

        const endpoint = `/guilds/${guildId}/button-groups/${groupId}`;
        console.log("📍 API 엔드포인트:", endpoint);
        
        const response = await safeApiRequest({ endpoint });
        console.log("📨 API 응답:", JSON.stringify(response, null, 2));

        // MessageDto 구조에서 실제 데이터 추출
        const group = response.innerDto || response.data || response;
        console.log("📦 추출된 그룹 데이터:", JSON.stringify(group, null, 2));

        const result = {
            id: group.id,
            name: group.name || '이름 없음',
            description: group.description || '',
            settings: group.settings || '{}', // 그룹 설정 JSON
            buttonCount: group.buttonCount || 0,
            isActive: group.isActive !== false,
            buttons: (group.buttons || []).map(button => ({
                id: button.id,
                buttonLabel: button.label || button.buttonLabel, // 백엔드 필드명에 맞춤
                config: button.config || '{}', // 버튼 설정 JSON
                isActive: button.isActive !== false
            }))
        };
        
        console.log("✅ 최종 반환 데이터:", JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error('❌ 버튼 그룹 조회 오류:', error);
        console.error('에러 스택:', error.stack);
        throw new Error(`버튼 그룹 조회 실패: ${error.message}`);
    }
}

/**
 * 새 버튼 자동화 그룹 생성
 * @param {string} guildId Discord 길드 ID
 * @param {Object} groupData 그룹 데이터
 * @returns {Promise<Object>} 생성된 그룹 정보
 */
async function createGroup(guildId, groupData) {
    try {
        if (!guildId || typeof guildId !== 'string') {
            throw new Error('유효하지 않은 길드 ID입니다.');
        }

        if (!groupData.name || typeof groupData.name !== 'string') {
            throw new Error('그룹 이름은 필수입니다.');
        }

        const endpoint = `/automations/groups`;
        const data = {
            guildId,
            name: groupData.name,
            description: groupData.description || '',
            settings: {
                isActive: true,
                createdBy: groupData.createdBy || null,
                maxButtons: 25
            }
        };

        const response = await safeApiRequest({
            method: 'POST',
            endpoint,
            data
        });

        return {
            id: response.id,
            name: response.name,
            description: response.description,
            isActive: response.isActive,
            createdAt: response.createdAt
        };
    } catch (error) {
        console.error('그룹 생성 오류:', error);
        throw new Error(`그룹 생성 실패: ${error.message}`);
    }
}

/**
 * 특정 그룹의 버튼 목록 조회
 * @param {string} guildId Discord 길드 ID
 * @param {string} groupId 버튼 그룹 ID
 * @returns {Promise<Object>} 그룹 정보와 버튼 목록
 */
async function getButtonsByGroup(guildId, groupId) {
    try {
        if (!guildId || typeof guildId !== 'string') {
            throw new Error('유효하지 않은 길드 ID입니다.');
        }

        if (!groupId || typeof groupId !== 'string') {
            throw new Error('유효하지 않은 그룹 ID입니다.');
        }

        const endpoint = `/automations/groups/${guildId}/${groupId}/buttons`;
        const response = await safeApiRequest({ endpoint });

        return {
            group: {
                id: response.group?.id || groupId,
                name: response.group?.name || '알 수 없음',
                description: response.group?.description || '',
                isActive: response.group?.isActive !== false,
                createdAt: response.group?.createdAt
            },
            buttons: (response.buttons || []).map(button => ({
                id: button.id,
                buttonLabel: button.buttonLabel,
                displayOrder: button.displayOrder || 0,
                isActive: button.isActive !== false,
                config: button.config ? JSON.parse(button.config) : null,
                createdAt: button.createdAt
            }))
        };
    } catch (error) {
        console.error('버튼 목록 조회 오류:', error);
        throw new Error(`버튼 목록 조회 실패: ${error.message}`);
    }
}

/**
 * 버튼 자동화 실행
 * @param {string} buttonId 버튼 ID
 * @param {Object} context 실행 컨텍스트
 * @returns {Promise<Object>} 실행 결과
 */
async function executeButtonAutomation(buttonId, context) {
    try {
        console.log("🚀 [실행 시작] 버튼 자동화 실행:", { buttonId, context });
        
        if (!buttonId || typeof buttonId !== 'string') {
            throw new Error('유효하지 않은 버튼 ID입니다.');
        }

        if (!context.userId || !context.guildId) {
            throw new Error('실행 컨텍스트가 불완전합니다.');
        }

        const endpoint = `/automations/execute/${buttonId}`;
        const data = {
            userId: context.userId,
            guildId: context.guildId,
            channelId: context.channelId,
            messageId: context.messageId,
            timestamp: new Date().toISOString()
        };

        console.log("📤 [API 호출] 엔드포인트:", endpoint);
        console.log("📤 [API 호출] 데이터:", JSON.stringify(data, null, 2));

        const response = await safeApiRequest({
            method: 'POST',
            endpoint,
            data
        });

        console.log("📨 [API 응답] 백엔드 응답:", JSON.stringify(response, null, 2));

        const result = {
            success: response.success !== false,
            executedActions: response.executedActions || [],
            message: response.message || '실행 완료',
            cooldownRemaining: response.cooldownRemaining || 0
        };

        console.log("✅ [실행 완료] 최종 결과:", JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error('❌ [실행 실패] 버튼 자동화 실행 오류:', error);
        console.error('❌ [실행 실패] 에러 스택:', error.stack);
        throw new Error(`버튼 자동화 실행 실패: ${error.message}`);
    }
}

/**
 * Discord 채널에 버튼 메시지 전송
 * @param {string} guildId Discord 길드 ID
 * @param {string} groupId 버튼 그룹 ID
 * @param {string} channelId 대상 채널 ID
 * @param {Object} options 전송 옵션
 * @returns {Promise<Object>} 전송 결과
 */
async function sendButtonMessage(guildId, groupId, channelId, options = {}) {
    try {
        // 그룹의 버튼 목록 조회
        const { group, buttons } = await getButtonsByGroup(guildId, groupId);

        if (!group.isActive) {
            throw new Error('비활성화된 그룹입니다.');
        }

        const activeButtons = buttons.filter(btn => btn.isActive);

        if (activeButtons.length === 0) {
            throw new Error('활성화된 버튼이 없습니다.');
        }

        // 메시지 전송 API 호출
        const endpoint = `/automations/send-message`;
        const data = {
            guildId,
            groupId,
            channelId,
            customMessage: options.customMessage,
            sender: options.sender
        };

        const response = await safeApiRequest({
            method: 'POST',
            endpoint,
            data
        });

        return {
            success: response.success !== false,
            messageId: response.messageId,
            buttonCount: activeButtons.length,
            channelId: channelId
        };
    } catch (error) {
        console.error('버튼 메시지 전송 오류:', error);
        throw new Error(`버튼 메시지 전송 실패: ${error.message}`);
    }
}

/**
 * 특정 버튼 설정 조회 (봇 전용)
 * @param {string} buttonId 버튼 ID  
 * @returns {Promise<Object>} 버튼 설정 데이터
 */
async function getBotButtonData(buttonId) {
    try {
        console.log("🔍 [API] getBotButtonData 호출 - buttonId:", buttonId);
        
        if (!buttonId || typeof buttonId !== 'string') {
            throw new Error('유효하지 않은 버튼 ID입니다.');
        }

        const endpoint = `/automations/buttons/${buttonId}`;
        console.log("📍 [API] 엔드포인트:", endpoint);
        
        const response = await safeApiRequest({ endpoint });
        console.log("📨 [API] 백엔드 응답:", JSON.stringify(response, null, 2));

        const result = {
            id: response.id,
            buttonLabel: response.buttonLabel,
            config: response.config, // JSON 문자열 또는 객체
            isActive: response.isActive
        };
        
        console.log("✅ [API] 반환 데이터:", JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error('❌ [API] 버튼 설정 조회 오류:', error);
        console.error('❌ [API] 에러 스택:', error.stack);
        throw new Error(`버튼 설정 조회 실패: ${error.message}`);
    }
}

/**
 * 버튼 자동화 통계 조회
 * @param {string} guildId Discord 길드 ID
 * @param {string} groupId 버튼 그룹 ID (선택사항)
 * @returns {Promise<Object>} 통계 데이터
 */
async function getAutomationStats(guildId, groupId = null) {
    try {
        if (!guildId || typeof guildId !== 'string') {
            throw new Error('유효하지 않은 길드 ID입니다.');
        }

        const endpoint = groupId
            ? `/automations/stats/${guildId}/${groupId}`
            : `/automations/stats/${guildId}`;

        const response = await safeApiRequest({ endpoint });

        return {
            totalExecutions: response.totalExecutions || 0,
            uniqueUsers: response.uniqueUsers || 0,
            mostUsedButton: response.mostUsedButton || null,
            dailyStats: response.dailyStats || [],
            errorRate: response.errorRate || 0
        };
    } catch (error) {
        console.error('자동화 통계 조회 오류:', error);
        throw new Error(`자동화 통계 조회 실패: ${error.message}`);
    }
}

/**
 * 버튼 그룹을 Discord 채널에 전송 (봇 전용 간소화 버전)
 * @param {string} guildId Discord 길드 ID
 * @param {string} groupId 버튼 그룹 ID  
 * @param {string} channelId 대상 채널 ID
 * @param {Object} options 전송 옵션
 * @returns {Promise<Object>} 전송 결과
 */
async function sendButtonGroupToChannel(guildId, groupId, channelId, options = {}) {
    try {
        if (!guildId || !groupId || !channelId) {
            throw new Error('필수 파라미터가 누락되었습니다.');
        }

        const endpoint = `/guilds/${guildId}/button-groups/${groupId}/send`;
        const data = {
            channelId,
            customMessage: options.customMessage || null,
            senderId: options.senderId || null
        };

        const response = await safeApiRequest({
            method: 'POST',
            endpoint,
            data
        });

        // MessageDto 구조에서 실제 데이터 추출
        const result = response.innerDto || response.data || response;

        return {
            success: result.success !== false,
            messageId: result.messageId,
            buttonCount: result.buttonCount || 0,
            channelId: result.channelId || channelId,
            groupId: result.groupId || groupId
        };
    } catch (error) {
        console.error('버튼 그룹 전송 오류:', error);
        throw new Error(`버튼 그룹 전송 실패: ${error.message}`);
    }
}

// 모듈 내보내기
module.exports = {
    // 기존 함수들 (웹용)
    getGroups,
    createGroup,
    getButtonsByGroup,
    executeButtonAutomation,
    sendButtonMessage,
    getAutomationStats,

    // 새로운 함수들 (봇 전용)
    getButtonGroups,
    getButtonGroup,
    getBotButtonData,  // 추가
    sendButtonGroupToChannel
};