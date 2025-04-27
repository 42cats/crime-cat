const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const nameOfCommand = "전체길드";
const description = "봇이 참여한 길드를 오너별로 정리해 출력합니다.";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description),

	async execute(interaction) {
		if (interaction.user.id !== '317655426868969482') {
			return await interaction.reply({ content: '⛔ 이 명령어는 개발자 전용입니다.', ephemeral: true });
		}

		await interaction.reply({ content: `📋 길드 정보를 오너별로 정리 중입니다...`, ephemeral: true });

		const client = interaction.client;
		const guilds = client.guilds.cache;

		const ownerMap = new Map();

		for (const guild of guilds.values()) {
			try {
				const owner = await client.users.fetch(guild.ownerId);
				const ownerId = owner.id;

				if (!ownerMap.has(ownerId)) {
					ownerMap.set(ownerId, {
						ownerTag: owner.tag,
						ownerId,
						guilds: []
					});
				}

				ownerMap.get(ownerId).guilds.push({
					name: guild.name,
					id: guild.id,
					memberCount: guild.memberCount,
					createdAt: guild.createdTimestamp
				});
			} catch (err) {
				console.error(`❌ ${guild.name} 정보 조회 실패:`, err);
			}
		}

		// 오너 순회
		for (const { ownerTag, ownerId, guilds } of ownerMap.values()) {
			// ✅ 길드 이름으로 정렬
			const sortedGuilds = guilds.sort((a, b) => a.name.localeCompare(b.name, 'ko'));

			const embed = new EmbedBuilder()
				.setTitle(`👑 ${ownerTag}`)
				.setDescription(`🆔 오너 ID: ${ownerId}\n📋 총 길드 수: **${sortedGuilds.length}개**`)
				.setColor(0x9b59b6);

			// ✅ 정리된 표 형태로 추가
			for (const g of sortedGuilds) {
				const createdAtFormatted = `<t:${Math.floor(g.createdAt / 1000)}:F>`; // 길드 생성일 포맷
				embed.addFields({
					name: `📘 ${g.name}`,
					value: `🆔 길드 ID: ${g.id}\n👥 인원수: ${g.memberCount}명\n📆 생성일: ${createdAtFormatted}`,
					inline: false
				});
			}

			await interaction.followUp({ embeds: [embed] });
		}
	},

	upload: true,
	permissionLevel: -1
};
