const { User, History } = require('./db');
const { Client } = require('discord.js');

/**
 * 특정 길드에서 플레이한 적 있는 유저 중 알림 설정이 활성화된 유저에게 DM을 전송하는 함수
 * @param {Client} client - Discord 클라이언트 인스턴스
 * @param {string} guildId - 길드 ID
 * @param {string} gameInfo - 전송할 게임 시작 메시지
 */
async function sendGameStartDM(client, guildId, gameInfo) {
	try {
		// 특정 길드에서 플레이한 적 있는 유저 ID 가져오기
		const historyUsers = await History.findAll({
			where: { guild_id: guildId },
			attributes: ['user_id'],
			raw: true,
		});
		const userIds = historyUsers.map(user => user.user_id);

		if (userIds.length === 0) {
			console.log(`🔍 해당 길드(${guildId})에서 플레이한 유저가 없습니다.`);
			return;
		}

		// 알림이 활성화된(`alert_ok = 1`) 유저 필터링
		const usersToAlert = await User.findAll({
			where: { user_id: userIds, alert_ok: 1 },
			attributes: ['user_id'],
			raw: true,
		});

		if (usersToAlert.length === 0) {
			console.log(`⚠️ 알림을 받을 유저가 없습니다.`);
			return;
		}

		// 유저에게 DM 전송
		for (const user of usersToAlert) {
			try {
				const discordUser = await client.users.fetch(user.user_id);
				if (discordUser) {
					await discordUser.send(`🎮 **게임 시작 알림** 🎮\n${gameInfo}`);
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
