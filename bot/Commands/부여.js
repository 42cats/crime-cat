// grant.js (부여 명령어)
const { SlashCommandBuilder, PermissionFlagsBits, Message } = require('discord.js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const nameOfCommand = "부여";
const description = '채널 권한이나 역할을 유저 또는 역할에게 부여함';

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.addStringOption(option =>
			option.setName('targets')
				.setDescription('부여할 채널(#채널), 역할(@역할), 유저(@유저)를 입력하세요')
				.setRequired(true)),

	async execute(interaction) {
		const guild = interaction.guild;
		const inputString = interaction.options.getString('targets');
		return await processGrant(interaction, guild, inputString);
	},

	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			const guild = message.guild;
			if (!args.length) {
				return message.reply('사용법: `!부여 #채널 @역할 @유저` 또는 `!부여 @역할 @유저`');
			}
			const inputString = args.join(' ');
			return await processGrant(message, guild, inputString);
		}
	},

	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator,
	isCacheCommand: false,
};

async function processGrant(interaction, guild, inputString) {
	const channelMatches = inputString.match(/<#(\d+)>/g) || [];
	const roleMatches = inputString.match(/<@&(\d+)>/g) || [];
	const userMatches = inputString.match(/<@!?(\d+)>/g) || [];

	const channels = channelMatches.map(m => guild.channels.cache.get(m.replace(/<|#|>/g, ''))).filter(Boolean);
	const roles = roleMatches.map(m => guild.roles.cache.get(m.replace(/<|@|&|>/g, ''))).filter(Boolean);
	const users = userMatches.map(m => guild.members.cache.get(m.replace(/<|@|!|>/g, ''))).filter(Boolean);

	if (channels.length > 0 && roles.length > 0 && users.length > 0) {
		return interaction.reply({ content: '❗ 채널과 역할이 모두 있을 경우 유저를 함께 지정할 수 없습니다.\n\n📘 사용법: `/부여 #채널 @역할` 또는 `/부여 @역할 @유저`', ephemeral: true });
	}

	if (channels.length === 0 && roles.length === 0 && users.length === 0) {
		return interaction.reply({ content: '❗ 입력된 대상이 없습니다. 형식을 다시 확인해주세요.\n\n📘 사용법: `/부여 #채널 @역할`, `/부여 @역할 @유저`, `/부여 #채널 @유저`', ephemeral: true });
	}

	if (users.length === 0 && (channels.length === 0 || roles.length === 0)) {
		return interaction.reply({ content: '❗ 유저 없이 사용할 경우에는 채널과 역할 모두를 입력해야 합니다.\n\n📘 사용법: `/부여 #채널 @역할`', ephemeral: true });
	}

	let successCount = 0;
	let errorMessages = [];
	let grantedChannels = [], grantedRoles = [];

	if (users.length > 0) {
		for (const channel of channels) {
			for (const user of users) {
				try {
					await channel.permissionOverwrites.edit(user, {
						ViewChannel: true,
						SendMessages: true,
						ReadMessageHistory: true
					});
					grantedChannels.push(`🔹 ${user.user.tag} → ${channel.name}`);
					successCount++;
				} catch (err) {
					errorMessages.push(`❌ ${user.user.tag} → ${channel.name} 실패: ${err.message}`);
				}
			}
		}
		for (const user of users) {
			for (const role of roles) {
				try {
					await user.roles.add(role);
					grantedRoles.push(`🔹 ${user.user.tag} → ${role.name}`);
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
					await channel.permissionOverwrites.edit(role, {
						ViewChannel: true,
						SendMessages: true,
						ReadMessageHistory: true
					});
					grantedChannels.push(`🔸 ${role.name} → ${channel.name}`);
					successCount++;
				} catch (err) {
					errorMessages.push(`❌ ${role.name} → ${channel.name} 실패: ${err.message}`);
				}
			}
		}
	}

	let response = `✅ ${successCount}개 부여 완료.`;
	if (grantedChannels.length > 0) response += `\n📌 채널 권한:\n${grantedChannels.join('\n')}`;
	if (grantedRoles.length > 0) response += `\n📌 역할 부여:\n${grantedRoles.join('\n')}`;
	if (errorMessages.length > 0) response += `\n⚠️ 오류:\n${errorMessages.join('\n')}`;

	return interaction.reply({ content: response, ephemeral: false });
}