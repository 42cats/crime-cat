const { SlashCommandBuilder, PermissionFlagsBits, Role, Client, Guild, ChannelType, PermissionsBitField, User, InteractionResponse, CommandInteraction } = require('discord.js');
const { USER_PERMISSION, PRICE_PERMISSION ,KO_PERMISSION ,getUserGrade, showPermisson, hasPermission,setPermisson } = require('./utility/UserGrade');
const { User :DbUser} = require('./utility/db');
const UserInfoImage = require('./utility/userInfoToImage');
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
        if(!botPermission){
            interaction.reply({embeds: [await UserInfoImage(interaction.user)]});
        }
        else{
            const {success, message} = await buyPermission(interaction.user, botPermission);
            interaction.reply(`${success ? "✅" : "❌"} ${message}`);
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
    upload: true,
    permissionLevel: PermissionFlagsBits.DeafenMembers
};


/**
 * 사용자가 특정 권한을 구매합니다.
 * @param {DiscordUser} user - Discord 사용자 객체
 * @param {USER_PERMISSION} permission - 구매하려는 권한
 * @returns {Promise<{ success: boolean, message: string }>} - 구매 성공 여부와 메시지
 */
async function buyPermission(user, permission) {
    try {
        const { id } = user;
        const permissionPrice = PRICE_PERMISSION[permission];

        if (!permissionPrice) {
            return { success: false, message: '유효하지 않은 권한입니다.' };
        }

        // 사용자 정보 조회
        const targetUser = await DbUser.findOne({ where: { user_id: id } });

        if (!targetUser) {
            return { success: false, message: '사용자 정보를 찾을 수 없습니다.' };
        }

        // 사용자의 현재 포인트 확인
        const currentPoints = targetUser.point || 0;

        if (currentPoints < permissionPrice) {
            return { success: false, message: '포인트가 부족합니다.' };
        }
        if(permission === USER_PERMISSION.LOCAL_MUSIC_UP){
            const prePermissionHas = await hasPermission(user,USER_PERMISSION.LOCAL_MUSIC);
            if(!prePermissionHas)
				return { success: false, message: '선행 권한을 먼저 얻으셔야 합니다!.' };

        }
        // 포인트 차감 및 권한 부여를 트랜잭션으로 처리
        await DbUser.sequelize.transaction(async (transaction) => {
            // 포인트 차감
            await targetUser.update(
                { point: currentPoints - permissionPrice },
                { transaction }
            );

            // 권한 부여
            await setPermisson(user, permission, transaction);
        });

        return { success: true, message: `${KO_PERMISSION[permission]} 권한이 성공적으로 부여되었습니다.` };
    } catch (error) {
        console.error('buyPermission error:', error);
        return { success: false, message: '권한 구매 중 오류가 발생했습니다.' };
    }
}
