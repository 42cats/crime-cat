const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getGuildPublicStatus, toggleGuildPublicStatus } = require('./api/guild/guild');

const nameOfCommand = "길드공개";
const description = "서버의 공개/비공개 상태를 변경합니다 (관리자 전용)";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		try {
			// 현재 상태 조회
			const currentStatus = await getGuildPublicStatus(interaction.guild.id);
			const currentStatusText = currentStatus ? '공개' : '비공개';
			const currentIcon = currentStatus ? '✅' : '🔒';

			// 상태 토글
			const result = await toggleGuildPublicStatus(interaction.guild.id);
			const newStatus = result.innerDto.isPublic;
			const newStatusText = newStatus ? '공개' : '비공개';
			const newIcon = newStatus ? '✅' : '🔒';
			const successColor = newStatus ? '#00FF00' : '#FF0000';

			// Embed 생성
			const embed = new EmbedBuilder()
				.setTitle('🔧 서버 공개 설정')
				.setDescription(`${newIcon} ${result.message}`)
				.setColor(successColor)
				.addFields(
					{ name: '이전 상태', value: `${currentIcon} ${currentStatusText}`, inline: true },
					{ name: '현재 상태', value: `${newIcon} ${newStatusText}`, inline: true }
				)
				.setTimestamp()
				.setFooter({ text: `실행자: ${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() });

			await interaction.editReply({ embeds: [embed] });
		} catch (error) {
			console.error('길드 공개 상태 변경 실패:', error);

			const errorEmbed = new EmbedBuilder()
				.setTitle('❌ 오류 발생')
				.setDescription('서버 공개 상태 변경 중 오류가 발생했습니다.')
				.setColor('#FF0000')
				.setTimestamp();

			await interaction.editReply({ embeds: [errorEmbed] });
		}
	},

	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator,
	isCacheCommand: false,
};
