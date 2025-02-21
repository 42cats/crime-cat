const { SlashCommandBuilder, PermissionFlagsBits, Role } = require('discord.js');
const { deleteCharacterName } = require('./utility/discord_db');
const delayedDeleteMessage = require('./utility/deleteMsg');
const nameOfCommand = "캐릭터제거";
const description = "길드에 캐릭터 선택지의 캐릭터 제거";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option =>
			option
				.setName('캐릭터이름') // 문자열 옵션 이름
				.setDescription('캐릭터의 이름을 입력하세요.') // 문자열 옵션 설명
				.setRequired(true) // 필수 옵션 여부
				.setAutocomplete(true)
		)
	,

	async execute(interaction) {
		const CharacterName = interaction.options.getString('캐릭터이름'); // 캐릭터이름 옵션 값 가져오기
		const guildId = interaction.guildId;
		const retMsg = await deleteCharacterName(guildId, CharacterName);
		const msg = await interaction.reply(`\`\`\`${retMsg}\`\`\``);
		await delayedDeleteMessage(msg, 2);
	},
	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
			if (args.length !== 1) {
				const msg = await message.channel.send("\`\`\`!캐릭터삭제 이름  으로 설정해야 합니다\`\`\`");
				await delayedDeleteMessage(msg, 2);
				return;
			}
			const guildId = message.guildId;
			const CharacterName = args[0];
			const retMsg = await deleteCharacterName(guildId, CharacterName);
			const msg = await message.channel.send(`\`\`\`${retMsg}\`\`\``);
			await delayedDeleteMessage(msg, 2);

		}
	},
	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};
