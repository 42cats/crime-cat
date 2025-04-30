// Events/interaction/buttonClick.js

/**
 * 버튼 클릭 이벤트 처리기
 * 버튼 클릭 시 customId 분석하여 적절한 핸들러에게 전달
 */
module.exports = {
    name: 'buttonClick',
    once: false,

    /**
     * @param {import('discord.js').ButtonInteraction} interaction
     * @param {import('discord.js').Client} client
     */
    execute: async (interaction, client) => {
        if (!interaction.isButton()) return;

        try {
            // customId 구문 분석
            const [name, head, ...options] = interaction.customId.split('_');

            if (!name) {
                console.error(`[오류] 버튼 customId 형식 오류: ${interaction.customId}`);
                return await interaction.reply({
                    content: '❌ 잘못된 버튼 ID 형식입니다.',
                    ephemeral: true
                });
            }

            // 핸들러 검색
            const button = client.buttons.get(name);
            if (!button) {
                console.error(`[오류] 찾을 수 없는 버튼 핸들러: ${name}`);
                return await safeReply(interaction, {
                    content: `❌ '${name}' 버튼을 처리할 수 없습니다. 관리자에게 문의하세요.`,
                    ephemeral: true
                });
            }

            // 핸들러 실행에 필요한 데이터 구성
            const metadata = {
                name,
                head,
                option: options
            };

            // 버튼 실행 및 오류 처리
            await button.execute(client, interaction, metadata).catch(async (error) => {
                // 오류 로깅
                console.error(`[오류] 버튼 핸들러 실행 중 오류 (${name}):`, error);
                await logButtonError(client, interaction, name, error);

                // 권한 관련 오류인지 확인
                if (error.code === 50001 || error.code === 50013) {
                    return await safeReply(interaction, {
                        content: `❌ 권한 오류: 봇에게 필요한 권한이 없습니다. 서버 관리자에게 문의하세요.`,
                        ephemeral: true
                    });
                }

                // 채널 관련 오류인지 확인
                if (error.code === 10003) {
                    return await safeReply(interaction, {
                        content: `❌ 채널 오류: 버튼 메시지와 연결된 채널을 찾을 수 없습니다.`,
                        ephemeral: true
                    });
                }

                // 일반 오류 응답
                await safeReply(interaction, {
                    content: `❌ 버튼 처리 중 오류가 발생했습니다.`,
                    ephemeral: true
                });
            });
        } catch (globalError) {
            // 전역 예외 처리
            console.error('[심각] 버튼 처리 중 치명적 오류:', globalError);
            await safeReply(interaction, {
                content: '❌ 내부 서버 오류가 발생했습니다. 나중에 다시 시도해주세요.',
                ephemeral: true
            });
        }
    }
};

/**
 * 안전하게 인터랙션에 응답하는 함수
 * @param {import('discord.js').ButtonInteraction} interaction 
 * @param {Object} options 응답 옵션
 * @returns {Promise<boolean>} 성공 여부
 */
async function safeReply(interaction, options) {
    try {
        if (interaction.replied) {
            await interaction.followUp(options);
        } else if (interaction.deferred) {
            await interaction.followUp(options);
        } else {
            await interaction.reply(options);
        }
        return true;
    } catch (error) {
        console.error('[오류] 버튼 인터랙션 응답 실패:', error);
        return false;
    }
}

/**
 * 버튼 오류 로깅 함수
 * @param {import('discord.js').Client} client 
 * @param {import('discord.js').ButtonInteraction} interaction 
 * @param {string} buttonName 
 * @param {Error} error 
 */
async function logButtonError(client, interaction, buttonName, error) {
    try {
        // 로그 채널이 설정되어 있는지 확인
        const logChannelId = process.env.ERROR_LOG_CHANNEL;
        if (!logChannelId) return;

        // 로그 채널 얻기
        const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
        if (!logChannel || !logChannel.isTextBased()) return;

        // 오류 정보 구성
        const errorInfo = {
            buttonName,
            customId: interaction.customId,
            userId: interaction.user.id,
            username: interaction.user.tag,
            guildId: interaction.guild?.id,
            guildName: interaction.guild?.name,
            channelId: interaction.channel?.id,
            channelName: interaction.channel?.name,
            timestamp: new Date().toISOString(),
            errorCode: error.code || 'N/A',
            errorMessage: error.message || 'Unknown error',
            errorStack: error.stack?.substring(0, 1000) || 'No stack trace'
        };

        // 로그 채널에 오류 정보 전송
        await logChannel.send({
            content: `## 🚨 버튼 오류 발생\n\`\`\`json\n${JSON.stringify(errorInfo, null, 2)}\n\`\`\``.substring(0, 2000)
        }).catch(err => {
            console.error('[오류] 오류 로그 전송 실패:', err);
        });
    } catch (logError) {
        console.error('[오류] 버튼 오류 로깅 실패:', logError);
    }
}