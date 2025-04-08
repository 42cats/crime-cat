const { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction, Message, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { encodeToString } = require('./utility/delimiterGeter');
const { getCharacterNames } = require('./api/character/character');
const nameOfCommand = "투표";
const description = "투표 폼을 호출합니다.";

module.exports = {
    aliases: [],
    data: new SlashCommandBuilder()
        .setName(nameOfCommand)
        .setDescription(description)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    ,
    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        const { guildId, client, user } = interaction;
        const msg = await voteFormMaker(client, guildId, user);
        interaction.reply(msg);
    },
    prefixCommand: {
        name: nameOfCommand,
        description,
        /**
         * 
         * @param {Message} message 
         * @param {Array} args 
         * @returns 
         */
        async execute(message, args) {
            const { guildId, client, author } = message;
            const msg = await voteFormMaker(client, guildId, author);
            console.log(msg);
            message.channel.send(msg);


        }
    },
    upload: true,
    permissionLevel: PermissionFlagsBits.Administrator
};

async function voteFormMaker(client, guildId, user) {

    const response = await getCharacterNames(guildId);
    const data = response?.characters || [];
    console.log("data = ", data, guildId);
    if (!data) return {
        content: '캐릭터를 추가하고 사용해 주세요!',
    }
    const characters = data.map(c => c.name);
    if (client.voteStorage.has(guildId)) {
        client.voteStorage.delete(guildId);
    }
    // 캐릭터 버튼 생성 (5개씩 행 구성)
    const characterRows = [];
    for (let i = 0; i < characters.length; i += 5) {
        const chunk = characters.slice(i, i + 5);
        const buttons = chunk.map(name =>
            new ButtonBuilder()
                .setCustomId(encodeToString(user.id, "voteChoice", name, chunk.length))
                .setLabel(name)
                .setStyle(ButtonStyle.Primary)
        );
        characterRows.push(new ActionRowBuilder().addComponents(buttons));
    }

    // 투표 종료 버튼 추가
    const endButton = new ButtonBuilder()
        .setCustomId(encodeToString(user.id, "endVote"))
        .setLabel('투표 종료')
        .setStyle(ButtonStyle.Danger);
    const endRow = new ActionRowBuilder().addComponents(endButton);
    characterRows.push(endRow);
    return {
        content: '`\`\`\🔎 범인이라고 생각되는 캐릭터를 선택해주세요!\n진행자는 투표가 끝나면 투표종료를 눌러주세요\`\`\`',
        components: characterRows
    };
}