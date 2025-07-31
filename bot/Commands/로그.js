const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ButtonBuilder,
	ActionRowBuilder,
	ButtonStyle
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const delayedDeleteMessage = require('./utility/deleteMsg');


const nameOfCommand = "로그";
const description = "엑셀로 저장된 로그를 불러옵니다. 관리자만 가능";

// 📦 엑셀 파일 로드 함수
function loadExcelSheet(guildId, fileName) {
	const filePath = path.resolve(__dirname, `../dat/${guildId}/${fileName}.xlsx`);
	console.log(`[📁 로드] 경로 확인: ${filePath}`);
	if (!fs.existsSync(filePath)) {
		console.warn(`[❌ 없음] 파일 존재하지 않음: ${filePath}`);
		return null;
	}
	const workbook = xlsx.readFile(filePath);
	console.log(`[📥 로드] 워크북 불러옴: ${fileName}.xlsx`);
	return workbook.Sheets[workbook.SheetNames[0]];
}

// 📤 로그 전송 함수
async function sendLogRow({
	client,
	sheet,
	currentRow,
	userId,
	guild,
	defaultChannel,
	fileName,
	onComplete
}) {
	console.log(`[➡️ 진행] currentRow: ${currentRow}`);

	const row = sheet[`A${currentRow}`];
	const channelCell = sheet[`B${currentRow}`];

	if (!row || !row.v) {
		console.log(`[✅ 종료] 시트 데이터 끝 (row ${currentRow})`);
		if (onComplete) await onComplete();
		return;
	}

	const text = String(row.v);
	const targetChannelName = channelCell ? String(channelCell.v).trim() : null;

	let targetChannel = defaultChannel;
	if (targetChannelName) {
		console.log(`[🔎 채널명 검색] "${targetChannelName}"`);
		const found = guild.channels.cache.find(c => c.name === targetChannelName);
		if (found) {
			console.log(`[✅ 채널 발견] ${found.name} (${found.id})`);
			targetChannel = found;
		} else {
			console.warn(`[⚠️ 채널 없음] 기본 채널(${defaultChannel.name})로 전송`);
			await defaultChannel.send(`⚠️ 채널명을 확인해주세요: ${targetChannelName}`);
		}
	}

	const sentMessage = await targetChannel.send(text);
	console.log(`[📤 전송 완료] 메시지 전송 → ${targetChannel.name} (${targetChannel.id})`);

	const buttonUUID = uuidv4(); // ✅ UUID 생성

	// Redis에 버튼 정보 저장
	await client.redis.setValue({
		command: 'logHandler',
		guildId: guild.id,
		fileName,
		currentRow
	}, 60 * 60 * 24, buttonUUID); // ✅ UUID를 Redis key로 사용

	const nextButton = new ButtonBuilder()
		.setCustomId(buttonUUID) // ✅ 커스텀 ID로 UUID 설정
		.setLabel(`다음 ${currentRow + 1}`)
		.setStyle(ButtonStyle.Success);

	const rowComponent = new ActionRowBuilder().addComponents(nextButton);
	await sentMessage.edit({ components: [rowComponent] });
	console.log(`[🔘 버튼 추가] 다음 버튼 부착됨`);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option =>
			option.setName('파일명')
				.setDescription('불러올 엑셀 파일명 (확장자 제외)')
				.setRequired(true)
				.setAutocomplete(true))
		.addIntegerOption(option =>
			option.setName('시작번호')
				.setDescription('몇 번째 줄부터 시작할지 (기본값 1)')
				.setRequired(false)),

	async execute(interaction) {
		const fileName = interaction.options.getString('파일명');
		let currentRow = interaction.options.getInteger('시작번호') || 1;
		const guildId = interaction.guildId;
		const userId = interaction.user.id;

		console.log(`[🚀 슬래시] 로그 실행됨 - 길드: ${guildId}, 유저: ${userId}, 파일: ${fileName}, 시작행: ${currentRow}`);

		const sheet = loadExcelSheet(guildId, fileName);
		if (!sheet) {
			await interaction.reply({ content: `❌ 파일 ${fileName}.xlsx이 존재하지 않습니다.`, ephemeral: true });
			return;
		}

		const msg = await interaction.reply({ content: `📥 ${fileName}.xlsx 불러오는 중...`, ephemeral: false });
		delayedDeleteMessage(msg, 2);
		sendLogRow({
			client: interaction.client,
			sheet,
			currentRow,
			userId,
			guild: interaction.guild,
			defaultChannel: interaction.channel,
			fileName,
			onComplete: async () => {
				await interaction.followUp("✅ 로그 종료");
			}
		});
	},

	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

			const fileName = args[0];
			if (!fileName) {
				await message.channel.send("⚠️ 파일명을 입력해 주세요.");
				return;
			}

			let currentRow = parseInt(args[1]) || 1;
			const guildId = message.guild.id;
			const userId = message.author.id;

			console.log(`[🚀 프리픽스] 로그 실행됨 - 길드: ${guildId}, 유저: ${userId}, 파일: ${fileName}, 시작행: ${currentRow}`);

			const sheet = loadExcelSheet(guildId, fileName);
			if (!sheet) {
				await message.channel.send(`❌ 파일 ${fileName}.xlsx이 존재하지 않습니다.`);
				return;
			}

			const msg = await message.channel.send(`📥 ${fileName}.xlsx 불러오는 중...`);
			delayedDeleteMessage(msg, 2);
			sendLogRow({
				client: message.client,
				sheet,
				currentRow,
				userId,
				guild: message.guild,
				defaultChannel: message.channel,
				fileName,
				onComplete: async () => {
					await message.channel.send("✅ 로그 종료");
				}
			});
		}
	},

	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator,
	isCacheCommand: true,
};
