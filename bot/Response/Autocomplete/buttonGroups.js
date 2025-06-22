const { Client, Interaction } = require('discord.js');
const { getButtonGroups } = require('../../Commands/api/automation/automationApi');

module.exports = {
	name: "자동화_그룹",
	/**
	 * @param {Client} client 
	 * @param {Interaction} interaction룹
	 * @returns 
	 */
	execute: async (client, interaction) => {
		const focusedOption = interaction.options.getFocused(true);
		if (focusedOption.name === '자동화_그룹') {
			try {
				console.log("🔍 버튼 그룹 조회 시작 - guildId:", interaction.guildId);
				const buttonGroups = await getButtonGroups(interaction.guildId);
				console.log("📦 버튼 그룹 조회 결과:", buttonGroups);

				if (!buttonGroups || buttonGroups.length === 0) {
					console.log("버튼 그룹 없음");
					return interaction.respond([]);
				}

				console.log("버튼 그룹 데이터:", buttonGroups);
				const inputValue = focusedOption.value.normalize("NFC").toLowerCase();

				const filteredGroups = buttonGroups
					.filter(group => {
						if (!inputValue) return true; // 입력값 없으면 모두 허용
						return group.name.normalize("NFC").toLowerCase().includes(inputValue);
					})
					.slice(0, 25)
					.map(group => ({
						name: `${group.name} (${group.buttonCount || 0}개 버튼)`,
						value: group.id
					}));

				await interaction.respond(filteredGroups);

			} catch (error) {
				console.error("버튼 그룹 오토컴플릿 오류:", error);
				await interaction.respond([]);
				return;
			}
		}
	},
};