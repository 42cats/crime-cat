/**
 * 테마 광고 추적 유틸리티
 * 디스코드 봇에서 광고 노출 및 클릭을 추적하는 기능을 제공
 */

const axios = require('axios');
const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://localhost:8080';

class ThemeAdTracker {
    /**
     * 광고 노출 기록 (디스코드 봇 전용 엔드포인트 사용)
     * @param {string} requestId - 광고 요청 ID
     */
    static async recordExposure(requestId) {
        try {
            await axios.post(`${BACKEND_BASE_URL}/api/bot/v1/theme-ads/exposure/${requestId}`);
            console.log(`📊 광고 노출 기록: ${requestId}`);
        } catch (error) {
            console.error(`❌ 광고 노출 기록 실패: ${requestId}`, error.message);
        }
    }

    /**
     * 광고 클릭 기록 (디스코드 봇 전용 엔드포인트 사용)
     * @param {string} requestId - 광고 요청 ID
     */
    static async recordClick(requestId) {
        try {
            await axios.post(`${BACKEND_BASE_URL}/api/bot/v1/theme-ads/click/${requestId}`);
            console.log(`📊 광고 클릭 기록: ${requestId}`);
        } catch (error) {
            console.error(`❌ 광고 클릭 기록 실패: ${requestId}`, error.message);
        }
    }

    /**
     * 현재 표시 중인 광고에 대한 노출 기록
     * @param {Object} adData - 광고 데이터 (id, themeName, themeType 포함)
     */
    static recordAdExposure(adData) {
        if (adData && adData.id) {
            this.recordExposure(adData.id);
        }
    }
}

module.exports = ThemeAdTracker;