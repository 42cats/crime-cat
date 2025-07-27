
const { Client, ActivityType } = require('discord.js')
const { recordAdExposureFromData } = require('../api/themeAd/themeAd');

async function ActivityMessage(bot, msg, type) {
	bot.user.setActivity(msg, { type });
}

/**
 * 최적화된 Activity 업데이트 시스템
 * Redis Pub/Sub을 통한 광고 실시간 동기화 + 인메모리 캐시 활용
 * 
 * @param {Client} client 
 * @param {*} messege 
 * @param {*} currentIndex 
 */
module.exports = async (client, messege, currentIndex) => {
	// 🚀 광고 업데이트 콜백 설정 (한 번만 실행, main.js에서 이미 초기화됨)
	if (client.advertisementManager && !client.advertisementManager.onUpdateCallback) {
		client.advertisementManager.setUpdateCallback((newAds) => {
			console.log(`📢 Activity 메시지 재구성 트리거: ${newAds.length}건의 광고 업데이트`);
			// 광고 변경 시 즉시 메시지 재구성은 다음 interval에서 반영됨
		});
		
		console.log('✅ Advertisement Manager 콜백 설정 완료');
	}

	// 🎡 Activity 로테이션 시작 (6초 간격 유지)
	setInterval(async () => {
		const ownerSet = new Set();
		messege = [];
		client.guilds.valueOf().map(v => ownerSet.add(v.ownerId));
		messege.push(`mystery-place.com`);
		messege.push(`모든기능 완전 무료`);

		// 기존 게임 플레이 정보 가져오기 (기존 로직 유지)
		const gameData = await client.redis?.getAllHashFields("players") || {};
		const gamePlayGuildList = Object.values(gameData || {})
			.flatMap(players => players)
			.map(player => `now!! ${player.guildName}`) || [];

		// 🚀 광고 정보 - 인메모리 캐시에서 조회 (Redis API 호출 없음!)
		const activeAds = client.advertisementManager?.getActiveAds() || [];
		const adMessages = activeAds.map(ad => `추천! ${ad.themeName}`);

		// 모든 메시지 병합
		messege = [...messege, ...gamePlayGuildList, ...adMessages];

		// 메시지가 없으면 기본 메시지 추가
		if (messege.length === 0) {
			messege.push('mystery-place.com');
		}

		currentIndex = (currentIndex + 1) % messege.length;

		// 활동 타입 결정
		let activityType = ActivityType.Watching;

		// 광고 노출 통계 기록
		const adStartIndex = 2 + gamePlayGuildList.length; // 기본 메시지 2개
		if (currentIndex >= adStartIndex && activeAds.length > 0) {
			const adIndex = currentIndex - adStartIndex;
			if (adIndex < activeAds.length) {
				// 광고가 표시될 때 노출 기록
				recordAdExposureFromData(activeAds[adIndex]);
				activityType = ActivityType.Custom;
			}
		} else if (currentIndex >= 2 && currentIndex < adStartIndex) {
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