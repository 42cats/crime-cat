const { Client, Interaction } = require('discord.js');
const { getGroups } = require('../../Commands/api/messageMacro/messageMacro');

module.exports = {
	name: "groupname",
	/**
	 * @param {Client} client 
	 * @param {Interaction} interaction
	 * @returns 
	 */
	execute: async (client, interaction) => {
		const focusedOption = interaction.options.getFocused(true);
		if (focusedOption.name === 'groupname' || focusedOption.name === 'groupnames') {
			try {
				console.log("🔍 버튼 그룹명 조회 시작 - guildId:", interaction.guildId);
				const groups = await getGroups(interaction.guildId);
				console.log("📦 버튼 그룹명 조회 결과:", groups);

				if (!groups || groups.length === 0) {
					console.log("버튼 그룹명 없음");
					return interaction.respond([]);
				}

				console.log("버튼 그룹명 데이터:", groups);
				let inputValue = focusedOption.value.normalize("NFC").toLowerCase();
				
				// 멀티 옵션인 경우 쉼표로 구분된 마지막 부분만 필터링
				if (focusedOption.name === 'groupnames') {
					const parts = focusedOption.value.split(',');
					inputValue = parts[parts.length - 1].trim().normalize("NFC").toLowerCase();
				}

				const filteredGroups = groups
					.filter(group => {
						if (!inputValue) return true; // 입력값 없으면 모두 허용
						return group.name.normalize("NFC").toLowerCase().includes(inputValue);
					})
					.slice(0, 25)
					.map(group => {
						if (focusedOption.name === 'groupnames') {
							// 멀티 옵션인 경우 기존 입력에 추가
							const parts = focusedOption.value.split(',');
							parts[parts.length - 1] = group.name;
							return {
								name: `${group.name}`,
								value: parts.join(',')
							};
						} else {
							// 단일 옵션인 경우
							return {
								name: `${group.name}`,
								value: group.name
							};
						}
					});

				await interaction.respond(filteredGroups);

			} catch (error) {
				console.error("버튼 그룹명 오토컴플릿 오류:", error);
				await interaction.respond([]);
				return;
			}
		}
	},
};