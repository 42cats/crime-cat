const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

const nameOfCommand = "광고상태";
const description = "광고 Pub/Sub 시스템 상태 확인";

module.exports = {
    data: new SlashCommandBuilder()
        .setName(nameOfCommand)
        .setDescription(description)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            // Advertisement Manager 상태 확인
            const advertisementManager = interaction.client.advertisementManager;
            
            if (!advertisementManager) {
                return await interaction.reply({
                    content: "❌ Advertisement Manager가 초기화되지 않았습니다.",
                    ephemeral: true
                });
            }
            
            const status = advertisementManager.getStatus();
            const activeAds = advertisementManager.getActiveAds();
            
            // 상태 정보 임베드 생성
            const statusEmbed = new EmbedBuilder()
                .setColor(status.isConnected ? '#00ff00' : '#ff0000')
                .setTitle('📊 광고 Pub/Sub 시스템 상태')
                .addFields(
                    { 
                        name: '🔗 연결 상태', 
                        value: status.isConnected ? '✅ 연결됨' : '❌ 연결 끊어짐', 
                        inline: true 
                    },
                    { 
                        name: '📢 활성 광고', 
                        value: `${status.adsCount}건`, 
                        inline: true 
                    },
                    { 
                        name: '🔄 재연결 중', 
                        value: status.isReconnecting ? '⚠️ 예' : '✅ 아니오', 
                        inline: true 
                    },
                    { 
                        name: '⏰ 마지막 업데이트', 
                        value: status.lastUpdated || '정보 없음', 
                        inline: true 
                    },
                    { 
                        name: '📞 콜백 등록', 
                        value: status.hasCallback ? '✅ 등록됨' : '❌ 미등록', 
                        inline: true 
                    },
                    { 
                        name: '📡 채널', 
                        value: '`advertisement:active:changed`', 
                        inline: true 
                    },
                    { 
                        name: '🔗 시스템 타입', 
                        value: status.managerType === 'unified' ? '✅ 통합 Pub/Sub' : '⚠️ 레거시', 
                        inline: true 
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: '광고 시스템 모니터링', 
                    iconURL: interaction.client.user.displayAvatarURL() 
                });
            
            // 활성 광고 목록 추가
            if (activeAds && activeAds.length > 0) {
                const adsList = activeAds
                    .slice(0, 10) // 최대 10개만 표시
                    .map((ad, index) => `${index + 1}. **${ad.themeName}** (${ad.themeType})`)
                    .join('\n');
                
                statusEmbed.addFields({
                    name: '📋 활성 광고 목록',
                    value: adsList + (activeAds.length > 10 ? `\n... 외 ${activeAds.length - 10}건 더` : ''),
                    inline: false
                });
            }
            
            await interaction.reply({ 
                embeds: [statusEmbed], 
                ephemeral: true 
            });
            
        } catch (error) {
            console.error('❌ 광고상태 명령어 실행 오류:', error);
            await interaction.reply({
                content: "❌ 상태 확인 중 오류가 발생했습니다.",
                ephemeral: true
            });
        }
    },
    
    upload: true,
    permissionLevel: PermissionFlagsBits.Administrator,
};