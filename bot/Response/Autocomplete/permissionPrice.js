const { Client, InteractionResponse, AutocompleteInteraction } = require('discord.js');
const { getPermissionPrice, PRICE_PERMISSION } = require('../../Commands/utility/UserGrade');
module.exports = {
	name: "봇권한",
	/**
	 * @param {Client} client 
	 * @param {AutocompleteInteraction} interaction 
	 * @returns 
	 */
	execute: async (client, interaction) => {
		const { user } = interaction;
		const focusedOption = interaction.options.getFocused(true);
		if (focusedOption.name === '봇권한') {
			// 클라이언트의 guilds.cache에서 모든 길드를 가져와 선택지로 변환
			const missingPermission = await getPermissionPrice(interaction.user);
			console.log("missing permission - ", missingPermission);
			const choices = missingPermission
				.map(v => ({
					name: v.permission,
					value: v.permissionName
				}));
			// 사용자가 입력한 값과 시작하는 길드 이름을 필터링 (대소문자 구분 없이)
			const filteredChoices = choices.filter(choice =>
				choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase())
			).slice(0, 25); // Discord는 최대 25개 선택지를 반환
			await interaction.respond(filteredChoices);
		}
	},
};
