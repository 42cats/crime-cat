const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const nameOfCommand = "파일삭제";
const description = "저장된 음악 또는 로그 파일을 삭제합니다.";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.addStringOption(option =>
			option
				.setName('파일이름_삭제')
				.setDescription('삭제할 파일의 이름을 입력하세요')
				.setAutocomplete(true)
				.setRequired(true)
		),

	/**
	 * Executes the slash command.
	 * @param {import('discord.js').CommandInteraction} interaction
	 */
	async execute(interaction) {
		const selected = interaction.options.getString('파일이름_삭제');
		const guildId = interaction.guildId;
		const userId = interaction.user.id;

		let fileName = selected;
		let filePath, targetDirectory;
		let fileType = 'music';

		// 파일 종류 판별
		if (selected.startsWith('[음악]')) {
			fileName = selected.replace('[음악] ', '').trim();
			targetDirectory = path.join(__dirname, '../MusicData', userId);
			filePath = path.join(targetDirectory, fileName);

		} else if (selected.startsWith('[로그]')) {
			fileName = selected.replace('[로그] ', '').trim();
			targetDirectory = path.join(__dirname, '../dat', guildId);
			filePath = path.join(targetDirectory, fileName);
			fileType = 'log';

			// 관리자 권한 확인
			if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
				await interaction.reply(`❌ 로그 파일 삭제는 관리자만 가능합니다.`);
				return;
			}
		} else {
			await interaction.reply(`❌ 파일 형식이 올바르지 않습니다. 자동완성 목록에서 선택해주세요.`);
			return;
		}

		// 파일 삭제 수행
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);

			// v4 플레이어 캐시 무효화
			if (fileType === 'music') {
				try {
					const { MusicSystemAdapter } = require('./utility/MusicSystemAdapter');
					await MusicSystemAdapter.refreshPlaylist(interaction.client, guildId, 'local');
					console.log(`[캐시갱신] 로컬 음악 캐시 무효화 완료`);
				} catch (error) {
					console.warn(`[캐시갱신] 캐시 무효화 실패 (무시됨):`, error);
				}
			}

			let replyMessage = `✅ 파일이 성공적으로 삭제되었습니다: ${fileName}`;
			if (fileType === 'music') {
				const folderSize = calculateFolderSize(targetDirectory);
				const maxStorage = 100 * 1024 * 1024;
				const leftSpace = maxStorage - folderSize;
				replyMessage += `\n남은 공간: ${(leftSpace / (1024 * 1024)).toFixed(2)}MB`;
				replyMessage += `\n🔄 음악 플레이어 목록이 자동으로 업데이트되었습니다.`;
			}

			await interaction.reply(replyMessage);
		} else {
			await interaction.reply(`❌ 파일을 찾을 수 없습니다: ${fileName}`);
		}
	},

	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator,
	isCacheCommand: false,
};

/**
 * 폴더 내 총 파일 용량 계산 함수
 * @param {string} directory 폴더 경로
 * @returns {number} 총 파일 크기 (바이트)
 */
function calculateFolderSize(directory) {
	let totalSize = 0;
	if (fs.existsSync(directory)) {
		const files = fs.readdirSync(directory);
		for (const file of files) {
			const filePath = path.join(directory, file);
			const stats = fs.statSync(filePath);
			if (stats.isFile()) {
				totalSize += stats.size;
			}
		}
	}
	return totalSize;
}
