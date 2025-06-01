const MusicPlayerV4 = require('./v4/MusicPlayerV4');
const logger = require('./logger');

/**
 * Music System Adapter for v4 Migration
 * 모든 음악 관련 기능을 v4로 통합하는 어댑터
 */
class MusicSystemAdapter {
    /**
     * 플레이어 인스턴스 가져오기 또는 생성
     * @param {Client} client 
     * @param {string} guildId 
     * @param {User} user 
     * @returns {MusicPlayer}
     */
    static async getPlayer(client, guildId, user) {
        // serverMusicData Map 초기화
        if (!client.serverMusicData) {
            client.serverMusicData = new Map();
        }

        let player = client.serverMusicData.get(guildId);
        
        // 기존 플레이어가 없거나 v4가 아닌 경우
        if (!player || !player.version || player.version !== 'v4') {
            logger.info(`[MusicSystemAdapter] Creating new v4 player for guild ${guildId}`);
            
            // 기존 플레이어 정리
            if (player) {
                try {
                    if (player.destroy) {
                        await player.destroy();
                    }
                } catch (error) {
                    logger.error(`[MusicSystemAdapter] Error cleaning up old player:`, error);
                }
            }
            
            // v4 플레이어 생성
            player = new MusicPlayerV4(guildId, client, user);
            client.serverMusicData.set(guildId, player);
        } else {
            // 사용자 정보 업데이트
            if (user && player.user !== user) {
                player.user = user;
            }
        }

        return player;
    }

    /**
     * 볼륨 설정 (레거시 호환)
     * @param {Client} client 
     * @param {string} guildId 
     * @param {number} volume (0-100)
     */
    static async setVolume(client, guildId, volume) {
        const player = await this.getPlayer(client, guildId);
        await player.setVolume(volume / 100);
        return `음량이 ${volume}%로 설정되었습니다.`;
    }

    /**
     * 플레이리스트 업데이트 (YouTube/로컬 파일 변경 시)
     * @param {Client} client 
     * @param {string} guildId 
     * @param {string} source 'youtube' | 'local'
     */
    static async refreshPlaylist(client, guildId, source = null) {
        const player = await this.getPlayer(client, guildId);
        
        // v4에서는 소스 전환으로 처리
        if (source === 'youtube') {
            await player.queue.loadFromSource('youtube');
        } else if (source === 'local') {
            await player.queue.loadFromSource('local', player.user?.id);
        }
        
        logger.info(`[MusicSystemAdapter] Playlist refreshed for ${source || 'all sources'}`);
        
        // UI 업데이트
        await player.updateUI('Playlist refreshed');
    }

    /**
     * 플레이어 상태 확인
     * @param {Client} client 
     * @param {string} guildId 
     */
    static async checkHealth(client, guildId) {
        if (!client.serverMusicData?.has(guildId)) {
            return { exists: false };
        }

        const player = client.serverMusicData.get(guildId);
        
        // v4 플레이어 체크
        if (player.healthCheck) {
            return {
                exists: true,
                version: player.version || 'unknown',
                health: player.healthCheck()
            };
        }

        // 알 수 없는 버전
        return {
            exists: true,
            version: 'unknown',
            health: { status: 'unknown' }
        };
    }

    /**
     * 플레이어 정리
     * @param {Client} client 
     * @param {string} guildId 
     */
    static async cleanup(client, guildId) {
        if (!client.serverMusicData?.has(guildId)) {
            return;
        }

        const player = client.serverMusicData.get(guildId);
        
        try {
            if (player.destroy) {
                await player.destroy();
            }
            client.serverMusicData.delete(guildId);
            logger.info(`[MusicSystemAdapter] Player cleaned up for guild ${guildId}`);
        } catch (error) {
            logger.error(`[MusicSystemAdapter] Error during cleanup:`, error);
        }
    }

    /**
     * 모든 플레이어 정리 (봇 종료 시)
     * @param {Client} client 
     */
    static async cleanupAll(client) {
        if (!client.serverMusicData) return;

        const cleanupPromises = [];
        
        for (const [guildId, player] of client.serverMusicData) {
            cleanupPromises.push(this.cleanup(client, guildId));
        }

        await Promise.all(cleanupPromises);
        logger.info(`[MusicSystemAdapter] All players cleaned up`);
    }

    /**
     * v3 호환성 메서드 (필요시)
     */
    static async migrateFromV3(client) {
        logger.info('[MusicSystemAdapter] Migrating from v3 to v4...');
        
        if (!client.serverMusicData) return;
        
        for (const [guildId, player] of client.serverMusicData) {
            if (player.version === 'v3') {
                try {
                    await player.destroy();
                    client.serverMusicData.delete(guildId);
                    logger.info(`[MusicSystemAdapter] Migrated guild ${guildId} from v3`);
                } catch (error) {
                    logger.error(`[MusicSystemAdapter] Migration error for guild ${guildId}:`, error);
                }
            }
        }
    }
}

module.exports = { MusicSystemAdapter };