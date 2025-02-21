const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { hasPermission, USER_PERMISSION } = require('./utility/UserGrade');

const nameOfCommand = "파일삭제";
const description = "저장된 음악 파일을 삭제합니다.";

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
	 * @param {import('discord.js').CommandInteraction} interactio제
	*/
    async execute(interaction) {
		const fileName = interaction.options.getString('파일이름_삭제');
        const userDirectory = path.join(__dirname, '../MusicData', interaction.user.id);
        const filePath = path.join(userDirectory, fileName);
		if(!await hasPermission(interaction.user, USER_PERMISSION.LOCAL_MUSIC | USER_PERMISSION.LOCAL_MUSIC_UP)){
			await interaction.reply(`❌ 사용 권한이 없습니다.`);
		}
        if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
			const folderSize = calculateFolderSize(userDirectory);
			const maxStorage = await hasPermission(interaction.user, USER_PERMISSION.LOCAL_MUSIC_UP | USER_PERMISSION.LOCAL_MUSIC) ? 200 * 1024 * 1024 : 100 * 1024 * 1024; // 100MB
            const leftSpace = maxStorage - folderSize;
            await interaction.reply(`✅ 파일이 성공적으로 삭제되었습니다: ${fileName} 남은 공간: ${(leftSpace / (1024 * 1024)).toFixed(2)}MB`);
        } else {
			await interaction.reply(`❌ 파일을 찾을 수 없습니다: ${fileName}`);
        }
    },

    // Additional settings
    upload: true,
    permissionLevel: PermissionFlagsBits.Administrator,
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
