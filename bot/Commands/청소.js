const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');
const delayedDeleteMessage = require('./utility/deleteMsg');
const { deleteAllMessages } = require('./utility/cleaner');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const API = process.env.GOOGLE_API;

const nameOfCommand = "청소";
const description = '현재 채널의 모든 메시지를 삭제함';

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction) {
		const guildId = interaction.guildId;
		const client = interaction.client;
		const channelId = interaction.channelId;
		const msg = await interaction.reply("메시지가 삭제중입니다.");
		await deleteChannelMsg(guildId, channelId, client);
		await delayedDeleteMessage(msg, 1);
	},
	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
			const guildId = message.guildId;
			const client = message.client;
			const channelId = message.channelId;
			await deleteChannelMsg(guildId, channelId, client);
		}
	},
	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};

async function deleteChannelMsg(guildId, channelId, client) {
	deleteAllMessages(guildId, channelId, client);
}
