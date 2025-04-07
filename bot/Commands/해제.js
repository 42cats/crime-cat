const { SlashCommandBuilder, PermissionFlagsBits, Message } = require('discord.js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const nameOfCommand = "해제";
const description = '채널 권한이나 역할을 유저 또는 역할로부터 제거함';

module.exports={
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.addStringOption(option =>
			option.setName('targets')
				.setDescription('해제할 채널(#채널), 역할(@역할), 유저(@유저)를 입력하세요')
				.setRequired(true)),

	async execute(interaction) {
		const guild = interaction.guild;
		const inputString = interaction.options.getString('targets');
		return await processRevoke(interaction, guild, inputString);
	},

	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			const guild = message.guild;
			if (!args.length) return message.reply('사용법: `!해제 #채널 @역할 @유저` 또는 `!해제 @역할 @유저`');
			const inputString = args.join(' ');
			return await processRevoke(message, guild, inputString);
		}
	},

	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};

async function processRevoke(interaction, guild, inputString) {
	const channelMatches = inputString.match(/<#(\d+)>/g) || [];
	const roleMatches = inputString.match(/<@&(\d+)>/g) || [];
	const userMatches = inputString.match(/<@!?(\d+)>/g) || [];

	const channels = channelMatches.map(m => guild.channels.cache.get(m.replace(/<|#|>/g, ''))).filter(Boolean);
	const roles = roleMatches.map(m => guild.roles.cache.get(m.replace(/<|@|&|>/g, ''))).filter(Boolean);
	const users = userMatches.map(m => guild.members.cache.get(m.replace(/<|@|!|>/g, ''))).filter(Boolean);

	if (channels.length > 0 && roles.length > 0 && users.length > 0) {
		return interaction.reply({ content: '❗ 채널과 역할이 모두 있을 경우 유저를 함께 지정할 수 없습니다.\n\n📘 사용법: `/해제 #채널 @역할` 또는 `/해제 @역할 @유저`', ephemeral: true });
	}

	if (channels.length === 0 && roles.length === 0 && users.length === 0) {
		return interaction.reply({ content: '❗ 입력된 대상이 없습니다. 형식을 다시 확인해주세요.\n\n📘 사용법: `/해제 #채널 @역할`, `/해제 @역할 @유저`, `/해제 #채널 @유저`', ephemeral: true });
	}

	if (users.length === 0 && (channels.length === 0 || roles.length === 0)) {
		return interaction.reply({ content: '❗ 유저 없이 사용할 경우에는 채널과 역할 모두를 입력해야 합니다.\n\n📘 사용법: `/해제 #채널 @역할`', ephemeral: true });
	}

	let successCount = 0;
	let errorMessages = [];
	let revokedChannels = [], revokedRoles = [];

	if (users.length > 0) {
		for (const channel of channels) {
			for (const user of users) {
				try {
					await channel.permissionOverwrites.delete(user);
					revokedChannels.push(`🗑️ ${user.user.tag} → ${channel.name}`);
					successCount++;
				} catch (err) {
					errorMessages.push(`❌ ${user.user.tag} → ${channel.name} 실패: ${err.message}`);
				}
			}
		}
		for (const user of users) {
			for (const role of roles) {
				try {
					await user.roles.remove(role);
					revokedRoles.push(`🗑️ ${user.user.tag} → ${role.name}`);
					successCount++;
				} catch (err) {
					errorMessages.push(`❌ ${user.user.tag} → ${role.name} 실패: ${err.message}`);
				}
			}
		}
	} else {
		for (const channel of channels) {
			for (const role of roles) {
				try {
					await channel.permissionOverwrites.delete(role);
					revokedChannels.push(`🗑️ ${role.name} → ${channel.name}`);
					successCount++;
				} catch (err) {
					errorMessages.push(`❌ ${role.name} → ${channel.name} 실패: ${err.message}`);
				}
			}
		}
	}

	let response = `✅ ${successCount}개 해제 완료.`;
	if (revokedChannels.length > 0) response += `\n📌 채널 권한:\n${revokedChannels.join('\n')}`;
	if (revokedRoles.length > 0) response += `\n📌 역할 제거:\n${revokedRoles.join('\n')}`;
	if (errorMessages.length > 0) response += `\n⚠️ 오류:\n${errorMessages.join('\n')}`;

	return interaction.reply({ content: response, ephemeral: false });
}
