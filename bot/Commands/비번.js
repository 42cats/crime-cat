const { SlashCommandBuilder, PermissionFlagsBits, Message } = require('discord.js');
const { matchPasswordContent } = require('./api/passwordNote/passwordNote');

const nameOfCommand = "비번";
const description = "비밀번호를 확인합니다.";

async function checkPasswordAndReply({ guild, user, passwordKey, channel }) {
	try {
		const data = await matchPasswordContent(guild.id, passwordKey);
		const targetChannel = guild.channels.cache.get(data.channelSnowflake);

		const displayName = user.displayName ?? user.globalName ?? user.username;

		await channel.send(`✅ ${displayName} 님이 비밀번호 \`${data.passwordKey}\` 를 푸셨습니다!`);
		await targetChannel?.send(`🔐 \`${data.passwordKey}\`비밀번호 의 컨텐츠:\n${data.content}`);
	} catch (error) {
		const displayName = user.displayName ?? user.globalName ?? user.username;
		await channel.send(`⛔ ${displayName} 님의 비밀번호 \`${passwordKey}\` 시도 실패\n오류: ${error.message ?? error}`);
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.addStringOption(option =>
			option.setName("비밀번호")
				.setDescription("확인할 비밀번호")
				.setRequired(true)
		),

	/**
	 * @param {import('discord.js').CommandInteraction} interaction
	 */
	async execute(interaction) {
		const passwordKey = interaction.options.getString('비밀번호');
		await checkPasswordAndReply({
			guild: interaction.guild,
			user: interaction.user,
			passwordKey,
			channel: interaction.channel
		});
	},

	/**
	 * 프리픽스 커맨드 (!비번 <비밀번호>)
	 * @param {Message} message
	 * @param {string[]} args
	 */
	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			const passwordKey = args.join(" ").trim();
			if (!passwordKey) {
				return message.reply("⛔ 비밀번호를 입력해주세요. 예시: `!비번 고양이`");
			}
			await checkPasswordAndReply({
				guild: message.guild,
				user: message.member.user,
				passwordKey,
				channel: message.channel
			});
		}
	},

	upload: true,
	permissionLevel: PermissionFlagsBits.DeafenMembers
};
