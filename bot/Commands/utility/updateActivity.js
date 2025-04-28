
const { Client, ActivityType } = require('discord.js')
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
		messege.push(`내 플레이기록 확인하고싶다면?`);
		messege.push(`crimecat.org 플레이기록`);
		messege.push(`편하게 진행하고 싶다면?`);
		messege.push(`crimecat.org 메시지 매크로`);
		messege.push(`내 테마 플레이 기록 확인하고싶다면?`);
		messege.push(`crimecat.org 메시지 매크로`);
		const gameData = await client.redis?.getAllHashFields("players") || {}; // gameData가 null이면 빈 객체 할당

		// 🔹 gameData가 존재하는지 확인 후 객체 → 배열 변환 후 map() 사용
		const gamePlayGuildList = Object.values(gameData || {}) // gameData가 null이어도 안전하게 처리
			.flatMap(players => players)  // 객체 내부의 배열을 평탄화 (2D → 1D)
			.map(player => `now!! ${player.guildName}`) || [];

		messege = [...messege, ...gamePlayGuildList];


		currentIndex = (currentIndex + 1) % messege.length;
		ActivityMessage(client, messege[currentIndex], currentIndex < 2 ? ActivityType.Watching : ActivityType.Playing);
	}, 6000);
}