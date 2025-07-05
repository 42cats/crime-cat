// Commands/automation.js

/**
 * Discord 버튼 자동화 시스템 관리 명령어
 * 그룹 이름만 입력받아 현재 채널에 버튼 전송
 */

const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const { getButtonGroup } = require('./api/automation/automationApi');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('기능버튼')
        .setDescription('버튼 그룹을 현재 채널에 전송')
        .addStringOption(option =>
            option.setName('자동화_그룹')
                .setDescription('전송할 버튼 그룹')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const groupId = interaction.options.getString('자동화_그룹');
        const guildId = interaction.guild?.id;
        const channelId = interaction.channel?.id;

        if (!guildId) {
            return await interaction.reply({
                content: '❌ 서버에서만 사용할 수 있는 명령어입니다.',
                ephemeral: true
            });
        }

        if (!channelId) {
            return await interaction.reply({
                content: '❌ 채널에서만 사용할 수 있는 명령어입니다.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ flags: 64 }); // 64 = ephemeral flag

        try {
            // 1. 버튼 그룹 데이터 조회
            console.log("🔍 버튼 그룹 데이터 조회 시작:", { guildId, groupId });
            const buttonGroupData = await getButtonGroup(guildId, groupId);
            console.log("📦 조회된 버튼 그룹 데이터:", buttonGroupData);

            if (!buttonGroupData.isActive) {
                throw new Error('비활성화된 버튼 그룹입니다.');
            }

            // 활성화된 버튼만 필터링
            const activeButtons = buttonGroupData.buttons.filter(btn => btn.isActive);
            if (activeButtons.length === 0) {
                throw new Error('활성화된 버튼이 없습니다.');
            }

            // 2. 그룹 설정 파싱 (description 필드에서 messageConfig 추출)
            let groupSettings = {};
            let messageConfig = {};

            try {
                // settings 필드 파싱
                groupSettings = JSON.parse(buttonGroupData.settings || '{}');
                console.log("⚙️ 그룹 설정 (settings):", groupSettings);
            } catch (e) {
                console.warn("⚠️ 그룹 설정 파싱 실패:", e.message);
            }

            try {
                // description 필드에서 messageConfig 파싱
                const descriptionData = JSON.parse(buttonGroupData.description || '{}');
                messageConfig = descriptionData.messageConfig || {};
                console.log("📝 메시지 설정 (description):", messageConfig);
            } catch (e) {
                console.warn("⚠️ description 파싱 실패:", e.message);
            }

            // 3. Discord 컴포넌트 생성
            const messageData = await createDiscordMessage(buttonGroupData, groupSettings, messageConfig, activeButtons);
            console.log("📝 생성된 메시지 데이터:", JSON.stringify(messageData, (key, value) => 
                typeof value === 'bigint' ? value.toString() : value, 2));

            // 4. 실제 Discord 채널에 메시지 전송
            const sentMessage = await interaction.channel.send(messageData);
            console.log("✅ 메시지 전송 완료, ID:", sentMessage.id);

            // 5. 이모지 반응 추가
            if (messageConfig.emojis && Array.isArray(messageConfig.emojis)) {
                console.log("😊 이모지 반응 추가 중:", messageConfig.emojis);
                for (const emoji of messageConfig.emojis) {
                    try {
                        await sentMessage.react(emoji);
                        console.log("✅ 이모지 반응 추가 완료:", emoji);
                    } catch (emojiError) {
                        console.warn("⚠️ 이모지 반응 추가 실패:", emoji, emojiError.message);
                    }
                }
            }

            // 6. 성공 응답
            const successEmbed = new EmbedBuilder()
                .setTitle('📤 버튼 그룹 전송 완료')
                .setDescription(`"${buttonGroupData.name}" 버튼 그룹이 성공적으로 전송되었습니다.`)
                .addFields(
                    { name: '대상 채널', value: `<#${channelId}>`, inline: true },
                    { name: '버튼 수', value: `${activeButtons.length}개`, inline: true },
                    { name: '메시지 ID', value: sentMessage.id, inline: true }
                )
                .setColor(0x27ae60)
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('❌ 버튼 그룹 전송 오류:', error);
            console.error('에러 스택:', error.stack);

            const errorMessage = error.message || '버튼 그룹 전송 중 오류가 발생했습니다.';

            await interaction.editReply({
                content: `❌ ${errorMessage}`
            });
        }
    },
    upload: true,
    permissionLevel: PermissionFlagsBits.Administrator
};

/**
 * Discord 메시지 데이터 생성
 * @param {Object} buttonGroupData 버튼 그룹 데이터
 * @param {Object} groupSettings 그룹 설정
 * @param {Object} messageConfig 메시지 설정
 * @param {Array} activeButtons 활성화된 버튼 목록
 * @returns {Object} Discord 메시지 데이터
 */
async function createDiscordMessage(buttonGroupData, groupSettings, messageConfig, activeButtons) {
    const messageData = {};

    console.log("🔧 메시지 생성 - messageConfig:", messageConfig);
    console.log("🔧 메시지 생성 - groupSettings:", groupSettings);

    // 1. 메시지 내용 설정 (description의 messageConfig에서 가져오기)
    if (messageConfig.content) {
        messageData.content = messageConfig.content;
        console.log("✅ 메시지 내용 설정:", messageConfig.content);
    }

    // 2. 임베드 생성 (설정이 있는 경우)
    if (groupSettings.embedTitle || groupSettings.embedDescription) {
        const embed = new EmbedBuilder();

        if (groupSettings.embedTitle) {
            embed.setTitle(groupSettings.embedTitle);
        }

        if (groupSettings.embedDescription) {
            embed.setDescription(groupSettings.embedDescription);
        }

        // 색상 설정 (기본값: 파란색)
        const color = parseColorString(groupSettings.embedColor) || 0x3498db;
        embed.setColor(color);

        if (groupSettings.embedImage) {
            embed.setImage(groupSettings.embedImage);
        }

        if (groupSettings.embedThumbnail) {
            embed.setThumbnail(groupSettings.embedThumbnail);
        }

        if (groupSettings.embedFooter) {
            embed.setFooter({ text: groupSettings.embedFooter });
        }

        embed.setTimestamp();

        messageData.embeds = [embed];
    }

    // 3. 버튼 컴포넌트 생성 (Discord 제한: 한 줄에 최대 5개, 총 최대 25개)
    const buttonComponents = createButtonComponents(activeButtons);
    if (buttonComponents.length > 0) {
        messageData.components = buttonComponents;
    }

    return messageData;
}

/**
 * 버튼 컴포넌트 생성
 * @param {Array} activeButtons 활성화된 버튼 목록
 * @returns {Array} ActionRow 배열
 */
function createButtonComponents(activeButtons) {
    const actionRows = [];
    const maxButtonsPerRow = 5;
    const maxRows = 5; // Discord 제한

    // 버튼을 5개씩 그룹화하여 ActionRow 생성
    for (let i = 0; i < activeButtons.length && actionRows.length < maxRows; i += maxButtonsPerRow) {
        const rowButtons = activeButtons.slice(i, i + maxButtonsPerRow);
        const buttons = rowButtons.map(btn => createButton(btn));

        if (buttons.length > 0) {
            actionRows.push(new ActionRowBuilder().addComponents(buttons));
        }
    }

    return actionRows;
}

/**
 * 개별 버튼 생성
 * @param {Object} buttonData 버튼 데이터
 * @returns {ButtonBuilder} Discord 버튼
 */
function createButton(buttonData) {
    let buttonConfig = {};
    try {
        buttonConfig = JSON.parse(buttonData.config || '{}');
    } catch (e) {
        console.warn(`⚠️ 버튼 설정 파싱 실패 (${buttonData.id}):`, e.message);
    }

    const button = new ButtonBuilder()
        .setCustomId(`automation_${buttonData.id}`)
        .setLabel(buttonData.buttonLabel || '버튼')
        .setStyle(getButtonStyle(buttonConfig.buttonStyle));

    // 이모지 설정
    if (buttonConfig.emoji) {
        try {
            button.setEmoji(buttonConfig.emoji);
        } catch (e) {
            console.warn(`⚠️ 이모지 설정 실패 (${buttonData.id}):`, e.message);
        }
    }

    // 비활성화 설정
    if (buttonConfig.disabled) {
        button.setDisabled(true);
    }

    return button;
}

/**
 * 버튼 스타일 변환
 * @param {string} styleString 스타일 문자열
 * @returns {ButtonStyle} Discord 버튼 스타일
 */
function getButtonStyle(styleString) {
    switch (styleString?.toUpperCase()) {
        case 'PRIMARY':
        case 'BLURPLE':
            return ButtonStyle.Primary;
        case 'SECONDARY':
        case 'GREY':
        case 'GRAY':
            return ButtonStyle.Secondary;
        case 'SUCCESS':
        case 'GREEN':
            return ButtonStyle.Success;
        case 'DANGER':
        case 'RED':
            return ButtonStyle.Danger;
        case 'LINK':
            return ButtonStyle.Link;
        default:
            return ButtonStyle.Primary; // 기본값
    }
}

/**
 * 색상 문자열을 숫자로 변환
 * @param {string} colorString 색상 문자열 (#FF0000, red, 0xFF0000 등)
 * @returns {number|null} 색상 숫자 또는 null
 */
function parseColorString(colorString) {
    if (!colorString) return null;

    // #으로 시작하는 hex 색상
    if (colorString.startsWith('#')) {
        const hex = colorString.slice(1);
        const color = parseInt(hex, 16);
        return isNaN(color) ? null : color;
    }

    // 0x로 시작하는 hex 색상
    if (colorString.startsWith('0x')) {
        const color = parseInt(colorString, 16);
        return isNaN(color) ? null : color;
    }

    // 기본 색상 이름
    const colorMap = {
        red: 0xFF0000,
        green: 0x00FF00,
        blue: 0x0000FF,
        yellow: 0xFFFF00,
        purple: 0x800080,
        orange: 0xFFA500,
        pink: 0xFFC0CB,
        black: 0x000000,
        white: 0xFFFFFF
    };

    return colorMap[colorString.toLowerCase()] || null;
}