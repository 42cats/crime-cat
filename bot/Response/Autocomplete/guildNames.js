const { Client, InteractionResponse, AutocompleteInteraction } = require('discord.js');
const { getUserHistory } = require('../../Commands/api/history/history');
module.exports = {
	name: "길드",
	/**
	 * @param {Client} client 
	 * @param {AutocompleteInteraction} interaction 
	 * @returns 
	 */
	execute: async (client, interaction) => {
		const { user } = interaction;
		const focusedOption = interaction.options.getFocused(true);

		if (focusedOption.name === '길드') {
			// 사용자의 길드 히스토리를 가져옴
			const userHistoryData = await getUserHistory(user.id);

			// guild_id와 created_at을 맵 형태로 변환
			const guildMap = userHistoryData.reduce((acc, v) => {
				acc[v.guildSnowflake] = v.createdAt;
				return acc;
			}, {});

			// 클라이언트의 guilds.cache에서 필터링
			const choices = client.guilds.cache
				.filter(guild => guildMap[guild.id]) // userHistoryData에 있는 길드만 필터링
				.map(guild => {
					// created_at을 가져와 한국 시간으로 변환
					const createdAt = guildMap[guild.id]
						? new Date(guildMap[guild.id]).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
						: '정보 없음';

					return {
						name: `${guild.name}  (${createdAt})`,
						value: guild.id
					};
				});

			// 사용자가 입력한 값과 일치하는 부분검색 지원
			const filteredChoices = choices.filter(choice =>
				choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()) // 부분 일치 검색
			).slice(0, 25); // Discord는 최대 25개 선택지를 반환
			await interaction.respond(filteredChoices);
		}
	},
};
