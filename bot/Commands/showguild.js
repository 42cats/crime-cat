const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const nameOfCommand = "showguild";
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
					createdAt: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`
				});
			} catch (err) {
				console.error(`❌ ${guild.name} 정보 조회 실패:`, err);
			}
		}

		for (const { ownerTag, ownerId, guilds } of ownerMap.values()) {
			const embed = new EmbedBuilder()
				.setTitle(`👑 ${ownerTag} (${ownerId})`)
				.setDescription(`관리 중인 길드 수: **${guilds.length}개**`)
				.setColor(0x9b59b6);

			for (const g of guilds) {
				embed.addFields({
					name: `📘 ${g.name}`,
					value: `🆔 ${g.id}\n👥 ${g.memberCount}명\n📆 ${g.createdAt}`,
					inline: false
				});
			}

			await interaction.followUp({ embeds: [embed], ephemeral: true });
		}
	},

	upload: true,
	permissionLevel: -1
};
