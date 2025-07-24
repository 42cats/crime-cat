const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');
const util = require('util');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Google Cloud Text-to-Speech 엔진
 * 고품질 TTS 음성 생성을 담당
 */
class TTSEngine {
    constructor() {
        this.client = null;
        this.tempDir = process.env.TTS_TEMP_DIR || './temp/tts';
        this.maxTextLength = parseInt(process.env.TTS_MAX_TEXT_LENGTH) || 500;
        this.defaultLanguage = process.env.TTS_DEFAULT_LANGUAGE || 'ko-KR';
        this.defaultVoice = process.env.TTS_DEFAULT_VOICE || 'ko-KR-Wavenet-A';
        this.defaultSpeed = parseFloat(process.env.TTS_DEFAULT_SPEED) || 1.0;
        this.audioFormat = process.env.TTS_AUDIO_FORMAT || 'mp3';
        this.sampleRate = parseInt(process.env.TTS_SAMPLE_RATE) || 24000;
        
        this.initializeClient();
        this.ensureTempDirectory();
    }

    /**
     * Google Cloud TTS 클라이언트 초기화
     */
    initializeClient() {
        try {
            const projectId = process.env.GOOGLE_CLOUD_TTS_PROJECT_ID;
            const keyFilename = process.env.GOOGLE_CLOUD_TTS_KEY_FILE;
            
            if (!projectId) {
                throw new Error('GOOGLE_CLOUD_TTS_PROJECT_ID 환경변수가 설정되지 않았습니다.');
            }

            const clientConfig = {
                projectId: projectId
            };

            // 서비스 계정 키 파일이 있는 경우
            if (keyFilename && fs.existsSync(keyFilename)) {
                clientConfig.keyFilename = keyFilename;
            }
            // API 키가 있는 경우
            else if (process.env.GOOGLE_CLOUD_TTS_API_KEY) {
                clientConfig.apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
            }

            this.client = new textToSpeech.TextToSpeechClient(clientConfig);
            console.log('[TTS] Google Cloud TTS 클라이언트가 초기화되었습니다.');
        } catch (error) {
            console.error('[TTS] 클라이언트 초기화 실패:', error.message);
            throw error;
        }
    }

    /**
     * 임시 디렉토리 생성
     */
    ensureTempDirectory() {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
            console.log(`[TTS] 임시 디렉토리 생성: ${this.tempDir}`);
        }
    }

    /**
     * 텍스트 유효성 검사
     * @param {string} text - 검사할 텍스트
     * @returns {boolean} 유효성 여부
     */
    validateText(text) {
        if (!text || typeof text !== 'string') {
            return { valid: false, error: '텍스트가 제공되지 않았습니다.' };
        }

        const trimmedText = text.trim();
        if (trimmedText.length === 0) {
            return { valid: false, error: '빈 텍스트는 변환할 수 없습니다.' };
        }

        if (trimmedText.length > this.maxTextLength) {
            return { 
                valid: false, 
                error: `텍스트가 너무 깁니다. 최대 ${this.maxTextLength}자까지 지원됩니다.` 
            };
        }

        return { valid: true, text: trimmedText };
    }

    /**
     * 음성 합성 실행
     * @param {string} text - 변환할 텍스트
     * @param {Object} options - TTS 옵션
     * @returns {Promise<string>} 생성된 오디오 파일 경로
     */
    async generateSpeech(text, options = {}) {
        try {
            // 텍스트 유효성 검사
            const validation = this.validateText(text);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            const cleanText = validation.text;
            const language = options.language || this.defaultLanguage;
            const voice = options.voice || this.defaultVoice;
            const speed = options.speed || this.defaultSpeed;

            // TTS 요청 구성
            const request = {
                input: { text: cleanText },
                voice: {
                    languageCode: language,
                    name: voice,
                    ssmlGender: 'NEUTRAL'
                },
                audioConfig: {
                    audioEncoding: this.audioFormat.toUpperCase(),
                    sampleRateHertz: this.sampleRate,
                    speakingRate: speed,
                    volumeGainDb: 0.0,
                    pitch: 0.0
                }
            };

            console.log(`[TTS] TTS 생성 시작: "${cleanText.substring(0, 50)}..."`);
            
            // Google Cloud TTS API 호출
            const [response] = await this.client.synthesizeSpeech(request);
            
            // 고유한 파일명 생성
            const timestamp = Date.now();
            const filename = `tts_${timestamp}.${this.audioFormat}`;
            const filepath = path.join(this.tempDir, filename);

            // 오디오 파일 저장
            const writeFile = util.promisify(fs.writeFile);
            await writeFile(filepath, response.audioContent, 'binary');

            console.log(`[TTS] TTS 파일 생성 완료: ${filepath}`);
            return filepath;

        } catch (error) {
            console.error('[TTS] 음성 합성 실패:', error);
            throw new Error(`TTS 생성 실패: ${error.message}`);
        }
    }

    /**
     * 사용 가능한 음성 목록 가져오기
     * @param {string} languageCode - 언어 코드 (예: 'ko-KR')
     * @returns {Promise<Array>} 음성 목록
     */
    async getAvailableVoices(languageCode = 'ko-KR') {
        try {
            const [result] = await this.client.listVoices({
                languageCode: languageCode
            });

            const voices = result.voices.map(voice => ({
                name: voice.name,
                languageCode: voice.languageCodes[0],
                ssmlGender: voice.ssmlGender,
                naturalSampleRateHertz: voice.naturalSampleRateHertz
            }));

            return voices;
        } catch (error) {
            console.error('[TTS] 음성 목록 가져오기 실패:', error);
            return [];
        }
    }

    /**
     * 임시 파일 정리
     * @param {string} filepath - 삭제할 파일 경로
     */
    async cleanupTempFile(filepath) {
        try {
            if (fs.existsSync(filepath)) {
                await fs.promises.unlink(filepath);
                console.log(`[TTS] 임시 파일 삭제: ${filepath}`);
            }
        } catch (error) {
            console.error(`[TTS] 임시 파일 삭제 실패: ${error.message}`);
        }
    }

    /**
     * 모든 임시 파일 정리 (5분 이상된 파일)
     */
    async cleanupOldTempFiles() {
        try {
            const files = await fs.promises.readdir(this.tempDir);
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

            for (const file of files) {
                const filepath = path.join(this.tempDir, file);
                const stats = await fs.promises.stat(filepath);
                
                if (stats.mtime.getTime() < fiveMinutesAgo) {
                    await this.cleanupTempFile(filepath);
                }
            }
        } catch (error) {
            console.error('[TTS] 오래된 임시 파일 정리 실패:', error);
        }
    }

    /**
     * 헬스 체크 - TTS 서비스 상태 확인
     * @returns {Promise<boolean>} 서비스 정상 여부
     */
    async healthCheck() {
        try {
            if (!this.client) {
                return false;
            }

            // 간단한 테스트 TTS 요청
            const testRequest = {
                input: { text: '테스트' },
                voice: {
                    languageCode: 'ko-KR',
                    name: 'ko-KR-Standard-A',
                    ssmlGender: 'NEUTRAL'
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    sampleRateHertz: 16000
                }
            };

            await this.client.synthesizeSpeech(testRequest);
            return true;
        } catch (error) {
            console.error('[TTS] 헬스 체크 실패:', error);
            return false;
        }
    }
}

module.exports = TTSEngine;