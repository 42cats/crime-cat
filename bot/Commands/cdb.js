// commands/ping.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { processGuildAndUsersWithHistory } = require('./utility/discord_db');
const dotenv = require('dotenv');
const { guildAddProcess } = require('./api/guild/guild');
dotenv.config();
const prefix = process.env.PRIFIX;

const nameOfCommand = "cdb";
const description = "dbcreate";
module.exports = {
	// 슬래시 명령어 정의
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description),

	// 슬래시 명령어 실행
	async execute(interaction) {
		await interaction.reply('dbcreate! 슬래시 명령어');
	},

	// Prefix 명령어 정의
	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			if (message.author.id !== '317655426868969482') return;
			const client = message.client;
			await message.reply('db 생성시작');
			const list = client.guilds.cache;
			for (const v of list.values()) {
				try {
					await guildAddProcess(client,v);
				} catch (err) {
					console.error('Error processing guild:', err);
					break; // 에러 발생 시 즉시 루프 중단
				}
			}
			await message.reply('db 셍성끝');
		}
	},
	upload: false,
	permissionLevel: -1
};
