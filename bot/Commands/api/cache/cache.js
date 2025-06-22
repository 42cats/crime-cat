const axios = require('axios');
const dotenv = require('dotenv');
const logger = require('../../utility/logger');

dotenv.config();
const BEARER_TOKEN = process.env.DISCORD_CLIENT_SECRET;
const baseUrl = process.env.BASE_URL;

/**
 * 특정 길드의 채널 캐시를 무효화합니다
 * Discord에서 채널이 추가/수정/삭제될 때 호출됩니다
 * 
 * @param {string} guildId 길드 ID
 * @param {Object} eventInfo 이벤트 정보 (선택사항)
 * @returns {Promise<string>} 캐시 무효화 결과
 */
async function evictChannelCache(guildId, eventInfo = {}) {
    const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}/cache/channels`;
    
    const body = {
        reason: 'discord_event_triggered',
        triggeredBy: 'bot_cache_invalidation_handler',
        timestamp: new Date().toISOString(),
        ...eventInfo
    };

    try {
        const response = await axios.delete(API_URL, {
            data: body,
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        logger.info('✅ [채널 캐시 무효화 성공]', {
            guildId,
            status: response.status,
            message: response.data?.message || 'success'
        });
        
        return response.data?.message || '채널 캐시가 성공적으로 무효화되었습니다.';
        
    } catch (error) {
        logger.error('❌ [채널 캐시 무효화 실패]', logger.formatApiError(error));
        throw new Error(error?.response?.data?.detail || error?.response?.data?.message || '채널 캐시 무효화 실패');
    }
}

/**
 * 특정 길드의 역할 캐시를 무효화합니다
 * Discord에서 역할이 추가/수정/삭제될 때 호출됩니다
 * 
 * @param {string} guildId 길드 ID
 * @param {Object} eventInfo 이벤트 정보 (선택사항)
 * @returns {Promise<string>} 캐시 무효화 결과
 */
async function evictRoleCache(guildId, eventInfo = {}) {
    const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}/cache/roles`;
    
    const body = {
        reason: 'discord_event_triggered',
        triggeredBy: 'bot_cache_invalidation_handler',
        timestamp: new Date().toISOString(),
        ...eventInfo
    };

    try {
        const response = await axios.delete(API_URL, {
            data: body,
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        logger.info('✅ [역할 캐시 무효화 성공]', {
            guildId,
            status: response.status,
            message: response.data?.message || 'success'
        });
        
        return response.data?.message || '역할 캐시가 성공적으로 무효화되었습니다.';
        
    } catch (error) {
        logger.error('❌ [역할 캐시 무효화 실패]', logger.formatApiError(error));
        throw new Error(error?.response?.data?.detail || error?.response?.data?.message || '역할 캐시 무효화 실패');
    }
}

/**
 * 특정 길드의 모든 캐시를 무효화합니다
 * 길드 정보, 채널, 역할 캐시를 모두 무효화합니다
 * 
 * @param {string} guildId 길드 ID
 * @param {Object} eventInfo 이벤트 정보 (선택사항)
 * @returns {Promise<string>} 캐시 무효화 결과
 */
async function evictAllGuildCache(guildId, eventInfo = {}) {
    const API_URL = `${baseUrl}/bot/v1/guilds/${guildId}/cache/all`;
    
    const body = {
        reason: 'discord_event_triggered',
        triggeredBy: 'bot_cache_invalidation_handler',
        timestamp: new Date().toISOString(),
        ...eventInfo
    };

    try {
        const response = await axios.delete(API_URL, {
            data: body,
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        logger.info('✅ [길드 전체 캐시 무효화 성공]', {
            guildId,
            status: response.status,
            message: response.data?.message || 'success'
        });
        
        return response.data?.message || '길드의 모든 캐시가 성공적으로 무효화되었습니다.';
        
    } catch (error) {
        logger.error('❌ [길드 전체 캐시 무효화 실패]', logger.formatApiError(error));
        throw new Error(error?.response?.data?.detail || error?.response?.data?.message || '길드 전체 캐시 무효화 실패');
    }
}

/**
 * 여러 길드의 캐시를 일괄 무효화합니다
 * 봇 재시작 시나 대량 처리가 필요할 때 사용
 * 
 * @param {Array<string>} guildIds 길드 ID 배열
 * @param {string} cacheType 캐시 타입 ('channels', 'roles', 'all')
 * @returns {Promise<Object>} 일괄 처리 결과
 */
async function evictMultipleGuildCaches(guildIds, cacheType = 'all') {
    const results = {
        total: guildIds.length,
        success: 0,
        failed: 0,
        errors: []
    };

    logger.info(`🔄 [일괄 캐시 무효화 시작] ${guildIds.length}개 길드, 타입: ${cacheType}`);

    const promises = guildIds.map(async (guildId) => {
        try {
            let result;
            const eventInfo = { 
                reason: 'bulk_invalidation',
                bulkOperation: true
            };

            switch (cacheType) {
                case 'channels':
                    result = await evictChannelCache(guildId, eventInfo);
                    break;
                case 'roles':
                    result = await evictRoleCache(guildId, eventInfo);
                    break;
                case 'all':
                default:
                    result = await evictAllGuildCache(guildId, eventInfo);
                    break;
            }

            results.success++;
            return { guildId, success: true, message: result };

        } catch (error) {
            results.failed++;
            results.errors.push({ guildId, error: error.message });
            return { guildId, success: false, error: error.message };
        }
    });

    // 동시 실행하되 과부하 방지를 위해 청크 단위로 처리
    const chunkSize = 10;
    const chunks = [];
    for (let i = 0; i < promises.length; i += chunkSize) {
        chunks.push(promises.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
        await Promise.all(chunk);
        // 청크 간 잠시 대기 (백엔드 부하 방지)
        if (chunks.indexOf(chunk) < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    logger.info(`✅ [일괄 캐시 무효화 완료] 성공: ${results.success}, 실패: ${results.failed}`);
    
    return results;
}

/**
 * 특정 채널 이벤트에 대한 캐시 무효화
 * 
 * @param {string} guildId 길드 ID
 * @param {Object} channelInfo 채널 정보
 * @param {string} eventType 이벤트 타입 ('create', 'update', 'delete')
 */
async function handleChannelEvent(guildId, channelInfo, eventType) {
    const eventInfo = {
        eventType,
        channelId: channelInfo.id,
        channelName: channelInfo.name,
        channelType: channelInfo.type,
        eventSource: 'discord_channel_event'
    };

    try {
        return await evictChannelCache(guildId, eventInfo);
    } catch (error) {
        logger.error(`[채널 이벤트 처리 실패] ${eventType} - ${channelInfo.name}:`, error.message);
        throw error;
    }
}

/**
 * 특정 역할 이벤트에 대한 캐시 무효화
 * 
 * @param {string} guildId 길드 ID
 * @param {Object} roleInfo 역할 정보
 * @param {string} eventType 이벤트 타입 ('create', 'update', 'delete')
 */
async function handleRoleEvent(guildId, roleInfo, eventType) {
    const eventInfo = {
        eventType,
        roleId: roleInfo.id,
        roleName: roleInfo.name,
        roleColor: roleInfo.color,
        eventSource: 'discord_role_event'
    };

    try {
        return await evictRoleCache(guildId, eventInfo);
    } catch (error) {
        logger.error(`[역할 이벤트 처리 실패] ${eventType} - ${roleInfo.name}:`, error.message);
        throw error;
    }
}

module.exports = {
    evictChannelCache,
    evictRoleCache,
    evictAllGuildCache,
    evictMultipleGuildCaches,
    handleChannelEvent,
    handleRoleEvent
};