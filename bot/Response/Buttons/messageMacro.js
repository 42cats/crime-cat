// handlers/messageMacro.js
const { PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getContents } = require('../../Commands/api/messageMacro/messageMacro');

const COLORS = [ButtonStyle.Primary, ButtonStyle.Danger, ButtonStyle.Success];
function getNextColor(currentStyle) {
	const index = COLORS.indexOf(currentStyle);
	if (index === -1) return COLORS[0]; // fallback
	return COLORS[(index + 1) % COLORS.length];
}

/**
 * 안전하게 메시지를 전송하는 함수
 * @param {Object} options - 전송 옵션
 * @param {import('discord.js').TextBasedChannel} options.channel - 메시지를 보낼 채널
 * @param {string} options.content - 전송할 메시지 내용
 * @param {import('discord.js').ButtonInteraction} options.interaction - 상호작용 객체
 * @param {boolean} options.ephemeral - 임시 메시지 여부
 * @param {string} options.channelId - 채널 ID (로깅용)
 * @returns {Promise<boolean>} 성공 여부
 */
async function safeSendMessage({ channel, content, interaction, ephemeral = false, channelId = 'unknown' }) {
	try {
		if (!channel) throw new Error('채널이 유효하지 않습니다');
		if (!channel.isTextBased()) throw new Error('텍스트 채널이 아닙니다');

		// 채널 권한 확인
		if (channel.guild) {
			const permissions = channel.permissionsFor(channel.guild.members.me);
			if (!permissions.has(PermissionFlagsBits.SendMessages)) {
				throw new Error('메시지 전송 권한이 없습니다');
			}
			if (content.includes('@everyone') || content.includes('@here') || content.match(/<@&\d+>/g)) {
				if (!permissions.has(PermissionFlagsBits.MentionEveryone)) {
					// @everyone, @here, 또는 역할 멘션이 있지만 권한이 없는 경우
					console.warn(`[경고] ${channel.name} 채널에서 @everyone/@here 권한이 없습니다.`);
				}
			}
		}

		// 메시지 길이 확인
		if (content.length > 2000) {
			console.warn(`[경고] 메시지 길이(${content.length})가 2000자를 초과합니다. 잘라서 전송합니다.`);
			content = content.substring(0, 1997) + '...';
		}

		// 전송 시도
		if (ephemeral && interaction) {
			await interaction.followUp({ content, ephemeral: true });
		} else {
			await channel.send(content);
		}

		return true;
	} catch (error) {
		// 오류 로깅 및 분류
		let errorMsg = `메시지 전송 실패 (채널: ${channelId})`;

		if (error.code === 50001) {
			errorMsg = `접근 권한 없음: 해당 채널에 메시지를 보낼 수 있는 권한이 없습니다.`;
		} else if (error.code === 50013) {
			errorMsg = `권한 부족: 봇에게 '메시지 보내기' 권한이 없습니다.`;
		} else if (error.code === 10003) {
			errorMsg = `존재하지 않는 채널입니다.`;
		} else if (error.code === 10004) {
			errorMsg = `존재하지 않는 길드(서버)입니다.`;
		} else if (error.code === 40005) {
			errorMsg = `첨부 파일이 너무 큽니다.`;
		} else if (error.code === 50006) {
			errorMsg = `메시지가 비어있습니다.`;
		} else if (error.code === 50035) {
			errorMsg = `유효하지 않은 메시지 형식입니다.`;
		}

		console.error(`❌ ${errorMsg}`, error);

		// 상호작용이 있고 아직 응답하지 않은 경우에만 오류 메시지 전송
		if (interaction && !interaction.replied && !interaction.deferred) {
			try {
				await interaction.followUp({
					content: `❌ ${errorMsg}`,
					ephemeral: true
				});
			} catch (followUpError) {
				console.error('오류 메시지 전송 실패:', followUpError);
			}
		}

		return false;
	}
}

module.exports = {
	name: 'messageMacro',

	/**
	 * @param {import('discord.js').Client} client
	 * @param {import('discord.js').ButtonInteraction} interaction
	 * @param {import('./types').ButtonMetaData} data
	*/
	execute: async (client, interaction, data) => {
		try {
			const { head, option } = data;

			const isOneTime = option?.[0] === '1';
			const isAdminOnly = option?.[1] === '1';
			const showPressDetail = option?.[2] === '1';
			const changeColor = option?.[3] === '1';
			const toDm = option?.[4] === '1';
			const showOnlyMe = option?.[5] === '1';
			const buttonName = interaction.component?.label || '알 수 없는 버튼';

			await interaction.deferReply({ ephemeral: true }); // 👈 가장 첫 줄에 추가

			// 관리자 제한
			if (isAdminOnly && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
				return await interaction.followUp({
					content: '🚫 관리자만 사용할 수 있는 버튼입니다.',
					ephemeral: true
				});
			}

			// 로그 남기기
			if (showPressDetail) {
				try {
					const originalContent = interaction.message.content || '';
					const lines = originalContent.split('\n');
					const userName = interaction.member.displayName;
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

					const headerLine = lines.find(line => !line.startsWith('👤')) || '**버튼 로그**';
					const newContent = [headerLine, ...updatedLogLines].join('\n');
					await interaction.message.edit({ content: newContent }).catch(err => {
						console.warn(`버튼 로그 업데이트 실패:`, err.message);
					});
				} catch (logError) {
					console.error("버튼 로그 업데이트 오류:", logError);
					// 로그 업데이트는 중요하지 않으므로 실패해도 계속 진행
				}
			}

			// 버튼 색상 변경 또는 비활성화
			if (changeColor || isOneTime) {
				try {
					const newComponents = interaction.message.components.map(row => {
						const newRow = ActionRowBuilder.from(row);
						newRow.components = row.components.map(button => {
							// 링크 버튼은 skip
							if (button.style === ButtonStyle.Link) return button;

							let builder = ButtonBuilder.from(button);

							// 모든 버튼에 색상 순환 적용
							if (changeColor) {
								builder = builder.setStyle(getNextColor(button.style));
							}

							// 클릭된 버튼만 비활성화
							if (isOneTime && button.customId === interaction.customId) {
								builder = builder.setDisabled(true);
							}

							return builder;
						});
						return newRow;
					});

					await interaction.message.edit({ components: newComponents }).catch(err => {
						console.warn(`버튼 색상/상태 업데이트 실패:`, err.message);
					});
				} catch (componentError) {
					console.error("버튼 컴포넌트 업데이트 오류:", componentError);
					// 컴포넌트 업데이트는 중요하지 않으므로 실패해도 계속 진행
				}
			}

			// 콘텐츠 가져오기 및 전송
			let contents = [];
			let successCount = 0;
			let errorCount = 0;

			try {
				contents = await getContents(head);
				if (!contents || contents.length === 0) {
					return await interaction.followUp({
						content: `⚠️ 연결된 콘텐츠가 없습니다.`,
						ephemeral: true
					});
				}
			} catch (contentError) {
				console.error("콘텐츠 조회 오류:", contentError);
				return await interaction.followUp({
					content: `❌ 콘텐츠 조회 중 오류가 발생했습니다: ${contentError.message}`,
					ephemeral: true
				});
			}

			// 콘텐츠 전송
			for (const content of contents) {
				const text = content.text;
				const channelId = content.channelId;

				// 빈 콘텐츠 건너뛰기
				if (!text || text.trim().length === 0) continue;

				// DM 전송
				if (toDm) {
					try {
						await interaction.user.send(text);
						successCount++;
					} catch (dmError) {
						console.error(`❌ DM 전송 실패`, dmError);
						errorCount++;
						await interaction.followUp({
							content: `❌ DM 전송에 실패했습니다. DM이 차단되어 있거나, 설정이 막혀 있을 수 있습니다.`,
							ephemeral: true
						}).catch(() => { });
					}
					continue; // DM 전송했으면 다음 콘텐츠로
				}

				// 인터랙션 응답 (ephemeral)
				if (showOnlyMe) {
					try {
						await interaction.followUp({
							content: text,
							ephemeral: true
						});
						successCount++;
					} catch (ephemeralError) {
						console.error(`❌ 인터랙션 응답 실패`, ephemeralError);
						errorCount++;
					}
					continue;
				}

				// 일반 채널 전송
				if (!channelId || channelId === 'none') {
					const success = await safeSendMessage({
						channel: interaction.channel,
						content: text,
						interaction,
						channelId: interaction.channel?.id || 'unknown'
					});

					if (success) successCount++;
					else errorCount++;
					continue;
				}

				// 지정된 채널로 전송
				try {
					const channel = await client.channels.fetch(channelId).catch(err => {
						console.error(`채널 조회 실패 (${channelId}):`, err.message);
						return null;
					});

					if (!channel) {
						console.error(`채널을 찾을 수 없음: ${channelId}`);
						await interaction.followUp({
							content: `❌ 채널 \`${channelId}\`를 찾을 수 없습니다.`,
							ephemeral: true
						}).catch(() => { });
						errorCount++;
						continue;
					}

					const success = await safeSendMessage({
						channel,
						content: text,
						interaction,
						channelId
					});

					if (success) successCount++;
					else errorCount++;
				} catch (channelError) {
					console.error(`❌ 채널 전송 중 예기치 않은 오류 (${channelId}):`, channelError);
					errorCount++;
					await interaction.followUp({
						content: `❌ 채널 \`${channelId}\`에 메시지를 전송하는 중 오류가 발생했습니다.`,
						ephemeral: true
					}).catch(() => { });
				}
			}

			// 최종 응답
			let summaryMessage = `✅ 버튼 \`${buttonName}\`을 눌렀습니다.`;
			if (contents.length > 0) {
				if (errorCount > 0) {
					summaryMessage += `\n📊 전송 결과: ${successCount}개 성공, ${errorCount}개 실패`;
				} else if (successCount > 0) {
					summaryMessage += `\n📊 ${successCount}개의 메시지가 성공적으로 전송되었습니다.`;
				}
			}

			await interaction.followUp({
				content: summaryMessage,
				ephemeral: true
			}).catch(err => {
				console.error("최종 응답 전송 실패:", err);
			});
		} catch (globalError) {
			console.error("버튼 처리 중 치명적 오류:", globalError);

			// 아직 응답하지 않은 경우에만 오류 메시지 전송
			if (!interaction.replied && !interaction.deferred) {
				try {
					await interaction.reply({
						content: `❌ 버튼 처리 중 오류가 발생했습니다: ${globalError.message}`,
						ephemeral: true
					});
				} catch (replyError) {
					try {
						await interaction.followUp({
							content: `❌ 버튼 처리 중 오류가 발생했습니다: ${globalError.message}`,
							ephemeral: true
						});
					} catch (followUpError) {
						console.error("오류 메시지 전송 실패:", followUpError);
					}
				}
			} else if (!interaction.replied) {
				try {
					await interaction.followUp({
						content: `❌ 버튼 처리 중 오류가 발생했습니다: ${globalError.message}`,
						ephemeral: true
					});
				} catch (followUpError) {
					console.error("오류 메시지 전송 실패:", followUpError);
				}
			}
		}
	}
};