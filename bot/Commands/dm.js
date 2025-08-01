// commands/dm.js
const { SlashCommandBuilder } = require('discord.js');

const nameOfCommand = "dm";
const description = "개발자 전용: 유저에게 DM 전송";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.addUserOption(option =>
			option.setName('user')
				.setDescription('DM을 보낼 대상 유저')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('message')
				.setDescription('전송할 메시지')
				.setRequired(true)),

	async execute(interaction) {
		// 개발자 인증
		if (interaction.user.id !== '317655426868969482') {
			return await interaction.reply({ content: '⛔ 이 명령어는 개발자 전용입니다.', ephemeral: true });
		}

		const targetUser = interaction.options.getUser('user');
		const messageContent = interaction.options.getString('message');

		if (!targetUser) {
			return await interaction.reply({ content: '❌ 유저를 찾을 수 없습니다.', ephemeral: true });
		}

		try {
			await targetUser.send(messageContent);
			console.log(`📨 ${targetUser.username} (${targetUser.id}) 에게 DM 전송: ${messageContent}`);
			await interaction.reply({ content: `✅ ${targetUser.username}에게 DM을 전송했습니다.`, ephemeral: true });
		} catch (error) {
			console.error("❌ DM 전송 실패:", error);
			await interaction.reply({ content: `⚠️ ${targetUser.username}에게 DM 전송에 실패했습니다.`, ephemeral: true });
		}
	},

	upload: true,
	permissionLevel: -1, // 길드 전용
	isCacheCommand: false,
};
