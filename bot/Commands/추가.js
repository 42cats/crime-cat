const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const dotenv = require('dotenv');
const path = require('path');
const delayedDeleteMessage = require('./utility/deleteMsg');
const { addChannelClean } = require('./api/channel/channel');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const nameOfCommand = "추가";
const description = "고양이 명령어 사용을 위해 현 채널 추가";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction) {
		const guildId = interaction.guildId;
		const channelId = interaction.channelId;
		const replydata = await addChannelForDelete(guildId, channelId);
		const msg = await interaction.reply(`${interaction.channel.name} 추가 ${replydata}`);
		await delayedDeleteMessage(msg, 1);
	},
	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
			const client = message;
			const guildId = message.guildId;
			const channelId = message.channel.id;
			const replydata = await addChannelForDelete(guildId, channelId);
			const msg = await message.channel.send(`${message.channel.name} 추가 ${replydata}`);
			await delayedDeleteMessage(msg, 1);
		}
	},
	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};


async function addChannelForDelete(guildId, channelId) {

	if (!guildId) {
		throw Error('길드아이디 오류. 관리자에게 문의');
	}
	return await addChannelClean(guildId, channelId);

}