const { evictChannelCache, evictRoleCache, evictAllGuildCache, handleChannelEvent, handleRoleEvent } = require('../Commands/api/cache/cache');
const logger = require('../Commands/utility/logger');

/**
 * 디스코드 이벤트 감지 및 캐시 무효화 핸들러
 * 채널 및 역할 변경 사항을 감지하여 백엔드 캐시를 자동으로 무효화
 */
class CacheInvalidationHandler {
    constructor(client) {
        this.client = client;
        this.isInitialized = false;
        this.eventCounts = {
            channelEvents: 0,
            roleEvents: 0,
            guildEvents: 0
        };
    }

    /**
     * 이벤트 리스너 초기화
     */
    initialize() {
        if (this.isInitialized) return;

        console.log('CacheInvalidationHandler 초기화 시작...');

        // 채널 관련 이벤트
        this.client.on('channelCreate', (channel) => this.handleChannelEvent('create', channel));
        this.client.on('channelDelete', (channel) => this.handleChannelEvent('delete', channel));
        this.client.on('channelUpdate', (oldChannel, newChannel) => this.handleChannelEvent('update', newChannel, oldChannel));

        // 역할 관련 이벤트 (올바른 이벤트명 사용)
        this.client.on('guildRoleCreate', (role) => this.handleRoleEvent('create', role));
        this.client.on('guildRoleDelete', (role) => this.handleRoleEvent('delete', role));
        this.client.on('guildRoleUpdate', (oldRole, newRole) => this.handleRoleEvent('update', newRole, oldRole));

        // 길드 관련 이벤트 (전체 캐시 무효화)
        this.client.on('guildUpdate', (oldGuild, newGuild) => this.handleGuildEvent('update', newGuild));
        this.client.on('guildDelete', (guild) => this.handleGuildEvent('leave', guild));

        this.initTime = Date.now();
        this.isInitialized = true;
        logger.info('CacheInvalidationHandler 초기화 완료 - Discord 이벤트 리스너 등록됨');
        
        // 초기화 시 인텐트 확인
        this.checkRequiredIntents();
    }

    /**
     * 필수 인텐트 확인
     */
    checkRequiredIntents() {
        const requiredIntents = [
            'Guilds' // 채널 및 역할 이벤트에 필요
        ];
        
        const clientIntents = this.client.options.intents;
        const missingIntents = [];
        
        // 인텐트 확인 로직 (간단화)
        if (!clientIntents || clientIntents.length === 0) {
            logger.warn('[캐시무효화] ⚠️  봇 인텐트가 설정되지 않았습니다. 이벤트 감지가 작동하지 않을 수 있습니다.');
            return;
        }
        
        logger.info('[캐시무효화] ✅ 봇 인텐트 확인 완료 - Discord 이벤트 감지 준비됨');
    }

    /**
     * 채널 이벤트 처리
     */
    async handleChannelEvent(eventType, channel, oldChannel = null) {
        if (!channel.guild) return; // DM 채널은 무시
        
        // 봇 자신이 발생시킨 변경사항인지 확인 (봇이 채널을 생성/수정한 경우)
        if (this.isBotTriggeredEvent(channel.guild)) {
            logger.info(`[캐시무효화] 봇 자신이 발생시킨 채널 이벤트 무시: ${eventType} - ${channel.name}`);
            return;
        }

        const guildId = channel.guild.id;
        this.eventCounts.channelEvents++;
        
        logger.info(`[캐시무효화] 채널 이벤트 감지: ${eventType} - ${channel.name} (${channel.id}) in ${channel.guild.name}`);

        try {
            // 채널 정보 구성
            const channelInfo = {
                id: channel.id,
                name: channel.name,
                type: channel.type,
                parentId: channel.parentId
            };
            
            // 변경 사항 분석
            if (eventType === 'update' && oldChannel) {
                channelInfo.changes = this.analyzeChannelChanges(oldChannel, channel);
            }
            
            // 백엔드 캐시 무효화 호출
            const result = await handleChannelEvent(guildId, channelInfo, eventType);
            
            logger.info(`[캐시무효화] 채널 캐시 무효화 완료: ${guildId} - ${result}`);

        } catch (error) {
            logger.error(`[캐시무효화] 채널 이벤트 처리 실패: ${eventType} - ${channel.name}`, error);
        }
    }

    /**
     * 역할 이벤트 처리
     */
    async handleRoleEvent(eventType, role, oldRole = null) {
        // @everyone 역할이나 관리 역할 변경은 특별히 처리
        if (role.name === '@everyone' || role.managed) {
            logger.debug(`[캐시무효화] 시스템 역할 이벤트 무시: ${eventType} - ${role.name}`);
            return;
        }
        
        // 봇 자신이 발생시킨 변경사항인지 확인
        if (this.isBotTriggeredEvent(role.guild)) {
            logger.info(`[캐시무효화] 봇 자신이 발생시킨 역할 이벤트 무시: ${eventType} - ${role.name}`);
            return;
        }

        const guildId = role.guild.id;
        this.eventCounts.roleEvents++;
        
        logger.info(`[캐시무효화] 역할 이벤트 감지: ${eventType} - ${role.name} (${role.id}) in ${role.guild.name}`);

        try {
            // 역할 정보 구성
            const roleInfo = {
                id: role.id,
                name: role.name,
                color: role.color,
                position: role.position,
                permissions: role.permissions.bitfield.toString()
            };
            
            // 변경 사항 분석
            if (eventType === 'update' && oldRole) {
                roleInfo.changes = this.analyzeRoleChanges(oldRole, role);
            }
            
            // 백엔드 캐시 무효화 호출
            const result = await handleRoleEvent(guildId, roleInfo, eventType);
            
            logger.info(`[캐시무효화] 역할 캐시 무효화 완료: ${guildId} - ${result}`);

        } catch (error) {
            logger.error(`[캐시무효화] 역할 이벤트 처리 실패: ${eventType} - ${role.name}`, error);
        }
    }

    /**
     * 길드 이벤트 처리
     */
    async handleGuildEvent(eventType, guild) {
        const guildId = guild.id;
        this.eventCounts.guildEvents++;
        
        logger.info(`[캐시무효화] 길드 이벤트 감지: ${eventType} - ${guild.name} (${guild.id})`);

        try {
            // 길드 전체 캐시 무효화
            const eventInfo = {
                reason: `guild_${eventType}`,
                guildName: guild.name,
                eventSource: 'discord_guild_event'
            };
            
            const result = await evictAllGuildCache(guildId, eventInfo);
            
            logger.info(`[캐시무효화] 길드 전체 캐시 무효화 완료: ${guildId} - ${result}`);

        } catch (error) {
            logger.error(`[캐시무효화] 길드 이벤트 처리 실패: ${eventType} - ${guild.name}`, error);
        }
    }

    /**
     * 봇이 발생시킨 이벤트인지 확인
     * 최근 봇 액션 기록을 확인하여 무한 루프 방지
     */
    isBotTriggeredEvent(guild) {
        // 간단한 시간 기반 필터링 (마지막 봇 액션 후 1초 이내면 봇이 발생시킨 것으로 간주)
        const now = Date.now();
        const lastBotAction = this.lastBotActionTime?.get(guild.id) || 0;
        return (now - lastBotAction) < 1000;
    }
    
    /**
     * 봇 액션 시간 기록
     */
    recordBotAction(guildId) {
        if (!this.lastBotActionTime) {
            this.lastBotActionTime = new Map();
        }
        this.lastBotActionTime.set(guildId, Date.now());
    }

    /**
     * 채널 변경 사항 분석
     */
    analyzeChannelChanges(oldChannel, newChannel) {
        const changes = [];
        
        if (oldChannel.name !== newChannel.name) {
            changes.push({ field: 'name', from: oldChannel.name, to: newChannel.name });
        }
        
        if (oldChannel.type !== newChannel.type) {
            changes.push({ field: 'type', from: oldChannel.type, to: newChannel.type });
        }
        
        if (oldChannel.parentId !== newChannel.parentId) {
            changes.push({ field: 'parentId', from: oldChannel.parentId, to: newChannel.parentId });
        }

        // 권한 변경 확인
        if (this.hasPermissionChanges(oldChannel, newChannel)) {
            changes.push({ field: 'permissions', changed: true });
        }

        return changes;
    }

    /**
     * 역할 변경 사항 분석
     */
    analyzeRoleChanges(oldRole, newRole) {
        const changes = [];
        
        if (oldRole.name !== newRole.name) {
            changes.push({ field: 'name', from: oldRole.name, to: newRole.name });
        }
        
        if (oldRole.color !== newRole.color) {
            changes.push({ field: 'color', from: oldRole.color, to: newRole.color });
        }
        
        if (oldRole.position !== newRole.position) {
            changes.push({ field: 'position', from: oldRole.position, to: newRole.position });
        }

        if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
            changes.push({ field: 'permissions', changed: true });
        }

        return changes;
    }

    /**
     * 권한 변경 확인
     */
    hasPermissionChanges(oldChannel, newChannel) {
        if (!oldChannel.permissionOverwrites || !newChannel.permissionOverwrites) {
            return oldChannel.permissionOverwrites !== newChannel.permissionOverwrites;
        }

        const oldOverwrites = oldChannel.permissionOverwrites.cache;
        const newOverwrites = newChannel.permissionOverwrites.cache;

        if (oldOverwrites.size !== newOverwrites.size) {
            return true;
        }

        for (const [id, oldOverwrite] of oldOverwrites) {
            const newOverwrite = newOverwrites.get(id);
            if (!newOverwrite || 
                oldOverwrite.allow.bitfield !== newOverwrite.allow.bitfield ||
                oldOverwrite.deny.bitfield !== newOverwrite.deny.bitfield) {
                return true;
            }
        }

        return false;
    }


    /**
     * 수동 캐시 무효화 (관리 목적)
     */
    async manualInvalidateCache(guildId, type = 'all') {
        logger.info(`[캐시무효화] 수동 캐시 무효화 요청: ${guildId}, 타입: ${type}`);

        try {
            const eventInfo = { 
                reason: 'manual_invalidation',
                requestedAt: new Date().toISOString(),
                source: 'manual_request'
            };

            let result;
            switch (type) {
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

            logger.info(`[캐시무효화] 수동 캐시 무효화 완료: ${guildId} - ${result}`);
            return result;

        } catch (error) {
            logger.error(`[캐시무효화] 수동 캐시 무효화 실패: ${guildId}`, error);
            throw error;
        }
    }

    /**
     * 대량 길드 캐시 무효화 (봇 재시작 시 등)
     */
    async invalidateAllGuildsCache() {
        logger.info('[캐시무효화] 모든 길드 캐시 무효화 시작...');

        const guilds = this.client.guilds.cache;
        const guildIds = Array.from(guilds.keys());
        
        try {
            const { evictMultipleGuildCaches } = require('../Commands/api/cache/cache');
            const result = await evictMultipleGuildCaches(guildIds, 'all');
            
            logger.info(`[캐시무효화] 모든 길드 캐시 무효화 완료 - 성공: ${result.success}, 실패: ${result.failed}`);
            
            if (result.errors.length > 0) {
                logger.warn('[캐시무효화] 일부 길드에서 캐시 무효화 실패:', result.errors);
            }
            
            return result;
            
        } catch (error) {
            logger.error('[캐시무효화] 대량 길드 캐시 무효화 실패:', error);
            throw error;
        }
    }

    /**
     * 상태 조회
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            connectedGuilds: this.client.guilds.cache.size,
            eventCounts: { ...this.eventCounts },
            lastBotActionTimes: this.lastBotActionTime ? this.lastBotActionTime.size : 0,
            uptime: this.isInitialized ? Date.now() - this.initTime : 0
        };
    }

    /**
     * 이벤트 통계 초기화
     */
    resetEventCounts() {
        this.eventCounts = {
            channelEvents: 0,
            roleEvents: 0,
            guildEvents: 0
        };
        logger.info('[캐시무효화] 이벤트 통계 초기화 완료');
    }
}

module.exports = { CacheInvalidationHandler };