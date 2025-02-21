// commands/ping.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, Message, AttachmentBuilder } = require('discord.js')
const termsSender = require('./utility/termsSender');
const dotenv = require('dotenv');
const { kMaxLength } = require('buffer');
const UserInfoImage = require('./utility/userInfoToImage');
dotenv.config();
const prefix = process.env.PRIFIX;

module.exports = {
	// 슬래시 명령어 정의
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Ping 명령어입니다!!'),

	// 슬래시 명령어 실행
	async execute(interaction) {
		await interaction.reply('Pong! 슬래시 명령어');
	},

	// Prefix 명령어 정의
	prefixCommand: {
		name: 'ping',
		description: 'Ping 명령어입니다!',
		/**
		 * 
		 * @param {Message} message
		 * @param {Array} args
		 */
		async execute(message, args) {
			if (message.author.id !== '317655426868969482') return;
			const client = message.client;
			const list = client.guilds.cache;
			console.log("user object", message.member);
		}
	},
	upload: false,
	permissionLevel: -1
};