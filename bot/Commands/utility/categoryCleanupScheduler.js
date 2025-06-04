const categoryManager = require('./categoryManager');

class CategoryCleanupScheduler {
    constructor() {
        this.cleanupInterval = null;
        this.isRunning = false;
        this.defaultIntervalHours = 24; // 24시간마다 실행
        this.defaultDaysToKeep = 7; // 7일 이상 된 빈 카테고리 삭제
    }

    /**
     * 정리 스케줄러 시작
     * @param {import('discord.js').Client} client - Discord 클라이언트
     * @param {number} intervalHours - 실행 간격 (시간, 기본 24시간)
     * @param {number} daysToKeep - 보관할 일수 (기본 7일)
     */
    start(client, intervalHours = this.defaultIntervalHours, daysToKeep = this.defaultDaysToKeep) {
        if (this.isRunning) {
            console.log('[카테고리 스케줄러] 이미 실행 중입니다.');
            return;
        }

        console.log(`[카테고리 스케줄러] 시작: ${intervalHours}시간마다 ${daysToKeep}일 이상 된 카테고리 정리`);

        // 즉시 한 번 실행
        this.runCleanup(client, daysToKeep);

        // 주기적 실행 설정
        this.cleanupInterval = setInterval(() => {
            this.runCleanup(client, daysToKeep);
        }, intervalHours * 60 * 60 * 1000); // 시간을 밀리초로 변환

        this.isRunning = true;
    }

    /**
     * 정리 스케줄러 중지
     */
    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.isRunning = false;
        console.log('[카테고리 스케줄러] 중지됨');
    }

    /**
     * 모든 길드에서 카테고리 정리 실행
     * @param {import('discord.js').Client} client - Discord 클라이언트
     * @param {number} daysToKeep - 보관할 일수
     */
    async runCleanup(client, daysToKeep) {
        console.log('[카테고리 스케줄러] 정리 작업 시작');

        let totalDeleted = 0;
        let processedGuilds = 0;

        try {
            const guilds = client.guilds.cache;
            console.log(`[카테고리 스케줄러] ${guilds.size}개 길드에서 정리 실행`);

            for (const [guildId, guild] of guilds) {
                try {
                    const deletedCount = await categoryManager.cleanupOldCategories(guild, daysToKeep);
                    totalDeleted += deletedCount;
                    processedGuilds++;

                    if (deletedCount > 0) {
                        console.log(`[카테고리 스케줄러] ${guild.name}: ${deletedCount}개 카테고리 삭제`);
                    }

                } catch (guildError) {
                    console.error(`[카테고리 스케줄러] ${guild.name} 정리 실패:`, guildError);
                }
            }

            console.log(`[카테고리 스케줄러] 정리 완료: ${processedGuilds}개 길드, 총 ${totalDeleted}개 카테고리 삭제`);

        } catch (error) {
            console.error('[카테고리 스케줄러] 정리 작업 중 오류:', error);
        }
    }

    /**
     * 특정 길드의 카테고리 정리 실행
     * @param {import('discord.js').Guild} guild - 길드 객체
     * @param {number} daysToKeep - 보관할 일수
     * @returns {Promise<number>} 삭제된 카테고리 수
     */
    async runGuildCleanup(guild, daysToKeep = this.defaultDaysToKeep) {
        try {
            console.log(`[카테고리 스케줄러] ${guild.name} 수동 정리 시작`);
            const deletedCount = await categoryManager.cleanupOldCategories(guild, daysToKeep);
            console.log(`[카테고리 스케줄러] ${guild.name} 수동 정리 완료: ${deletedCount}개 카테고리 삭제`);
            return deletedCount;
        } catch (error) {
            console.error(`[카테고리 스케줄러] ${guild.name} 수동 정리 실패:`, error);
            return 0;
        }
    }

    /**
     * 스케줄러 상태 조회
     * @returns {Object} 스케줄러 상태 정보
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            hasInterval: !!this.cleanupInterval,
            defaultIntervalHours: this.defaultIntervalHours,
            defaultDaysToKeep: this.defaultDaysToKeep
        };
    }

    /**
     * 다음 정리 예정 시간 계산 (대략적)
     * @param {number} intervalHours - 실행 간격 (시간)
     * @returns {Date|null} 다음 실행 예정 시간
     */
    getNextCleanupTime(intervalHours = this.defaultIntervalHours) {
        if (!this.isRunning) return null;
        
        const next = new Date();
        next.setHours(next.getHours() + intervalHours);
        return next;
    }
}

// 싱글턴 인스턴스 생성
const categoryCleanupScheduler = new CategoryCleanupScheduler();

module.exports = categoryCleanupScheduler;