const { SlashCommandBuilder } = require('discord.js');
const dotenv = require('dotenv');
const { deletePermisson } = require('./api/user/permission');
dotenv.config();

const nameOfCommand = "권한삭제";
const description = "개발자 전용: 사용자 권한을 삭제합니다.";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.addStringOption(option =>
			option.setName('권한이름')
				.setDescription('삭제할 권한 이름')
				.setRequired(true)
		),

	async execute(interaction) {
		// ✅ 개발자 권한 확인
		if (interaction.user.id !== '317655426868969482') {
			return await interaction.reply({ content: '⛔ 이 명령어는 개발자만 사용할 수 있습니다.', ephemeral: true });
		}

		const permissionName = interaction.options.getString('권한이름');

		try {
			const response = await deletePermisson(permissionName);
			await interaction.reply({
				content: `✔️ 권한 삭제 완료\n권한 이름: \`${permissionName}\`\n메시지: ${response.data.message}`,
				ephemeral: true
			});
		} catch (error) {
			console.error('❌ 권한 삭제 실패:', error);
			await interaction.reply({ content: '❌ 권한 삭제 중 오류가 발생했습니다.', ephemeral: true });
		}
	},

	upload: true,
	permissionLevel: -1 // 개발자 전용 길드 등록용
};
