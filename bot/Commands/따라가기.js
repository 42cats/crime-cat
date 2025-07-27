const { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction, Message } = require('discord.js');
const delayedDeleteMessage = require('./utility/deleteMsg');
const redisManager = require('./utility/redis');

const nameOfCommand = "따라가기";
const description = "특정 유저를 5시간 동안 자동으로 따라갑니다";

const FOLLOW_TIMER_TTL = 18000; // 5시간
const NO_TTL = 0;

module.exports = {
    data: new SlashCommandBuilder()
        .setName(nameOfCommand)
        .setDescription(description)
        .addUserOption(option =>
            option
                .setName('타깃')
                .setDescription('따라갈 유저를 선택하세요')
                .setRequired(true)
        ),
    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        const targetUser = interaction.options.getUser('타깃');
        const followerId = interaction.user.id;
        const guildId = interaction.guild.id;

        // 검증 로직
        if (targetUser.id === followerId) {
            return await interaction.reply({
                content: "❌ 자기 자신은 따라갈 수 없습니다!",
                ephemeral: true
            });
        }

        if (targetUser.bot) {
            return await interaction.reply({
                content: "❌ 봇은 추적할 수 없습니다!",
                ephemeral: true
            });
        }

        // 같은 길드 멤버인지 확인
        const targetMember = interaction.guild.members.cache.get(targetUser.id);
        if (!targetMember) {
            return await interaction.reply({
                content: "❌ 해당 유저는 이 서버의 멤버가 아닙니다!",
                ephemeral: true
            });
        }

        // 팔로워가 음성 채널에 있는지 확인
        const followerMember = interaction.guild.members.cache.get(followerId);
        if (!followerMember.voice.channel) {
            return await interaction.reply({
                content: "❌ 음성 채널에 입장한 후 사용해주세요!",
                ephemeral: true
            });
        }

        try {
            // 1. 기존 추적 해제 (다른 타깃을 추적 중이었다면)
            await removeFollowerFromPreviousTarget(guildId, followerId);

            // 2. 새로운 추적 설정
            await addFollowerToTarget(guildId, targetUser.id, followerId);

            // 3. 개별 팔로워 정보도 저장 (해제 시 필요)
            const followerData = {
                targetUserId: targetUser.id,
                targetDisplayName: targetMember.displayName,
                guildId: guildId,
                createdAt: new Date().toISOString()
            };
            const followerKey = `follower:${guildId}:${followerId}`;
            await redisManager.setValue(followerData, FOLLOW_TIMER_TTL, followerKey); // 5시간 TTL

            await interaction.reply({
                content: `🎯 **${targetMember.displayName}**님을 5시간 동안 따라갑니다!\n⏰ 자동 해제: <t:${Math.floor(Date.now() / 1000) + FOLLOW_TIMER_TTL}:R>`,
                ephemeral: true
            });

            console.log(`✅ Follow tracking started: ${followerMember.displayName} → ${targetMember.displayName} in ${interaction.guild.name}`);

        } catch (error) {
            console.error('❌ Redis 저장 오류:', error);
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
            if (args.length === 0) {
                await message.channel.send("❌ 사용법: `!따라가기 @유저`");
                return delayedDeleteMessage(message);
            }

            // 멘션된 유저 찾기
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                await message.channel.send("❌ 유저를 멘션해주세요. 예: `!따라가기 @유저명`");
                return delayedDeleteMessage(message);
            }

            const followerId = message.author.id;
            const guildId = message.guild.id;

            // 동일한 검증 로직
            if (targetUser.id === followerId) {
                await message.channel.send("❌ 자기 자신은 따라갈 수 없습니다!");
                return delayedDeleteMessage(message);
            }

            if (targetUser.bot) {
                await message.channel.send("❌ 봇은 추적할 수 없습니다!");
                return delayedDeleteMessage(message);
            }

            const targetMember = message.guild.members.cache.get(targetUser.id);
            if (!targetMember) {
                await message.channel.send("❌ 해당 유저는 이 서버의 멤버가 아닙니다!");
                return delayedDeleteMessage(message);
            }

            const followerMember = message.guild.members.cache.get(followerId);
            if (!followerMember.voice.channel) {
                await message.channel.send("❌ 음성 채널에 입장한 후 사용해주세요!");
                return delayedDeleteMessage(message);
            }

            try {
                // 1. 기존 추적 해제
                await removeFollowerFromPreviousTarget(guildId, followerId);

                // 2. 새로운 추적 설정
                await addFollowerToTarget(guildId, targetUser.id, followerId);

                // 3. 개별 팔로워 정보 저장
                const followerData = {
                    targetUserId: targetUser.id,
                    targetDisplayName: targetMember.displayName,
                    guildId: guildId,
                    createdAt: new Date().toISOString()
                };
                const followerKey = `follower:${guildId}:${followerId}`;
                await redisManager.setValue(followerData, FOLLOW_TIMER_TTL, followerKey);

                await message.channel.send(`🎯 **${targetMember.displayName}**님을 5시간 동안 따라갑니다!\n⏰ 자동 해제: <t:${Math.floor(Date.now() / 1000) + FOLLOW_TIMER_TTL}:R>`);
                
                console.log(`✅ Follow tracking started: ${followerMember.displayName} → ${targetMember.displayName} in ${message.guild.name}`);

            } catch (error) {
                console.error('❌ Redis 저장 오류:', error);
                await message.channel.send("❌ 시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            }

            delayedDeleteMessage(message);
        }
    },
    upload: true,
    permissionLevel: PermissionFlagsBits.DeafenMembers
};

/**
 * 타깃에 팔로워 추가 (TTL 없이 수동 관리)
 * @param {string} guildId 
 * @param {string} targetUserId 
 * @param {string} followerId 
 */
async function addFollowerToTarget(guildId, targetUserId, followerId) {
    const targetKey = `target:${guildId}:${targetUserId}`;
    let followers = await redisManager.getValue(targetKey) || [];
    
    // 이미 팔로우 중이면 추가하지 않음
    if (!followers.includes(followerId)) {
        followers.push(followerId);
        // TTL 없이 저장 - 개별 팔로워 TTL로 관리
        await redisManager.setValue(followers, NO_TTL, targetKey); // TTL 없음
    }
}

/**
 * 팔로워가 이전에 추적하던 타깃에서 제거
 * @param {string} guildId 
 * @param {string} followerId 
 */
async function removeFollowerFromPreviousTarget(guildId, followerId) {
    // 팔로워의 기존 추적 정보 확인
    const followerKey = `follower:${guildId}:${followerId}`;
    const followerData = await redisManager.getValue(followerKey);
    
    if (followerData && followerData.targetUserId) {
        // 이전 타깃에서 이 팔로워 제거
        await removeFollowerFromTarget(guildId, followerData.targetUserId, followerId);
    }
}

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
        await redisManager.setValue(updatedFollowers, NO_TTL, targetKey);
    }
}