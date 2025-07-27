/**
 * 광고 매니저 - 통합 Pub/Sub 시스템과 연동
 * 광고 데이터 인메모리 캐시 및 업데이트 콜백 관리
 */

class AdvertisementPubSubManager {
    constructor(client) {
        this.client = client;
        this.activeAds = []; // 인메모리 광고 캐시
        this.lastUpdated = null;
        this.onUpdateCallback = null;
        
        // 통합 Pub/Sub 매니저 참조 (나중에 설정됨)
        this.unifiedPubSub = null;
        
        console.log('📢 Advertisement Manager 생성됨 (통합 Pub/Sub 연동)');
    }

    /**
     * 광고 시스템 초기화 (통합 Pub/Sub 연동)
     */
    async initialize() {
        try {
            console.log('📡 Advertisement Manager 초기화 시작...');
            
            // 통합 Pub/Sub 매니저 참조 설정
            this.unifiedPubSub = this.client.unifiedPubSub;
            
            if (!this.unifiedPubSub) {
                throw new Error('Unified Pub/Sub Manager가 초기화되지 않았습니다.');
            }
            
            // 통합 Pub/Sub에 핸들러 등록
            this.registerWithUnifiedPubSub();
            
            // 초기 광고 데이터 로드
            await this.loadInitialAds();
            
            console.log('✅ Advertisement Manager 초기화 완료');
            
        } catch (error) {
            console.error('❌ Advertisement Manager 초기화 실패:', error);
            // 5초 후 재시도
            setTimeout(() => this.initialize(), 5000);
        }
    }

    /**
     * 통합 Pub/Sub 시스템에 핸들러 등록
     */
    registerWithUnifiedPubSub() {
        if (!this.unifiedPubSub) {
            console.error('❌ Unified Pub/Sub Manager가 설정되지 않았습니다.');
            return;
        }
        
        // 광고 업데이트 핸들러 등록
        this.unifiedPubSub.registerChannelHandler(
            'advertisement:active:changed',
            (message) => this.handleAdvertisementUpdate(message),
            {
                description: 'Advertisement update handler',
                manager: 'AdvertisementPubSubManager'
            }
        );
        
        console.log('✅ Advertisement 핸들러가 통합 Pub/Sub에 등록됨');
    }

    /**
     * 광고 변경 이벤트 처리
     * @param {string} message - Pub/Sub 메시지 (JSON 형태)
     */
    handleAdvertisementUpdate(message) {
        try {
            console.log('📢 광고 업데이트 이벤트 수신:', message.substring(0, 200) + '...');
            
            const eventData = JSON.parse(message);
            
            // 이벤트 데이터 검증
            if (!eventData || !eventData.adsData || !Array.isArray(eventData.adsData)) {
                console.warn('⚠️ 유효하지 않은 광고 이벤트 데이터:', eventData);
                return;
            }
            
            // 인메모리 캐시 업데이트
            this.activeAds = eventData.adsData;
            this.lastUpdated = Date.now();
            
            console.log(`✅ 광고 캐시 업데이트 완료: ${this.activeAds.length}건 (이벤트 시간: ${new Date(eventData.timestamp).toLocaleString()})`);
            
            // Activity 메시지 재구성 콜백 호출
            if (this.onUpdateCallback && typeof this.onUpdateCallback === 'function') {
                this.onUpdateCallback(this.activeAds);
            }
            
        } catch (error) {
            console.error('❌ 광고 업데이트 이벤트 처리 실패:', error);
        }
    }

    /**
     * 초기 광고 데이터 로드 (Redis에서 직접 조회)
     * Pub/Sub 구독 전에 현재 상태 동기화
     */
    async loadInitialAds() {
        try {
            console.log('📥 초기 광고 데이터 로드 중...');
            
            // Redis에서 현재 활성 광고 조회
            const activeAdsData = await this.client.redis.getValue('theme:ad:active');
            
            if (!activeAdsData || !Array.isArray(activeAdsData)) {
                console.log('📭 활성 광고 없음 - 빈 배열로 초기화');
                this.activeAds = [];
            } else {
                this.activeAds = activeAdsData;
                console.log(`📦 초기 광고 데이터 로드 완료: ${this.activeAds.length}건`);
            }
            
            this.lastUpdated = Date.now();
            
        } catch (error) {
            console.error('❌ 초기 광고 데이터 로드 실패:', error);
            // 실패 시 빈 배열로 초기화
            this.activeAds = [];
            this.lastUpdated = Date.now();
        }
    }

    /**
     * 인메모리 캐시에서 활성 광고 목록 반환
     * @returns {Array} 활성 광고 목록
     */
    getActiveAds() {
        return this.activeAds || [];
    }

    /**
     * 마지막 업데이트 시간 반환
     * @returns {number|null} 마지막 업데이트 타임스탬프
     */
    getLastUpdated() {
        return this.lastUpdated;
    }

    /**
     * 광고 업데이트 콜백 설정
     * @param {Function} callback - 광고 업데이트 시 호출될 콜백 함수
     */
    setUpdateCallback(callback) {
        this.onUpdateCallback = callback;
    }

    /**
     * 수동으로 광고 데이터 새로고침
     */
    async refreshAds() {
        console.log('🔄 수동 광고 데이터 새로고침 시작...');
        await this.loadInitialAds();
        
        if (this.onUpdateCallback) {
            this.onUpdateCallback(this.activeAds);
        }
    }

    /**
     * 통합 Pub/Sub에서 핸들러를 통해 광고 업데이트 처리
     * @param {Object} eventData - 통합 매니저에서 파싱된 이벤트 데이터
     */
    handleAdvertisementUpdateFromUnified(eventData) {
        try {
            // 인메모리 캐시 업데이트
            this.activeAds = eventData.adsData;
            this.lastUpdated = Date.now();
            
            console.log(`✅ 광고 캐시 업데이트 완료 (통합 매니저): ${this.activeAds.length}건 (이벤트 시간: ${new Date(eventData.timestamp).toLocaleString()})`);
            
            // Activity 메시지 재구성 콜백 호출
            if (this.onUpdateCallback && typeof this.onUpdateCallback === 'function') {
                this.onUpdateCallback(this.activeAds);
            }
            
        } catch (error) {
            console.error('❌ 통합 매니저 광고 업데이트 처리 실패:', error);
        }
    }

    /**
     * 연결 해제 (통합 시스템에서는 불필요)
     */
    async disconnect() {
        console.log('📢 Advertisement Manager는 통합 Pub/Sub 시스템을 사용합니다.');
        // 통합 시스템에서 관리하므로 별도 연결 해제 불필요
    }

    /**
     * 상태 정보 반환 (디버깅용)
     */
    getStatus() {
        return {
            isConnected: this.unifiedPubSub?.status?.connected || false,
            adsCount: this.activeAds.length,
            lastUpdated: this.lastUpdated ? new Date(this.lastUpdated).toLocaleString() : null,
            hasCallback: !!this.onUpdateCallback,
            unifiedPubSubStatus: this.unifiedPubSub?.getStatus() || null,
            managerType: 'unified'
        };
    }
}

module.exports = AdvertisementPubSubManager;