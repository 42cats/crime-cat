const { 
    SlashCommandBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder 
} = require('discord.js');
const logger = require('./utility/logger');
const dotenv = require('dotenv');
dotenv.config();

const nameOfCommand = "bc";
const description = "개발자 전용: 모든 서버 오너에게 메시지를 브로드캐스트";

module.exports = {
    data: new SlashCommandBuilder()
        .setName(nameOfCommand)
        .setDescription(description),

    async execute(interaction) {
        // ✅ 개발자 인증
        if (interaction.user.id !== '317655426868969482') {
            return await interaction.reply({ 
                content: '⛔ 이 명령어는 개발자 전용입니다.', 
                ephemeral: true 
            });
        }

        // 모달 생성
        const modal = new ModalBuilder()
            .setCustomId('broadcast_modal')
            .setTitle('서버 오너 브로드캐스트 메시지');

        const messageInput = new TextInputBuilder()
            .setCustomId('broadcast_message')
            .setLabel('전송할 메시지 (최대 2000자)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(2000)
            .setPlaceholder('모든 서버 오너에게 전송될 메시지를 입력하세요.');

        const actionRow = new ActionRowBuilder().addComponents(messageInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    },

    upload: true,
    permissionLevel: -1
};