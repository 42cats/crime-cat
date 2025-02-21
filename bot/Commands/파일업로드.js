const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { USER_PERMISSION, hasPermission } = require('./utility/UserGrade');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const nameOfCommand = "파일업로드";
const description = "음악 파일을 업로드 합니다.";

// Discord.js에서 지원하는 오디오 파일 확장자 목록
const ALLOWED_EXTENSIONS = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus'];

module.exports = {
    aliases: [],

    data: new SlashCommandBuilder()
        .setName(nameOfCommand)
        .setDescription(description)
        .addStringOption(option =>
            option
                .setName('파일이름_업로드')
                .setDescription('저장할 파일의 기본 이름을 입력하세요 (확장자 자동 추가)')
				.setMinLength(2)
				.setMaxLength(10)
                .setRequired(true)
        )
        .addAttachmentOption(option =>
            option
                .setName('파일')
                .setDescription('업로드할 파일을 선택하세요')
                .setRequired(true)
        ),

    /**
     * Slash Command 실행 함수
     * @param {import('discord.js').CommandInteraction} interaction 
     */
    async execute(interaction) {
        const { guildId, user } = interaction;

        // 파일 업로드 권한 확인
        if (!await hasPermission(user, USER_PERMISSION.LOCAL_MUSIC)) {
            await interaction.reply('❌ 파일 업로드 권한이 없습니다. 권한을 업그레이드 해 주세요.');
            return;
        }

        // 옵션 값 가져오기
        const baseFileName = interaction.options.getString('파일이름_업로드');
        const targetFile = interaction.options.getAttachment('파일');

        // 업로드된 파일에서 확장자 추출
        const uploadedFileName = targetFile.name;
        const fileExtension = path.extname(uploadedFileName).toLowerCase().replace('.', '');

        // 확장자가 없는 경우 또는 지원되지 않는 확장자인 경우 처리
        if (!fileExtension || !ALLOWED_EXTENSIONS.includes(fileExtension)) {
            await interaction.reply(`❌ 지원되지 않는 파일 형식입니다. 지원되는 형식: ${ALLOWED_EXTENSIONS.join(', ')}`);
            return;
        }

        // 확장자를 포함한 최종 파일 이름 생성
        const finalFileName = `${baseFileName}.${fileExtension}`;

        // 저장 경로 설정
        const userDirectory = path.join(__dirname, '../MusicData', user.id);
        const filePath = path.join(userDirectory, finalFileName);

        // 폴더가 없으면 생성
        if (!fs.existsSync(userDirectory)) {
            fs.mkdirSync(userDirectory, { recursive: true });
        }

        // 동일한 이름의 파일이 이미 존재하는지 확인
        if (fs.existsSync(filePath)) {
            await interaction.reply(`⚠️ 동일한 이름의 파일이 이미 존재합니다: ${finalFileName}`);
            return;
        }

        // 폴더 내 총 파일 용량 계산
        const folderSize = calculateFolderSize(userDirectory);
        const maxStorage = await hasPermission(user, USER_PERMISSION.LOCAL_MUSIC_UP | USER_PERMISSION.LOCAL_MUSIC) ? 200 * 1024 * 1024 : 100 * 1024 * 1024; // 100MB
        const fileSize = targetFile.size;

        // 저장 용량 초과 체크
        if (folderSize + fileSize > maxStorage) {
            const leftSpace = maxStorage - folderSize;
            await interaction.reply(`⚠️ 파일 저장 공간이 부족합니다. 남은 공간: ${(leftSpace / (1024 * 1024)).toFixed(2)}MB`);
            return;
        }

        try {
            // 파일 다운로드 및 저장
            const response = await axios.get(targetFile.url, { responseType: 'arraybuffer' });
            fs.writeFileSync(filePath, response.data);

            // 남은 용량 계산
            const leftSpace = maxStorage - (folderSize + fileSize);
            await interaction.reply(`✅ 파일이 성공적으로 저장되었습니다. 남은 공간: ${(leftSpace / (1024 * 1024)).toFixed(2)}MB`);
        } catch (error) {
            console.error('파일 저장 오류:', error);
            await interaction.reply('❌ 파일 저장 중 오류가 발생했습니다.');
        }
    },

    prefixCommand: {
        name: nameOfCommand,
        description: description,
        async execute(message, args) {
            message.reply('Prefix Command 실행됨.');
        }
    },

    upload: true,
    permissionLevel: PermissionFlagsBits.Administrator
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
