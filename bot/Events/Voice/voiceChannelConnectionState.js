// voiceStateUpdate.js
const { Events, ChannelType } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
module.exports = {
	name: "voiceStateUpdate",
	once: false, // 매 이벤트마다 실행

	/**
	 * @param {import('discord.js').VoiceState} oldState
	 * @param {import('discord.js').VoiceState} newState
	 */
	execute: async (oldState, newState) => {
		const client = oldState.client;  // 또는 newState.client (같은 Client 객체)
		const guild = newState.guild;    // oldState.guild도 동일

		// ---- '옛 채널'과 '새 채널' 구분 ----
		const oldChannel = oldState.channel;
		const newChannel = newState.channel;

		// Redis 키로 guild.id를 추천 (guild.name은 변경 가능)
		const redisKey = guild.id;

		// ───────────────────────────────────
		// 1) "새 채널"이 존재하면 -> 유저가 들어옴 (또는 이동)
		// ───────────────────────────────────
		// if (newChannel && newChannel.type === ChannelType.GuildVoice) {
		// 	// 봇 제외 멤버 수
		// 	const nonBotMembers = newChannel.members.filter(m => !m.user.bot);
		// 	const count = nonBotMembers.size;

		// 	// 인원이 2명 이상이라면 Redis에 저장
		// 	if (count >= 4) {
		// 		await client.redis.set(redisKey, count);
		// 		console.log(`[INFO] '${newChannel.name}' 멤버 수(${count}) → Redis 저장`);
		// 	}
		// 	else {
		// 		// 인원이 1명 이하라면 Redis에서 삭제
		// 		if (await client.redis.exists(redisKey)) {
		// 			await client.redis.del(redisKey);
		// 			console.log(`[INFO] '${newChannel.name}' 멤버 ${count}명 → Redis에서 키(${redisKey}) 삭제`);
		// 		}
		// 	}
		// }

		// ───────────────────────────────────
		// 2) "옛 채널"이 존재하면 -> 유저가 떠남 (또는 이동)
		// ───────────────────────────────────
		if (oldChannel && oldChannel.type === ChannelType.GuildVoice) {
			const nonBotMembers = oldChannel.members.filter(m => !m.user.bot);
			const count = nonBotMembers.size;

			if (count <= 2) {
				// 인원이 2명 이하라면 Redis에서 삭제
				await client.redis.deleteField("players",redisKey);
					console.log(`[INFO] '${oldChannel.name}' 멤버 ${count}명 → Redis에서 키(${redisKey}) 삭제`);
			}
		}

		// ───────────────────────────────────
		// 3) 봇이 음성 채널에 연결 중이면, 0명(또는 n명 이하)이면 봇 퇴장
		// (원한다면 구현)
		// ───────────────────────────────────
		const connection = getVoiceConnection(guild.id);
		// ↑ 상황에 따라 연결 가져오는 방식이 다를 수 있으니 맞춰서 사용
		if (connection) {
			const botChannelId = connection.joinConfig?.channelId;
			const botChannel = guild.channels.cache.get(botChannelId);

			if (botChannel && botChannel.type === ChannelType.GuildVoice) {
				const members = botChannel.members.filter(m => !m.user.bot);
				if (members.size === 0) {
					// 봇 퇴장 처리
					console.log(`봇 퇴장 로직 실행...`);
					connection.destroy();  // 등등
				}
			}
		}
	},
};
