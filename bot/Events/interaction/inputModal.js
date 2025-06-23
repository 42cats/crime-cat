const { decodeFromString } = require('../../Commands/utility/delimiterGeter');
const { Client, ModalSubmitInteraction } = require('discord.js');

module.exports = {
	name: 'MODAL_SUBMIT',
	once: false,
	/**
	 * @param {Client} client
	 * @param {ModalSubmitInteraction} interaction
	 */
	execute: async (client, interaction) => {
		if (!interaction.isModalSubmit()) return;

		// 모달의 Custom ID가 encodeToString 형식으로 되어 있다면 파싱
		const parsed = decodeFromString(interaction.customId);
		const { command } = parsed;

		if (!command) {
			console.warn('⚠️ decodeFromString 결과에 command가 없습니다:', parsed);
			return;
		}

		console.log(`[Modal Submit] Command: ${command}`, interaction.components);
		console.log(client.responses.modals);
		// client.responses.modals는 command에 해당하는 핸들러를 저장한 Map이어야 함
		if (client.responses?.modals?.has(command)) {
			const handler = client.responses.modals.get(command);
			await handler.execute(client, interaction, parsed); // parsed를 넘기면 option, otherOption도 활용 가능
		} else {
			console.warn(`❓ Unknown modal command received: ${command}`);
		}
	},
};
