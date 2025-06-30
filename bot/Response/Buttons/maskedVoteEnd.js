const { ButtonInteraction, Client, PermissionFlagsBits } = require('discord.js');
const { decodeFromString } = require('../../Commands/utility/delimiterGeter');
const { endVote } = require('../../Commands/복면투표');

module.exports = {
    name: "maskedVoteEnd",
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
            
            // 권한 확인 (투표 생성자 또는 관리자만 종료 가능)
            const isCreator = user.id === metaData.creatorId;
            const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
            const isOwner = guild.ownerId === user.id;
            
            if (!isCreator && !isAdmin && !isOwner) {
                return await interaction.reply({
                    content: '❌ 투표를 종료할 권한이 없습니다. (투표 생성자 또는 관리자만 가능)',
                    ephemeral: true
                });
            }
            
            // 투표 종료 처리
            await interaction.deferReply({ ephemeral: true });
            
            // endVote 함수 호출
            await endVote(client, voteId, message);
            
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