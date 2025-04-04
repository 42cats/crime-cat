const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const nameOfCommand = "부여";
const description = '채널 권한이나 역할을 유저에게 부여함';

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.addStringOption(option =>
			option.setName('targets')
				.setDescription('부여할 채널(#채널), 역할(@역할), 유저(@유저)를 입력하세요 다중입력 가능')
				.setRequired(true)),

	async execute(interaction) {
		const guild = interaction.guild;
		const inputString = interaction.options.getString('targets')

		return await processGrant(interaction, guild, inputString);
	},

	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			const guild = message.guild;
			if (!args.length) {
				return message.reply('사용법: `!부여 #채널1 @역할1 @유저1 @유저2`');
			}

			const inputString = args.join(' ');
			return await processGrant(message, guild, inputString);
		}
	},

	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};

/**
 * ✅ 채널과 역할을 자동으로 구분하여 유저에게 부여하는 함수 (응답 메시지 개선)
 */
async function processGrant(interaction, guild, inputString) {
	// 정규식을 이용해 채널, 역할, 유저 파싱
	const channelMatches = inputString.match(/<#(\d+)>/g) || [];
	const roleMatches = inputString.match(/<@&(\d+)>/g) || [];
	const userMatches = inputString.match(/<@!?(\d+)>/g) || [];

	if (userMatches.length === 0) {
		return interaction.reply({ content: '유효한 유저(@유저)를 입력하세요.', ephemeral: true });
	}

	const channels = channelMatches.map(match => guild.channels.cache.get(match.replace(/<|#|>/g, ''))).filter(Boolean);
	const roles = roleMatches.map(match => guild.roles.cache.get(match.replace(/<|@|&|>/g, ''))).filter(Boolean);
	const users = userMatches.map(match => guild.members.cache.get(match.replace(/<|@|!|>/g, ''))).filter(Boolean);

	let successCount = 0;
	let errorMessages = [];
	let grantedChannels = [];
	let grantedRoles = [];

	// ✅ 채널 권한 부여
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
				errorMessages.push(`❌ ${user.user.tag} → ${channel.name} 채널 권한 부여 실패: ${err.message}`);
			}
		}
	}

	// ✅ 역할 부여
	for (const user of users) {
		for (const role of roles) {
			try {
				await user.roles.add(role);
				grantedRoles.push(`🔹 ${user.user.tag} → ${role.name}`);
				successCount++;
			} catch (err) {
				errorMessages.push(`❌ ${user.user.tag} → ${role.name} 역할 부여 실패: ${err.message}`);
			}
		}
	}

	let responseMessage = `✅ ${successCount}개의 권한/역할 부여 완료.\n`;

	if (grantedChannels.length > 0) {
		responseMessage += `\n📌 **채널 권한 부여 내역:**\n${grantedChannels.join('\n')}`;
	}

	if (grantedRoles.length > 0) {
		responseMessage += `\n📌 **역할 부여 내역:**\n${grantedRoles.join('\n')}`;
	}

	if (errorMessages.length > 0) {
		responseMessage += `\n⚠️ **오류 발생:**\n${errorMessages.join('\n')}`;
	}

	return interaction.reply({
		content: responseMessage,
		ephemeral: false
	});
}
