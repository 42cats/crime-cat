// Response/Modals/recordMessage.js
const { Client, ModalSubmitInteraction } = require('discord.js');
const { decodeFromString } = require('../../Commands/utility/delimiterGeter');
const { addChannelMessage } = require('../../Commands/api/channel/channel');
const delayedDeleteMessage = require('../../Commands/utility/deleteMsg');

module.exports = {
	name: "recodeMessage", // 반드시 encodeToString()에서 사용된 command와 같아야 함

	/**
	 * @param {Client} client 
	 * @param {ModalSubmitInteraction} interaction 
	 */
	execute: async (client, interaction) => {
		if (!interaction.isModalSubmit()) return;

		try {
			const { command, option: channelId, otherOption } = decodeFromString(interaction.customId);
			const guildId = interaction.guildId;

			// 유저 입력값 받기 (customId로 설정된 ID가 전체 모달 ID와 동일함)
			const input = interaction.fields.getTextInputValue(interaction.customId);

			if (!input || input.trim().length === 0) {
				await interaction.reply({ content: '❗ 입력된 내용이 없습니다.', ephemeral: true });
				return;
			}

			await addChannelMessage(guildId, channelId, input);

			await interaction.reply({ content: `✅ 메시지가 <#${channelId}> 채널에 기록되었습니다.`, ephemeral: true });

		} catch (error) {
			console.error(error.stack);
			await interaction.reply({ content: '❌ 메시지 기록 중 오류가 발생했습니다.', ephemeral: true });

			const errorMsg = await interaction.channel.send(`❌ ${error.message}`);
			delayedDeleteMessage(errorMsg, 3);
		}
	}
};
