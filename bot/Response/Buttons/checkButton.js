const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const delayedDeleteMessage = require('../../Commands/utility/deleteMsg');
const { createPrivateChannel } = require('../../Commands/utility/createPrivateChannel');
const { getGuildObserverSet } = require('../../Commands/api/guild/observer');
const channelManager = require('../../Commands/utility/channelManager');

module.exports = {
	name: 'checkButton',

	/**
	 * @param {import('discord.js').Client} _client
	 * @param {import('discord.js').ButtonInteraction} interaction
	 * @param {import('./types').ButtonMetaData} data
	 */
	execute: async (_client, interaction, data) => {
		try {
			const { option, otherOption } = data;

			// 옵션 파싱
			const isOneTime = option?.[0] === '1';
			const showPressDetail = option?.[2] === '1';
			const labelName = option?.[6] === '1';
			const isMulti = option?.[7] === '1';
			const isSecret = option?.[10] === '1';

			const buttonName = interaction.component?.label || '알 수 없는 항목';
			const userName = interaction.member.displayName;

			await interaction.deferReply();

			// 통계 업데이트 (멀티 모드이고 통계 표시 옵션이 켜진 경우)
			if (isMulti && showPressDetail && otherOption) {
				try {
					// 통계 메시지 가져오기
					const statsMessage = await interaction.channel.messages.fetch(otherOption);

					if (statsMessage) {
						const originalContent = statsMessage.content || '';
						const lines = originalContent.split('\n');
						const userLogLines = lines.filter(line => line.startsWith('👤'));

						let updated = false;
						const updatedLogLines = userLogLines.map(line => {
							if (line.includes(userName)) {
								const match = line.match(/: (\d+)/);
								const count = match ? parseInt(match[1]) + 1 : 1;
								updated = true;
								return `👤 ${userName}: ${count}`;
							}
							return line;
						});

						if (!updated) {
							updatedLogLines.push(`👤 ${userName}: 1`);
						}

						// 총 횟수 계산
						const totalCount = updatedLogLines.reduce((total, line) => {
							const match = line.match(/: (\d+)/);
							return total + (match ? parseInt(match[1]) : 0);
						}, 0);

						const headerLine = lines.find(line => !line.startsWith('👤') && !line.startsWith('📊')) || '**체크리스트**';
						const statsLine = `📊 누른사람: ${totalCount}회`;
						const newContent = [headerLine, statsLine, ...updatedLogLines].join('\n');

						await statsMessage.edit({ content: newContent }).catch(err => {
							console.warn(`통계 메시지 업데이트 실패:`, err.message);
						});
					}
				} catch (statsError) {
					console.error("통계 업데이트 오류:", statsError);
				}
			}

			// 버튼 상태 업데이트 (한번만 옵션이나 누가눌렀어 옵션이 켜진 경우)
			if (isOneTime || labelName) {
				try {
					const newComponents = interaction.message.components.map(row => {
						const newRow = ActionRowBuilder.from(row);
						newRow.components = row.components.map(button => {
							if (button.style === ButtonStyle.Link) return button;

							let builder = ButtonBuilder.from(button);

							// 클릭된 버튼만 처리
							if (button.customId === interaction.customId) {
								// 누가눌렀어: 버튼 라벨에 사용자 이름 추가 (한번만과 함께 사용)
								if (labelName && isOneTime) {
									const currentLabel = button.label || '알 수 없는 항목';
									builder = builder.setLabel(`${currentLabel} (${userName})`);
								}

								// 한번만: 버튼 비활성화
								if (isOneTime) {
									builder = builder.setDisabled(true);
								}
							}

							return builder;
						});
						return newRow;
					});

					await interaction.message.edit({ components: newComponents }).catch(err => {
						console.warn(`버튼 상태 업데이트 실패:`, err.message);
					});
				} catch (componentError) {
					console.error("버튼 컴포넌트 업데이트 오류:", componentError);
				}
			}

			// 비밀 옵션 처리 - 개인 채널에 로그 전송
			if (isSecret) {
				try {
					// Redis에서 사용자 전용 채널 확인
					let channelData = await channelManager.getUserPrivateChannel(
						interaction.user.id,
						interaction.guild.id
					);

					let targetChannel;

					if (!channelData) {
						// 새 채널 생성 필요
						const observerData = await getGuildObserverSet(interaction.guild.id);
						const observerRoleId = observerData?.data?.roleSnowFlake;

						console.log(`[비밀 체크] 새 채널 생성 시작 - 사용자: ${interaction.user.tag}`);

						targetChannel = await createPrivateChannel(
							interaction.guild,
							interaction.member,
							observerRoleId,
							'CHECK' // 체크 전용 채널 식별자
						);

						// Redis에 저장
						await channelManager.setUserPrivateChannel(
							interaction.user.id,
							interaction.guild.id,
							targetChannel.id,
							'CHECK'
						);

						console.log(`[비밀 체크] 새 채널 생성 완료: ${targetChannel.name} (${targetChannel.id})`);
					} else {
						// 기존 채널 사용
						try {
							targetChannel = await interaction.client.channels.fetch(channelData.channelId);
							await channelManager.updateChannelLastUsed(interaction.user.id, interaction.guild.id);
							console.log(`[비밀 체크] 기존 채널 사용: ${targetChannel.name} (${targetChannel.id})`);
						} catch (channelError) {
							// 채널이 삭제된 경우 Redis에서도 제거하고 새로 생성
							console.warn(`[비밀 체크] 기존 채널이 삭제됨. 새로 생성합니다: ${channelError.message}`);
							await channelManager.deleteUserPrivateChannel(interaction.user.id, interaction.guild.id);

							// 새 채널 생성
							const observerData = await getGuildObserverSet(interaction.guild.id);
							const observerRoleId = observerData?.data?.roleSnowFlake;

							targetChannel = await createPrivateChannel(
								interaction.guild,
								interaction.member,
								observerRoleId,
								'CHECK'
							);

							await channelManager.setUserPrivateChannel(
								interaction.user.id,
								interaction.guild.id,
								targetChannel.id,
								'CHECK'
							);

							console.log(`[비밀 체크] 복구 채널 생성 완료: ${targetChannel.name} (${targetChannel.id})`);
						}
					}

					// 개인 채널에 체크 로그 전송
					await targetChannel.send({
						embeds: [{
							color: 0x3498db,
							title: '🔒 체크 로그',
							fields: [
								{
									name: '📌 체크한 사용자',
									value: `**${userName}**`,
									inline: false
								},
								{
									name: '📝 체크 항목',
									value: `**${buttonName}**`,
									inline: false
								},
								{
									name: '⏰ 체크 시간',
									value: `${new Date().toLocaleString('ko-KR')}`,
									inline: false
								}
							],
							timestamp: new Date().toISOString(),
							footer: {
								text: '처리후 이모지로 체크해 두시면 편합니다.'
							}
						}]
					});

					// 간단한 응답 메시지 (임시 메시지)
					const checkMessage = await interaction.followUp({
						content: `✅ 체크 완료 (개인 채널에 로그 저장됨)`,
						ephemeral: true
					});

				} catch (secretError) {
					console.error("비밀 채널 처리 중 오류:", secretError);

					// 오류 발생 시 일반 메시지로 폴백
					const checkMessage = await interaction.followUp({
						content: `✅ **${buttonName}** 항목을 체크했습니다. (개인 채널 생성 실패)`,
						ephemeral: false
					});

					if (isOneTime) {
						delayedDeleteMessage(checkMessage, 3);
					}
				}
			} else {
				// 일반 체크 완료 메시지 (interaction 응답)
				const checkMessage = await interaction.followUp({
					content: `✅ **${userName}** 님이 **${buttonName}** 항목을 체크했습니다.`,
					ephemeral: false
				});

				// 한번만 옵션이 켜져있으면 3초 후 메시지 삭제
				if (isOneTime) {
					delayedDeleteMessage(checkMessage, 3);
				}
			}

		} catch (error) {
			console.error("체크 버튼 처리 중 오류:", error);

			if (!interaction.replied && !interaction.deferred) {
				await interaction.reply({
					content: `❌ 체크 처리 중 오류가 발생했습니다: ${error.message}`,
					ephemeral: true
				});
			} else {
				await interaction.followUp({
					content: `❌ 체크 처리 중 오류가 발생했습니다: ${error.message}`,
					ephemeral: true
				});
			}
		}
	}
};