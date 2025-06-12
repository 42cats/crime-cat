
const { Client, ActivityType } = require('discord.js')
const { recordAdExposureFromData } = require('../api/themeAd/themeAd');

async function ActivityMessage(bot, msg, type) {
	bot.user.setActivity(msg, { type });
}

/**
 * 
 * @param {Client} client 
 * @param {*} messege 
 * @param {*} currentIndex 
 */
module.exports = (client, messege, currentIndex) => {
	setInterval(async () => {
		const ownerSet = new Set();
		messege = [];
		client.guilds.valueOf().map(v => ownerSet.add(v.ownerId));
		messege.push(`mystery-place.com`);
		messege.push(`모든기능 완전 무료`);

		// 기존 게임 플레이 정보 가져오기
		const gameData = await client.redis?.getAllHashFields("players") || {}; // gameData가 null이면 빈 객체 할당

		// 🔹 gameData가 존재하는지 확인 후 객체 → 배열 변환 후 map() 사용
		const gamePlayGuildList = Object.values(gameData || {}) // gameData가 null이어도 안전하게 처리
			.flatMap(players => players)  // 객체 내부의 배열을 평탄화 (2D → 1D)
			.map(player => `now!! ${player.guildName}`) || [];

		// 활성 테마 광고 정보 가져오기
		const activeAds = await getActiveThemeAdvertisements(client.redis);
		const adMessages = activeAds.map(ad => `추천! ${ad.themeName}`);

		// 모든 메시지 병합 (기본 사이트 + 게임 플레이 + 광고)
		messege = [...messege, ...gamePlayGuildList, ...adMessages];

		// 메시지가 없으면 기본 메시지 추가
		if (messege.length === 0) {
			messege.push('mystery-place.com');
		}

		currentIndex = (currentIndex + 1) % messege.length;

		// 활동 타입 결정: 기본 사이트는 Watching, 게임 플레이는 Playing, 광고는 Custom
		let activityType = ActivityType.Watching;

		// 광고 노출 통계 기록
		const adStartIndex = 1 + gamePlayGuildList.length;
		if (currentIndex >= adStartIndex && activeAds.length > 0) {
			const adIndex = currentIndex - adStartIndex;
			if (adIndex < activeAds.length) {
				// 광고가 표시될 때 노출 기록
				recordAdExposureFromData(activeAds[adIndex]);
				activityType = ActivityType.Custom; // 광고는 Custom 타입으로 표시
			}
		} else if (currentIndex >= 1 && currentIndex < adStartIndex) {
			activityType = ActivityType.Playing;
		}

		ActivityMessage(client, messege[currentIndex], activityType);
	}, 6000);
}

/**
 * Redis에서 활성 테마 광고 목록을 가져오는 함수
 * @param {Object} redis - Redis 클라이언트
 * @returns {Array} 활성 광고 목록
 */
async function getActiveThemeAdvertisements(redis) {
	try {
		if (!redis) {
			console.warn('⚠️ Redis client not available for theme advertisements');
			return [];
		}

		// 백엔드에서 설정한 캐시 키 사용
		const cacheKey = "theme:ad:active";
		
		// RedisManager의 getValue 메서드 사용 (타입 체크와 JSON 파싱 자동 처리)
		const activeAdsData = await redis.getValue(cacheKey);
		
		if (!activeAdsData) {
			console.log('📢 No active theme advertisements found');
			return [];
		}
		
		if (!Array.isArray(activeAdsData)) {
			console.warn('⚠️ Active ads data is not an array:', typeof activeAdsData);
			return [];
		}
		
		console.log(`📢 Found ${activeAdsData.length} active theme advertisements`);
		return activeAdsData;

	} catch (error) {
		console.error('❌ Error fetching active theme advertisements:', error);
		return [];
	}
}