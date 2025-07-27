const { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { encodeToString } = require('./utility/delimiterGeter');

const nameOfCommand = "주사위생성";
const description = "주사위 버튼을 생성합니다";

module.exports = {
    data: new SlashCommandBuilder()
        .setName(nameOfCommand)
        .setDescription(description)
        .addIntegerOption(option =>
            option.setName('눈')
            .setDescription('주사위 눈 개수 (기본: 6개)')
            .setMinValue(2)
            .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('개수')
                .setDescription('주사위 개수 (기본: 1개)')
                .setMinValue(1)
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName('표시')
                .setDescription('버튼에 주사위 정보(예: 3D6) 표시 여부 (기본: 숨김)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('라벨')
                .setDescription('버튼 라벨명 (기본: "주사위")')
                .setMaxLength(15)
                .setRequired(false)
        ),

    /**
     * 주사위 버튼 생성 명령어 실행
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        try {
            // 옵션 파싱 (모든 매개변수 옵셔널)
            const diceCount = interaction.options.getInteger('개수') ?? 1;
            const diceEyes = interaction.options.getInteger('눈') ?? 6;
            const showDetails = interaction.options.getBoolean('표시') ?? false;
            const customLabel = interaction.options.getString('라벨') ?? null;

            // 설정 객체 생성
            const config = {
                eyes: diceEyes,
                count: diceCount,
                showDetails: showDetails,
                customLabel: customLabel
            };

            // 버튼과 임베드 생성
            const button = createDiceButton(config, interaction.guildId);
            // const embed = createDiceEmbed(config);
            const actionRow = new ActionRowBuilder().addComponents(button);

            // 응답 전송
            await interaction.reply({
                // embeds: [embed],
                components: [actionRow]
            });

        } catch (error) {
            console.error('[주사위생성] Error:', error);
            await interaction.reply({
                content: '❌ 주사위 버튼 생성 중 오류가 발생했습니다.',
                ephemeral: true
            });
        }
    },

    upload: true,
    permissionLevel: PermissionFlagsBits.DeafenMembers
};

/**
 * 버튼 라벨 생성 함수
 * @param {Object} config 주사위 설정
 * @returns {string} 버튼 라벨
 */
function generateButtonLabel(config) {
    let label = config.customLabel || '주사위';

    if (config.showDetails) {
        // 표시 옵션 ON: 라벨 + 주사위 정보
        return `🎲 ${label} (${config.count}D${config.eyes})`;
    } else {
        // 표시 옵션 OFF: 라벨만
        return `🎲 ${label}`;
    }
}

/**
 * 주사위 버튼 생성 함수
 * @param {Object} config 주사위 설정
 * @param {string} guildId 길드 ID
 * @returns {ButtonBuilder} 생성된 버튼
 */
function createDiceButton(config, guildId) {
    const label = generateButtonLabel(config);
    // 기존 아키텍처에 맞는 customId 인코딩
    const customId = encodeToString(
        guildId,
        'diceRollButton',
        `${config.eyes}:${config.count}`,
        Date.now().toString()
    );

    return new ButtonBuilder()
        .setCustomId(customId)
        .setLabel(label)
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎲');
}

/**
 * 주사위 설명 임베드 생성 함수
 * @param {Object} config 주사위 설정
 * @returns {EmbedBuilder} 생성된 임베드
 */
function createDiceEmbed(config) {
    let description = `주사위 버튼이 생성되었습니다.\n버튼을 클릭하여 주사위를 굴려보세요!`;

    // 설정 정보 표시
    description += `\n\n**📋 설정 정보:**\n`;
    description += `🎲 **주사위**: ${config.count}D${config.eyes}\n`;

    if (config.customLabel) {
        description += `🏷️ **라벨**: ${config.customLabel}\n`;
    }

    description += `👁️ **정보 표시**: ${config.showDetails ? '표시' : '숨김'}`;

    return new EmbedBuilder()
        .setTitle('🎲 주사위 버튼 생성됨')
        .setDescription(description)
        .setColor(0x0099FF)
        .setTimestamp()
        .setFooter({
            text: '버튼을 클릭하면 개인 메시지로 결과를 받을 수 있습니다.'
        });
}