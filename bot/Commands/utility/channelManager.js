const redisManager = require('./redis');

class ChannelManager {
    constructor() {
        this.keyPrefix = 'user_private_channels';
        this.defaultTTL = 3600 * 24 * 7; // 7일
    }

    /**
     * 사용자의 전용 채널 정보 조회
     * @param {string} userId - 사용자 ID
     * @param {string} guildId - 길드 ID
     * @returns {Promise<Object|null>} 채널 데이터 또는 null
     */
    async getUserPrivateChannel(userId, guildId) {
        const key = `${this.keyPrefix}:${guildId}`;
        const channelData = await redisManager.getHash(key, userId);
        
        console.log(`[Redis] 사용자 ${userId}의 채널 정보 조회: ${channelData ? '존재함' : '없음'}`);
        return channelData;
    }

    /**
     * 사용자의 전용 채널 정보 저장
     * @param {string} userId - 사용자 ID
     * @param {string} guildId - 길드 ID
     * @param {string} channelId - 채널 ID
     * @param {string} roleId - 역할 ID
     * @returns {Promise<Object>} 저장된 채널 데이터
     */
    async setUserPrivateChannel(userId, guildId, channelId, roleId) {
        const key = `${this.keyPrefix}:${guildId}`;
        const channelData = {
            channelId,
            roleId,
            createdAt: Date.now(),
            lastUsed: Date.now()
        };

        await redisManager.setHash(key, userId, channelData, this.defaultTTL);
        console.log(`[Redis] 사용자 ${userId}의 채널 정보 저장: ${channelId}`);
        return channelData;
    }

    /**
     * 채널 사용 시간 업데이트
     * @param {string} userId - 사용자 ID
     * @param {string} guildId - 길드 ID
     */
    async updateChannelLastUsed(userId, guildId) {
        const key = `${this.keyPrefix}:${guildId}`;
        const channelData = await this.getUserPrivateChannel(userId, guildId);
        
        if (channelData) {
            channelData.lastUsed = Date.now();
            await redisManager.setHash(key, userId, channelData, this.defaultTTL);
            console.log(`[Redis] 사용자 ${userId}의 채널 사용 시간 업데이트`);
        }
    }

    /**
     * 사용자의 전용 채널 삭제
     * @param {string} userId - 사용자 ID
     * @param {string} guildId - 길드 ID
     */
    async deleteUserPrivateChannel(userId, guildId) {
        const key = `${this.keyPrefix}:${guildId}`;
        await redisManager.deleteField(key, userId);
        console.log(`[Redis] 사용자 ${userId}의 채널 정보 삭제`);
    }

    /**
     * 길드의 모든 사용자 채널 정보 조회
     * @param {string} guildId - 길드 ID
     * @returns {Promise<Object|null>} 모든 사용자 채널 데이터
     */
    async getAllUserChannels(guildId) {
        const key = `${this.keyPrefix}:${guildId}`;
        const allChannels = await redisManager.getAllHashFields(key);
        console.log(`[Redis] 길드 ${guildId}의 모든 사용자 채널 조회: ${Object.keys(allChannels || {}).length}개`);
        return allChannels;
    }

    /**
     * 만료된 채널 정보 정리
     * @param {string} guildId - 길드 ID
     * @param {number} maxAge - 최대 보관 기간 (밀리초, 기본 7일)
     */
    async cleanupExpiredChannels(guildId, maxAge = 7 * 24 * 60 * 60 * 1000) {
        const allChannels = await this.getAllUserChannels(guildId);
        if (!allChannels) return;

        const now = Date.now();
        let cleanedCount = 0;

        for (const [userId, channelData] of Object.entries(allChannels)) {
            if (channelData && channelData.lastUsed) {
                const age = now - channelData.lastUsed;
                if (age > maxAge) {
                    await this.deleteUserPrivateChannel(userId, guildId);
                    cleanedCount++;
                }
            }
        }

        console.log(`[Redis] 길드 ${guildId}에서 ${cleanedCount}개의 만료된 채널 정보 정리 완료`);
        return cleanedCount;
    }
}

module.exports = new ChannelManager();