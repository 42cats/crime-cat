const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle } = require('discord.js');
const ButtonsBuilder = require('./utility/buttonsBuilder');
const { encodeToString } = require('./utility/delimiterGeter');
const { getCharacterNames } = require('./api/character/character');

const nameOfCommand = "캐릭터";
const description = "길드에 캐릭터 선택지 표출";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction) {
		const guildId = interaction.guildId;
		const guildName = interaction.guild.name;
		try {
			console.log("guild id ", guildId, "guild name = ", guildName);
			const components = await getNamse(interaction.client, guildId);
			if (!components) {
				await interaction.reply("추가된 캐릭터가 없습니다");
				return;
			}
			const content = `\`\`\`${guildName}에 오신것을 환영합니다\n해당하는 캐릭터의 이름을 눌러주세요!\n닉네임이 변경됩니다.\`\`\``;
			await interaction.reply({ content, components });
		} catch (e) {
			console.error("캐릭터 명령어 에러", e.stack);
		}
	},

	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			try {
				if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
				const guildId = message.guildId;
				const guildName = message.guild.name;
				const components = await getNamse(message.client, guildId);
				if (!components) {
					await message.channel.send("추가된 캐릭터가 없습니다");
					return;
				}
				const content = `\`\`\`${guildName}에 오신것을 환영합니다\n해당하는 캐릭터의 이름을 눌러주세요!\`\`\``;
				await message.channel.send({ content, components });
			} catch (e) {
				console.error("캐릭터명령어", e.stack);
			}
		}
	},

	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};

/**
 * 캐릭터 목록에서 버튼 구성 반환
 * @param {Client} client
 * @param {String} guildId
 * @returns {ActionRowBuilder[]} or null
 */
async function getNamse(client, guildId) {
	try {
		const result = await getCharacterNames(guildId);
		const characters = result?.characters || [];

		if (characters.length === 0) {
			return null;
		}

		// Redis 저장: 캐릭터 이름 리스트 저장
		await client.redis.setHash("players", guildId, [], 3600 * 3);

		const components = new ButtonsBuilder().add(
			...characters.map(char => {
				const roleIdString = Array.isArray(char.roles) ? char.roles.join(",") : "";
				return new ButtonBuilder()
					.setCustomId(encodeToString(guildId, "characterChoice", char.name))
					.setLabel(char.name)
					.setStyle(ButtonStyle.Primary);
			})
		).make();

		return components;
	} catch (error) {
		console.error("Error in getNamse:", error);
		return null;
	}
}
