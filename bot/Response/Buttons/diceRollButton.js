const { Client, ButtonInteraction } = require('discord.js');
const { diceSimulator } = require('../../Commands/주사위');

module.exports = {
    name: "diceRollButton",
    /**
     * 주사위 버튼 클릭 핸들러
     * @param {Client} client 
     * @param {ButtonInteraction} interaction 
     * @param {Object} data 인코딩된 데이터 { head, command, option, otherOption }
     */
    execute: async (client, interaction, data) => {
        try {
            // 인코딩된 데이터에서 주사위 설정 파싱: "6:1"
            const [eyes, count] = data.option.split(':');

            // 파싱된 값 검증
            const diceEyes = parseInt(eyes);
            const diceCount = parseInt(count);

            if (isNaN(diceEyes) || isNaN(diceCount) || diceEyes < 2 || diceCount < 1) {
                await interaction.reply({
                    content: '❌ 잘못된 주사위 설정입니다.',
                    ephemeral: true
                });
                return;
            }

            console.log(`[DiceRollButton] Rolling ${diceCount}D${diceEyes} for ${interaction.user.displayName}`);

            // 기존 diceSimulator 함수 사용
            const result = diceSimulator(diceEyes, diceCount);
            const userName = interaction.user.displayName ?? interaction.user.globalName;

            await interaction.reply({
                content: `${userName} 님의\n${result}`,
            });

        } catch (error) {
            console.error('[DiceRollButton] Error:', error);
            await interaction.reply({
                content: '❌ 주사위 굴리기 중 오류가 발생했습니다.',
                ephemeral: true
            });
        }
    }
};