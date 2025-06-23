const { InteractionType, ComponentType } = require('discord.js');
const { traceCommand, traceEvent } = require('../../trace');

module.exports = {
	name: 'interactionHandeleder',
	once: false,
	execute: async (client, interaction) => {
		try {
			// Interaction 분기 처리
			switch (interaction.type) {
				case InteractionType.ApplicationCommand: // 슬래시 명령어
					const command = client.slashCommands.get(interaction.commandName);
					if (!command) return;
					try {
						// 명령 실행을 추적
						await traceCommand(interaction.commandName, async () => {
							await command.execute(interaction);
						});
					} catch (error) {
						console.error(error.stack);

						// 오류 응답 추가
						try {
							if (!interaction.replied && !interaction.deferred) {
								await interaction.reply({
									content: '❌ 명령어 실행 중 오류가 발생했습니다.',
									ephemeral: true
								});
							} else if (!interaction.replied) {
								await interaction.followUp({
									content: '❌ 명령어 실행 중 오류가 발생했습니다.',
									ephemeral: true
								});
							}
						} catch (replyError) {
							console.error('오류 응답 실패:', replyError);
						}
					}
					break;

				case InteractionType.MessageComponent: // 버튼 또는 셀렉트 메뉴
					if (interaction.componentType === ComponentType.Button) {
						await traceEvent(`버튼:${interaction.customId}`, async () => {
							const command = client.events.get('BUTTON_CLICK');
							await command?.execute(client, interaction);
						});
					} else if (interaction.componentType === ComponentType.StringSelect) {
						await traceEvent(`선택메뉴:${interaction.customId}`, async () => {
							const command = client.events.get('SELECT_MENU');
							await command?.execute(client, interaction);
						});
					}
					break;

				case InteractionType.ApplicationCommandAutocomplete:
					const focusedOption = interaction.options.getFocused(true);
					const optionName = focusedOption.name;
					const isOptionAutoComplete = client.responses.autocomplete.get(optionName);
					console.log("옵션네임 ", optionName);
					if (isOptionAutoComplete) {
						await traceEvent(`자동완성:${optionName}`, async () => {
							await isOptionAutoComplete.execute(client, interaction);
						});
					}
					break;

				case InteractionType.ModalSubmit:
					{
						await traceEvent(`모달:${interaction.customId}`, async () => {
							const command = client.events.get('MODAL_SUBMIT');
							await command?.execute(client, interaction);
						});
					}
					break;

				default:
					console.log('Unhandled interaction type:', interaction.type, interaction.componentType);
			}
		} catch (err) {
			console.error('Error handling interaction:', err);

			// 글로벌 오류 처리
			try {
				if (interaction && !interaction.replied && !interaction.deferred) {
					await interaction.reply({
						content: '❌ 내부 서버 오류가 발생했습니다. 나중에 다시 시도해주세요.',
						ephemeral: true
					});
				}
			} catch (finalError) {
				console.error('최종 오류 응답 실패:', finalError);
			}
		}
	}
};