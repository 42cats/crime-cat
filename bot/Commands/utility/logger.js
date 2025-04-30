// utils/logger.js

/**
 * 로깅 유틸리티 모듈
 * 일관된 로그 형식과 오류 추적을 제공
 */

// 외부 라이브러리 (필요에 따라 추가)
const { inspect } = require('util');
const fs = require('fs');
const path = require('path');
const { format: formatDate } = require('date-fns');

// 로그 레벨 정의
const LOG_LEVELS = {
	DEBUG: { value: 0, label: 'DEBUG', color: '\x1b[36m' }, // 청록색
	INFO: { value: 1, label: 'INFO', color: '\x1b[32m' },  // 녹색
	WARN: { value: 2, label: 'WARN', color: '\x1b[33m' },  // 노란색
	ERROR: { value: 3, label: 'ERROR', color: '\x1b[31m' }, // 빨간색
	FATAL: { value: 4, label: 'FATAL', color: '\x1b[35m' }  // 보라색
};

// 로그 설정
const LOG_CONFIG = {
	level: process.env.LOG_LEVEL || 'INFO',
	useColors: process.env.NODE_ENV !== 'production',
	logToFile: process.env.LOG_TO_FILE === 'true' || false,
	logDirectory: process.env.LOG_DIRECTORY || 'logs',
	maxLogSize: parseInt(process.env.MAX_LOG_SIZE || '10485760', 10), // 10MB
};

// 컬러 코드
const RESET_COLOR = '\x1b[0m';

/**
 * 현재 시간 문자열 가져오기
 * @returns {string} 형식화된 시간 문자열
 */
function getTimeString() {
	return formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');
}

/**
 * 로그 레벨에 따른 출력 여부 확인
 * @param {string} level 로그 레벨
 * @returns {boolean} 출력 여부
 */
function shouldLog(level) {
	const configLevel = LOG_LEVELS[LOG_CONFIG.level] || LOG_LEVELS.INFO;
	const msgLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO;
	return msgLevel.value >= configLevel.value;
}

/**
 * 객체를 로그 가능한 문자열로 변환
 * @param {any} obj 변환할 객체
 * @returns {string} 변환된 문자열
 */
function formatObject(obj) {
	if (obj instanceof Error) {
		return formatError(obj);
	}

	try {
		if (typeof obj === 'object' && obj !== null) {
			return inspect(obj, { depth: 4, colors: false });
		}
		return String(obj);
	} catch (err) {
		return `[포맷 오류: ${err.message}]`;
	}
}

/**
 * 오류 객체 포맷팅
 * @param {Error} error 오류 객체
 * @returns {string} 포맷된 오류 문자열
 */
function formatError(error) {
	if (!error) return '[빈 오류]';

	const details = [];
	details.push(`타입: ${error.constructor.name}`);
	details.push(`메시지: ${error.message}`);

	if (error.code) details.push(`코드: ${error.code}`);
	if (error.statusCode) details.push(`상태 코드: ${error.statusCode}`);

	if (error.stack) {
		// 스택 트레이스 처리 (첫 5줄만)
		const stackLines = error.stack.split('\n').slice(0, 6);
		if (stackLines.length === 6) {
			stackLines[5] = '... (스택 트레이스 일부 생략)';
		}
		details.push(`스택: \n${stackLines.join('\n')}`);
	}

	// 추가 속성 확인
	const extraProps = Object.keys(error).filter(key =>
		!['name', 'message', 'stack', 'code', 'statusCode'].includes(key)
	);

	if (extraProps.length > 0) {
		details.push('추가 정보:');
		for (const prop of extraProps) {
			try {
				details.push(`  ${prop}: ${formatObject(error[prop])}`);
			} catch (e) {
				details.push(`  ${prop}: [포맷 불가: ${e.message}]`);
			}
		}
	}

	return details.join('\n');
}

/**
 * API 오류 포맷팅
 * @param {Error} error axios 오류 객체
 * @returns {Object} 정리된 오류 정보
 */
function formatApiError(error) {
	if (!error) return { message: '알 수 없는 오류' };

	const result = {
		message: error.message,
		code: error.code,
	};

	if (error.response) {
		// 서버가 응답을 반환한 경우
		result.status = error.response.status;
		result.statusText = error.response.statusText;
		result.data = error.response.data;
		result.headers = error.response.headers;
	} else if (error.request) {
		// 요청이 이루어졌지만 응답이 없는 경우
		result.request = 'Request sent, but no response received';
	}

	if (error.config) {
		result.url = error.config.url;
		result.method = error.config.method?.toUpperCase();
		result.baseURL = error.config.baseURL;
	}

	return result;
}

/**
 * 로그 파일에 로그 추가
 * @param {string} level 로그 레벨
 * @param {string} message 로그 메시지
 */
function appendToLogFile(level, message) {
	if (!LOG_CONFIG.logToFile) return;

	try {
		// 로그 디렉토리 확인 및 생성
		const logDir = LOG_CONFIG.logDirectory;
		if (!fs.existsSync(logDir)) {
			fs.mkdirSync(logDir, { recursive: true });
		}

		const date = formatDate(new Date(), 'yyyy-MM-dd');
		const logFile = path.join(logDir, `${date}.log`);
		const logEntry = `[${getTimeString()}] [${level}] ${message}\n`;

		// 파일 크기 확인
		let stats = { size: 0 };
		try {
			stats = fs.existsSync(logFile) ? fs.statSync(logFile) : { size: 0 };
		} catch (e) { }

		// 파일 크기 제한 초과 시 로테이션
		if (stats.size >= LOG_CONFIG.maxLogSize) {
			const rotatedFile = path.join(logDir, `${date}.${Date.now()}.log`);
			try {
				fs.renameSync(logFile, rotatedFile);
			} catch (e) { }
		}

		// 로그 파일에 추가
		fs.appendFileSync(logFile, logEntry);
	} catch (error) {
		console.error(`로그 파일 기록 실패: ${error.message}`);
	}
}

/**
 * 로그 출력 함수
 * @param {string} level 로그 레벨
 * @param {string} message 메시지
 * @param {any[]} args 추가 인자들
 */
function log(level, message, ...args) {
	if (!shouldLog(level)) return;

	const logLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO;
	const time = getTimeString();

	// 메시지 형식화
	let formattedMessage = message;
	if (args.length > 0) {
		try {
			formattedMessage += ' ' + args.map(arg => formatObject(arg)).join(' ');
		} catch (err) {
			formattedMessage += ` [인자 포맷 실패: ${err.message}]`;
		}
	}

	// 콘솔 출력
	const prefix = `[${time}] [${logLevel.label}]`;
	if (LOG_CONFIG.useColors) {
		console.log(`${logLevel.color}${prefix}${RESET_COLOR} ${formattedMessage}`);
	} else {
		console.log(`${prefix} ${formattedMessage}`);
	}

	// 파일 로깅
	appendToLogFile(logLevel.label, formattedMessage);
}

// 외부 노출 로그 함수들
const logger = {
	debug: (message, ...args) => log('DEBUG', message, ...args),
	info: (message, ...args) => log('INFO', message, ...args),
	warn: (message, ...args) => log('WARN', message, ...args),
	error: (message, ...args) => log('ERROR', message, ...args),
	fatal: (message, ...args) => log('FATAL', message, ...args),

	// 유틸리티 함수 노출
	formatError,
	formatLog: formatObject,
	formatApiError
};

module.exports = logger;