const { Client, ActivityType } = require('discord.js')

// 기본 메시지 배열을 상수로 선언
const DEFAULT_MESSAGES = [
	"mystery-place.com",
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
 * 시그널 기반 즉시 업데이트 + 캐시된 메시지 사용
 *
 * 성능 개선:
 * - 메시지 재구성: 변경 시에만 실행
 */
module.exports = async (client, messege, currentIndex, initialAds = null) => {
	let cachedMessages = [...DEFAULT_MESSAGES];
	let cachedActiveAds = initialAds || [];  // 초기화 시 전달된 광고 데이터 사용
	let cachedGamePlayGuildList = [];

	// 초기 메시지 배열 구성
	await rebuildMessageArray();

	// ✨ 광고 변경 시에만 메시지 재구성하는 콜백 설정
	if (client.advertisementManager) {
		client.advertisementManager.setUpdateCallback(async (newAds) => {
			console.log(`📢 Activity 메시지 즉시 재구성: ${newAds.length}건의 광고 업데이트`);
			cachedActiveAds = newAds;
			await rebuildMessageArray();
		});
		console.log('✅ Advertisement Manager 콜백 설정 완료 - 즉시 업데이트 모드');
	}

	setInterval(async () => {
		// 게임 플레이 데이터는 여전히 동적으로 변경되므로 주기적 갱신 필요
		await updateGamePlayData();

		currentIndex = (currentIndex + 1) % cachedMessages.length;

		// 활동 타입 결정
		const activityType = getActivityType(currentIndex);


		ActivityMessage(client, cachedMessages[currentIndex], activityType);
	}, 6000);

	// ✨ 메시지 배열 재구성 (광고 변경 시에만 호출)
	async function rebuildMessageArray() {
		try {
			const adMessages = cachedActiveAds.map(ad => `추천! ${ad.themeName}`);

			cachedMessages = [
				...DEFAULT_MESSAGES,
				...cachedGamePlayGuildList,
				...adMessages
			];

			// 메시지가 없으면 기본 메시지
			if (cachedMessages.length === 0) {
				cachedMessages = [...DEFAULT_MESSAGES];
			}

			console.log(`✅ Activity 메시지 배열 재구성 완료: 총 ${cachedMessages.length}개 메시지 (광고 ${cachedActiveAds.length}개)`);
		} catch (error) {
			console.error('❌ 메시지 배열 재구성 실패:', error);
			cachedMessages = [...DEFAULT_MESSAGES];
		}
	}

	// 게임 플레이 데이터 업데이트 (여전히 동적이므로 주기적 갱신)
	async function updateGamePlayData() {
		try {
			const gameData = await client.redis?.getAllHashFields("players") || {};
			const newGamePlayGuildList = Object.values(gameData || {})
				.flatMap(players => players)
				.map(player => `now!! ${player.guildName}`) || [];

			// 게임 데이터 변경 시에만 메시지 재구성
			if (JSON.stringify(cachedGamePlayGuildList) !== JSON.stringify(newGamePlayGuildList)) {
				cachedGamePlayGuildList = newGamePlayGuildList;
				await rebuildMessageArray();
			}
		} catch (error) {
			console.error('❌ 게임 플레이 데이터 업데이트 실패:', error);
		}
	}

	// 활동 타입 결정 함수
	function getActivityType(index) {
		const adStartIndex = DEFAULT_MESSAGE_COUNT + cachedGamePlayGuildList.length;
		if (index >= adStartIndex && cachedActiveAds.length > 0) {
			return ActivityType.Custom;
		} else if (index >= DEFAULT_MESSAGE_COUNT && index < adStartIndex) {
			return ActivityType.Playing;
		}
		return ActivityType.Watching;
	}

}