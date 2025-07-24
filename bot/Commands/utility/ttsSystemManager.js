const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

/**
 * TTS 시스템 관리자
 * 파일 정리, 헬스 체크, 시스템 모니터링을 담당
 */
class TTSSystemManager {
    constructor() {
        this.tempDir = process.env.TTS_TEMP_DIR || './temp/tts';
        this.cleanupInterval = null;
        this.healthCheckInterval = null;
        this.isRunning = false;
        
        // 통계 정보
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            filesCreated: 0,
            filesDeleted: 0,
            totalAudioDuration: 0,
            lastCleanup: null,
            lastHealthCheck: null
        };

        console.log('[TTSSystemManager] TTS 시스템 관리자가 초기화되었습니다.');
    }

    /**
     * 시스템 시작
     */
    start() {
        if (this.isRunning) {
            console.log('[TTSSystemManager] 이미 실행 중입니다.');
            return;
        }

        this.isRunning = true;
        this.setupCleanupScheduler();
        this.setupHealthCheckScheduler();
        this.ensureTempDirectory();
        
        console.log('[TTSSystemManager] TTS 시스템 관리자가 시작되었습니다.');
    }

    /**
     * 시스템 중지
     */
    stop() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;

        if (this.cleanupInterval) {
            this.cleanupInterval.destroy();
            this.cleanupInterval = null;
        }

        if (this.healthCheckInterval) {
            this.healthCheckInterval.destroy();
            this.healthCheckInterval = null;
        }

        console.log('[TTSSystemManager] TTS 시스템 관리자가 중지되었습니다.');
    }

    /**
     * 임시 디렉토리 생성
     */
    ensureTempDirectory() {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
            console.log(`[TTSSystemManager] 임시 디렉토리 생성: ${this.tempDir}`);
        }
    }

    /**
     * 정리 스케줄러 설정 (5분마다 실행)
     */
    setupCleanupScheduler() {
        // 5분마다 오래된 파일 정리
        this.cleanupInterval = cron.schedule('*/5 * * * *', () => {
            this.cleanupOldFiles();
        }, {
            scheduled: true,
            timezone: "Asia/Seoul"
        });

        console.log('[TTSSystemManager] 파일 정리 스케줄러가 설정되었습니다. (5분마다 실행)');
    }

    /**
     * 헬스 체크 스케줄러 설정 (30분마다 실행)
     */
    setupHealthCheckScheduler() {
        // 30분마다 시스템 상태 체크
        this.healthCheckInterval = cron.schedule('*/30 * * * *', () => {
            this.performHealthCheck();
        }, {
            scheduled: true,
            timezone: "Asia/Seoul"
        });

        console.log('[TTSSystemManager] 헬스 체크 스케줄러가 설정되었습니다. (30분마다 실행)');
    }

    /**
     * 오래된 파일 정리 (10분 이상된 파일)
     */
    async cleanupOldFiles() {
        try {
            if (!fs.existsSync(this.tempDir)) {
                return;
            }

            const files = await fs.promises.readdir(this.tempDir);
            const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
            let deletedCount = 0;

            for (const file of files) {
                try {
                    const filepath = path.join(this.tempDir, file);
                    const stats = await fs.promises.stat(filepath);
                    
                    // 10분 이상된 파일 삭제
                    if (stats.mtime.getTime() < tenMinutesAgo) {
                        await fs.promises.unlink(filepath);
                        deletedCount++;
                        this.stats.filesDeleted++;
                    }
                } catch (error) {
                    console.error(`[TTSSystemManager] 파일 삭제 실패 (${file}):`, error.message);
                }
            }

            if (deletedCount > 0) {
                console.log(`[TTSSystemManager] 오래된 TTS 파일 ${deletedCount}개를 정리했습니다.`);
            }

            this.stats.lastCleanup = new Date();

        } catch (error) {
            console.error('[TTSSystemManager] 파일 정리 실패:', error);
        }
    }

    /**
     * 시스템 헬스 체크
     */
    async performHealthCheck() {
        try {
            const health = {
                timestamp: new Date(),
                tempDirExists: fs.existsSync(this.tempDir),
                tempDirSize: 0,
                tempFileCount: 0,
                diskSpaceCheck: true,
                memoryUsage: process.memoryUsage(),
                systemUptime: process.uptime()
            };

            // 임시 디렉토리 상태 확인
            if (health.tempDirExists) {
                try {
                    const files = await fs.promises.readdir(this.tempDir);
                    health.tempFileCount = files.length;

                    // 디렉토리 크기 계산
                    for (const file of files) {
                        try {
                            const filepath = path.join(this.tempDir, file);
                            const stats = await fs.promises.stat(filepath);
                            health.tempDirSize += stats.size;
                        } catch (error) {
                            // 개별 파일 오류는 무시
                        }
                    }
                } catch (error) {
                    console.error('[TTSSystemManager] 임시 디렉토리 확인 실패:', error);
                }
            }

            // 메모리 사용량 체크 (500MB 이상이면 경고)
            const memoryUsageMB = health.memoryUsage.heapUsed / 1024 / 1024;
            if (memoryUsageMB > 500) {
                console.warn(`[TTSSystemManager] 높은 메모리 사용량 감지: ${memoryUsageMB.toFixed(2)}MB`);
            }

            // 임시 파일이 너무 많으면 경고 (100개 이상)
            if (health.tempFileCount > 100) {
                console.warn(`[TTSSystemManager] 임시 파일이 많습니다: ${health.tempFileCount}개`);
                // 즉시 정리 실행
                await this.cleanupOldFiles();
            }

            this.stats.lastHealthCheck = health.timestamp;

            console.log(`[TTSSystemManager] 헬스 체크 완료 - 파일: ${health.tempFileCount}개, 크기: ${(health.tempDirSize / 1024 / 1024).toFixed(2)}MB`);

        } catch (error) {
            console.error('[TTSSystemManager] 헬스 체크 실패:', error);
        }
    }

    /**
     * 통계 업데이트
     * @param {string} type - 통계 타입
     * @param {number} value - 값
     */
    updateStats(type, value = 1) {
        switch (type) {
            case 'request':
                this.stats.totalRequests += value;
                break;
            case 'success':
                this.stats.successfulRequests += value;
                break;
            case 'failure':
                this.stats.failedRequests += value;
                break;
            case 'file_created':
                this.stats.filesCreated += value;
                break;
            case 'file_deleted':
                this.stats.filesDeleted += value;
                break;
            case 'audio_duration':
                this.stats.totalAudioDuration += value;
                break;
        }
    }

    /**
     * 통계 정보 가져오기
     * @returns {Object} 통계 정보
     */
    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.totalRequests > 0 
                ? ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(2) + '%'
                : '0%',
            averageAudioDuration: this.stats.successfulRequests > 0
                ? (this.stats.totalAudioDuration / this.stats.successfulRequests).toFixed(2) + 's'
                : '0s',
            isRunning: this.isRunning
        };
    }

    /**
     * 임시 디렉토리 상태 확인
     * @returns {Promise<Object>} 디렉토리 상태
     */
    async getTempDirStatus() {
        try {
            if (!fs.existsSync(this.tempDir)) {
                return {
                    exists: false,
                    fileCount: 0,
                    totalSize: 0,
                    files: []
                };
            }

            const files = await fs.promises.readdir(this.tempDir);
            let totalSize = 0;
            const fileDetails = [];

            for (const file of files) {
                try {
                    const filepath = path.join(this.tempDir, file);
                    const stats = await fs.promises.stat(filepath);
                    
                    totalSize += stats.size;
                    fileDetails.push({
                        name: file,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime,
                        ageMinutes: Math.floor((Date.now() - stats.mtime.getTime()) / 1000 / 60)
                    });
                } catch (error) {
                    // 개별 파일 오류는 무시
                }
            }

            return {
                exists: true,
                fileCount: files.length,
                totalSize: totalSize,
                totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
                files: fileDetails.sort((a, b) => b.modified - a.modified) // 최신 순 정렬
            };

        } catch (error) {
            console.error('[TTSSystemManager] 임시 디렉토리 상태 확인 실패:', error);
            return {
                exists: false,
                error: error.message
            };
        }
    }

    /**
     * 즉시 파일 정리 실행
     */
    async forceCleanup() {
        console.log('[TTSSystemManager] 즉시 파일 정리를 실행합니다...');
        await this.cleanupOldFiles();
    }

    /**
     * 모든 임시 파일 삭제 (긴급 상황용)
     */
    async emergencyCleanup() {
        try {
            console.log('[TTSSystemManager] 긴급 파일 정리를 실행합니다...');
            
            if (!fs.existsSync(this.tempDir)) {
                return { deleted: 0, errors: 0 };
            }

            const files = await fs.promises.readdir(this.tempDir);
            let deletedCount = 0;
            let errorCount = 0;

            for (const file of files) {
                try {
                    const filepath = path.join(this.tempDir, file);
                    await fs.promises.unlink(filepath);
                    deletedCount++;
                    this.stats.filesDeleted++;
                } catch (error) {
                    errorCount++;
                    console.error(`[TTSSystemManager] 긴급 정리 실패 (${file}):`, error.message);
                }
            }

            console.log(`[TTSSystemManager] 긴급 정리 완료 - 삭제: ${deletedCount}개, 실패: ${errorCount}개`);
            
            return { deleted: deletedCount, errors: errorCount };

        } catch (error) {
            console.error('[TTSSystemManager] 긴급 파일 정리 실패:', error);
            throw error;
        }
    }
}

// 싱글톤 인스턴스
let instance = null;

module.exports = {
    getInstance() {
        if (!instance) {
            instance = new TTSSystemManager();
        }
        return instance;
    },
    
    TTSSystemManager
};