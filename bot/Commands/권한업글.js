const { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction } = require('discord.js');
const UserInfoImage = require('./utility/userInfoToImage');
const { addUserPermisson } = require('./api/user/user');
const nameOfCommand = "권한업글";
const description = "포인트 사용으로 추가 권한 획득";

module.exports = {
    aliases: [""],
    data: new SlashCommandBuilder()
        .setName(nameOfCommand)
        .setDescription(description)
        .addStringOption(option =>
            option
                .setName('봇권한') // 문자열 옵션 이름
                .setDescription('추가할 봇 권한을 입력하세요 미입력시 권한목록 출력') // 문자열 옵션 설명
                .setRequired(false) // 필수 옵션 여부
                .setAutocomplete(true)
        )
    ,
    /**
     * 
     * @param {CommandInteraction} interaction 
     * @returns 
     */
    async execute(interaction) {
        const botPermission = interaction.options.getString('봇권한');
        if (!botPermission) {
            interaction.reply({ embeds: [await UserInfoImage(interaction.user)] });
        }
        else {
            const response = await addUserPermisson(interaction.user, botPermission);
            console.log("response ", response);
            interaction.reply(`${response.status === 200 ? "✅ 권한 등록 성공" : "❌ 권한 등록 실패"} \n현재 권한 : ${response.data.permissions ? `${response.data.permissions.map(v => v.name)}` : ""}`);
        }
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
    upload: false,
    permissionLevel: PermissionFlagsBits.DeafenMembers,
    isCacheCommand: false,
};
