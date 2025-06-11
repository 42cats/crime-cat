const axios = require('axios');
const dotenv = require('dotenv');
const logger = require('../../utility/logger');
dotenv.config();

const BEARER_TOKEN = process.env.DISCORD_CLIENT_SECRET;
const baseUrl = process.env.BASE_URL;

/**
 * 테마 광고 노출 기록
 * @param {string} requestId - 광고 요청 ID
 */
async function recordThemeAdExposure(requestId) {
	const API_URL = `${baseUrl}/bot/v1/theme-ads/exposure/${requestId}`;
	try {
		const response = await axios.post(API_URL, null, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		return response.data;
	} catch (error) {
		logger.error(`❌ 테마 광고 노출 기록 실패: ${requestId}`, logger.formatApiError(error));
		return null;
	}
}

/**
 * 테마 광고 클릭 기록
 * @param {string} requestId - 광고 요청 ID
 */
async function recordThemeAdClick(requestId) {
	const API_URL = `${baseUrl}/bot/v1/theme-ads/click/${requestId}`;
	try {
		const response = await axios.post(API_URL, null, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		logger.info(`📊 테마 광고 클릭 기록 성공: ${requestId}`, response.status);
		return response.data;
	} catch (error) {
		logger.error(`❌ 테마 광고 클릭 기록 실패: ${requestId}`, logger.formatApiError(error));
		return null;
	}
}

/**
 * 광고 데이터로부터 노출 기록
 * @param {Object} adData - 광고 데이터 (id, themeName, themeType 포함)
 */
async function recordAdExposureFromData(adData) {
	if (adData && adData.id) {
		return await recordThemeAdExposure(adData.id);
	} else {
		logger.warn('⚠️ 광고 데이터가 유효하지 않습니다:', adData);
		return null;
	}
}

/**
 * 활성 테마 광고 목록 조회
 * @param {string} guildId - 길드 ID (선택사항)
 */
async function getActiveThemeAdvertisements(guildId = null) {
	let API_URL = `${baseUrl}/bot/v1/theme-ads/active`;
	if (guildId) {
		API_URL += `?guildId=${guildId}`;
	}

	try {
		const response = await axios.get(API_URL, {
			headers: {
				'Authorization': `Bearer ${BEARER_TOKEN}`
			}
		});
		return response.data || [];
	} catch (error) {
		logger.error('❌ 활성 테마 광고 목록 조회 실패:', logger.formatApiError(error));
		return [];
	}
}

module.exports = {
	recordThemeAdExposure,
	recordThemeAdClick,
	recordAdExposureFromData,
	getActiveThemeAdvertisements
};