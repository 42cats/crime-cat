/**
 * 통합 Redis Pub/Sub 매니저
 * 모든 Pub/Sub 기능을 중앙 집중식으로 관리
 * - 광고 시스템 (advertisement:*)
 * - 슬립타이머 시스템 (__keyevent@0__:expired)
 * - 미래 확장 가능한 구조
 */

class UnifiedPubSubManager {
    constructor(client) {
        this.client = client;
        this.redisClient = client.redis;
        this.subscriber = null;
        this.reconnecting = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        
        // 채널별 핸들러 등록소
        this.channelHandlers = new Map();
        
        // 패턴별 핸들러 등록소 (psubscribe 용)
        this.patternHandlers = new Map();
        
        // 상태 관리
        this.status = {
            connected: false,
            lastConnected: null,
            totalMessages: 0,
            errors: 0,
            handlers: {
                channels: 0,
                patterns: 0
            }
        };
        
        console.log('📡 Unified Pub/Sub Manager 생성됨');
    }

    /**
     * 통합 Pub/Sub 시스템 초기화
     */
    async initialize() {
        try {
            console.log('🚀 Unified Pub/Sub Manager 초기화 시작...');
            
            // 핸들러 등록
            this.registerDefaultHandlers();
            
            // Redis 구독자 초기화
            await this.initializeSubscriber();
            
            console.log('✅ Unified Pub/Sub Manager 초기화 완료');
            
        } catch (error) {
            console.error('❌ Unified Pub/Sub Manager 초기화 실패:', error);
            this.scheduleReconnect();
        }
    }

    /**
     * Redis Pub/Sub 구독자 설정
     */
    async initializeSubscriber() {
        try {
            // 기존 구독자 정리
            if (this.subscriber) {
                await this.cleanupSubscriber();
            }
            
            // 새 구독자 생성
            this.subscriber = this.redisClient.client.duplicate();
            await this.subscriber.connect();
            
            // 연결 이벤트 핸들러
            this.setupConnectionHandlers();
            
            // 등록된 모든 채널 구독
            await this.subscribeToRegisteredChannels();
            
            // 상태 업데이트
            this.status.connected = true;
            this.status.lastConnected = Date.now();
            this.reconnectAttempts = 0;
            
            console.log('✅ Redis Pub/Sub subscriber 연결 완료');
            
        } catch (error) {
            console.error('❌ Redis Pub/Sub subscriber 초기화 실패:', error);
            this.status.connected = false;
            this.status.errors++;
            throw error;
        }
    }

    /**
     * 연결 이벤트 핸들러 설정
     */
    setupConnectionHandlers() {
        // 에러 처리
        this.subscriber.on('error', (error) => {
            console.error('❌ Unified Pub/Sub subscriber error:', error);
            this.status.connected = false;
            this.status.errors++;
            this.handleConnectionError(error);
        });

        // 연결 해제 처리
        this.subscriber.on('end', () => {
            console.warn('⚠️ Unified Pub/Sub subscriber disconnected');
            this.status.connected = false;
            this.handleDisconnection();
        });

        // 연결 복구 처리
        this.subscriber.on('connect', () => {
            console.log('🔗 Unified Pub/Sub subscriber connected');
            this.status.connected = true;
            this.status.lastConnected = Date.now();
        });
    }

    /**
     * 기본 핸들러들 등록
     */
    registerDefaultHandlers() {
        // 슬립타이머 시스템 핸들러
        this.registerChannelHandler('__keyevent@0__:expired', (message) => {
            this.handleKeyExpired(message);
        });
        
        // 광고 시스템 핸들러
        this.registerChannelHandler('advertisement:active:changed', (message) => {
            this.handleAdvertisementUpdate(message);
        });
        
        console.log('📋 기본 Pub/Sub 핸들러 등록 완료');
    }

    /**
     * 채널 핸들러 등록
     * @param {string} channel - 구독할 채널명
     * @param {Function} handler - 메시지 처리 함수
     * @param {Object} options - 추가 옵션
     */
    registerChannelHandler(channel, handler, options = {}) {
        if (typeof handler !== 'function') {
            throw new Error('Handler must be a function');
        }
        
        this.channelHandlers.set(channel, {
            handler,
            options,
            registered: Date.now(),
            messageCount: 0,
            lastMessage: null
        });
        
        this.status.handlers.channels = this.channelHandlers.size;
        
        console.log(`📝 채널 핸들러 등록: ${channel}`);
        
        // 이미 연결된 상태라면 즉시 구독
        if (this.status.connected && this.subscriber) {
            this.subscribeToChannel(channel);
        }
    }

    /**
     * 패턴 핸들러 등록 (psubscribe)
     * @param {string} pattern - 구독할 패턴
     * @param {Function} handler - 메시지 처리 함수
     * @param {Object} options - 추가 옵션
     */
    registerPatternHandler(pattern, handler, options = {}) {
        if (typeof handler !== 'function') {
            throw new Error('Handler must be a function');
        }
        
        this.patternHandlers.set(pattern, {
            handler,
            options,
            registered: Date.now(),
            messageCount: 0,
            lastMessage: null
        });
        
        this.status.handlers.patterns = this.patternHandlers.size;
        
        console.log(`🔍 패턴 핸들러 등록: ${pattern}`);
        
        // 이미 연결된 상태라면 즉시 구독
        if (this.status.connected && this.subscriber) {
            this.subscribeToPattern(pattern);
        }
    }

    /**
     * 등록된 모든 채널/패턴 구독
     */
    async subscribeToRegisteredChannels() {
        try {
            // 일반 채널 구독
            for (const channel of this.channelHandlers.keys()) {
                await this.subscribeToChannel(channel);
            }
            
            // 패턴 구독
            for (const pattern of this.patternHandlers.keys()) {
                await this.subscribeToPattern(pattern);
            }
            
            console.log(`📡 구독 완료: ${this.channelHandlers.size}개 채널, ${this.patternHandlers.size}개 패턴`);
            
        } catch (error) {
            console.error('❌ 채널 구독 실패:', error);
            throw error;
        }
    }

    /**
     * 개별 채널 구독
     * @param {string} channel - 채널명
     */
    async subscribeToChannel(channel) {
        try {
            await this.subscriber.subscribe(channel, (message) => {
                this.handleChannelMessage(channel, message);
            });
            
            console.log(`✅ 채널 구독: ${channel}`);
            
        } catch (error) {
            console.error(`❌ 채널 구독 실패 (${channel}):`, error);
        }
    }

    /**
     * 개별 패턴 구독
     * @param {string} pattern - 패턴
     */
    async subscribeToPattern(pattern) {
        try {
            await this.subscriber.pSubscribe(pattern, (message, channel) => {
                this.handlePatternMessage(pattern, channel, message);
            });
            
            console.log(`✅ 패턴 구독: ${pattern}`);
            
        } catch (error) {
            console.error(`❌ 패턴 구독 실패 (${pattern}):`, error);
        }
    }

    /**
     * 채널 메시지 처리
     * @param {string} channel - 채널명
     * @param {string} message - 메시지 내용
     */
    handleChannelMessage(channel, message) {
        try {
            const handlerInfo = this.channelHandlers.get(channel);
            
            if (!handlerInfo) {
                console.warn(`⚠️ 등록되지 않은 채널 메시지: ${channel}`);
                return;
            }
            
            // 통계 업데이트
            handlerInfo.messageCount++;
            handlerInfo.lastMessage = Date.now();
            this.status.totalMessages++;
            
            // 핸들러 실행
            handlerInfo.handler(message, channel);
            
        } catch (error) {
            console.error(`❌ 채널 메시지 처리 실패 (${channel}):`, error);
            this.status.errors++;
        }
    }

    /**
     * 패턴 메시지 처리
     * @param {string} pattern - 패턴
     * @param {string} channel - 실제 채널명
     * @param {string} message - 메시지 내용
     */
    handlePatternMessage(pattern, channel, message) {
        try {
            const handlerInfo = this.patternHandlers.get(pattern);
            
            if (!handlerInfo) {
                console.warn(`⚠️ 등록되지 않은 패턴 메시지: ${pattern}`);
                return;
            }
            
            // 통계 업데이트
            handlerInfo.messageCount++;
            handlerInfo.lastMessage = Date.now();
            this.status.totalMessages++;
            
            // 핸들러 실행
            handlerInfo.handler(message, channel, pattern);
            
        } catch (error) {
            console.error(`❌ 패턴 메시지 처리 실패 (${pattern}):`, error);
            this.status.errors++;
        }
    }

    /**
     * 키 만료 이벤트 처리 (슬립타이머)
     * @param {string} expiredKey - 만료된 키
     */
    handleKeyExpired(expiredKey) {
        try {
            // 슬립타이머 키인지 확인
            if (expiredKey.startsWith('sleepTimer:')) {
                this.processSleepTimerExpired(expiredKey);
            }
            // 미래에 다른 TTL 기반 기능 추가 가능
            
        } catch (error) {
            console.error('❌ 키 만료 이벤트 처리 실패:', error);
        }
    }

    /**
     * 슬립타이머 만료 처리
     * @param {string} expiredKey - 만료된 슬립타이머 키
     */
    async processSleepTimerExpired(expiredKey) {
        try {
            // 키 파싱: sleepTimer:guildId:userId
            const parts = expiredKey.split(':');
            if (parts.length !== 3) return;
            
            const [, guildId, userId] = parts;
            
            // Discord 클라이언트를 통해 유저 연결 해제
            if (global.discordClient) {
                const guild = global.discordClient.guilds.cache.get(guildId);
                if (guild) {
                    const member = guild.members.cache.get(userId);
                    if (member && member.voice.channel) {
                        await member.voice.disconnect('Sleep timer expired');
                        console.log(`💤 Sleep timer: Disconnected ${member.displayName} from voice channel`);
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ 슬립타이머 만료 처리 실패:', error);
        }
    }

    /**
     * 광고 업데이트 이벤트 처리
     * @param {string} message - 광고 업데이트 메시지
     */
    handleAdvertisementUpdate(message) {
        try {
            console.log('📢 광고 업데이트 이벤트 수신 (통합 매니저)');
            
            const eventData = JSON.parse(message);
            
            // 이벤트 데이터 검증
            if (!eventData || !eventData.adsData || !Array.isArray(eventData.adsData)) {
                console.warn('⚠️ 유효하지 않은 광고 이벤트 데이터:', eventData);
                return;
            }
            
            // Advertisement Manager가 있다면 업데이트
            if (this.client.advertisementManager && this.client.advertisementManager.handleAdvertisementUpdateFromUnified) {
                this.client.advertisementManager.handleAdvertisementUpdateFromUnified(eventData);
            } else {
                console.warn('⚠️ Advertisement Manager가 초기화되지 않았거나 handleAdvertisementUpdateFromUnified 메서드가 없습니다.');
            }
            
        } catch (error) {
            console.error('❌ 광고 업데이트 이벤트 처리 실패:', error);
        }
    }

    /**
     * 연결 오류 처리
     * @param {Error} error - 오류 객체
     */
    handleConnectionError(error) {
        console.error('🔥 Pub/Sub 연결 오류:', error.message);
        this.scheduleReconnect();
    }

    /**
     * 연결 해제 처리
     */
    handleDisconnection() {
        console.warn('🔌 Pub/Sub 연결이 해제되었습니다.');
        this.scheduleReconnect();
    }

    /**
     * 재연결 스케줄링
     */
    scheduleReconnect() {
        if (this.reconnecting) return;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('💥 최대 재연결 시도 횟수 초과. 재연결을 포기합니다.');
            return;
        }
        
        this.reconnecting = true;
        this.reconnectAttempts++;
        
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // 지수 백오프, 최대 30초
        
        console.log(`🔄 ${delay}ms 후 재연결 시도... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(async () => {
            try {
                await this.initializeSubscriber();
                console.log('✅ Pub/Sub 재연결 성공');
            } catch (error) {
                console.error('❌ Pub/Sub 재연결 실패:', error);
            } finally {
                this.reconnecting = false;
            }
        }, delay);
    }

    /**
     * 구독자 정리
     */
    async cleanupSubscriber() {
        try {
            if (this.subscriber) {
                await this.subscriber.quit();
                this.subscriber = null;
            }
        } catch (error) {
            console.error('❌ 구독자 정리 실패:', error);
        }
    }

    /**
     * 상태 정보 반환
     */
    getStatus() {
        return {
            ...this.status,
            reconnectAttempts: this.reconnectAttempts,
            reconnecting: this.reconnecting,
            channels: Array.from(this.channelHandlers.keys()),
            patterns: Array.from(this.patternHandlers.keys()),
            channelStats: Object.fromEntries(
                Array.from(this.channelHandlers.entries()).map(([channel, info]) => [
                    channel, 
                    {
                        messageCount: info.messageCount,
                        lastMessage: info.lastMessage ? new Date(info.lastMessage).toLocaleString() : null
                    }
                ])
            )
        };
    }

    /**
     * 연결 해제
     */
    async disconnect() {
        try {
            console.log('🚪 Unified Pub/Sub Manager 연결 해제 중...');
            
            this.reconnecting = false; // 재연결 방지
            await this.cleanupSubscriber();
            
            console.log('✅ Unified Pub/Sub Manager 연결 해제 완료');
            
        } catch (error) {
            console.error('❌ Unified Pub/Sub Manager 연결 해제 실패:', error);
        }
    }
}

module.exports = UnifiedPubSubManager;