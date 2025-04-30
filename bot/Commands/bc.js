const {
	SlashCommandBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder
} = require('discord.js');
const logger = require('./utility/logger');
const dotenv = require('dotenv');
const { encodeToString } = require('./utility/delimiterGeter');
dotenv.config();

const nameOfCommand = "bc";
const description = "개발자 전용: 모든 서버 오너에게 메시지를 브로드캐스트";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description),
	async execute(interaction) {
		try {
			// ✅ 개발자 인증
			if (interaction.user.id !== '317655426868969482') {
				logger.warn(`비인가 사용자 접근: ${interaction.user.id}`);
				return await interaction.reply({
					content: '⛔ 이 명령어는 개발자 전용입니다.',
					ephemeral: true
				});
			}

			// 로깅 추가
			logger.info(`${interaction.user.username}(${interaction.user.id})가 bc 명령어 실행`);


			// 모달 생성
			const modal = new ModalBuilder()
				.setCustomId(encodeToString(interaction.guildId, "brodcastMessage", interaction.channel.id))
				.setTitle('서버 오너 브로드캐스트 메시지');

			const messageInput = new TextInputBuilder()
				.setCustomId(encodeToString(interaction.guildId, "brodcastMessage", interaction.channel.id))
				.setLabel('전송할 메시지 (최대 2000자)')
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true)
				.setMaxLength(2000)
				.setPlaceholder('모든 서버 오너에게 전송될 메시지를 입력하세요.');

			const actionRow = new ActionRowBuilder().addComponents(messageInput);
			modal.addComponents(actionRow);

			// 모달 표시 전 로깅
			logger.info('브로드캐스트 모달 표시 시도');

			// 모달 표시
			await interaction.showModal(modal);

			logger.info('모달 표시 성공');
		} catch (error) {
			// 오류 상세 로깅
			logger.error('bc 명령어 실행 중 오류 발생', error);

			// 오류 응답
			try {
				if (!interaction.replied && !interaction.deferred) {
					await interaction.reply({
						content: '❌ 명령어 실행 중 오류가 발생했습니다.',
						ephemeral: true
					});
				}
			} catch (replyError) {
				logger.error('오류 응답 실패', replyError);
			}
		}
	},
	upload: true,
	permissionLevel: -1
};