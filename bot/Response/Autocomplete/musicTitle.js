const { Client, Interaction } = require('discord.js');
const { getGuildMusic } = require('../../Commands/api/guild/music');

module.exports = {
	name: "타이틀",
	/**
	 * @param {Client} client 
	 * @param {Interaction} interaction 
	 * @returns 
	 */
	execute: async (client, interaction) => {
		const focusedOption = interaction.options.getFocused(true);
		if (focusedOption.name === '타이틀') {
			const titles = await getGuildMusic(interaction.guildId);
			console.log("titles ", titles);
			if (!titles) {
				return interaction.respond([]);
			}

			// 입력된 값을 정규화 (한글 & 영문 대소문자 일관성 유지)
			const inputValue = focusedOption.value.normalize("NFC").toLowerCase();

			// 서버에서 실제 채널 정보 가져오기
			const titleData = titles
				.map(v => {
					const title = v.title
					return title ? { name: title, id: title } : null;
				})
				.filter(v => v !== null); // 존재하는 채널만 필터링
			console.log("after map = ", titleData);
			// 부분 일치 검색 (한글, 영어 등 모든 문자 비교 가능하도록 정규화 적용)
			const filteredtitles = titleData
				.filter(title =>
					title.name.normalize("NFC").toLowerCase().includes(inputValue)
				)
				.slice(0, 25);

			// 자동완성 결과 반환 (채널 이름을 표시하고, 선택하면 채널 ID를 반환)
			await interaction.respond(
				filteredtitles.map(title => ({ name: title.name, value: title.id }))
			);
		}
	},
};
