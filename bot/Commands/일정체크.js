// Commands/일정체크.js

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { checkScheduleOverlap, formatUserErrorMessage } = require('./api/schedule/scheduleApi');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('일정체크')
        .setDescription('입력한 날짜와 내 일정을 교차 확인합니다')
        .addStringOption(option =>
            option
                .setName('날짜목록')
                .setDescription('확인할 날짜 목록 (예: "10월 1 2 3 4" 또는 "8월 28 29, 9월 3 4")')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('개월')
                .setDescription('조회할 개월 수 (1-12개월, 기본값: 3개월)')
                .setMinValue(1)
                .setMaxValue(12)
                .setRequired(false)
        ),

    async execute(interaction) {
        const discordSnowflake = interaction.user.id;
        const inputDates = interaction.options.getString('날짜목록');
        const months = interaction.options.getInteger('개월') || 3; // 기본값 3개월

        console.log(`🔍 일정체크 명령어 실행: ${interaction.user.tag} (${discordSnowflake})`);
        console.log(`📋 입력된 날짜: ${inputDates}, 조회 기간: ${months}개월`);

        // 응답 지연 처리 (API 호출 시간 대비) - ephemeral로 혼자만 보이게 설정
        await interaction.deferReply({ ephemeral: true });

        try {
            // 백엔드 API 호출
            const result = await checkScheduleOverlap(discordSnowflake, inputDates, months);

            // 응답 데이터 검증
            if (!result) {
                throw new Error('서버 응답이 없습니다');
            }

            // 성공 응답 생성 (통계/정보용 임베드)
            const embed = await createSuccessEmbed(result, inputDates, months, interaction.user);

            // 첫 번째 메시지: 통계 및 정보 임베드
            await interaction.editReply({ embeds: [embed] });

            // 두 번째 메시지: 복사 전용 일정 텍스트 (항상 분리)
            if (result.totalAvailableFromInput > 0 && result.availableDatesFromInput && result.availableDatesFromInput.length > 0) {
                // 사용 가능한 날짜가 있는 경우
                const copyMessage = `${result.availableDatesFromInput}`;

                await interaction.followUp({
                    content: copyMessage,
                    ephemeral: true
                });
            } else {
                // 사용 가능한 날짜가 없는 경우
                await interaction.followUp({
                    content: '📋 **복사 전용 - 참여 가능한 날짜**\n```\n⚠️ 입력하신 날짜에는 참여 가능한 날짜가 없습니다.\n```',
                    ephemeral: true
                });
            }

            console.log(`✅ 일정체크 완료: ${result.totalMatches}개 일치`);

        } catch (error) {
            console.error('❌ 일정체크 실패:', error);

            // 에러 응답 생성
            const embed = createErrorEmbed(error, interaction.user, months);
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
async function createSuccessEmbed(result, inputDates, months, user) {
    const embed = new EmbedBuilder()
        .setColor('#22c55e') // 녹색
        .setTitle('🔍 일정 교차 체크 결과')
        .setAuthor({
            name: user.displayName || user.username,
            iconURL: user.displayAvatarURL()
        })
        .setTimestamp()
        .setFooter({
            text: 'Mystery-place 일정 관리 시스템',
            iconURL: 'https://cdn.discordapp.com/app-icons/your-bot-id/icon.png'
        });

    // 기본 정보 필드
    embed.addFields(
        {
            name: '📋 입력 정보',
            value: [
                `• 입력한 날짜: \`${inputDates}\``,
                `• 조회 기간: **${months}개월**`,
                `• 분석 대상: **${result.inputTotal}개 날짜**`
            ].join('\n'),
            inline: false
        }
    );

    // 사용 가능한 날짜 표시 (로직 반전)
    if (result.totalAvailableFromInput === 0) {
        // 사용 가능한 날짜가 없는 경우
        embed.addFields(
            {
                name: '⚠️ 알림',
                value: '**모든 날짜가 사용 불가합니다!**\n입력하신 날짜에는 일정이나 차단 설정으로 인해 참여 가능한 날짜가 없습니다.',
                inline: false
            },
            {
                name: '📊 상세 분석',
                value: [
                    `• 입력 날짜: **${result.inputTotal}개**`,
                    `• 사용 가능: **0개** (0%)`,
                    `• iCal 일정 겹침: **${result.totalMatches}개**`,
                    `• 웹 차단 설정: **${result.totalBlockedFromInput || 0}개**`
                ].join('\n'),
                inline: false
            }
        );
    } else {
        // 사용 가능한 날짜가 있는 경우
        embed.addFields(
            {
                name: '✅ 참여 가능한 날짜',
                value: '📋 **아래 복사 전용 메시지에서 확인하세요**',
                inline: false
            },
            {
                name: '📊 상세 분석',
                value: [
                    `• 입력 날짜: **${result.inputTotal}개**`,
                    `• 사용 가능: **${result.totalAvailableFromInput}개** (${Math.round((result.availabilityRatioFromInput || 0) * 100)}%)`,
                    `• iCal 일정 겹침: **${result.totalMatches}개**`,
                    `• 웹 차단 설정: **${result.totalBlockedFromInput || 0}개**`
                ].join('\n'),
                inline: false
            }
        );

        // // 추천 메시지 (가용성 기준으로 변경)
        // const availabilityPercent = Math.round((result.availabilityRatioFromInput || 0) * 100);
        // if (availabilityPercent > 70) {
        //     embed.addFields({
        //         name: '💡 추천',
        //         value: '대부분의 날짜가 사용 가능해서 일정 조율이 쉬울 것 같습니다!',
        //         inline: false
        //     });
        // } else if (availabilityPercent > 40) {
        //     embed.addFields({
        //         name: '💡 추천',
        //         value: '적당한 날짜가 사용 가능합니다. 사용 가능한 날짜로 일정을 조율해보세요.',
        //         inline: false
        //     });
        // } else {
        //     embed.addFields({
        //         name: '⚠️ 주의',
        //         value: '사용 가능한 날짜가 제한적입니다. 다른 기간을 고려해보시는 것을 추천합니다.',
        //         inline: false
        //     });
        // }
    }

    // 추가 안내 메시지
    embed.addFields({
        name: '💡 도움말',
        value: [
            '• `/내일정` - 전체 일정 확인',
            '• `/일정갱신` - 캘린더 강제 새로고침',
            '• 웹사이트에서 차단 날짜 설정 가능'
        ].join('\n'),
        inline: false
    });

    return embed;
}

/**
 * 에러 응답 Embed 생성
 */
function createErrorEmbed(error, user, months) {
    const embed = new EmbedBuilder()
        .setColor('#ef4444') // 빨간색
        .setTitle('❌ 일정 체크 실패')
        .setAuthor({
            name: user.displayName || user.username,
            iconURL: user.displayAvatarURL()
        })
        .setDescription(formatUserErrorMessage(error))
        .setTimestamp()
        .setFooter({
            text: 'Mystery-place 일정 관리 시스템',
            iconURL: 'https://cdn.discordapp.com/app-icons/your-bot-id/icon.png'
        });

    // 도움말 추가
    embed.addFields(
        {
            name: '📋 올바른 사용법',
            value: [
                '`/일정체크 10월 1 2 3 4` - 10월 1,2,3,4일 체크',
                '`/일정체크 8월 28 29, 9월 3 4` - 여러 달 체크',
                '`/일정체크 10월 1 2 개월:6` - 6개월 범위로 체크',
                '',
                '**입력 규칙:**',
                '• 월과 날짜 사이에는 공백이 필요합니다',
                '• 여러 달은 쉼표로 구분합니다',
                '• 같은 달 내 날짜는 공백으로 구분합니다'
            ].join('\n'),
            inline: false
        },
        {
            name: '🔧 설정 방법',
            value: [
                '**캘린더 등록:**',
                '1. 웹사이트 → Discord 로그인',
                '2. 설정 → 캘린더 관리',
                '3. Google/Apple 캘린더 iCal URL 등록',
                '',
                '**관련 명령어:**',
                '• `/내일정` - 전체 일정 조회',
                '• `/일정갱신` - 캐시 새로고침'
            ].join('\n'),
            inline: false
        }
    );

    return embed;
}