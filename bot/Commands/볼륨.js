const { SlashCommandBuilder, PermissionFlagsBits, Client } = require('discord.js');
const delayedDeleteMessage = require('./utility/deleteMsg');
const { deleteMessagesFromChannel } = require('./utility/cleaner');
const { MusicSystemAdapter } = require('./utility/MusicSystemAdapter');
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
 * v4 모드 체크 및 볼륨 제어
 * @param {Client} client 
 * @param {string} guildId 
 * @param {Number} Volume 
 */
async function volumeControl(client, guildId, Volume) {
	try {
		// MusicSystemAdapter를 통해 현재 플레이어 가져오기
		const musicPlayer = await MusicSystemAdapter.getPlayer(client, guildId);
		
		if (!musicPlayer) {
			return "음악 플레이어 정보가 없습니다. 음악 플레이어를 생성하고 사용해 주세요";
		}
		
		// v4 플레이어인 경우 오디오 모드 체크
		if (musicPlayer.version === 'v4') {
			const audioMode = musicPlayer.state?.audioMode;
			
			if (audioMode === 'HIGH_QUALITY') {
				return `🎧 **고음질 모드**에서는 볼륨 조절이 불가능합니다.

**현재 설정:** 고음질 모드 (원본 음질 유지)
**변경 방법:** 
1. 플레이어에서 🎛️ **조절 모드** 버튼 클릭
2. 모드 전환 후 다시 볼륨 조절 시도

💡 **두 모드 비교:**
🎧 고음질 모드: 최고 음질, 볼륨 조절 불가
🎛️ 조절 모드: 볼륨/페이드 조절 가능, 약간의 음질 변환`;
			}
			
			// 조절 모드에서만 볼륨 설정 실행
			const normalizedVolume = Volume / 100; // 0-1 범위로 변환
			const success = await musicPlayer.setVolume(normalizedVolume);
			
			if (success) {
				return `🎛️ 볼륨이 **${Volume}%**로 설정되었습니다. (조절 모드)`;
			} else {
				return "볼륨 설정에 실패했습니다. 다시 시도해주세요.";
			}
		}
		
		// v3 또는 기타 버전은 기존 로직 사용
		const result = await MusicSystemAdapter.setVolume(client, guildId, Volume);
		return result;
		
	} catch (error) {
		console.error('[볼륨 설정 오류]', error);
		
		if (error.message?.includes('No player')) {
			return "음악 플레이어 정보가 없습니다. 음악 플레이어를 생성하고 사용해 주세요";
		}
		
		if (error.message?.includes('HIGH_QUALITY')) {
			return "🎧 고음질 모드에서는 볼륨 조절이 불가능합니다. 조절 모드로 전환해주세요.";
		}
		
		return "볼륨 설정 중 오류가 발생했습니다.";
	}
}