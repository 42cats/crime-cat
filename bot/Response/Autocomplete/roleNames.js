const { Client, InteractionResponse, AutocompleteInteraction } = require('discord.js');
const { findHistory, getCharacterName } = require('../../Commands/utility/discord_db');
module.exports = {
	name: "캐릭터이름",
	/**
	 * @param {Client} client 
	 * @param {AutocompleteInteraction} interaction 
	 * @returns 
	 */
	execute: async (client, interaction) => {
		const { user, guildId } = interaction;
		console.log("guild id ", guildId);
		const focusedOption = interaction.options.getFocused(true);
		if (focusedOption.name === '캐릭터이름') {
			// 클라이언트의 guilds.cache에서 모든 길드를 가져와 선택지로 변환
			const guildIdMap = await getCharacterName(guildId);
			const values = guildIdMap.map(v => v.dataValues);
			console.log("guildmap = ", values);
			const choices = values
				.map(role => ({
					name: role.character_name,
					value: role.character_name
				}));
			// 사용자가 입력한 값과 시작하는 길드 이름을 필터링 (대소문자 구분 없이)
			const filteredChoices = choices.filter(choice =>
				choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase())
			).slice(0, 25); // Discord는 최대 25개 선택지를 반환
			await interaction.respond(filteredChoices);
		}
	},
};
