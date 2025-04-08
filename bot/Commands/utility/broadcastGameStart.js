const { getGmaePlayedUser } = require('../api/history/history');
const { Client } = require('discord.js');

/**
 * 특정 길드에서 플레이한 적 있는 유저 중 알림 설정이 활성화된 유저에게 DM을 전송하는 함수
 * @param {Client} client - Discord 클라이언트 인스턴스
 * @param {string} guildId - 길드 ID
 * @param {string} gameInfo - 전송할 게임 시작 메시지
 */
async function sendGameStartDM(client, guildId) {
	try {
		const userIds = await getGmaePlayedUser(guildId, true);;

		const playersData = await client.redis.getHash("players", guildId);
		let gameInfo = "";
		const guildName = playersData[0]?.guildName || "???";
		console.log("platerdata =- ", playersData);
		playersData?.map(v => {
			gameInfo += (`${v.characterName} 역의 ${v.name} 님\n`);
		})
		if (userIds.length === 0) {
			console.log(`🔍 해당 길드(${guildId})에서 플레이 또는 알람설정한 유저가 없습니다.\n${gameInfo}`);
			return;
		}
		try {
			client.master.send(`${gameInfo}`);
		} catch (error) {
			console.log(e);
		}

		// 유저에게 DM 전송
		for (const user of userIds) {
			try {
				const discordUser = await client.users.fetch(user.user_id);
				if (discordUser) {
					await discordUser.send(`🎮 **게임 시작 알림** 🎮\n\n${guildName}\n\n${gameInfo}\n\n알림을 받지 않으시려면 /알림 명령어를 써주세요`);
					console.log(`📨 ${user.user_id} 에게 게임 시작 DM 전송 완료`);
				}
			} catch (dmError) {
				console.error(`❌ ${user.user_id}에게 DM을 보낼 수 없습니다.`, dmError);
			}
		}
	} catch (error) {
		console.error('🚨 sendGameStartDM 오류 발생:', error);
	}
}

module.exports = { sendGameStartDM };
