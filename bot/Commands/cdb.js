// commands/cdb.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const dotenv = require('dotenv');
const { guildAddProcess } = require('./api/guild/guild');
dotenv.config();

const nameOfCommand = "cdb";
const description = "개발자 전용: DB 생성 실행";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description),

	async execute(interaction) {
		// 개발자 유저 ID 검사
		if (interaction.user.id !== '317655426868969482') {
			return await interaction.reply({ content: '⛔ 이 명령어는 개발자 전용입니다.', ephemeral: true });
		}

		await interaction.reply({ content: '📦 DB 생성 시작', ephemeral: true });

		const client = interaction.client;
		const guildList = client.guilds.cache;

		for (const guild of guildList.values()) {
			try {
				await guildAddProcess(client, guild);
			} catch (err) {
				console.error('❌ Error processing guild:', err);
				await interaction.followUp({ content: `❌ ${guild.name} 처리 중 에러 발생`, ephemeral: true });
				break;
			}
		}

		await interaction.followUp({ content: '✅ DB 생성 완료', ephemeral: true });
	},

	upload: true,
	permissionLevel: -1 // 길드 전용으로 등록할 수 있도록 설정
};
