const { Client, AutocompleteInteraction } = require('discord.js');
const { getCharacterNames } = require('../../Commands/api/character/character');

module.exports = {
	name: "캐릭터이름",
	/**
	 * @param {Client} client 
	 * @param {AutocompleteInteraction} interaction 
	 */
	execute: async (client, interaction) => {
		const { guildId } = interaction;
		const focusedOption = interaction.options.getFocused(true);

		if (focusedOption.name === '캐릭터이름') {
			try {
				const result = await getCharacterNames(guildId);

				// API 응답에서 characters 배열 추출
				const characters = result?.characters || [];

				// 캐릭터 이름을 선택지로 변환
				const choices = characters.map(char => ({
					name: char.name,
					value: char.name
				}));

				// 입력값으로 필터링
				const filteredChoices = choices
					.filter(choice =>
						choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase())
					)
					.slice(0, 25); // Discord 제한

				await interaction.respond(filteredChoices);
			} catch (err) {
				console.error("오토컴플리트 에러:", err);
				await interaction.respond([]); // 실패 시 빈 선택지 반환
			}
		}
	}
};
