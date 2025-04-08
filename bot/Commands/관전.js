const { SlashCommandBuilder, PermissionFlagsBits, Client, Guild, ChannelType, PermissionsBitField, User } = require('discord.js');
const { isPermissionHas } = require('./api/user/permission');
const nameOfCommand = "관전";
const description = "참여했던 크씬에 관전자로 참가합니다.";

module.exports = {
    aliases: [""],
    data: new SlashCommandBuilder()
        .setName(nameOfCommand)
        .setDescription(description)
        .addStringOption(option =>
            option
                .setName('길드') // 문자열 옵션 이름
                .setDescription('참여할 크씬의 이름을 써주세요') // 문자열 옵션 설명
                .setRequired(true) // 필수 옵션 여부
                .setAutocomplete(true)
        )
    ,
    /**
     * 
     * @param {import('discord.js').Interaction} interaction 
     * @returns 
     */
    async execute(interaction) {
        // 옵션 "길드"의 값은 오토컴플릿에서 guild id를 반환하도록 설정함
        const guildId = interaction.options.getString('길드');
        const targetGuild = await interaction.client.guilds.cache.get(guildId);
        console.log("target ghuild", targetGuild);
        const isAnyGuildOwner = interaction.client.guilds.cache.some(guild => guild.ownerId === interaction.user.id);
        if (!isAnyGuildOwner) {
            // 길드장이 아니라면 일반 사용자 권한 레벨 체크 수행
            if (! await isPermissionHas(interaction.user.id, "관전")) {
                return await interaction.reply(`해당 권한이 없습니다.`);
            }
        }
        if (!targetGuild) {
            return interaction.reply("해당 길드를 찾을 수 없습니다. ");
        }
        // 초대 링크 생성 및 대상 유저에게 DM 전송
        await inviteGuild(interaction.client, targetGuild, interaction.user);
        await interaction.reply({ content: ` ${isAnyGuildOwner ? "진행자 특권으로 관전명령어를 실행합니다." : ""}초대 링크를 DM으로 전송했습니다.` });
    },

    prefixCommand: {
        name: nameOfCommand,
        description,
        async execute(message, args) {
            /*
            prifixCommand not provid!
            */
        }
    },
    upload: true,
    permissionLevel: PermissionFlagsBits.DeafenMembers
};

/**
 * 
 * @param {Client} client 
 * @param {Guild} targetGuild 
 * @param {User} targetUser 
 * @returns 
 */
async function inviteGuild(client, targetGuild, targetUser) {
    try {
        // 멤버 정보를 fetch로 시도합니다.
        let isAlreadyIn;
        try {
            isAlreadyIn = await targetGuild.members.fetch(targetUser.id);
        } catch (fetchError) {
            // fetch에서 에러가 발생하면, 해당 유저가 길드에 없다고 가정합니다.
            isAlreadyIn = null;
        }
        if (isAlreadyIn) {
            return await targetUser.send("이미 참여중인 길드입니다.");
        }
        let inviteChannel = targetGuild.systemChannel;
        if (!inviteChannel) {
            inviteChannel = targetGuild.channels.cache.find(ch => {
                return ch.type === ChannelType.GuildText &&
                    ch.permissionsFor(targetGuild.members.me)?.has(PermissionsBitField.Flags.CreateInstantInvite);
            });
        }
        if (!inviteChannel)
            return await targetUser.send("봇이 해당 길드에 참여시킬 권한이 없습니다. 해당 서버의 진행자에게 문의하세요!");
        const invite = await inviteChannel.createInvite({
            maxUses: 1,
            unique: true
        });
        await targetUser.send(`${targetGuild.name} 의 초대 코드입니다. 입장 후 진행자에게 관전 권한을 요청하세요!\n${invite}`);
        await inviteChannel.send(`${targetUser.globalName} 님이 관전을 요청하여 초대중입니다!`);
    } catch (error) {
        console.log("invite command error", error.stack);
    }
}
