const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const nameOfCommand = "광고새로고침";
const description = "광고 캐시 수동 새로고침";

module.exports = {
    data: new SlashCommandBuilder()
        .setName(nameOfCommand)
        .setDescription(description)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            // Advertisement Manager 확인
            const advertisementManager = interaction.client.advertisementManager;
            
            if (!advertisementManager) {
                return await interaction.reply({
                    content: "❌ Advertisement Manager가 초기화되지 않았습니다.",
                    ephemeral: true
                });
            }
            
            await interaction.deferReply({ ephemeral: true });
            
            // 새로고침 실행
            const beforeCount = advertisementManager.getActiveAds().length;
            await advertisementManager.refreshAds();
            const afterCount = advertisementManager.getActiveAds().length;
            
            const response = [
                "🔄 **광고 캐시 새로고침 완료**",
                "",
                `📊 **새로고침 결과:**`,
                `• 이전: ${beforeCount}건`,
                `• 현재: ${afterCount}건`,
                `• 변경: ${afterCount - beforeCount > 0 ? '+' : ''}${afterCount - beforeCount}건`,
                "",
                `⏰ **업데이트 시간:** ${new Date().toLocaleString()}`
            ].join('\n');
            
            await interaction.editReply({ content: response });
            
            console.log(`🔄 광고 수동 새로고침 완료: ${beforeCount} → ${afterCount}건 (${interaction.user.tag})`);
            
        } catch (error) {
            console.error('❌ 광고새로고침 명령어 실행 오류:', error);
            
            if (interaction.deferred) {
                await interaction.editReply({
                    content: "❌ 광고 새로고침 중 오류가 발생했습니다."
                });
            } else {
                await interaction.reply({
                    content: "❌ 광고 새로고침 중 오류가 발생했습니다.",
                    ephemeral: true
                });
            }
        }
    },
    
    upload: true,
    permissionLevel: PermissionFlagsBits.Administrator,
};