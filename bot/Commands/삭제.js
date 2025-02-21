const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');
const { getDeleteChannel } = require('./utility/discord_db');
const delayedDeleteMessage = require('./utility/deleteMsg');
const { deleteMessagesFromChannel, deleteRecentMessages } = require('./utility/cleaner');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const API = process.env.GOOGLE_API;

const nameOfCommand = "삭제";
const description = '현재 채널의 15일이 지나지 않은 메시지를 모두 삭제함';

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addNumberOption(option =>
			option
				.setName('number') // 옵션 이름은 소문자로 설정해야 합니다.
				.setDescription('삭제할 메시지의 수 (1 ~ 100)')
				.setMinValue(2)
				.setMaxValue(100)
				.setRequired(false) // 필수가 아님
		),

	async execute(interaction) {
		const guildId = interaction.guildId;
		const client = interaction.client;
		const channelId = interaction.channelId;
		const amount = interaction.options.getNumber('number') ? interaction.options.getNumber('number') : 100;
		console.log("amount = ", amount);
		const msg = await interaction.reply("메시지가 삭제중입니다.");
		await delayedDeleteMessage(msg, 1);
		await deleteMessagesFromChannel(channelId, client, amount);
	},
	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
			const guildId = message.guildId;
			const client = message.client;
			const channelId = message.channelId;
			const amount = args[0] ? parseInt(args[0]) : 100;
			console.log(amount);
			if (!Number.isInteger(amount) || amount <= 1 || amount > 100 || !amount) {
				const msg = await message.channel.send("입력값이 잘못되었습니다. 다시한번 확인해 주세요 2~100 사이의 값이나 입력하지않으면 100으로 고정됩니다.");
				await delayedDeleteMessage(msg, 1);
				return;
			}
			console.log(args);
			await deleteRecentMessages(channelId, client, amount);
		}
	},
	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};

