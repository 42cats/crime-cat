const { SlashCommandBuilder, PermissionFlagsBits, Role } = require('discord.js');
const { addCharacterName } = require('./utility/discord_db');
const delayedDeleteMessage = require('./utility/deleteMsg');
const nameOfCommand = "캐릭터추가";
const description = "길드에 캐릭터 선택지의 캐릭터 추가";

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
		)
		.addRoleOption(option =>
			option
				.setName('권한') // 역할 옵션 이름
				.setDescription('권한 역할을 선택하세요.') // 역할 옵션 설명
				.setRequired(false) // 필수 옵션 여부
		)
	,

	async execute(interaction) {
		const CharacterName = interaction.options.getString('캐릭터이름'); // 캐릭터이름 옵션 값 가져오기
		const role = interaction.options.getRole('권한'); // 권한 역할 옵션 값 가져오기
		const guildId = interaction.guildId;
		console.log("role = ", role);
		const isAdd = await addCharacterName(guildId, CharacterName, role?.id);
		let msg = null;
		if (isAdd)
			msg = await interaction.reply(`\`\`\`${CharacterName}에 ${role?.name ? role.name : "설정 없음"} 역을 캐릭터셋에 추가하였습니다.\`\`\``);
		else
			msg = await interaction.reply(`\`\`\`${CharacterName}는 이미 추가된 이름이거나 추가할수 없습니다.\`\`\``);
		await delayedDeleteMessage(msg, 2);
	},
	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
			if (args.length === 0) {
				const msg = await message.channel.send("\`\`\`!캐릭터추가 이름 or !캐릭터추가 이름 역할(길드권한) 으로 설정해야 합니다\`\`\`");
				await delayedDeleteMessage(msg, 2);
				return;
			}
			const guildId = message.guildId;
			const CharacterName = args[0];
			const CharacterRole = args.splice(1).join(" ");
			console.log(CharacterName, CharacterRole,);
			message.guild.roles.cache.map(v => console.log("역할 = ", v.name));
			let role = null;
			if (CharacterRole || CharacterRole.trim() !== "") {
				role = await message.guild.roles.cache.find(r => r.name === CharacterRole);
				if (!role) {
					const msg = await message.channel.send("\`\`\`길드에 없는 역할 입니다. 다시 한번 확인해 주세요\`\`\`");
					await delayedDeleteMessage(msg, 2);
					return;
				}
				role = role;
			}
			console.log("find role = ", role);
			const isAdd = await addCharacterName(guildId, CharacterName, role?.id);
			let msg = null;
			if (isAdd)
				msg = await message.channel.send(`\`\`\`${CharacterName}에 ${role?.name ? role.name : "설정 없음"} 역을 캐릭터셋에 추가하였습니다.\`\`\``);
			else
				msg = await message.channel.send(`\`\`\`${CharacterName}는 이미 추가된 이름이거나 추가할수 없습니다.\`\`\``);
			await delayedDeleteMessage(msg, 2);

		}
	},
	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};
