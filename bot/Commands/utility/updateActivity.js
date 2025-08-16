const { Client, ActivityType } = require('discord.js')
const { recordAdExposureFromData } = require('../api/themeAd/themeAd');

// 기본 메시지 배열을 상수로 선언
const DEFAULT_MESSAGES = [
	"mystery-place.com",
	"모든기능 완전 무료",
	// "대한민국 광복절",
	// "8 . 15 독립"
];
// 기본 메시지 개수를 상수로
const DEFAULT_MESSAGE_COUNT = DEFAULT_MESSAGES.length;

/**
 * Activity 메시지 변경
 */
async function ActivityMessage(bot, msg, type) {
	bot.user.setActivity(msg, { type });
}

/**
 * 최적화된 Activity 업데이트 시스템
 * Redis Pub/Sub + 인메모리 캐시 활용
 */
module.exports = async (client, messege, currentIndex) => {
	// 콜백 중복 설정 방지
	if (client.advertisementManager && !client.advertisementManager.onUpdateCallback) {
		client.advertisementManager.setUpdateCallback((newAds) => {
			console.log(`📢 Activity 메시지 재구성 트리거: ${newAds.length}건의 광고 업데이트`);
		});
		console.log('✅ Advertisement Manager 콜백 설정 완료');
	}

	setInterval(async () => {
		const ownerSet = new Set();
		let messege = [...DEFAULT_MESSAGES]; // 항상 새 배열로 시작

		client.guilds.valueOf().map(v => ownerSet.add(v.ownerId));

		// 게임 플레이 길드 정보 가져오기
		const gameData = await client.redis?.getAllHashFields("players") || {};
		const gamePlayGuildList = Object.values(gameData || {})
			.flatMap(players => players)
			.map(player => `now!! ${player.guildName}`) || [];

		// 광고 정보 인메모리 캐시에서 조회
		const activeAds = client.advertisementManager?.getActiveAds() || [];
		const adMessages = activeAds.map(ad => `추천! ${ad.themeName}`);

		// 모든 메시지 병합
		messege = [
			...DEFAULT_MESSAGES,
			...gamePlayGuildList,
			...adMessages
		];

		// 메시지가 없으면 기본 메시지
		if (messege.length === 0) {
			messege = [...DEFAULT_MESSAGES];
		}

		currentIndex = (currentIndex + 1) % messege.length;

		// 활동 타입
		let activityType = ActivityType.Watching;

		// 광고 노출 통계 기록 (상수 활용)
		const adStartIndex = DEFAULT_MESSAGE_COUNT + gamePlayGuildList.length;
		if (currentIndex >= adStartIndex && activeAds.length > 0) {
			const adIndex = currentIndex - adStartIndex;
			if (adIndex < activeAds.length) {
				recordAdExposureFromData(activeAds[adIndex]);
				activityType = ActivityType.Custom;
			}
		} else if (currentIndex >= DEFAULT_MESSAGE_COUNT && currentIndex < adStartIndex) {
			activityType = ActivityType.Playing;
		}

		ActivityMessage(client, messege[currentIndex], activityType);
	}, 6000);
}

/**
 * ⚠️ DEPRECATED: Redis에서 활성 테마 광고 목록을 가져오는 함수
 * 
 * 이 함수는 더 이상 사용되지 않습니다.
 * 대신 AdvertisementPubSubManager의 getActiveAds() 메서드를 사용하세요.
 * 
 * Redis Pub/Sub 시스템으로 대체되어 실시간 광고 업데이트와 
 * 99% API 호출 감소 효과를 제공합니다.
 * 
 * @deprecated Use AdvertisementPubSubManager.getActiveAds() instead
 * @param {Object} redis - Redis 클라이언트  
 * @returns {Array} 활성 광고 목록
 */
async function getActiveThemeAdvertisements(redis) {
	console.warn('⚠️ getActiveThemeAdvertisements is deprecated. Use AdvertisementPubSubManager.getActiveAds() instead.');

	try {
		if (!redis) {
			console.warn('⚠️ Redis client not available for theme advertisements');
			return [];
		}

		const cacheKey = "theme:ad:active";
		const activeAdsData = await redis.getValue(cacheKey);

		if (!activeAdsData || !Array.isArray(activeAdsData)) {
			return [];
		}

		return activeAdsData;

	} catch (error) {
		console.error('❌ Error fetching active theme advertisements:', error);
		return [];
	}
}