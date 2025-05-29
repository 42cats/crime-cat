/**
 * EventBus v2.0
 * 통합 이벤트 관리 시스템
 * 
 * 특징:
 * - 타입 안전한 이벤트 시스템
 * - 이벤트 히스토리 추적
 * - 성능 모니터링
 * - 메모리 누수 방지
 */

const { EventEmitter } = require('events');

class EventBus extends EventEmitter {
    constructor() {
        super();
        
        // 이벤트 히스토리 (디버깅용)
        this.eventHistory = [];
        this.maxHistorySize = 100;
        
        // 성능 모니터링
        this.eventStats = new Map();
        
        // 메모리 누수 방지
        this.setMaxListeners(50);
        
        console.log('[EventBus v2.0] Initialized');
    }

    /**
     * 이벤트 발생 (성능 모니터링 포함)
     */
    emit(eventName, data = null) {
        const startTime = Date.now();
        
        // 히스토리 기록
        this.addToHistory(eventName, data, 'emit');
        
        // 이벤트 발생
        const result = super.emit(eventName, data);
        
        // 성능 기록
        this.recordPerformance(eventName, Date.now() - startTime);
        
        return result;
    }

    /**
     * 이벤트 리스너 등록 (추적 포함)
     */
    on(eventName, listener) {
        this.addToHistory(eventName, null, 'on');
        return super.on(eventName, listener);
    }

    /**
     * 일회성 이벤트 리스너
     */
    once(eventName, listener) {
        this.addToHistory(eventName, null, 'once');
        return super.once(eventName, listener);
    }

    /**
     * 이벤트 리스너 제거
     */
    off(eventName, listener) {
        this.addToHistory(eventName, null, 'off');
        return super.off(eventName, listener);
    }

    /**
     * 모든 리스너 제거
     */
    removeAllListeners(eventName) {
        this.addToHistory(eventName || 'ALL', null, 'removeAll');
        return super.removeAllListeners(eventName);
    }

    /**
     * 히스토리에 이벤트 기록
     */
    addToHistory(eventName, data, action) {
        const record = {
            timestamp: new Date().toISOString(),
            action,
            eventName,
            dataType: data ? typeof data : 'null',
            listenerCount: this.listenerCount(eventName)
        };

        this.eventHistory.push(record);
        
        // 히스토리 크기 제한
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }

    /**
     * 성능 통계 기록
     */
    recordPerformance(eventName, duration) {
        if (!this.eventStats.has(eventName)) {
            this.eventStats.set(eventName, {
                count: 0,
                totalTime: 0,
                avgTime: 0,
                maxTime: 0
            });
        }

        const stats = this.eventStats.get(eventName);
        stats.count++;
        stats.totalTime += duration;
        stats.avgTime = stats.totalTime / stats.count;
        stats.maxTime = Math.max(stats.maxTime, duration);

        // 성능 경고 (평균 100ms 초과)
        if (stats.avgTime > 100) {
            console.warn(`[EventBus] Performance warning: ${eventName} avg time ${stats.avgTime.toFixed(2)}ms`);
        }
    }

    /**
     * 타입 안전한 이벤트 발생
     */
    emitSafe(eventName, data, expectedType = null) {
        try {
            if (expectedType && data && typeof data !== expectedType) {
                throw new Error(`Event ${eventName} expects ${expectedType}, got ${typeof data}`);
            }
            
            return this.emit(eventName, data);
        } catch (error) {
            console.error(`[EventBus] Safe emit failed for ${eventName}:`, error);
            this.emit('eventbus.error', { eventName, error, data });
            return false;
        }
    }

    /**
     * 조건부 이벤트 발생
     */
    emitIf(condition, eventName, data) {
        if (condition) {
            return this.emit(eventName, data);
        }
        return false;
    }

    /**
     * 지연 이벤트 발생
     */
    emitDelayed(eventName, data, delayMs = 0) {
        setTimeout(() => {
            this.emit(eventName, data);
        }, delayMs);
    }

    /**
     * 배치 이벤트 발생
     */
    emitBatch(events) {
        const results = [];
        for (const { eventName, data } of events) {
            results.push(this.emit(eventName, data));
        }
        return results;
    }

    /**
     * Promise 기반 이벤트 대기
     */
    waitFor(eventName, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.off(eventName, handler);
                reject(new Error(`Event ${eventName} timeout after ${timeout}ms`));
            }, timeout);

            const handler = (data) => {
                clearTimeout(timer);
                resolve(data);
            };

            this.once(eventName, handler);
        });
    }

    /**
     * 이벤트 파이프라인 (체이닝)
     */
    pipeline(startEventName, ...transforms) {
        this.on(startEventName, async (data) => {
            let result = data;
            
            for (const transform of transforms) {
                if (typeof transform === 'function') {
                    result = await transform(result);
                } else if (typeof transform === 'string') {
                    this.emit(transform, result);
                }
            }
        });
    }

    /**
     * 디버그 정보 출력
     */
    getDebugInfo() {
        return {
            listenerCounts: this.eventNames().reduce((acc, name) => {
                acc[name] = this.listenerCount(name);
                return acc;
            }, {}),
            recentHistory: this.eventHistory.slice(-10),
            performanceStats: Object.fromEntries(this.eventStats),
            memoryUsage: {
                maxListeners: this.getMaxListeners(),
                totalListeners: this.eventNames().reduce((sum, name) => sum + this.listenerCount(name), 0)
            }
        };
    }

    /**
     * 헬스 체크
     */
    healthCheck() {
        const totalListeners = this.eventNames().reduce((sum, name) => sum + this.listenerCount(name), 0);
        const suspiciousEvents = Array.from(this.eventStats.entries())
            .filter(([name, stats]) => stats.avgTime > 200)
            .map(([name, stats]) => ({ name, avgTime: stats.avgTime }));

        return {
            status: totalListeners < 100 && suspiciousEvents.length === 0 ? 'healthy' : 'warning',
            totalListeners,
            suspiciousEvents,
            maxListeners: this.getMaxListeners()
        };
    }

    /**
     * 리소스 정리
     */
    destroy() {
        console.log('[EventBus v2.0] Destroying...');
        
        // 모든 리스너 제거
        this.removeAllListeners();
        
        // 히스토리 및 통계 정리
        this.eventHistory = [];
        this.eventStats.clear();
        
        console.log('[EventBus v2.0] Destroyed');
    }
}

// 이벤트 타입 정의 (문서화용)
EventBus.Events = {
    // 플레이어 이벤트
    PLAYER_STATE_CHANGED: 'player.stateChanged',
    PLAYER_TRACK_ENDED: 'player.trackEnded',
    PLAYER_ERROR: 'player.error',
    
    // 플레이리스트 이벤트
    PLAYLIST_UPDATED: 'playlist.updated',
    PLAYLIST_ITEM_ADDED: 'playlist.itemAdded',
    PLAYLIST_ITEM_REMOVED: 'playlist.itemRemoved',
    
    // UI 이벤트
    UI_INTERACTION: 'ui.interaction',
    UI_UPDATE_REQUIRED: 'ui.updateRequired',
    UI_ERROR: 'ui.error',
    
    // 상태 이벤트
    STATE_CHANGED: 'state.changed',
    
    // 시스템 이벤트
    ERROR: 'error',
    EVENTBUS_ERROR: 'eventbus.error'
};

module.exports = { EventBus };