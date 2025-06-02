const { AsyncLocalStorage } = require('async_hooks');
const { randomBytes } = require('crypto');
const fs = require('fs');
const path = require('path');
const { format: formatDate } = require('date-fns');

/**
 * AsyncLocalStorage 기반 추적 로거
 * Node.js의 비동기 컨텍스트를 추적하는 ThreadLocal 유사 구현
 */
class AsyncTraceLogger {
    constructor() {
        this.asyncLocalStorage = new AsyncLocalStorage();
        this.config = {
            enabled: process.env.TRACE_ENABLED !== 'false',
            logToFile: process.env.TRACE_LOG_TO_FILE === 'true',
            logDirectory: process.env.TRACE_LOG_DIR || 'logs/trace',
            maxDepth: parseInt(process.env.TRACE_MAX_DEPTH || '10'),
            useColors: process.env.NODE_ENV !== 'production'
        };
        
        // 컬러 설정
        this.colors = {
            traceId: '\x1b[36m',    // 청록색
            enter: '\x1b[32m',      // 녹색
            exit: '\x1b[33m',       // 노란색
            error: '\x1b[31m',      // 빨간색
            reset: '\x1b[0m'
        };
        
        // 로그 디렉토리 생성
        if (this.config.logToFile && !fs.existsSync(this.config.logDirectory)) {
            fs.mkdirSync(this.config.logDirectory, { recursive: true });
        }
    }
    
    /**
     * 새로운 추적 컨텍스트 시작
     */
    startTrace(identifier) {
        if (!this.config.enabled) return null;
        
        const traceId = randomBytes(4).toString('hex');
        const context = {
            traceId,
            identifier,
            startTime: Date.now(),
            level: 0,
            path: [identifier]
        };
        
        return new Promise((resolve) => {
            this.asyncLocalStorage.run(context, () => {
                this.log(`추적 시작: ${identifier}`, 'TRACE_START');
                resolve(context);
            });
        });
    }
    
    /**
     * 현재 추적 컨텍스트 가져오기
     */
    getCurrentContext() {
        return this.asyncLocalStorage.getStore();
    }
    
    /**
     * 메서드 진입 로깅
     */
    enterMethod(methodName) {
        const context = this.getCurrentContext();
        if (!context || context.level >= this.config.maxDepth) return;
        
        context.level++;
        context.path.push(methodName);
        
        const elapsed = Date.now() - context.startTime;
        const indent = this.getIndent(context.level);
        
        this.writeLog(
            context.traceId,
            `${indent}--> ${methodName}`,
            elapsed,
            'ENTER'
        );
    }
    
    /**
     * 메서드 종료 로깅
     */
    exitMethod(methodName, error = null) {
        const context = this.getCurrentContext();
        if (!context || context.level < 1) return;
        
        const elapsed = Date.now() - context.startTime;
        const indent = this.getIndent(context.level);
        
        if (error) {
            this.writeLog(
                context.traceId,
                `${indent}<X- ${methodName} [오류: ${error.message}]`,
                elapsed,
                'ERROR'
            );
        } else {
            this.writeLog(
                context.traceId,
                `${indent}<-- ${methodName}`,
                elapsed,
                'EXIT'
            );
        }
        
        context.path.pop();
        context.level--;
    }
    
    /**
     * 추적 종료
     */
    endTrace() {
        const context = this.getCurrentContext();
        if (!context) return;
        
        const totalTime = Date.now() - context.startTime;
        this.log(`추적 종료: ${context.identifier} (총 ${totalTime}ms)`, 'TRACE_END');
    }
    
    /**
     * 일반 로그 메시지
     */
    log(message, type = 'INFO') {
        const context = this.getCurrentContext();
        if (!context) return;
        
        const elapsed = Date.now() - context.startTime;
        const indent = this.getIndent(context.level + 1);
        
        this.writeLog(
            context.traceId,
            `${indent}[${type}] ${message}`,
            elapsed,
            type
        );
    }
    
    /**
     * 들여쓰기 생성
     */
    getIndent(level) {
        return '|   '.repeat(Math.max(0, level - 1));
    }
    
    /**
     * 로그 작성
     */
    writeLog(traceId, message, elapsed, type) {
        const timestamp = formatDate(new Date(), 'HH:mm:ss.SSS');
        
        // 콘솔 출력
        if (this.config.useColors) {
            const color = this.getColor(type);
            console.log(
                `${this.colors.traceId}[${traceId}]${this.colors.reset} ` +
                `${color}${message}${this.colors.reset} ` +
                `(${elapsed}ms)`
            );
        } else {
            console.log(`[${traceId}] ${message} (${elapsed}ms)`);
        }
        
        // 파일 로깅
        if (this.config.logToFile) {
            this.appendToFile(timestamp, traceId, message, elapsed);
        }
    }
    
    /**
     * 타입별 색상 가져오기
     */
    getColor(type) {
        switch (type) {
            case 'ENTER':
            case 'TRACE_START':
                return this.colors.enter;
            case 'EXIT':
            case 'TRACE_END':
                return this.colors.exit;
            case 'ERROR':
                return this.colors.error;
            default:
                return this.colors.reset;
        }
    }
    
    /**
     * 파일에 로그 추가
     */
    appendToFile(timestamp, traceId, message, elapsed) {
        try {
            const date = formatDate(new Date(), 'yyyy-MM-dd');
            const logFile = path.join(this.config.logDirectory, `trace-${date}.log`);
            const logEntry = `[${timestamp}] [${traceId}] ${message} (${elapsed}ms)\n`;
            
            fs.appendFileSync(logFile, logEntry);
        } catch (error) {
            console.error('추적 로그 파일 작성 실패:', error.message);
        }
    }
    
    /**
     * 비동기 함수 실행 및 추적
     */
    async runWithTrace(identifier, asyncFn) {
        if (!this.config.enabled) {
            return await asyncFn();
        }
        
        return new Promise((resolve, reject) => {
            const context = {
                traceId: randomBytes(4).toString('hex'),
                identifier,
                startTime: Date.now(),
                level: 0,
                path: [identifier]
            };
            
            this.asyncLocalStorage.run(context, async () => {
                try {
                    this.log(`추적 시작: ${identifier}`, 'TRACE_START');
                    const result = await asyncFn();
                    this.endTrace();
                    resolve(result);
                } catch (error) {
                    this.log(`오류 발생: ${error.message}`, 'ERROR');
                    this.endTrace();
                    reject(error);
                }
            });
        });
    }
}

// 싱글톤 인스턴스
const instance = new AsyncTraceLogger();

module.exports = instance;