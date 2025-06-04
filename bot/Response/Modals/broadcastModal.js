const { encodeToString } = require('../../Commands/utility/delimiterGeter');
const logger = require('../../Commands/utility/logger');
module.exports = {
    name: 'brodcastMessage',
    async execute(client, interaction) {
        try {
            // 개발자 인증
            if (interaction.user.id !== '317655426868969482') {
                return await interaction.reply({
                    content: '⛔ 이 명령어는 개발자 전용입니다.',
                    ephemeral: true
                });
            }

            const messageContent = interaction.fields.getTextInputValue(encodeToString(interaction.guildId, "brodcastMessage", interaction.channel.id));

            // 메시지 유효성 검사
            if (!messageContent || messageContent.trim().length === 0) {
                return await interaction.reply({
                    content: '❌ 메시지는 비워둘 수 없습니다.',
                    ephemeral: true
                });
            }

            const guilds = client.guilds.cache;
            const ownerSet = new Set();
            let successCounter = 0;
            let failCounter = 0;

            // 먼저 오너 ID 수집 (중복 제거)
            for (const guild of guilds.values()) {
                if (!ownerSet.has(guild.ownerId) && guild.ownerId !== "288302173912170497") {
                    ownerSet.add(guild.ownerId);
                }
            }

            // 초기 응답
            await interaction.reply({
                content: `📢 브로드캐스트 준비: ${ownerSet.size}명의 오너에게 전송 시도`,
                ephemeral: true
            });

            const sendPromises = Array.from(ownerSet).map(async (ownerId) => {
                try {
                    const owner = await client.users.fetch(ownerId);
                    await owner.send({
                        content: `**개발자 브로드캐스트 메시지**
            
            ${messageContent}
            
            **발신: Mystery-place 개발팀**`
                    });
                    successCounter++;
                    logger.info(`✅ DM 전송됨: ${owner.globalName || '알 수 없음'} (${ownerId})`);
                } catch (err) {
                    failCounter++;
                    logger.error(`❌ DM 전송 실패: ${ownerId}`, err);
                }
            });

            // 모든 메시지 전송 완료 대기
            await Promise.allSettled(sendPromises);

            // 최종 결과 전송
            await interaction.followUp({
                content: `📨 브로드캐스트 완료: ${successCounter}/${ownerSet.size}명 성공 (${failCounter}명 실패)`,
                ephemeral: true
            });
        } catch (error) {
            logger.error('브로드캐스트 모달 처리 중 오류:', error);

            try {
                // 오류 응답 (이미 응답했을 수 있으므로 followUp 사용)
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ 브로드캐스트 중 오류가 발생했습니다.',
                        ephemeral: true
                    });
                } else {
                    await interaction.followUp({
                        content: '❌ 브로드캐스트 중 오류가 발생했습니다.',
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                logger.error('오류 응답 실패:', replyError);
            }
        }
    }
};