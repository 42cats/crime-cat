// Commands/일정갱신.js

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { refreshUserCache, formatUserErrorMessage } = require('./api/schedule/scheduleApi');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('일정갱신')
        .setDescription('등록된 iCal 캘린더 캐시를 강제로 새로고침합니다'),

    async execute(interaction) {
        const discordSnowflake = interaction.user.id;

        console.log(`🔄 일정갱신 명령어 실행: ${interaction.user.tag} (${discordSnowflake})`);

        // 응답 지연 처리 (API 호출 시간 대비)
        await interaction.deferReply();

        try {
            // 백엔드 API 호출
            const startTime = Date.now();
            const result = await refreshUserCache(discordSnowflake);
            const processingTime = Date.now() - startTime;

            // 응답 데이터 검증
            if (!result) {
                throw new Error('서버 응답이 없습니다');
            }

            // 성공 응답 생성
            const embed = await createSuccessEmbed(result, processingTime, interaction.user);
            await interaction.editReply({ embeds: [embed] });

            console.log(`✅ 일정갱신 완료: ${processingTime}ms`);

        } catch (error) {
            console.error('❌ 일정갱신 실패:', error);

            // 에러 응답 생성
            const embed = createErrorEmbed(error, interaction.user);
            await interaction.editReply({ embeds: [embed] });
        }
    },
    upload: true,
    permissionLevel: PermissionFlagsBits.DeafenMembers,
    isCacheCommand: false,
};

/**
 * 성공 응답 Embed 생성
 */
async function createSuccessEmbed(result, processingTime, user) {
    const embed = new EmbedBuilder()
        .setColor('#22c55e') // 녹색
        .setTitle('🔄 캘린더 갱신 완료')
        .setAuthor({
            name: user.displayName || user.username,
            iconURL: user.displayAvatarURL()
        })
        .setTimestamp()
        .setFooter({
            text: 'Crime-Cat 일정 관리 시스템',
            iconURL: 'https://cdn.discordapp.com/app-icons/your-bot-id/icon.png'
        });

    // 갱신 결과 표시
    embed.addFields(
        {
            name: '✅ 갱신 상태',
            value: [
                '**캘린더 캐시가 성공적으로 갱신되었습니다!**',
                '',
                `• 처리 시간: **${processingTime}ms**`,
                '• 기존 캐시: 모두 삭제됨',
                '• 새 데이터: 실시간으로 동기화 완료',
                '• 캐시 유효기간: 30분'
            ].join('\n'),
            inline: false
        }
    );

    // 다음 단계 안내
    embed.addFields({
        name: '📅 다음 단계',
        value: [
            '이제 `/내일정` 명령어로 최신 일정을 확인하세요.',
            '',
            '**추천 명령어:**',
            '• `/내일정` - 갱신된 일정 확인',
            '• `/일정체크 [날짜]` - 특정 날짜와 겹침 확인'
        ].join('\n'),
        inline: false
    });

    // 성능 정보 (개발자/관리자용)
    if (processingTime > 5000) { // 5초 이상인 경우 주의 메시지
        embed.addFields({
            name: '⚠️ 성능 알림',
            value: `갱신 시간이 ${Math.round(processingTime / 1000)}초로 다소 오래 걸렸습니다. 캘린더 수나 네트워크 상태를 확인해보세요.`,
            inline: false
        });
    } else if (processingTime < 1000) { // 1초 미만인 경우
        embed.addFields({
            name: '⚡ 빠른 처리',
            value: '캘린더 갱신이 매우 빠르게 완료되었습니다!',
            inline: false
        });
    }

    return embed;
}

/**
 * 에러 응답 Embed 생성
 */
function createErrorEmbed(error, user) {
    const embed = new EmbedBuilder()
        .setColor('#ef4444') // 빨간색
        .setTitle('❌ 캘린더 갱신 실패')
        .setAuthor({
            name: user.displayName || user.username,
            iconURL: user.displayAvatarURL()
        })
        .setDescription(formatUserErrorMessage(error))
        .setTimestamp()
        .setFooter({
            text: 'Crime-Cat 일정 관리 시스템',
            iconURL: 'https://cdn.discordapp.com/app-icons/your-bot-id/icon.png'
        });

    // 문제해결 가이드
    embed.addFields(
        {
            name: '🔧 문제해결',
            value: [
                '**일반적인 해결 방법:**',
                '1. 웹사이트에서 로그인 상태 확인',
                '2. 캘린더 설정에서 iCal URL 유효성 확인',
                '3. 잠시 후 다시 시도',
                '',
                '**계속 문제가 발생할 경우:**',
                '• 웹사이트 → 설정 → 캘린더 관리',
                '• iCal URL 재등록 시도'
            ].join('\n'),
            inline: false
        },
        {
            name: '📋 관련 명령어',
            value: [
                '• `/내일정` - 현재 캐시된 일정 확인',
                '• `/일정체크` - 특정 날짜 겹침 확인',
                '• 웹사이트에서 캘린더 설정 관리'
            ].join('\n'),
            inline: false
        }
    );

    return embed;
}