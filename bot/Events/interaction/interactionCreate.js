const { InteractionType, ComponentType } = require('discord.js');
module.exports = {
	name: 'interactionHandeleder',

	execute: async (client, interaction) => {
		try {
			// Interaction 분기 처리
			switch (interaction.type) {
				case InteractionType.ApplicationCommand: // 슬래시 명령어
					const command = client.slashCommands.get(interaction.commandName);
					if (!command) return;
					try {
						await command.execute(interaction);
					} catch (error) {
						console.error(error.stack);
					};
					break;
				case InteractionType.MessageComponent: // 버튼 또는 셀렉트 메뉴
					if (interaction.componentType === ComponentType.Button) {
						const command = client.events.get('BUTTON_CLICK');
						await command?.execute(client, interaction);
					} else if (interaction.componentType === ComponentType.StringSelect) {
						const command = client.events.get('SELECT_MENU');
						await command?.execute(client, interaction);
					} 
					break;
				case InteractionType.ApplicationCommandAutocomplete:
					const focusedOption = interaction.options.getFocused(true);
					const optionName = focusedOption.name;
					const isOptionAutoComplete = client.responses.autocomplete.get(optionName);
					console.log("옵션네임 ", optionName);
					if (isOptionAutoComplete)
						await isOptionAutoComplete.execute(client, interaction);
					break;
				case InteractionType.ModalSubmit:
					{
						const command = client.events.get('MODAL_SUBMIT');
						await command?.execute(client,interaction);
					}
					break;
				default:
					console.log('Unhandled interaction type:', interaction.type, interaction.componentType);
			}
		} catch (err) {
			console.error('Error handling interaction:', err);
		}
	}
}