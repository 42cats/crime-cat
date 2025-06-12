const redis = require('./redis');
const logger = require('./logger');

/**
 * Redis에서 활성 광고 목록을 가져오는 함수
 * @returns {Promise<Array>} 활성 광고 배열 또는 빈 배열
 */
async function getActiveAdsFromRedis() {
    const REDIS_KEY = 'theme:ad:active';
    
    try {
        // Redis 데이터 타입 확인
        const dataType = await redis.type(REDIS_KEY);
        
        if (dataType === 'none') {
            logger.warn('⚠️ Redis에 활성 광고 캐시가 없습니다. 빈 배열 반환');
            return [];
        }
        
        if (dataType !== 'string') {
            logger.error(`⚠️ 예상치 못한 Redis 데이터 타입: ${dataType} for key: ${REDIS_KEY}`);
            return [];
        }
        
        // Redis에서 데이터 가져오기
        const jsonData = await redis.get(REDIS_KEY);
        
        if (!jsonData) {
            logger.info('📢 활성 광고가 없습니다 (캐시 비어있음)');
            return [];
        }
        
        // JSON 파싱
        try {
            const activeAds = JSON.parse(jsonData);
            
            if (!Array.isArray(activeAds)) {
                logger.error('⚠️ 활성 광고 데이터가 배열이 아닙니다:', typeof activeAds);
                return [];
            }
            
            logger.info(`✅ Redis에서 ${activeAds.length}개의 활성 광고를 가져왔습니다`);
            return activeAds;
            
        } catch (parseError) {
            logger.error('❌ JSON 파싱 오류:', parseError.message);
            return [];
        }
        
    } catch (error) {
        logger.error('❌ Redis 접근 오류:', error.message);
        return [];
    }
}

/**
 * 활성 광고가 있는지 확인하는 함수
 * @returns {Promise<boolean>} 활성 광고 존재 여부
 */
async function hasActiveAds() {
    const ads = await getActiveAdsFromRedis();
    return ads.length > 0;
}

module.exports = {
    getActiveAdsFromRedis,
    hasActiveAds
};