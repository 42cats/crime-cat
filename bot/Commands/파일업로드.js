const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { isPermissionHas } = require('./api/user/permission');

const nameOfCommand = "파일업로드";
const description = "음악 또는 로그 파일을 업로드 합니다.";

// Discord.js에서 지원하는 오디오 파일 확장자 목록
const ALLOWED_MUSIC_EXTENSIONS = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus'];
const ALLOWED_LOG_EXTENSIONS = ['xlsx', 'xls'];

module.exports = {
    aliases: [],

    data: new SlashCommandBuilder()
        .setName(nameOfCommand)
        .setDescription(description)
        .addStringOption(option =>
            option.setName('종류')
                .setDescription('업로드할 파일 종류를 선택하세요')
                .setRequired(true)
                .addChoices(
                    { name: '음악파일', value: 'music' },
                    { name: '로그파일', value: 'log' }
                )
        )
        .addStringOption(option =>
            option
                .setName('파일이름')
                .setDescription('저장할 파일의 이름 (확장자 자동 추가)')
                .setMinLength(2)
                .setMaxLength(20)
                .setRequired(true)
        )
        .addAttachmentOption(option =>
            option
                .setName('파일')
                .setDescription('업로드할 파일을 선택하세요')
                .setRequired(true)
        ),

    async execute(interaction) {
        const { guildId, user } = interaction;

        const fileType = interaction.options.getString('종류');
        const baseFileName = interaction.options.getString('파일이름');
        const targetFile = interaction.options.getAttachment('파일');

        console.log(`[파일업로드] 호출됨 - 유저: ${user.id}, 길드: ${guildId}, 종류: ${fileType}, 파일명: ${baseFileName}, 업로드 파일: ${targetFile.name}`);

        const uploadedFileName = targetFile.name;
        const fileExtension = path.extname(uploadedFileName).toLowerCase().replace('.', '');

        let allowedExtensions, saveDirectory, finalFileName;

        if (fileType === 'music') {
            const has = await isPermissionHas(user.id, "로컬음악");
            console.log(`[권한체크] 음악 업로드 권한 있음? ${has}`);
            if (!has) {
                await interaction.reply('❌ 음악 파일 업로드 권한이 없습니다.');
                return;
            }
            allowedExtensions = ALLOWED_MUSIC_EXTENSIONS
            saveDirectory = path.join(__dirname, '../MusicData', user.id);
        } else if (fileType === 'log') {
            console.log(`[권한체크] 관리자 권한 있음? ${interaction.member.permissions.has(PermissionFlagsBits.Administrator)}`);
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                await interaction.reply('❌ 로그 파일 업로드는 관리자만 가능합니다.');
                return;
            }
            allowedExtensions = ALLOWED_LOG_EXTENSIONS;
            saveDirectory = path.join(__dirname, '../dat', guildId);
        } else {
            console.warn(`[오류] 알 수 없는 파일 종류: ${fileType}`);
            await interaction.reply('❌ 알 수 없는 파일 종류입니다.');
            return;
        }

        console.log(`[경로계산] 저장경로: ${saveDirectory}`);

        if (!allowedExtensions.includes(fileExtension)) {
            console.warn(`[확장자검사] 허용되지 않는 확장자: ${fileExtension}`);
            await interaction.reply(`❌ 지원되지 않는 파일 형식입니다. 지원되는 형식: ${allowedExtensions.join(', ')}`);
            return;
        }

        finalFileName = `${baseFileName}.${fileExtension}`;
        const filePath = path.join(saveDirectory, finalFileName);
        console.log(`[경로계산] 최종 파일 경로: ${filePath}`);

        if (!fs.existsSync(saveDirectory)) {
            fs.mkdirSync(saveDirectory, { recursive: true });
            console.log(`[폴더생성] 새 폴더 생성됨: ${saveDirectory}`);
        }

        if (fs.existsSync(filePath)) {
            console.warn(`[중복파일] 동일한 이름의 파일이 이미 존재함: ${filePath}`);
            await interaction.reply(`⚠️ 동일한 이름의 파일이 이미 존재합니다: ${finalFileName}`);
            return;
        }

        if (fileType === 'music') {
            const folderSize = calculateFolderSize(saveDirectory);
            const fileSize = targetFile.size;
            const maxStorage = 100 * 1024 * 1024;

            console.log(`[용량확인] 현재 폴더 사용량: ${(folderSize / 1024 / 1024).toFixed(2)}MB / 최대: ${(maxStorage / 1024 / 1024)}MB, 업로드 파일 크기: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);

            if (folderSize + fileSize > maxStorage) {
                const leftSpace = maxStorage - folderSize;
                console.warn(`[용량초과] 저장 공간 부족 - 남은 공간: ${(leftSpace / 1024 / 1024).toFixed(2)}MB`);
                await interaction.reply(`⚠️ 파일 저장 공간이 부족합니다. 남은 공간: ${(leftSpace / (1024 * 1024)).toFixed(2)}MB`);
                return;
            }
        }

        try {
            const response = await axios.get(targetFile.url, { responseType: 'arraybuffer' });
            fs.writeFileSync(filePath, response.data);
            console.log(`[저장성공] 파일 저장 완료: ${filePath}`);

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

            let message = `✅ 파일이 성공적으로 저장되었습니다: ${finalFileName}`;
            if (fileType === 'music') {
                const folderSize = calculateFolderSize(saveDirectory);
                const maxStorage = 100 * 1024 * 1024;
                const leftSpace = maxStorage - folderSize;
                message += `\n남은 저장공간: ${(leftSpace / (1024 * 1024)).toFixed(2)}MB`;
                message += `\n🔄 음악 플레이어 목록이 자동으로 업데이트되었습니다.`;
            }
            await interaction.reply(message);
        } catch (error) {
            console.error('❌ 파일 저장 중 오류:', error);
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
