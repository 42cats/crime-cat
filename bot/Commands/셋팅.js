const { SlashCommandBuilder, PermissionFlagsBits, Message } = require('discord.js');
const { getGuildChannelMessage, deleteChannelMessage } = require('./api/channel/channel');
const delayedDeleteMessage = require('./utility/deleteMsg');

const nameOfCommand = "셋팅";
const description = "저장된 메시지를 불러와 각 채널에 전송합니다.";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	/**
	 * 슬래시 커맨드
	 * @param {import('discord.js').CommandInteraction} interaction 
	 */
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		const guild = interaction.guild;

		try {
			const result = await processSettingCommand(guild);
			await interaction.editReply(result);
		} catch (err) {
			console.error('❌ 셋팅 처리 오류:', err);
			await interaction.editReply('❌ 메시지 전송 중 오류가 발생했습니다.');
		}
	},

	/**
	 * 프리픽스 커맨드
	 * @param {Message} message 
	 */
	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message) {
			const guild = message.guild;

			const reply = await message.channel.send('⏳ 셋팅 실행 중입니다...');

			try {
				const result = await processSettingCommand(guild);
				await reply.edit(result);
				delayedDeleteMessage(reply,3);
			} catch (err) {
				console.error('❌ 셋팅 처리 오류:', err);
				await reply.edit('❌ 메시지 전송 중 오류가 발생했습니다.');
			}
		}
	},

	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};

/**
 * 공통 셋팅 처리 함수 (슬래시 & 프리픽스 공용)
 * @param {import('discord.js').Guild} guild 
 * @returns {Promise<string>} 처리 결과 메시지
 */
async function processSettingCommand(guild) {
	const records = await getGuildChannelMessage(guild.id);

	if (records.length === 0) return '❗ 전송할 기록이 없습니다.';

	let success = 0, failed = 0, deleted = 0;

	for (const record of records) {
		const { channelSnowflake, message } = record;

		try {
			const channel = await guild.channels.fetch(channelSnowflake);

			if (channel?.isTextBased()) {
				await channel.send(message);
				success++;
			} else {
				console.warn(`⚠️ 채널 ${channelSnowflake}은 텍스트 채널이 아닙니다.`);
				failed++;
			}
		} catch (e) {
			console.warn(`⚠️ 채널 ${channelSnowflake}을 찾을 수 없음 → 삭제 요청`);
			await deleteChannelMessage(guild.id, channelSnowflake);
			deleted++;
		}
	}

	return `✅ 셋팅 완료\n📤 성공: ${success}개\n⚠️ 실패: ${failed}개\n🧹 삭제된 채널 정리: ${deleted}개`;
}
