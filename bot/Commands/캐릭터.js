const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getCharacterName } = require('./utility/discord_db');
const ButtonsBuilder = require('./utility/buttonsBuilder');
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
			const ret = await getNamse(interaction.client, guildId);
			if (!ret) {
				await interaction.reply("추가된 캐릭터가 없습니다");
				return;
			}
			const content = `\`\`\`${guildName}에 오신것을 환영합니다\n해당하는 캐릭터의 이름을 눌러주세요!\n닉네임이 변경됩니다.\`\`\``;
			interaction.reply({ content, components: ret });
		}
		catch (e) {
			console.log("캐릭터 명령어 에러", e.stack);
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
				const ret = await getNamse(message.client, guildId);
				console.log(ret);
				if (!ret) {
					await message.channel.send("추가된 캐릭터가 없습니다");
					return;
				}
				const content = `\`\`\`${guildName}에 오신것을 환영합니다\n해당하는 캐릭터의 이름을 눌러주세요!\`\`\``;
				await message.channel.send({ content, components: ret });
			}
			catch (e) {
				console.error("캐릭터명령어", e.stack);
			}
		}
	},
	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};

async function getNamse(client, guildId) {
	try {
		const listOfNmaes = await getCharacterName(guildId);
		console.log("list names", listOfNmaes);
		// 데이터가 없을 경우 처리
		if (!listOfNmaes || listOfNmaes.length === 0) {
			return null;
		}
		if (await client.redis.exists(guildId)) {
			await client.redis.del(guildId);
		}
		const idSet = guildId + "_characterChoice:";
		const components = new ButtonsBuilder().add(
			...listOfNmaes.map(v => {
				const ret = new ButtonBuilder()
					.setCustomId(`${idSet + v.character_name}?${v.role_id}`) // 버튼 ID 설정
					.setLabel(v.character_name)           // 버튼 라벨 설정
					.setStyle(ButtonStyle.Primary);       // 버튼 스타일 설정
				return ret;
			})
		).make();

		return components;
	} catch (error) {
		console.error("Error in getNamse:", error);
		return "캐릭터 목록을 가져오는 중 오류가 발생했습니다.";
	}
}