// autocomplete/로그파일명.js
const { Client, Interaction } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
	name: '파일명', // 슬래시 명령어의 옵션 name과 일치해야 함

	/**
	 * @param {Client} client 
	 * @param {Interaction} interaction 
	 */
	execute: async (client, interaction) => {
		const focusedValue = interaction.options.getFocused(true).value;
		const guildId = interaction.guildId;

		const logFolderPath = path.resolve(__dirname, `../../dat/${guildId}`);
		let suggestions = [];

		if (fs.existsSync(logFolderPath)) {
			const files = fs.readdirSync(logFolderPath)
				.filter(name => name.endsWith('.xlsx') || name.endsWith('.xls'))
				.map(name => path.basename(name, path.extname(name))); // 확장자 제거

			const normalizedInput = focusedValue.normalize("NFC").toLowerCase();

			suggestions = files
				.filter(name => name.normalize("NFC").toLowerCase().includes(normalizedInput))
				.slice(0, 25)
				.map(name => ({ name, value: name }));
		}

		await interaction.respond(suggestions);
	}
};
