const {
	ButtonBuilder,
	ActionRowBuilder,
	ButtonStyle
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');


// responses/buttons/logHandler.js

function loadExcelSheet(guildId, fileName) {
	const filePath = path.resolve(__dirname, `../../dat/${guildId}/${fileName}.xlsx`);
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

	const buttonKey = `log:${guild.id}:${fileName}:${currentRow}`;

	// Redis에 버튼 정보 저장
	await client.redis.setValue({
		command: 'logHandler',
		guildId: guild.id,
		fileName,
		currentRow
	}, 60 * 60 * 24, buttonKey);

	const nextButton = new ButtonBuilder()
		.setCustomId(buttonKey)
		.setLabel(`다음 ${currentRow + 1}`)
		.setStyle(ButtonStyle.Success);

	const rowComponent = new ActionRowBuilder().addComponents(nextButton);
	await sentMessage.edit({ components: [rowComponent] });
	console.log(`[🔘 버튼 추가] 다음 버튼 부착됨`);
}

module.exports = {
	name: 'logHandler',
	/**
	 * @param {Client} client 
	 * @param {ButtonInteraction} interaction 
	 * @param {*} data  // { command, guildId, fileName, currentRow }
	 */
	execute: async (client, interaction, data) => {
		const { fileName, currentRow, guildId } = data;
		const sheet = loadExcelSheet(guildId, fileName);
		if (!sheet) {
			await interaction.reply({ content: `❌ 파일 ${fileName}.xlsx을 찾을 수 없습니다.`, ephemeral: true });
			return;
		}

		console.log(`[📦 logHandler] ${fileName}.xlsx → ${currentRow + 1}행 요청`);

		// 이전 메시지에서 버튼 제거
		await interaction.message.edit({ components: [] });

		await sendLogRow({
			client,
			sheet,
			currentRow: currentRow + 1,
			userId: interaction.user.id,
			guild: interaction.guild,
			defaultChannel: interaction.channel,
			fileName,
			onComplete: async () => {
				try {
					if (!interaction.deferred && !interaction.replied) {
						await interaction.deferUpdate();
					}
					await interaction.followUp("✅ 로그 종료");
				} catch (e) {
					console.error("❌ followUp 오류:", e);
				}
			}

		});
	}
};
