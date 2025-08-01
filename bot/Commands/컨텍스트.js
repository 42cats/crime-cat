const { ApplicationCommandType, ContextMenuCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('테스트 컨텍스트 메뉴')
        .setType(ApplicationCommandType.User),
    
    async execute(interaction) {
        const menu = new StringSelectMenuBuilder()
            .setCustomId('test_context_menu')
            .setPlaceholder('원하는 작업을 선택하세요')
            .addOptions([
                { label: '기본 테스트', value: 'test_basic' },
                { label: '추가 기능', value: 'test_extra' }
            ]);

        const row = new ActionRowBuilder().addComponents(menu);

        await interaction.reply({ content: `원하는 작업을 선택하세요:`, components: [row], ephemeral: true });
    },
    
    async selectMenuHandler(interaction) {
        if (interaction.customId === 'test_context_menu') {
            if (interaction.values[0] === 'test_basic') {
                await interaction.update({ content: `유저 컨텍스트 메뉴 테스트 완료! 대상: ${interaction.user.username}`, components: [] });
            } else if (interaction.values[0] === 'test_extra') {
                await interaction.update({ content: `추가 기능 실행됨! 대상: ${interaction.user.username}`, components: [] });
            }
        }
    },
    upload: true,
    permissionLevel: PermissionFlagsBits.Administrator,
    isCacheCommand: false,
};
