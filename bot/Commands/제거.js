const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { delDeleteChannel } = require('./utility/discord_db');
const dotenv = require('dotenv');
const path = require('path');
const delayedDeleteMessage = require('./utility/deleteMsg');
const { deleteChannelClean } = require('./api/channel/channel');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const nameOfCommand = "제거";
const description = "고양이 명령어 사용을 위해 현 채널 제거";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option =>
			option
				.setName('채널이름') // 문자열 옵션 이름
				.setDescription('청소리스트에서 삭제할 채널을 선택하세요') // 문자열 옵션 설명
				.setRequired(true) // 필수 옵션 여부
				.setAutocomplete(true)
		)
		,
		async execute(interaction) {
			const guildId = interaction.guildId;
			const channelId = interaction.options.getString('채널이름'); // 선택한 채널 ID 가져오기
	
			const replydata = await delChannelForDelete(guildId, channelId);
			const msg = await interaction.reply(`${interaction.guild.channels.cache.get(channelId)?.name} 제거 ${replydata}`);
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
			const replydata = await delChannelForDelete(guildId, channelId);
			const msg = await message.channel.send(`${message.channel.name} 제거 ${replydata}`);
			await delayedDeleteMessage(msg, 1);
		}
	},
	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};


async function delChannelForDelete(guildId, channelId) {

	if (!guildId) {
		throw Error('길드아이디 오류. 관리자에게 문의');
	}
	return await deleteChannelClean(guildId, channelId);

}