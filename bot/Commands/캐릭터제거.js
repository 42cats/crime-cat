const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const delayedDeleteMessage = require('./utility/deleteMsg');
const { deleteCharacter } = require('./api/character/character');

const nameOfCommand = "캐릭터제거";
const description = "길드에 캐릭터 선택지의 캐릭터 제거";

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
				.setAutocomplete(true)
		),

	async execute(interaction) {
		const characterName = interaction.options.getString('캐릭터이름');
		const guildId = interaction.guildId;

		await handleDeleteCharacter({
			guildId,
			characterName,
			sendReply: (msg) => interaction.reply(msg),
		});
	},

	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

			if (args.length !== 1) {
				const msg = await message.channel.send("```!캐릭터삭제 이름 으로 설정해야 합니다```");
				await delayedDeleteMessage(msg, 2);
				return;
			}

			const characterName = args[0];
			const guildId = message.guildId;

			await handleDeleteCharacter({
				guildId,
				characterName,
				sendReply: (msg) => message.channel.send(msg),
			});
		}
	},

	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};

/**
 * 캐릭터 삭제 처리 공통 로직
 * @param {Object} params
 * @param {String} params.guildId
 * @param {String} params.characterName
 * @param {(msg: string) => Promise<Message>} params.sendReply
 */
async function handleDeleteCharacter({ guildId, characterName, sendReply }) {
	try {
		const response = await deleteCharacter(guildId, characterName);

		if (response?.message === "Character deleted successfully") {
			const msg = await sendReply(`\`\`\`✅ 캐릭터 ${response.characterName} 가 삭제되었습니다.\`\`\``);
			await delayedDeleteMessage(msg, 2);
		} else {
			const msg = await sendReply(`\`\`\`⚠️ 캐릭터 삭제 실패: 존재하지 않거나 삭제 불가능한 이름입니다.\`\`\``);
			await delayedDeleteMessage(msg, 2);
		}
	} catch (e) {
		console.error("캐릭터 삭제 중 오류:", e);
		const msg = await sendReply("```❌ 캐릭터 삭제 도중 오류가 발생했습니다.```");
		await delayedDeleteMessage(msg, 2);
	}
}
