// Commands/내일정.js

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getMySchedule, formatUserErrorMessage } = require('./api/schedule/scheduleApi');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('내일정')
        .setDescription('등록된 iCal 캘린더의 내 일정을 확인합니다')
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
        const months = interaction.options.getInteger('개월') || 3; // 기본값 3개월

        console.log(`📅 내일정 명령어 실행: ${interaction.user.tag} (${discordSnowflake})`);
        console.log(`📊 조회 기간: ${months}개월`);

        // 응답 지연 처리 (API 호출 시간 대비) - ephemeral로 혼자만 보이게 설정
        await interaction.deferReply({ ephemeral: true });

        try {
            // 백엔드 API 호출
            const result = await getMySchedule(discordSnowflake, months);

            // 응답 데이터 검증
            if (!result) {
                throw new Error('서버 응답이 없습니다');
            }

            // 성공 응답 생성 (통계/정보용 임베드)
            const embed = await createSuccessEmbed(result, months, interaction.user);

            // 첫 번째 메시지: 통계 및 정보 임베드
            await interaction.editReply({ embeds: [embed] });

            // 두 번째 메시지: 복사 전용 일정 텍스트 (항상 분리)
            if (result.availableDatesFormat && result.availableDatesFormat.length > 0) {
                // 2000자 제한 고려하여 필요시 자르기
                let dateText = result.availableDatesFormat;
                if (dateText.length > 1900) {
                    dateText = `${dateText.substring(0, 1900)}\n...(웹사이트에서 전체 확인)`;
                }

                const copyMessage = `${dateText}`;

                await interaction.followUp({
                    content: copyMessage,
                    ephemeral: true
                });
            } else {
                // 일정이 없는 경우에도 안내 메시지
                await interaction.followUp({
                    content: '📋 **복사 전용 일정**\n```\n✅ 모든 날짜가 사용 가능합니다!\n```',
                    ephemeral: true
                });
            }

            console.log(`✅ 내일정 조회 완료: ${result.totalEvents}개 일정`);

        } catch (error) {
            console.error('❌ 내일정 조회 실패:', error);

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
async function createSuccessEmbed(result, months, user) {
    const embed = new EmbedBuilder()
        .setColor('#3b82f6') // 파란색
        .setTitle('📅 내 일정 조회 결과')
        .setAuthor({
            name: user.displayName || user.username,
            iconURL: user.displayAvatarURL()
        })
        .setTimestamp()
        .setFooter({
            text: 'Mystery-place 일정 관리 시스템',
            iconURL: 'https://cdn.discordapp.com/app-icons/your-bot-id/icon.png'
        });

    // 기본 정보
    embed.addFields(
        {
            name: '📊 조회 정보',
            value: [
                `• 조회 기간: **${months}개월**`,
                `• 연결된 캘린더: **${result.calendarCount}개**`,
                `• 총 일정 수: **${result.totalEvents}개**`,
                `• 마지막 동기화: **${formatSyncTime(result.syncedAt)}**`
            ].join('\n'),
            inline: false
        }
    );

    // 사용 가능한 날짜 표시 (로직 반전)
    if (result.totalAvailableDays === 0) {
        embed.addFields({
            name: '⚠️ 알림',
            value: '**모든 날짜가 사용 불가합니다!**\n일정이나 차단 설정으로 인해 가능한 날짜가 없습니다.',
            inline: false
        });
    } else {
        // 사용 가능한 날짜는 별도 메시지에서 출력
        embed.addFields({
            name: '✅ 사용 가능한 날짜',
            value: '📋 **아래 복사 전용 메시지에서 확인하세요**',
            inline: false
        });

        // 가용성 통계 정보 추가
        embed.addFields({
            name: '📊 가용성 분석',
            value: [
                `• 사용 가능: **${result.totalAvailableDays}개 날짜** (${Math.round((result.availabilityRatio || 0) * 100)}%)`,
                `• iCal 일정: **${result.totalEvents}개 날짜**`,
                `• 사용자 차단: **${result.totalBlockedDays || 0}개 날짜**`,
                `• 조회 기간: **${result.requestedMonths}개월**`
            ].join('\n'),
            inline: false
        });

        // 추천 메시지
        // const availabilityPercent = Math.round((result.availabilityRatio || 0) * 100);
        // if (availabilityPercent > 70) {
        //     embed.addFields({
        //         name: '💡 추천',
        //         value: '대부분의 날짜가 비어있어서 일정 조율이 쉬울 것 같습니다!',
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
            '• `/일정체크 [날짜목록]` - 특정 날짜와 겹침 확인',
            '• `/일정갱신` - 캘린더 강제 새로고침',
            '• mystery-place.com 에서 캘린더 추가/수정 가능'
        ].join('\n'),
        inline: false
    });

    return embed;
}

/**
 * 성공 응답 Embed 생성 (날짜 데이터 포함)
 */
async function createSuccessEmbedWithDates(result, months, user) {
    const embed = new EmbedBuilder()
        .setColor('#3b82f6') // 파란색
        .setTitle('📅 내 일정 조회 결과')
        .setAuthor({
            name: user.displayName || user.username,
            iconURL: user.displayAvatarURL()
        })
        .setTimestamp()
        .setFooter({
            text: 'Mystery-place 일정 관리 시스템',
            iconURL: 'https://cdn.discordapp.com/app-icons/your-bot-id/icon.png'
        });

    // 기본 정보
    embed.addFields(
        {
            name: '📊 조회 정보',
            value: [
                `• 조회 기간: **${months}개월**`,
                `• 연결된 캘린더: **${result.calendarCount}개**`,
                `• 총 일정 수: **${result.totalEvents}개**`,
                `• 마지막 동기화: **${formatSyncTime(result.syncedAt)}**`
            ].join('\n'),
            inline: false
        }
    );

    // 사용 가능한 날짜 표시 (로직 반전)
    if (result.totalAvailableDays === 0) {
        embed.addFields({
            name: '⚠️ 알림',
            value: '**모든 날짜가 사용 불가합니다!**\n일정이나 차단 설정으로 인해 가능한 날짜가 없습니다.',
            inline: false
        });
    } else {
        // 사용 가능한 날짜를 Embed Field에 직접 포함
        embed.addFields({
            name: '✅ 사용 가능한 날짜',
            value: result.availableDatesFormat && result.availableDatesFormat.length > 0 ?
                `\`\`\`\n${result.availableDatesFormat}\n\`\`\`` :
                '✅ **모든 날짜가 사용 가능합니다!**',
            inline: false
        });

        // 가용성 통계 정보 추가
        embed.addFields({
            name: '📊 가용성 분석',
            value: [
                `• 사용 가능: **${result.totalAvailableDays}개 날짜** (${Math.round((result.availabilityRatio || 0) * 100)}%)`,
                `• iCal 일정: **${result.totalEvents}개 날짜**`,
                `• 사용자 차단: **${result.totalBlockedDays || 0}개 날짜**`,
                `• 조회 기간: **${result.requestedMonths}개월**`
            ].join('\n'),
            inline: false
        });
    }

    // 추가 안내 메시지
    embed.addFields({
        name: '💡 도움말',
        value: [
            '• `/일정체크 [날짜목록]` - 특정 날짜와 겹침 확인',
            '• `/일정갱신` - 캘린더 강제 새로고침',
            '• mystery-place.com 에서 캘린더 추가/수정 가능'
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
        .setTitle('❌ 내 일정 조회 실패')
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
            name: '📋 사용법',
            value: [
                '`/내일정` - 기본 3개월 조회',
                '`/내일정 개월:6` - 6개월 조회',
                '`/내일정 개월:12` - 12개월 조회',
                '',
                '**설정 방법:**',
                '1. 웹사이트 로그인',
                '2. 설정 → 캘린더 관리',
                '3. Google/Apple 캘린더 iCal URL 등록'
            ].join('\n'),
            inline: false
        },
        {
            name: '🔗 관련 명령어',
            value: [
                '• `/일정체크` - 특정 날짜 겹침 확인',
                '• `/일정갱신` - 캐시 강제 새로고침'
            ].join('\n'),
            inline: false
        }
    );

    return embed;
}

/**
 * 동기화 시간 포맷팅
 */
function formatSyncTime(syncedAt) {
    if (!syncedAt) return '알 수 없음';

    try {
        const date = new Date(syncedAt);
        const now = new Date();
        const diffMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffMinutes < 1) {
            return '방금 전';
        } else if (diffMinutes < 60) {
            return `${diffMinutes}분 전`;
        } else if (diffMinutes < 1440) { // 24시간
            const hours = Math.floor(diffMinutes / 60);
            return `${hours}시간 전`;
        } else {
            const days = Math.floor(diffMinutes / 1440);
            return `${days}일 전`;
        }
    } catch (error) {
        return '알 수 없음';
    }
}