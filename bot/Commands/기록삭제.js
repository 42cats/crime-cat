const { SlashCommandBuilder, PermissionFlagsBits, Message } = require('discord.js');
const { deleteChannelMessage } = require('./api/channel/channel');
const delayedDeleteMessage = require('./utility/deleteMsg');
const nameOfCommand = "기록삭제";
const description = "현재 채널의 기록된 메시지를 삭제합니다.";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description),

	/**
	 * 슬래시 커맨드 실행 시
	 * @param {import('discord.js').CommandInteraction} interaction 
	 */
	async execute(interaction) {
		const guildId = interaction.guildId;
		const channelId = interaction.channelId;

		try {
			const resultMsg = await deleteChannelMessage(guildId, channelId);
			const msg = await interaction.reply({ content: `🧹 ${resultMsg}`, ephemeral: true });
			delayedDeleteMessage(msg,3);
		} catch (err) {
			console.error(err.stack);
			await interaction.reply({ content: '❌ 기록 삭제 중 오류가 발생했습니다.', ephemeral: true });
		}
	},

	/**
	 * 프리픽스 커맨드 실행 시
	 * @param {Message} message 
	 * @param {string[]} args 
	 */
	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			const guildId = message.guildId;
			const channelId = message.channelId;

			try {
				const resultMsg = await deleteChannelMessage(guildId, channelId);
				const msg = await message.channel.send(`🧹 ${resultMsg}`);
				delayedDeleteMessage(msg,3);
			} catch (err) {
				console.error(err.stack);
				await message.channel.send('❌ 기록 삭제 중 오류가 발생했습니다.');
			}
		}
	},

	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator, // 필요시 관리자 권한 등 추가 가능
	isCacheCommand: false,
};
