const { SlashCommandBuilder } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const nameOfCommand = "bc";
const description = "개발자 전용: 모든 서버 오너에게 메시지를 브로드캐스트";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.addStringOption(option =>
			option.setName('메시지')
				.setDescription('서버 오너에게 보낼 메시지')
				.setRequired(true)),

	async execute(interaction) {
		// ✅ 개발자 인증
		if (interaction.user.id !== '317655426868969482') {
			return await interaction.reply({ content: '⛔ 이 명령어는 개발자 전용입니다.', ephemeral: true });
		}

		const client = interaction.client;
		const messageContent = interaction.options.getString('메시지');
		const guilds = client.guilds.cache;
		const ownerSet = new Set();
		let counter = 0;

		// 먼저 오너 ID 수집
		for (const guild of guilds.values()) {
			if (!ownerSet.has(guild.ownerId) && guild.ownerId !== "288302173912170497") {
				ownerSet.add(guild.ownerId);
			}
		}

		await interaction.reply({ content: `📢 브로드캐스트 시작: ${ownerSet.size}명의 오너에게 전송 시도`, ephemeral: true });

		for (const ownerId of ownerSet) {
			try {
				const owner = await client.users.fetch(ownerId);
				await owner.send(messageContent);
				counter++;
				console.log(`✅ DM 전송됨: ${owner.globalName} (${ownerId})`);
			} catch (err) {
				console.error(`❌ DM 실패: ${ownerId}`, err);
			}
		}

		await interaction.followUp({ content: `📨 메시지 전송 완료: ${counter}/${ownerSet.size}명에게 성공`, ephemeral: true });
	},

	upload: true,
	permissionLevel: -1
};
