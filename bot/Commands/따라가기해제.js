const { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction, Message } = require('discord.js');
const delayedDeleteMessage = require('./utility/deleteMsg');
const redisManager = require('./utility/redis');

const nameOfCommand = "따라가기해제";
const description = "현재 설정된 따라가기를 해제합니다";

module.exports = {
    data: new SlashCommandBuilder()
        .setName(nameOfCommand)
        .setDescription(description),
    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        const followerId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            // 팔로워 정보 확인
            const followerKey = `follower:${guildId}:${followerId}`;
            const followerData = await redisManager.getValue(followerKey);

            if (!followerData) {
                return await interaction.reply({
                    content: "❌ 현재 설정된 따라가기가 없습니다.",
                    ephemeral: true
                });
            }

            // 1. 타깃의 팔로워 목록에서 제거
            await removeFollowerFromTarget(guildId, followerData.targetUserId, followerId);

            // 2. 팔로워 정보 삭제
            await redisManager.delete(followerKey);

            await interaction.reply({
                content: `✅ **${followerData.targetDisplayName}**님에 대한 따라가기가 해제되었습니다!`,
                ephemeral: true
            });

            console.log(`✅ Follow tracking stopped: ${interaction.user.displayName} → ${followerData.targetDisplayName} in ${interaction.guild.name}`);

        } catch (error) {
            console.error('❌ Redis 조회/삭제 오류:', error);
            await interaction.reply({
                content: "❌ 시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
                ephemeral: true
            });
        }
    },

    prefixCommand: {
        name: nameOfCommand,
        description,
        /**
         * 
         * @param {Message} message 
         * @param {Array} args 
         */
        async execute(message, args) {
            const followerId = message.author.id;
            const guildId = message.guild.id;

            try {
                // 팔로워 정보 확인
                const followerKey = `follower:${guildId}:${followerId}`;
                const followerData = await redisManager.getValue(followerKey);

                if (!followerData) {
                    await message.channel.send("❌ 현재 설정된 따라가기가 없습니다.");
                    return delayedDeleteMessage(message);
                }

                // 1. 타깃의 팔로워 목록에서 제거
                await removeFollowerFromTarget(guildId, followerData.targetUserId, followerId);

                // 2. 팔로워 정보 삭제
                await redisManager.delete(followerKey);

                await message.channel.send(`✅ **${followerData.targetDisplayName}**님에 대한 따라가기가 해제되었습니다!`);
                
                console.log(`✅ Follow tracking stopped: ${message.author.displayName} → ${followerData.targetDisplayName} in ${message.guild.name}`);

            } catch (error) {
                console.error('❌ Redis 조회/삭제 오류:', error);
                await message.channel.send("❌ 시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            }

            delayedDeleteMessage(message);
        }
    },
    upload: true,
    permissionLevel: PermissionFlagsBits.DeafenMembers,
    isCacheCommand: true,
};

/**
 * 특정 타깃에서 팔로워 제거
 * @param {string} guildId 
 * @param {string} targetUserId 
 * @param {string} followerId 
 */
async function removeFollowerFromTarget(guildId, targetUserId, followerId) {
    const targetKey = `target:${guildId}:${targetUserId}`;
    let followers = await redisManager.getValue(targetKey) || [];
    
    const updatedFollowers = followers.filter(id => id !== followerId);
    
    if (updatedFollowers.length === 0) {
        // 팔로워가 없으면 키 삭제
        await redisManager.delete(targetKey);
    } else {
        // 업데이트된 팔로워 목록 저장 (TTL 없음)
        await redisManager.setValue(updatedFollowers, 0, targetKey);
    }
}