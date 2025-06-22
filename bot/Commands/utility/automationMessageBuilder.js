// Commands/utility/automationMessageBuilder.js

/**
 * 자동화 버튼 메시지 생성 유틸리티
 * Discord 메시지에 자동화 버튼을 추가하는 기능 제공
 */

const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

/**
 * 버튼 스타일 매핑
 */
const BUTTON_STYLE_MAP = {
    'primary': ButtonStyle.Primary,
    'secondary': ButtonStyle.Secondary,
    'success': ButtonStyle.Success,
    'danger': ButtonStyle.Danger
};

/**
 * 자동화 버튼 그룹을 Discord 메시지로 변환
 * @param {Object} group 버튼 그룹 정보
 * @param {Array} buttons 버튼 목록
 * @param {Object} options 추가 옵션
 * @returns {Object} Discord 메시지 객체
 */
function buildAutomationMessage(group, buttons, options = {}) {
    const { customMessage, showGroupInfo = true, maxButtonsPerRow = 5 } = options;

    // 활성화된 버튼만 필터링하고 정렬
    const activeButtons = buttons
        .filter(button => button.isActive)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    if (activeButtons.length === 0) {
        throw new Error('활성화된 버튼이 없습니다.');
    }

    if (activeButtons.length > 25) {
        throw new Error('Discord 제한으로 인해 최대 25개의 버튼만 지원됩니다.');
    }

    // 메시지 구성 요소 준비
    const components = [];
    let embeds = [];

    // 커스텀 메시지가 있는 경우 임베드 생성
    if (customMessage || showGroupInfo) {
        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTimestamp();

        if (customMessage) {
            embed.setDescription(customMessage);
        }

        if (showGroupInfo) {
            embed.setTitle(group.name);
            if (group.description) {
                embed.addFields({
                    name: '설명',
                    value: group.description,
                    inline: false
                });
            }
            
            embed.setFooter({
                text: `${activeButtons.length}개의 버튼 • 자동화 시스템`
            });
        }

        embeds.push(embed);
    }

    // 버튼을 행별로 나누어 ActionRow 생성
    const rows = [];
    for (let i = 0; i < activeButtons.length; i += maxButtonsPerRow) {
        const rowButtons = activeButtons.slice(i, i + maxButtonsPerRow);
        const actionRow = new ActionRowBuilder();

        for (const button of rowButtons) {
            try {
                const config = typeof button.config === 'string' 
                    ? JSON.parse(button.config) 
                    : button.config;

                const discordButton = new ButtonBuilder()
                    .setCustomId(`automation_${button.id}`)
                    .setLabel(button.buttonLabel || '버튼')
                    .setStyle(BUTTON_STYLE_MAP[config?.buttonSettings?.style] || ButtonStyle.Primary);

                // 이모지 설정 (옵션)
                if (config?.buttonSettings?.emoji) {
                    discordButton.setEmoji(config.buttonSettings.emoji);
                }

                // 비활성화 설정
                if (config?.buttonSettings?.disabled) {
                    discordButton.setDisabled(true);
                }

                actionRow.addComponents(discordButton);
            } catch (error) {
                console.error(`버튼 구성 중 오류 (ID: ${button.id}):`, error);
                // 오류가 발생한 버튼은 건너뛰고 계속 진행
                continue;
            }
        }

        if (actionRow.components.length > 0) {
            rows.push(actionRow);
        }
    }

    // 최대 5개 행 제한 (Discord 제한)
    if (rows.length > 5) {
        throw new Error('Discord 제한으로 인해 최대 5개 행까지만 지원됩니다.');
    }

    components.push(...rows);

    return {
        embeds: embeds.length > 0 ? embeds : undefined,
        components: components.length > 0 ? components : undefined,
        content: (!customMessage && !showGroupInfo) ? group.name : undefined
    };
}

/**
 * 자동화 그룹 미리보기 메시지 생성
 * @param {Object} group 버튼 그룹 정보
 * @param {Array} buttons 버튼 목록
 * @returns {Object} Discord 메시지 객체
 */
function buildPreviewMessage(group, buttons) {
    const activeButtons = buttons.filter(button => button.isActive);
    
    const embed = new EmbedBuilder()
        .setTitle(`📋 ${group.name} - 미리보기`)
        .setDescription(group.description || '설명 없음')
        .setColor(0x95a5a6)
        .addFields({
            name: '버튼 정보',
            value: activeButtons.length > 0 
                ? activeButtons.map((btn, idx) => `${idx + 1}. ${btn.buttonLabel}`).join('\n')
                : '활성화된 버튼이 없습니다.',
            inline: false
        })
        .setFooter({
            text: `총 ${buttons.length}개 버튼 (활성: ${activeButtons.length}개) • 미리보기 모드`
        })
        .setTimestamp();

    return { embeds: [embed] };
}

/**
 * 자동화 상태 메시지 생성
 * @param {Object} group 버튼 그룹 정보
 * @param {Array} buttons 버튼 목록
 * @param {Object} stats 통계 정보
 * @returns {Object} Discord 메시지 객체
 */
function buildStatusMessage(group, buttons, stats = {}) {
    const activeButtons = buttons.filter(button => button.isActive);
    const inactiveButtons = buttons.filter(button => !button.isActive);

    const embed = new EmbedBuilder()
        .setTitle(`📊 ${group.name} - 상태`)
        .setDescription(group.description || '설명 없음')
        .setColor(group.isActive ? 0x27ae60 : 0xe74c3c)
        .addFields(
            {
                name: '그룹 상태',
                value: group.isActive ? '🟢 활성' : '🔴 비활성',
                inline: true
            },
            {
                name: '버튼 현황',
                value: `전체: ${buttons.length}개\n활성: ${activeButtons.length}개\n비활성: ${inactiveButtons.length}개`,
                inline: true
            },
            {
                name: '사용 통계',
                value: `실행 횟수: ${stats.totalExecutions || 0}회\n고유 사용자: ${stats.uniqueUsers || 0}명\n오류율: ${(stats.errorRate || 0).toFixed(1)}%`,
                inline: true
            }
        )
        .setTimestamp();

    if (activeButtons.length > 0) {
        const buttonList = activeButtons
            .slice(0, 10) // 최대 10개까지만 표시
            .map(btn => {
                const config = typeof btn.config === 'string' ? JSON.parse(btn.config) : btn.config;
                const actionCount = config?.actions?.length || 0;
                return `• ${btn.buttonLabel} (${actionCount}개 액션)`;
            })
            .join('\n');

        embed.addFields({
            name: '활성 버튼 목록',
            value: buttonList + (activeButtons.length > 10 ? `\n... 외 ${activeButtons.length - 10}개` : ''),
            inline: false
        });
    }

    return { embeds: [embed] };
}

/**
 * 오류 메시지 생성
 * @param {string} title 오류 제목
 * @param {string} description 오류 설명
 * @param {string} errorCode 오류 코드 (선택사항)
 * @returns {Object} Discord 메시지 객체
 */
function buildErrorMessage(title, description, errorCode = null) {
    const embed = new EmbedBuilder()
        .setTitle(`❌ ${title}`)
        .setDescription(description)
        .setColor(0xe74c3c)
        .setTimestamp();

    if (errorCode) {
        embed.setFooter({ text: `오류 코드: ${errorCode}` });
    }

    return { embeds: [embed] };
}

/**
 * 성공 메시지 생성
 * @param {string} title 성공 제목
 * @param {string} description 성공 설명
 * @param {Array} additionalFields 추가 필드 (선택사항)
 * @returns {Object} Discord 메시지 객체
 */
function buildSuccessMessage(title, description, additionalFields = []) {
    const embed = new EmbedBuilder()
        .setTitle(`✅ ${title}`)
        .setDescription(description)
        .setColor(0x27ae60)
        .setTimestamp();

    if (additionalFields.length > 0) {
        embed.addFields(additionalFields);
    }

    return { embeds: [embed] };
}

module.exports = {
    buildAutomationMessage,
    buildPreviewMessage,
    buildStatusMessage,
    buildErrorMessage,
    buildSuccessMessage
};