// const { Client, InteractionResponse } = require('discord.js');
// module.exports = {
// 	name: "권한",
// 	/**
// 	 * @param {Client} client 
// 	 * @param {InteractionResponse} interaction 
// 	 * @returns 
// 	 */
// 	execute: async (client, interaction) => {
// 		const focusedOption = interaction.options.getFocused(true);
// 		if (focusedOption.name === '권한') {
// 			const roles = await interaction.guild.roles.fetch(); // 서버의 역할을 가져옴
// 			const roleNames = roles.map(role => role.name); // 역할 이름을 추출

// 			// 입력된 값에 맞는 역할을 필터링하여 제시
// 			const filteredRoles = roleNames.filter(roleName => roleName.toLowerCase().startsWith(focusedOption.value.toLowerCase()));

// 			// 자동완성 결과 반환
// 			await interaction.respond(
// 				filteredRoles.map(role => ({ name: role, value: role }))
// 			);
// 		}
// 	},
// }