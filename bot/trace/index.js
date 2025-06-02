/**
 * 추적 시스템 메인 엔트리
 * 모든 추적 관련 기능을 통합 제공
 */

const tracer = require('./AsyncTraceLogger');
const proxyTracer = require('./ProxyTracer');

// 자주 사용되는 유틸리티 모듈들을 미리 래핑
const tracedModules = {
    // 기존 모듈들을 프록시로 래핑하여 export
    get redis() {
        return proxyTracer.wrap(require('../Commands/utility/redis'), 'redis');
    },
    
    get database() {
        const mysql = require('mysql2/promise');
        return proxyTracer.wrap(mysql, 'mysql');
    },
    
    get axios() {
        return proxyTracer.wrap(require('axios'), 'axios');
    },
    
    // 음악 관련 모듈들
    get MusicPlayer() {
        const MusicPlayerV4 = require('../Commands/utility/v4/MusicPlayerV4');
        return proxyTracer.wrap(MusicPlayerV4, 'MusicPlayerV4');
    },
    
    get AudioEngine() {
        const AudioEngineV4 = require('../Commands/utility/v4/AudioEngineV4');
        return proxyTracer.wrap(AudioEngineV4, 'AudioEngineV4');
    },
    
    get QueueManager() {
        const QueueManagerV4 = require('../Commands/utility/v4/QueueManagerV4');
        return proxyTracer.wrap(QueueManagerV4, 'QueueManagerV4');
    }
};

/**
 * 명령 실행을 추적하는 헬퍼 함수
 */
async function traceCommand(commandName, executeFunction) {
    return tracer.runWithTrace(`명령:${commandName}`, executeFunction);
}

/**
 * 이벤트 실행을 추적하는 헬퍼 함수
 */
async function traceEvent(eventName, executeFunction) {
    return tracer.runWithTrace(`이벤트:${eventName}`, executeFunction);
}

/**
 * 추적 시스템 초기화
 */
function initializeTracing() {
    console.log('🔍 추적 시스템 초기화 중...');
    
    // 환경 변수 확인
    if (process.env.TRACE_ENABLED === 'false') {
        console.log('⚠️  추적 시스템이 비활성화되어 있습니다.');
        return;
    }
    
    // require 함수 자동 래핑 활성화 (선택적)
    if (process.env.TRACE_AUTO_WRAP === 'true') {
        proxyTracer.wrapRequire();
        console.log('✅ 자동 모듈 래핑 활성화됨');
    }
    
    console.log('✅ 추적 시스템 초기화 완료');
    console.log(`   - 로그 디렉토리: ${tracer.config.logDirectory}`);
    console.log(`   - 파일 로깅: ${tracer.config.logToFile ? '활성화' : '비활성화'}`);
    console.log(`   - 최대 추적 깊이: ${tracer.config.maxDepth}`);
}

// 추적된 유틸리티 함수들
const tracedUtils = {
    /**
     * 지연 실행 (추적 포함)
     */
    async delay(ms) {
        const context = tracer.getCurrentContext();
        if (context) {
            tracer.log(`${ms}ms 대기 시작`);
        }
        
        await new Promise(resolve => setTimeout(resolve, ms));
        
        if (context) {
            tracer.log(`${ms}ms 대기 완료`);
        }
    },
    
    /**
     * 재시도 로직 (추적 포함)
     */
    async retry(fn, options = {}) {
        const { retries = 3, delay = 1000, factor = 2 } = options;
        const context = tracer.getCurrentContext();
        
        for (let i = 0; i < retries; i++) {
            try {
                if (context && i > 0) {
                    tracer.log(`재시도 ${i + 1}/${retries}`);
                }
                
                return await fn();
            } catch (error) {
                if (i === retries - 1) throw error;
                
                const waitTime = delay * Math.pow(factor, i);
                if (context) {
                    tracer.log(`실패. ${waitTime}ms 후 재시도...`);
                }
                
                await this.delay(waitTime);
            }
        }
    }
};

module.exports = {
    // 핵심 추적 기능
    tracer,
    proxyTracer,
    
    // 헬퍼 함수
    traceCommand,
    traceEvent,
    initializeTracing,
    
    // 추적된 모듈들
    modules: tracedModules,
    
    // 유틸리티
    utils: tracedUtils,
    
    // 프록시 래핑 함수 (수동 래핑용)
    wrap: (module, name) => proxyTracer.wrap(module, name)
};