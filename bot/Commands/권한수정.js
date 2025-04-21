const { SlashCommandBuilder } = require('discord.js');
const dotenv = require('dotenv');
const { editPermisson } = require('./api/user/permission');
dotenv.config();

const nameOfCommand = "권한수정";
const description = "개발자 전용: 사용자 권한 정보를 수정합니다.";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.addStringOption(option =>
			option.setName('이름')
				.setDescription('수정할 권한 이름')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('가격')
				.setDescription('수정할 가격')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('기간')
				.setDescription('수정할 권한 기간 (일, 기본: 28)')
				.setRequired(false)),

	async execute(interaction) {
		if (interaction.user.id !== '317655426868969482') {
			return await interaction.reply({ content: '⛔ 이 명령어는 개발자 전용입니다.', ephemeral: true });
		}

		const name = interaction.options.getString('이름');
		const price = interaction.options.getInteger('가격');
		const duration = interaction.options.getInteger('기간') ?? 28;

		try {
			const response = await editPermisson(name, price, duration);
			await interaction.reply({
				content: `✔️ 권한 수정 완료\n` +
					`📛 이름: \`${name}\`\n💰 가격: \`${price}\`\n📅 기간: \`${duration}\`일\n📨 메시지: ${response.data.message}`,
				ephemeral: true
			});
		} catch (error) {
			console.error('❌ 권한 수정 실패:', error);
			await interaction.reply({ content: '❌ 권한 수정 중 오류가 발생했습니다.', ephemeral: true });
		}
	},

	upload: true,
	permissionLevel: -1
};
