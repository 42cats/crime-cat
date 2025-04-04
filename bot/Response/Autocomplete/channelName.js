const { Client, Interaction } = require('discord.js');
const { getDeleteChannel } = require('../../Commands/utility/discord_db');
const { getChannelClean } = require('../../Commands/api/channel/channel');

module.exports = {
	name: "채널이름",
	/**
	 * @param {Client} client 
	 * @param {Interaction} interaction 
	 * @returns 
	 */
	execute: async (client, interaction) => {
		const focusedOption = interaction.options.getFocused(true);
		if (focusedOption.name === '채널이름') {
			// 데이터베이스에서 삭제 가능한 채널 ID 목록 가져오기
			const channels = await getChannelClean(interaction.guildId);
			console.log("channsels ", channels);
			if (!channels) {
				return interaction.respond([]);
			}

			// 입력된 값을 정규화 (한글 & 영문 대소문자 일관성 유지)
			const inputValue = focusedOption.value.normalize("NFC").toLowerCase();

			// 서버에서 실제 채널 정보 가져오기
			const channelData = channels
				.map(v => {
					const channel = interaction.guild.channels.cache.get(v);
					return channel ? { name: channel.name, id: v } : null;
				})
				.filter(v => v !== null); // 존재하는 채널만 필터링
				console.log("after map = ", channelData);
			// 부분 일치 검색 (한글, 영어 등 모든 문자 비교 가능하도록 정규화 적용)
			const filteredChannels = channelData
				.filter(channel => 
					channel.name.normalize("NFC").toLowerCase().includes(inputValue)
				)
				.slice(0, 25);

			// 자동완성 결과 반환 (채널 이름을 표시하고, 선택하면 채널 ID를 반환)
			await interaction.respond(
				filteredChannels.map(channel => ({ name: channel.name, value: channel.id }))
			);
		}
	},
};
