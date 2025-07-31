const { ButtonInteraction, Client, PermissionFlagsBits, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { decodeFromString } = require('../../Commands/utility/delimiterGeter');
const { endVote } = require('../../Commands/커스텀투표');

module.exports = {
    name: "customVoteEnd",
    /**
     * @param {Client} client 
     * @param {ButtonInteraction} interaction 
     */
    async execute(client, interaction) {
        const { customId, user, member, guild, message } = interaction;
        const { head: voteId } = decodeFromString(customId);
        const redis = client.redis;
        
        try {
            // 투표 메타데이터 가져오기
            const metaData = await redis.getHash(`vote:${voteId}:meta`, 'data');
            if (!metaData) {
                return await interaction.reply({
                    content: '❌ 종료되었거나 존재하지 않는 투표입니다.',
                    ephemeral: true
                });
            }
            
            // 권한 확인 (관리자만 종료 가능)
            const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
            const isOwner = guild.ownerId === user.id;
            
            if (!isAdmin && !isOwner) {
                return await interaction.reply({
                    content: '❌ 투표를 종료할 권한이 없습니다. (관리자 권한이 필요합니다)',
                    ephemeral: true
                });
            }
            
            // 투표 종료 처리
            await interaction.deferReply({ ephemeral: true });
            
            // 투표 종료 버튼을 누른 사용자에게 DM을 보내도록 수정
            await endVoteWithCustomRecipient(client, voteId, message, user, interaction);
            
            await interaction.editReply({
                content: '✅ 투표가 종료되었습니다! 결과가 DM으로 전송되었습니다.'
            });
            
        } catch (error) {
            console.error('Vote end error:', error);
            
            const errorMsg = error.message.includes('Cannot send messages to this user') 
                ? '❌ DM을 보낼 수 없습니다. DM 설정을 확인해주세요.'
                : '❌ 투표 종료 중 오류가 발생했습니다.';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMsg });
            } else {
                await interaction.reply({ content: errorMsg, ephemeral: true });
            }
        }
    }
};

/**
 * 커스텀 DM 수신자로 투표 종료 처리
 * @param {Client} client Discord 클라이언트
 * @param {string} voteId 투표 ID
 * @param {Message} message 투표 메시지
 * @param {User} dmRecipient DM을 받을 사용자
 * @param {Interaction} interaction 현재 interaction (fallback 용도)
 */
async function endVoteWithCustomRecipient(client, voteId, message, dmRecipient, interaction) {
    const redis = client.redis;

    try {
        // 메타데이터 가져오기
        const metaData = await redis.getHash(`vote:${voteId}:meta`, 'data');
        if (!metaData) {
            console.error(`❌ [CustomVoteEnd] 메타데이터 없음: vote:${voteId}:meta`);
            return;
        }

        console.log(`🔍 [CustomVoteEnd] 메타데이터:`, metaData);
        
        const options = metaData.options.split(',');
        console.log(`🔍 [CustomVoteEnd] Guild ID 조회: ${metaData.guildId}`);
        
        let guild = client.guilds.cache.get(metaData.guildId);
        console.log(`🔍 [CustomVoteEnd] Guild 조회 결과:`, guild ? `${guild.name} (${guild.id})` : 'null');
        
        // Guild 조회 실패 시 현재 interaction의 guild 사용
        if (!guild && interaction && interaction.guild) {
            guild = interaction.guild;
            console.log(`🔄 [CustomVoteEnd] 현재 interaction의 Guild 사용: ${guild.name} (${guild.id})`);
        }
        
        if (!guild) {
            console.error(`❌ [CustomVoteEnd] Guild 조회 완전 실패:`, {
                targetGuildId: metaData.guildId,
                currentInteractionGuild: interaction?.guild?.id,
                availableGuilds: client.guilds.cache.map(g => ({ id: g.id, name: g.name }))
            });
            // Guild 조회 실패 시에도 투표 종료 진행 (단, 멤버 정보는 생략)
            console.warn(`⚠️ [CustomVoteEnd] Guild 조회 실패, 기본 정보로 DM 전송`);
        }

        // 결과 집계
        const guildName = guild ? guild.name : `알 수 없는 서버 (${metaData.guildId})`;
        let resultMsg = `📊 **커스텀투표 결과** (서버: ${guildName})\n\n`;
        const results = [];

        for (const option of options) {
            const voterIds = await redis.client.sMembers(`vote:${voteId}:voters:${option}`) || [];
            const voters = [];

            // 유저 이름과 ID 가져오기
            for (const userId of voterIds) {
                try {
                    if (guild) {
                        const member = await guild.members.fetch(userId);
                        const displayName = member.displayName || member.user.username;
                        voters.push(`${displayName} (${userId})`);
                    } else {
                        // Guild가 없으면 userId만 표시
                        voters.push(`(사용자) (${userId})`);
                    }
                } catch {
                    voters.push(`(알 수 없음) (${userId})`);
                }
            }

            results.push({
                option,
                count: voterIds.length,
                voters: voters.sort()
            });
        }

        // 투표 수 기준 정렬
        results.sort((a, b) => b.count - a.count);

        // 결과 메시지 생성
        const medals = ['🥇', '🥈', '🥉'];
        results.forEach((result, index) => {
            const medal = medals[index] || '▫️';
            resultMsg += `${medal} **${result.option}** (${result.count}표)\n`;
            if (result.voters.length > 0) {
                resultMsg += `   → 투표자: ${result.voters.join(', ')}\n`;
            }
            resultMsg += '\n';
        });

        const totalVotes = results.reduce((sum, r) => sum + r.count, 0);
        resultMsg += `총 참여자: ${totalVotes}명`;

        // 지정된 사용자에게 DM 전송
        try {
            console.log(`📩 [CustomVoteEnd] DM 전송 대상: ${dmRecipient.username} (${dmRecipient.id})`);
            await dmRecipient.send(resultMsg);
            console.log(`✅ [CustomVoteEnd] DM 전송 완료: ${dmRecipient.username}`);
        } catch (error) {
            console.error(`❌ [CustomVoteEnd] DM 전송 실패 (${dmRecipient.username}):`, error);
            throw error; // 에러를 다시 던져서 호출자가 처리할 수 있도록
        }

        // 버튼 비활성화
        const disabledComponents = message.components.map(row => {
            const newRow = ActionRowBuilder.from(row);
            newRow.components.forEach(button => button.setDisabled(true));
            return newRow;
        });

        await message.edit({
            components: disabledComponents,
            embeds: [
                EmbedBuilder.from(message.embeds[0])
                    .setFooter({ text: '✅ 투표가 종료되었습니다' })
                    .setColor(0x57F287)
            ]
        });

        // Redis 데이터 정리 (1시간 후)
        setTimeout(async () => {
            await redis.delete(`vote:${voteId}:meta`);
            await redis.delete(`vote:${voteId}:userChoice`);
            for (const option of options) {
                await redis.delete(`vote:${voteId}:voters:${option}`);
            }
        }, 3600000);

    } catch (error) {
        console.error('End vote with custom recipient error:', error);
        throw error;
    }
}