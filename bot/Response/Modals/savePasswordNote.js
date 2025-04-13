// Response/Modals/recordMessage.js
const { Client, ModalSubmitInteraction } = require('discord.js');
const { decodeFromString, encodeToString } = require('../../Commands/utility/delimiterGeter');
const delayedDeleteMessage = require('../../Commands/utility/deleteMsg');
const { addPasswordContent } = require('../../Commands/api/passwordNote/passwordNote');

module.exports = {
	name: "passwordNote", // 반드시 encodeToString()에서 사용된 command와 같아야 함

	/**
	 * @param {Client} client 
	 * @param {ModalSubmitInteraction} interaction 
	 */
	execute: async (client, interaction) => {
		if (!interaction.isModalSubmit()) return;
		try {
			const { command, option: channelId, otherOption } = decodeFromString(interaction.customId);
			const guildId = interaction.guildId;
			console.log("feild value", interaction.fields);
			// 유저 입력값 받기 (customId로 설정된 ID가 전체 모달 ID와 동일함)
			const passwordKey = interaction.fields.getTextInputValue(encodeToString(interaction.guildId, "privatePassword", channelId, "password"));
			const content = interaction.fields.getTextInputValue(encodeToString(interaction.guildId, "privateMessage", channelId, "content"));


			if ((!passwordKey || passwordKey.trim().length === 0) || (!content || content.trim().length === 0)) {
				await interaction.reply({ content: '❗ 패스워드, 콘텐츠 둘다 입력되어야 합니다.', ephemeral: true });
				return;
			}
			let ret = null;
			try {
				ret = await addPasswordContent(guildId, channelId, passwordKey, content);
			}
			catch (e) {
				console.log(e);
				interaction.reply({content: `${e}`});
			}
			if (ret)
				await interaction.reply({ content: `✅\n비밀번호 ${ret.passwordKey} 로\n채널 ${interaction.channel.name} 에\n콘텐츠 ${ret.content}가 설정되었습니다.`, ephemeral: true });

		} catch (error) {
			console.error(error.stack);
			await interaction.reply({ content: '❌ 비밀번호 메시지 설정중 오류가 발생했습니다.', ephemeral: true });

			const errorMsg = await interaction.channel.send(`❌ ${error.message}`);
			delayedDeleteMessage(errorMsg, 3);
		}
	}
};
