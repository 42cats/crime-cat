const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const delayedDeleteMessage = require('./utility/deleteMsg');
const { addCharacterInfo } = require('./api/character/character');

const nameOfCommand = "캐릭터추가";
const description = "길드에 캐릭터 선택지의 캐릭터 추가";

async function handleAddCharacter({ guild, guildId, characterName, role, roleIds = [], replyFunc }) {
	try {
		const rolesToSend = role ? [role.id] : roleIds;
		const responseData = await addCharacterInfo(guildId, characterName, rolesToSend);

		if (responseData?.character) {
			const savedRoleIds = responseData.character.roles || [];
			const roleNames = savedRoleIds
				.map(id => guild.roles.cache.get(id))
				.filter(r => r)
				.map(r => r.name);

			const result = `✅ 캐릭터 **${characterName}** 추가됨\n🧩 역할: ${roleNames.length > 0 ? roleNames.join(", ") : "설정 없음"}`;
			const msg = await replyFunc(`\`\`\`${result}\`\`\``);
			await delayedDeleteMessage(msg, 2);
		} else if (responseData?.message?.includes("already")) {
			const msg = await replyFunc(`\`\`\`⚠️ ${characterName}는 이미 추가된 이름입니다.\`\`\``);
			await delayedDeleteMessage(msg, 2);
		} else {
			const msg = await replyFunc(`\`\`\`❌ 캐릭터 추가 실패: 알 수 없는 오류\`\`\``);
			await delayedDeleteMessage(msg, 2);
		}
	} catch (err) {
		console.error('명령 실행 중 오류:', err);
		const msg = await replyFunc(`\`\`\`🚨 캐릭터 추가 중 API 오류가 발생했습니다.\`\`\``);
		await delayedDeleteMessage(msg, 2);
	}
}


module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option =>
			option
				.setName('캐릭터이름')
				.setDescription('캐릭터의 이름을 입력하세요.')
				.setRequired(true)
		)
		.addRoleOption(option =>
			option
				.setName('권한')
				.setDescription('권한 역할을 선택하세요.')
				.setRequired(false)
		),

	async execute(interaction) {
		const characterName = interaction.options.getString('캐릭터이름');
		const role = interaction.options.getRole('권한');
		await handleAddCharacter({
			guild: interaction.guild,
			guildId: interaction.guildId,
			characterName,
			role,
			replyFunc: (msg) => interaction.reply(msg),
		});
	},

	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
	
			if (args.length === 0) {
				const msg = await message.channel.send("```!캐릭터추가 이름 @역할1 @역할2 ... 형식으로 입력해주세요```");
				await delayedDeleteMessage(msg, 2);
				return;
			}
	
			const characterName = args[0];
			// 역할 멘션 ID들 추출: <@&ROLE_ID>
			const roleMentions = message.mentions.roles;
			const roleIds = roleMentions.map(role => role.id);
	
			// 역할이 없으면 roleIds = []로 들어감
			await handleAddCharacter({
				guild: message.guild,
				guildId: message.guildId,
				characterName,
				role: null, // 역할 객체 하나만 필요 없음
				roleIds,
				replyFunc: (msg) => message.channel.send(msg),
			});
		}
	},
	

	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};
