const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { request } = require('undici');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('프로필')
        .setDescription('봇의 프로필 이미지를 변경합니다')
        .addSubcommand(subcommand =>
            subcommand
                .setName('파일')
                .setDescription('첨부 파일로 봇의 프로필 이미지를 변경합니다')
                .addAttachmentOption(option =>
                    option.setName('이미지')
                        .setDescription('변경할 프로필 이미지 파일')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('링크')
                .setDescription('URL 링크로 봇의 프로필 이미지를 변경합니다')
                .addStringOption(option =>
                    option.setName('이미지url')
                        .setDescription('변경할 프로필 이미지의 URL 주소')
                        .setRequired(true))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // 관리자 권한 확인
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '🚫 이 명령어는 관리자만 사용할 수 있습니다.',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            let imageUrl;
            let isFile = false;

            // 서브커맨드 확인
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === '파일') {
                // 첨부된 이미지 가져오기
                const attachment = interaction.options.getAttachment('이미지');

                // 이미지 형식 검증
                if (!attachment.contentType.startsWith('image/')) {
                    return await interaction.editReply('❌ 유효한 이미지 파일을 첨부해주세요.');
                }

                // 파일 크기 확인 (Discord API 제한: 최대 8MB)
                if (attachment.size > 8 * 1024 * 1024) {
                    return await interaction.editReply('❌ 이미지 크기가 너무 큽니다. 8MB 이하의 이미지를 사용해주세요.');
                }

                imageUrl = attachment.url;
                isFile = true;
            } else if (subcommand === '링크') {
                // URL 링크로 설정
                imageUrl = interaction.options.getString('이미지url');

                // URL 형식 검증
                if (!isValidImageUrl(imageUrl)) {
                    return await interaction.editReply('❌ 유효한 이미지 URL을 입력해주세요. URL은 http:// 또는 https://로 시작해야 하며, 이미지 파일(.png, .jpg, .jpeg, .gif 등)로 끝나야 합니다.');
                }
            }

            // 이미지 다운로드
            const response = await request(imageUrl);

            // 응답 상태 확인
            if (response.statusCode !== 200) {
                return await interaction.editReply(`❌ 이미지 다운로드에 실패했습니다. 상태 코드: ${response.statusCode}`);
            }

            // 콘텐츠 타입 확인 (URL로 설정하는 경우에만 필요)
            if (!isFile) {
                const contentType = response.headers['content-type'];
                if (!contentType || !contentType.startsWith('image/')) {
                    return await interaction.editReply('❌ 제공된 URL이 유효한 이미지가 아닙니다.');
                }

                // 파일 크기 확인
                const contentLength = response.headers['content-type'];
                if (contentLength && parseInt(contentLength) > 8 * 1024 * 1024) {
                    return await interaction.editReply('❌ 이미지 크기가 너무 큽니다. 8MB 이하의 이미지를 사용해주세요.');
                }
            }

            const arrayBuffer = await response.body.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // 봇 프로필 이미지 변경
            await interaction.client.user.setAvatar(buffer);

            // 성공 메시지
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ 프로필 이미지 변경 완료')
                .setDescription('봇의 프로필 이미지가 성공적으로 변경되었습니다.')
                .setColor(0x3498DB)
                .setImage(imageUrl)
                .setFooter({ text: '프로필 이미지는 Discord API 제한으로 인해 짧은 시간 내에 여러 번 변경할 수 없습니다.' })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });
        } catch (error) {
            console.error('프로필 이미지 변경 중 오류 발생:', error);

            // Discord API 제한 관련 오류 처리
            if (error.code === 50013) {
                await interaction.editReply('❌ 봇에 프로필 이미지를 변경할 권한이 없습니다.');
            } else if (error.code === 50035) {
                await interaction.editReply('❌ 이미지 형식이 올바르지 않습니다. 다른 이미지를 사용해주세요.');
            } else if (error.code === 50016) {
                await interaction.editReply('❌ Discord API 제한으로 인해 현재 프로필 이미지를 변경할 수 없습니다. 잠시 후 다시 시도해주세요.');
            } else {
                await interaction.editReply(`❌ 프로필 이미지 변경 중 오류가 발생했습니다: ${error.message}`);
            }
        }
    },

    // Prefix 명령어 정의
    prefixCommand: {
        name: '프로필',
        description: '봇의 프로필 이미지를 변경합니다',
        async execute(message, args) {
            // 관리자 권한 확인
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await message.reply('🚫 이 명령어는 관리자만 사용할 수 있습니다.');
            }

            // 명령어 형식 확인
            if (args.length > 0 && args[0].toLowerCase() === '링크') {
                // URL로 설정하는 경우
                if (args.length < 2) {
                    return await message.reply('❌ 이미지 URL을 입력해주세요. 예: `!프로필 링크 https://example.com/image.png`');
                }

                const imageUrl = args[1];

                // URL 형식 검증
                if (!isValidImageUrl(imageUrl)) {
                    return await message.reply('❌ 유효한 이미지 URL을 입력해주세요. URL은 http:// 또는 https://로 시작해야 합니다.');
                }

                try {
                    // 진행 중 메시지
                    const processingMsg = await message.reply('⏳ URL에서 이미지를 다운로드하여 프로필을 변경하는 중입니다...');

                    // 이미지 다운로드
                    const response = await request(imageUrl);

                    // 응답 상태 확인
                    if (response.statusCode !== 200) {
                        return await processingMsg.edit(`❌ 이미지 다운로드에 실패했습니다. 상태 코드: ${response.statusCode}`);
                    }

                    // 콘텐츠 타입 확인
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.startsWith('image/')) {
                        return await processingMsg.edit('❌ 제공된 URL이 유효한 이미지가 아닙니다.');
                    }

                    // 파일 크기 확인
                    const contentLength = response.headers.get('content-length');
                    if (contentLength && parseInt(contentLength) > 8 * 1024 * 1024) {
                        return await processingMsg.edit('❌ 이미지 크기가 너무 큽니다. 8MB 이하의 이미지를 사용해주세요.');
                    }

                    const arrayBuffer = await response.body.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    // 봇 프로필 이미지 변경
                    await message.client.user.setAvatar(buffer);

                    // 성공 메시지
                    const successEmbed = new EmbedBuilder()
                        .setTitle('✅ 프로필 이미지 변경 완료')
                        .setDescription('봇의 프로필 이미지가 성공적으로 변경되었습니다.')
                        .setColor(0x3498DB)
                        .setImage(imageUrl)
                        .setFooter({ text: '프로필 이미지는 Discord API 제한으로 인해 짧은 시간 내에 여러 번 변경할 수 없습니다.' })
                        .setTimestamp();

                    await processingMsg.edit({ content: null, embeds: [successEmbed] });
                } catch (error) {
                    handlePrefixCommandError(error, message);
                }
            } else {
                // 이미지 첨부 확인
                const attachment = message.attachments.first();
                if (!attachment) {
                    return await message.reply('❌ 프로필로 설정할 이미지를 첨부하거나 `!프로필 링크 [URL]` 형식으로 URL을 입력해주세요.');
                }

                // 이미지 형식 검증
                if (!attachment.contentType?.startsWith('image/')) {
                    return await message.reply('❌ 유효한 이미지 파일을 첨부해주세요.');
                }

                // 파일 크기 확인
                if (attachment.size > 8 * 1024 * 1024) {
                    return await message.reply('❌ 이미지 크기가 너무 큽니다. 8MB 이하의 이미지를 사용해주세요.');
                }

                try {
                    // 진행 중 메시지
                    const processingMsg = await message.reply('⏳ 프로필 이미지를 변경하는 중입니다...');

                    // 이미지 다운로드
                    const response = await request(attachment.url);
                    const arrayBuffer = await response.body.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    // 봇 프로필 이미지 변경
                    await message.client.user.setAvatar(buffer);

                    // 성공 메시지
                    const successEmbed = new EmbedBuilder()
                        .setTitle('✅ 프로필 이미지 변경 완료')
                        .setDescription('봇의 프로필 이미지가 성공적으로 변경되었습니다.')
                        .setColor(0x3498DB)
                        .setImage(attachment.url)
                        .setFooter({ text: '프로필 이미지는 Discord API 제한으로 인해 짧은 시간 내에 여러 번 변경할 수 없습니다.' })
                        .setTimestamp();

                    await processingMsg.edit({ content: null, embeds: [successEmbed] });
                } catch (error) {
                    handlePrefixCommandError(error, message);
                }
            }
        }
    },
    upload: true,
    permissionLevel: -1
};

// URL이 유효한 이미지 URL인지 확인하는 함수
function isValidImageUrl(url) {
    try {
        // URL 형식 확인
        new URL(url);

        // http 또는 https로 시작하는지 확인
        return url.startsWith('http://') || url.startsWith('https://');
    } catch (e) {
        return false;
    }
}

// 프리픽스 명령어 오류 처리 함수
async function handlePrefixCommandError(error, message) {
    console.error('프로필 이미지 변경 중 오류 발생:', error);

    // 오류 메시지
    let errorMessage = '❌ 프로필 이미지 변경 중 오류가 발생했습니다.';

    if (error.code === 50013) {
        errorMessage = '❌ 봇에 프로필 이미지를 변경할 권한이 없습니다.';
    } else if (error.code === 50035) {
        errorMessage = '❌ 이미지 형식이 올바르지 않습니다. 다른 이미지를 사용해주세요.';
    } else if (error.code === 50016) {
        errorMessage = '❌ Discord API 제한으로 인해 현재 프로필 이미지를 변경할 수 없습니다. 잠시 후 다시 시도해주세요.';
    }

    await message.reply(errorMessage);
}
