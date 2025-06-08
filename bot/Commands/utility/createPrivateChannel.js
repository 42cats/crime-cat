const { ChannelType, PermissionFlagsBits } = require('discord.js');
const categoryManager = require('./categoryManager');

/**
 * 사용자 전용 채널 생성 함수
 * @param {import('discord.js').Guild} guild - 길드 객체
 * @param {import('discord.js').GuildMember} member - 길드 멤버 객체  
 * @param {string} observerRoleId - 관전자 역할 ID
 * @param {string} roleId - 역할 ID (콘텐츠 접근 권한 역할)
 * @returns {Promise<import('discord.js').TextChannel>} 생성된 채널 객체
 */
async function createPrivateChannel(guild, member, observerRoleId, roleId) {
    // 역할 이름 가져오기
    const role = guild.roles.cache.get(roleId);
    const roleName = role ? role.name : 'unknown-role';

    // 채널명 생성 (사용자명-롤이름-사용자유저네임)
    const channelName = `${member.displayName || member.user.globalName}-${roleName}-${member.user.globalName}`.toLowerCase().replace(/[^a-z0-9가-힣\-]/g, '-');

    // 기본 권한 설정
    const permissionOverwrites = [
        {
            id: guild.id, // @everyone
            deny: [PermissionFlagsBits.ViewChannel]
        },
        {
            id: member.user.id, // 사용자
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks
            ]
        }
    ];

    // 관리자 권한 추가 (Administrator 권한을 가진 역할 찾기)
    const adminRoles = guild.roles.cache.filter(role =>
        role.permissions.has(PermissionFlagsBits.Administrator)
    );

    adminRoles.forEach(adminRole => {
        permissionOverwrites.push({
            id: adminRole.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
            ]
        });
    });

    // 관전자 역할 권한 추가 (존재하는 경우)
    if (observerRoleId) {
        const observerRole = guild.roles.cache.get(observerRoleId);
        if (observerRole) {
            permissionOverwrites.push({
                id: observerRoleId,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            });
            console.log(`[채널 생성] 관전자 역할 권한 추가: ${observerRole.name} (${observerRoleId})`);
        } else {
            console.warn(`[채널 생성] 관전자 역할을 찾을 수 없음: ${observerRoleId}`);
        }
    }

    try {
        // 오늘 날짜의 카테고리 가져오기 또는 생성
        const category = await categoryManager.getOrCreateDailyCategory(guild, observerRoleId);

        // 채널 생성
        const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: category.id, // 카테고리에 포함
            topic: `${member.displayName || member.user.username}님의 전용 채널 - 역할 기반 콘텐츠 전용`,
            permissionOverwrites
        });

        console.log(`[채널 생성] 성공: ${channel.name} (${channel.id}) for ${member.user.tag} with role ${roleName} in category ${category.name}`);

        // 채널 생성 안내 메시지 전송
        await channel.send({
            content: `🎯 **${member.displayName || member.user.username}님의 전용 채널이 생성되었습니다!**\n\n` +
                `**역할**: ${roleName}\n` +
                `**카테고리**: ${category.name}\n` +
                `• 오직 ${member.displayName || member.user.username}님과 관리자, 관전자만 이 채널을 볼 수 있습니다.\n` +
                `•` +
                `•` +
                `•`
        });

        return channel;

    } catch (error) {
        console.error(`[채널 생성] 실패:`, error);
        throw new Error(`채널 생성에 실패했습니다: ${error.message}`);
    }
}

module.exports = { createPrivateChannel };