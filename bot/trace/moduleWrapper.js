const proxyTracer = require('./ProxyTracer');
const path = require('path');

/**
 * 모든 유틸리티 모듈을 자동으로 프록시로 래핑
 * Commands/utility 디렉토리의 모든 모듈을 추적 가능하게 만듭니다.
 */

// 래핑할 모듈 경로 매핑
const moduleMapping = {
    // 데이터베이스 및 캐시
    redis: '../Commands/utility/redis',
    
    // 로거는 제외 (순환 참조 방지)
    // logger: '../Commands/utility/logger',
    
    // 유틸리티 함수들
    updateActivity: '../Commands/utility/updateActivity',
    termsSender: '../Commands/utility/termsSender',
    deleteMsg: '../Commands/utility/deleteMsg',
    cleaner: '../Commands/utility/cleaner',
    server: '../Commands/utility/server',
    ping: '../Commands/utility/ping',
    
    // 사용자 관련
    user: '../Commands/utility/user',
    UserinfoInRedis: '../Commands/utility/UserinfoInRedis',
    userInfoToImage: '../Commands/utility/userInfoToImage',
    addObserverPemission: '../Commands/utility/addObserverPemission',
    
    // 음악 시스템 V3
    MusicPlayer: '../Commands/utility/v3/MusicPlayer',
    AudioEngine: '../Commands/utility/v3/AudioEngine',
    PlaylistEngine: '../Commands/utility/v3/PlaylistEngine',
    StateManager: '../Commands/utility/v3/StateManager',
    UIEngine: '../Commands/utility/v3/UIEngine',
    
    // 음악 시스템 V4
    MusicPlayerV4: '../Commands/utility/v4/MusicPlayerV4',
    AudioEngineV4: '../Commands/utility/v4/AudioEngineV4',
    QueueManagerV4: '../Commands/utility/v4/QueueManagerV4',
    UIManagerV4: '../Commands/utility/v4/UIManagerV4',
    DebugLogger: '../Commands/utility/v4/DebugLogger',
    
    // 기타 유틸리티
    MusicSystemAdapter: '../Commands/utility/MusicSystemAdapter',
    Debounce: '../Commands/utility/Debounce',
    broadcastGameStart: '../Commands/utility/broadcastGameStart',
    buttonsBuilder: '../Commands/utility/buttonsBuilder',
    delimiterGeter: '../Commands/utility/delimiterGeter',
    ytdlpUpdate: '../Commands/utility/ytdlpUpdate',
    
    // API 모듈들
    channelApi: '../Commands/api/channel/channel',
    characterApi: '../Commands/api/character/character',
    couponApi: '../Commands/api/coupon/coupon',
    guildApi: '../Commands/api/guild/guild',
    musicApi: '../Commands/api/guild/music',
    observerApi: '../Commands/api/guild/observer',
    historyApi: '../Commands/api/history/history',
    messageMacroApi: '../Commands/api/messageMacro/messageMacro',
    passwordNoteApi: '../Commands/api/passwordNote/passwordNote',
    permissionApi: '../Commands/api/user/permission',
    userApi: '../Commands/api/user/user'
};

/**
 * 모든 모듈을 래핑하여 반환
 */
function wrapAllModules() {
    const wrapped = {};
    
    for (const [name, modulePath] of Object.entries(moduleMapping)) {
        try {
            // 모듈 로드
            const module = require(modulePath);
            
            // 프록시로 래핑
            wrapped[name] = proxyTracer.wrap(module, name);
            
            console.log(`✅ ${name} 모듈 추적 활성화`);
        } catch (error) {
            console.warn(`⚠️  ${name} 모듈 로드 실패:`, error.message);
        }
    }
    
    return wrapped;
}

/**
 * require 함수를 오버라이드하여 자동 래핑
 * 주의: 이 기능은 신중하게 사용해야 합니다.
 */
function enableAutoWrapping() {
    const Module = require('module');
    const originalRequire = Module.prototype.require;
    
    Module.prototype.require = function(id) {
        const module = originalRequire.apply(this, arguments);
        
        // Commands/utility 또는 Commands/api 경로인 경우 자동 래핑
        if (typeof id === 'string' && 
            (id.includes('/Commands/utility/') || id.includes('/Commands/api/'))) {
            
            // 로거는 제외
            if (!id.includes('logger')) {
                const moduleName = path.basename(id, '.js');
                return proxyTracer.wrap(module, moduleName);
            }
        }
        
        return module;
    };
    
    console.log('✅ 자동 모듈 래핑 활성화됨');
}

/**
 * 특정 모듈만 선택적으로 래핑
 */
function wrapModule(module, name) {
    return proxyTracer.wrap(module, name);
}

module.exports = {
    wrapAllModules,
    enableAutoWrapping,
    wrapModule,
    
    // 래핑된 모듈들을 바로 사용할 수 있도록 export
    modules: wrapAllModules()
};