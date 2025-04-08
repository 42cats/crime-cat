const { Client, AutocompleteInteraction } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
	name: "파일이름_삭제",
	/**
	 * @param {Client} client 
	 * @param {AutocompleteInteraction} interaction 
	 * @returns 
	 */
	execute: async (client, interaction) => {
		const focusedOption = interaction.options.getFocused(true);

		if (focusedOption.name === '파일이름_삭제') {
			const userId = interaction.user.id;
			const guildId = interaction.guildId;

			const musicDir = path.join(__dirname, '../../MusicData', userId);
			const logDir = path.join(__dirname, '../../dat', guildId);

			let fileNames = [];

			// 음악 파일
			if (fs.existsSync(musicDir)) {
				const musicFiles = fs.readdirSync(musicDir).map(file => ({
					name: `[음악] ${file}`,
					value: `[음악] ${file}`,
				}));
				fileNames.push(...musicFiles);
			}

			// 로그 파일
			if (fs.existsSync(logDir)) {
				const logFiles = fs.readdirSync(logDir)
					.filter(file => file.endsWith('.xlsx'))
					.map(file => ({
						name: `[로그] ${file}`,
						value: `[로그] ${file}`,
					}));
				fileNames.push(...logFiles);
			}

			// 최대 25개 자동완성 항목 제한
			await interaction.respond(fileNames.slice(0, 25));
		}
	},
};
