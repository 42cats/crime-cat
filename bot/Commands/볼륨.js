const { SlashCommandBuilder, PermissionFlagsBits, Client } = require('discord.js');
const delayedDeleteMessage = require('./utility/deleteMsg');
const { deleteMessagesFromChannel } = require('./utility/cleaner');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const API = process.env.GOOGLE_API;

const nameOfCommand = "볼륨";
const description = '플레이어의 볼륨을 제어합니다.';

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addNumberOption(option =>
			option
				.setName('볼륨') // 옵션 이름은 소문자로 설정해야 합니다.
				.setDescription('설정할 음량크기 (1 ~ 100)')
				.setMinValue(0)
				.setMaxValue(100)
				.setRequired(true) // 필수가 아님
		),

	async execute(interaction) {
		const guildId = interaction.guildId;
		const client = interaction.client;
		const channelId = interaction.channelId;
		const amount = interaction.options.getNumber('볼륨');
		console.log("Volume amount = ", amount);
		const retmsg = await volumeControl(client, guildId, amount);
		const msg = await interaction.reply(retmsg);
		await delayedDeleteMessage(msg, 1);
	},
	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
			const guildId = message.guildId;
			const client = message.client;
			const channelId = message.channelId;
			const amount = args[0] ? parseInt(args[0]) : null;
			console.log(amount, !Number.isInteger(amount), amount < 0, amount > 100 , !amount);
			if (!Number.isInteger(amount) || amount < 0 || amount > 100) {
				const msg = await message.channel.send("입력값이 잘못되었습니다. 다시한번 확인해 주세요 0~100 사이의 값을 입력해야 합니다.");
				await delayedDeleteMessage(msg, 1);
				return;
			}
			const retmsg = await volumeControl(client, guildId, amount);
			const msg = await message.channel.send(retmsg);
			await delayedDeleteMessage(msg, 1);
		}
	},
	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};

/**
 * 
 * @param {Client} client 
 * @param {Number} Volume 
 */
async function volumeControl(client, guildId, Volume) {
	const musicData = client.serverMusicData.get(guildId);
	if (!musicData)
		return "음악 플레이어 정보가 없습니다. 음악 플레이어를 생성하고 사용해 주세요";
	const targetVolume = (Volume / 100);
	console.log("targetvolume = ", targetVolume);
	await musicData.audioPlayerManager.setVolume(targetVolume);
	return `음량이 설정되었습니다.`
}