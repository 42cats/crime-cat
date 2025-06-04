const fs = require('fs');
const path = require('path');

/**
 * v4 Debug Logger
 * 상세한 디버깅 정보를 제공하는 로거
 */
class DebugLogger {
    constructor(component, guildId) {
        this.component = component;
        this.guildId = guildId;
        this.isDebugMode = process.env.DEBUG_MODE === 'true';
        this.logToFile = process.env.LOG_TO_FILE === 'true';
        this.logFilePath = path.join(__dirname, '../../../../logs', `music-v4-${guildId}.log`);
    }

    /**
     * 로그 포맷터
     */
    formatLog(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level}] [${this.component}] [Guild:${this.guildId}]`;
        
        let logMessage = `${prefix} ${message}`;
        
        if (data) {
            if (typeof data === 'object') {
                try {
                    logMessage += '\n' + JSON.stringify(data, null, 2);
                } catch (e) {
                    logMessage += '\n[Circular object - cannot stringify]';
                }
            } else {
                logMessage += ' ' + data;
            }
        }
        
        return logMessage;
    }

    /**
     * 파일에 로그 기록
     */
    writeToFile(logMessage) {
        if (!this.logToFile) return;
        
        try {
            const dir = path.dirname(this.logFilePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.appendFileSync(this.logFilePath, logMessage + '\n');
        } catch (error) {
            console.error('[DebugLogger] Failed to write to file:', error);
        }
    }

    /**
     * 디버그 로그
     */
    debug(message, data = null) {
        if (!this.isDebugMode) return;
        
        const logMessage = this.formatLog('DEBUG', message, data);
        console.log('\x1b[36m%s\x1b[0m', logMessage); // Cyan
        this.writeToFile(logMessage);
    }

    /**
     * 정보 로그
     */
    info(message, data = null) {
        const logMessage = this.formatLog('INFO', message, data);
        console.log('\x1b[32m%s\x1b[0m', logMessage); // Green
        this.writeToFile(logMessage);
    }

    /**
     * 경고 로그
     */
    warn(message, data = null) {
        const logMessage = this.formatLog('WARN', message, data);
        console.warn('\x1b[33m%s\x1b[0m', logMessage); // Yellow
        this.writeToFile(logMessage);
    }

    /**
     * 에러 로그
     */
    error(message, error = null) {
        const errorData = error ? {
            message: error.message,
            stack: error.stack,
            code: error.code
        } : null;
        
        const logMessage = this.formatLog('ERROR', message, errorData);
        console.error('\x1b[31m%s\x1b[0m', logMessage); // Red
        this.writeToFile(logMessage);
    }

    /**
     * 성능 측정 시작
     */
    startTimer(operation) {
        const startTime = Date.now();
        this.debug(`⏱️ Starting operation: ${operation}`);
        
        return {
            end: (success = true) => {
                const duration = Date.now() - startTime;
                const emoji = success ? '✅' : '❌';
                this.debug(`${emoji} Operation completed: ${operation} (${duration}ms)`);
                return duration;
            }
        };
    }

    /**
     * 메서드 실행 추적
     */
    trace(methodName, args = []) {
        this.debug(`📍 Calling method: ${methodName}`, {
            arguments: args.map(arg => {
                if (typeof arg === 'object' && arg !== null) {
                    return arg.constructor.name;
                }
                return typeof arg;
            })
        });
    }

    /**
     * 상태 변경 로그
     */
    stateChange(from, to, details = null) {
        this.info(`🔄 State change: ${from} → ${to}`, details);
    }

    /**
     * 사용자 액션 로그
     */
    userAction(action, details = null) {
        this.info(`👤 User action: ${action}`, details);
    }

    /**
     * 리소스 사용량 로그
     */
    resource(type, action, details = null) {
        this.debug(`💾 Resource ${type}: ${action}`, details);
    }

    /**
     * 플레이어 이벤트 로그
     */
    playerEvent(event, details = null) {
        this.info(`🎵 Player event: ${event}`, details);
    }

    /**
     * UI 업데이트 로그
     */
    uiUpdate(action, details = null) {
        this.debug(`🖼️ UI update: ${action}`, details);
    }

    /**
     * 네트워크 요청 로그
     */
    network(method, url, status = null) {
        this.debug(`🌐 Network ${method}: ${url}`, { status });
    }

    /**
     * 큐 작업 로그
     */
    queue(action, details = null) {
        this.debug(`📋 Queue ${action}`, details);
    }

    /**
     * 오디오 처리 로그
     */
    audio(action, details = null) {
        this.info(`🔊 Audio ${action}`, details);
    }
}

module.exports = DebugLogger;