// handlers/messageMacro.js
const { PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { getContents } = require('../../Commands/api/messageMacro/messageMacro');
const logger = require('../../Commands/utility/logger');
const channelManager = require('../../Commands/utility/channelManager');
const { getGuildObserverSet } = require('../../Commands/api/guild/observer');
const { createPrivateChannel } = require('../../Commands/utility/createPrivateChannel');

const COLORS = [ButtonStyle.Primary, ButtonStyle.Danger, ButtonStyle.Success];
function getNextColor(currentStyle) {
	const index = COLORS.indexOf(currentStyle);
	if (index === -1) return COLORS[0]; // fallback
	return COLORS[(index + 1) % COLORS.length];
}

/**
 * Discord 임베드 형식을 감지하고 파싱하는 함수
 * @param {string} content - 파싱할 콘텐츠
 * @returns {Object} { type, data } 형태의 객체
 */
function parseMessageContent(content) {
	// JSON 형태의 임베드 감지
	if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
		try {
			const embedData = JSON.parse(content);
			// embeds 배열이 있거나 embed 객체가 있는 경우
			if (embedData.embeds || embedData.embed) {
				return { type: 'embed', data: embedData };
			}
			// 단일 embed 객체인 경우 (title, description, color 등의 속성이 있는 경우)
			if (embedData.title || embedData.description || embedData.color || embedData.fields) {
				return { type: 'embed', data: { embeds: [embedData] } };
			}
		} catch (e) {
			// JSON 파싱 실패 시 일반 텍스트로 처리
			console.debug('JSON 파싱 실패, 일반 텍스트로 처리:', e.message);
		}
	}
	
	// 커스텀 임베드 마크다운 문법 감지 (예: {{embed}} ... {{/embed}})
	if (content.includes('{{embed}}') && content.includes('{{/embed}}')) {
		return { type: 'custom_embed', data: content };
	}
	
	// 일반 텍스트
	return { type: 'text', data: content };
}

/**
 * 커스텀 임베드 마크다운을 Discord EmbedBuilder로 변환
 * @param {string} content - 커스텀 임베드 마크다운
 * @returns {EmbedBuilder} Discord EmbedBuilder 객체
 */
function parseCustomEmbedSyntax(content) {
	const embed = new EmbedBuilder();
	
	// {{embed}}와 {{/embed}} 사이의 내용 추출
	const embedMatch = content.match(/{{embed}}([\s\S]*?){{\/embed}}/i);
	if (!embedMatch) return embed;
	
	const embedContent = embedMatch[1].trim();
	const lines = embedContent.split('\n');
	
	for (const line of lines) {
		const trimmedLine = line.trim();
		if (!trimmedLine) continue;
		
		// title: 제목
		if (trimmedLine.startsWith('title:')) {
			embed.setTitle(trimmedLine.substring(6).trim());
		}
		// description: 설명
		else if (trimmedLine.startsWith('description:')) {
			embed.setDescription(trimmedLine.substring(12).trim());
		}
		// color: #hex 또는 숫자
		else if (trimmedLine.startsWith('color:')) {
			const colorValue = trimmedLine.substring(6).trim();
			if (colorValue.startsWith('#')) {
				embed.setColor(colorValue);
			} else {
				embed.setColor(parseInt(colorValue));
			}
		}
		// field: 이름 | 값 | inline(true/false)
		else if (trimmedLine.startsWith('field:')) {
			const fieldData = trimmedLine.substring(6).trim().split('|');
			if (fieldData.length >= 2) {
				const name = fieldData[0].trim();
				const value = fieldData[1].trim();
				const inline = fieldData[2] ? fieldData[2].trim() === 'true' : false;
				embed.addFields({ name, value, inline });
			}
		}
		// thumbnail: 썸네일 URL
		else if (trimmedLine.startsWith('thumbnail:')) {
			embed.setThumbnail(trimmedLine.substring(10).trim());
		}
		// image: 이미지 URL
		else if (trimmedLine.startsWith('image:')) {
			embed.setImage(trimmedLine.substring(6).trim());
		}
		// footer: 푸터 텍스트
		else if (trimmedLine.startsWith('footer:')) {
			embed.setFooter({ text: trimmedLine.substring(7).trim() });
		}
		// timestamp: true이면 현재 시간
		else if (trimmedLine.startsWith('timestamp:') && trimmedLine.includes('true')) {
			embed.setTimestamp();
		}
	}
	
	return embed;
}

/**
 * 안전하게 메시지를 전송하는 함수
 * @param {Object} options - 전송 옵션
 * @param {import('discord.js').TextBasedChannel} options.channel - 메시지를 보낼 채널
 * @param {string} options.content - 전송할 메시지 내용
 * @param {import('discord.js').ButtonInteraction} options.interaction - 상호작용 객체
 * @param {boolean} options.ephemeral - 임시 메시지 여부
 * @param {string} options.channelId - 채널 ID (로깅용)
 * @param {string} options.emoji - 자동 리액션 이모지 (선택적)
 * @returns {Promise<boolean>} 성공 여부
 */
async function safeSendMessage({ channel, content, interaction, ephemeral = false, channelId = 'unknown', emoji = null }) {
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

		// 임베드 파싱 및 전송
		const parsedContent = parseMessageContent(content);
		
		if (parsedContent.type === 'embed') {
			// JSON 형태의 임베드 처리
			try {
				const { embeds, content: textContent, ...otherOptions } = parsedContent.data;
				const embedBuilders = embeds ? embeds.map(embedData => new EmbedBuilder(embedData)) : [];
				
				// 임베드가 비어있으면 일반 텍스트로 폴백
				if (embedBuilders.length === 0) {
					throw new Error('임베드 데이터가 비어있습니다.');
				}
				
				let sentMessage;
				if (ephemeral && interaction) {
					sentMessage = await interaction.followUp({
						content: textContent || undefined,
						embeds: embedBuilders,
						ephemeral: true,
						...otherOptions
					});
				} else {
					sentMessage = await channel.send({
						content: textContent || undefined,
						embeds: embedBuilders,
						...otherOptions
					});
				}

				// 이모지 리액션 추가 (ephemeral 메시지가 아닌 경우에만)
				if (emoji && emoji.trim() && !ephemeral && sentMessage) {
					// 콤마로 구분된 이모지 문자열 처리
					const emojis = emoji.split(',').map(e => e.trim()).filter(Boolean);
					for (const singleEmoji of emojis) {
						try {
							await sentMessage.react(singleEmoji);
							console.log(`✅ 자동 리액션 추가 성공 (embed): ${singleEmoji}`);
						} catch (reactionError) {
							console.warn(`⚠️ 자동 리액션 추가 실패 (embed): ${singleEmoji} - ${reactionError.message}`);
						}
					}
				}
			} catch (embedError) {
				console.warn('임베드 생성 실패, 일반 텍스트로 폴백:', embedError.message);
				// 임베드 생성 실패 시 원본 content를 일반 텍스트로 전송
				if (ephemeral && interaction) {
					await interaction.followUp({ content, ephemeral: true });
				} else {
					await channel.send(content);
				}
			}
		} else if (parsedContent.type === 'custom_embed') {
			// 커스텀 마크다운 임베드 처리
			try {
				const embed = parseCustomEmbedSyntax(parsedContent.data);
				
				// 임베드에 최소한의 내용이 있는지 확인
				if (!embed.data.title && !embed.data.description && !embed.data.fields?.length) {
					throw new Error('임베드에 표시할 내용이 없습니다.');
				}
				
				let sentMessage;
				if (ephemeral && interaction) {
					sentMessage = await interaction.followUp({ embeds: [embed], ephemeral: true });
				} else {
					sentMessage = await channel.send({ embeds: [embed] });
				}

				// 이모지 리액션 추가 (ephemeral 메시지가 아닌 경우에만)
				if (emoji && emoji.trim() && !ephemeral && sentMessage) {
					// 콤마로 구분된 이모지 문자열 처리
					const emojis = emoji.split(',').map(e => e.trim()).filter(Boolean);
					for (const singleEmoji of emojis) {
						try {
							await sentMessage.react(singleEmoji);
							console.log(`✅ 자동 리액션 추가 성공 (custom embed): ${singleEmoji}`);
						} catch (reactionError) {
							console.warn(`⚠️ 자동 리액션 추가 실패 (custom embed): ${singleEmoji} - ${reactionError.message}`);
						}
					}
				}
			} catch (customEmbedError) {
				console.warn('커스텀 임베드 생성 실패, 일반 텍스트로 폴백:', customEmbedError.message);
				// 커스텀 임베드 생성 실패 시 원본 content를 일반 텍스트로 전송
				if (ephemeral && interaction) {
					await interaction.followUp({ content, ephemeral: true });
				} else {
					await channel.send(content);
				}
			}
		} else {
			// 일반 텍스트 처리 (기존 방식)
			let sentMessage;
			if (ephemeral && interaction) {
				sentMessage = await interaction.followUp({ content, ephemeral: true });
			} else {
				sentMessage = await channel.send(content);
			}

			// 이모지 리액션 추가 (ephemeral 메시지가 아닌 경우에만)
			if (emoji && emoji.trim() && !ephemeral && sentMessage) {
				// 콤마로 구분된 이모지 문자열 처리
				const emojis = emoji.split(',').map(e => e.trim()).filter(Boolean);
				for (const singleEmoji of emojis) {
					try {
						await sentMessage.react(singleEmoji);
						console.log(`✅ 자동 리액션 추가 성공: ${singleEmoji}`);
					} catch (reactionError) {
						console.warn(`⚠️ 자동 리액션 추가 실패: ${singleEmoji} - ${reactionError.message}`);
					}
				}
			}
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
			const { head, option, otherOption } = data;

			const isOneTime = option?.[0] === '1';
			const isAdminOnly = option?.[1] === '1';
			const showPressDetail = option?.[2] === '1';
			const changeColor = option?.[3] === '1';
			const toDm = option?.[4] === '1';
			const showOnlyMe = option?.[5] === '1';
			const labelName = option?.[6] === '1';
			const isMulti = option?.[7] === '1';  // 추가: 멀티 모드 여부 확인
			const isRoleOption = option?.[8] === '1';  // 추가: 역할옵션 여부 확인
			const isDesignatedChannel = option?.[9] === '1';  // 추가: 지정채널 여부 확인
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
					let messageToUpdate;

					// 멀티 모드이고 통계 메시지 ID가 있으면 해당 메시지 업데이트
					if (isMulti && otherOption) {
						try {
							// 통계 메시지 가져오기
							messageToUpdate = await interaction.channel.messages.fetch(otherOption);
							console.log(`통계 메시지 가져오기 성공 (메시지 ID: ${otherOption})`);
						} catch (fetchError) {
							console.error(`통계 메시지 가져오기 실패 (메시지 ID: ${otherOption}):`, fetchError.message);
							// 통계 메시지를 가져올 수 없으면 현재 메시지 사용
							messageToUpdate = interaction.message;
						}
					} else {
						// 단일 모드이거나 통계 메시지 ID가 없으면 현재 메시지 사용
						messageToUpdate = interaction.message;
					}

					const originalContent = messageToUpdate.content || '';
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

					await messageToUpdate.edit({ content: newContent }).catch(err => {
						console.warn(`버튼 로그 업데이트 실패:`, err.message);
					});
				} catch (logError) {
					console.error("버튼 로그 업데이트 오류:", logError);
					// 로그 업데이트는 중요하지 않으므로 실패해도 계속 진행
				}
			}

			// 버튼 색상 변경 또는 비활성화
			if (changeColor || isOneTime || (labelName && isOneTime)) {
				try {
					console.log(`버튼 옵션 상태 - isOneTime: ${isOneTime}, labelName: ${labelName}, changeColor: ${changeColor}`);
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

							// 클릭된 버튼만 처리
							if (button.customId === interaction.customId) {
								console.log(`클릭된 버튼 처리 중 - customId: ${button.customId}`);

								// 라벨 이름 옵션이 켜져있고 원타임 옵션도 켜져있을 경우, 버튼 이름에 유저 이름 추가
								if (labelName && isOneTime) {
									const userName = interaction.member.displayName;
									const currentLabel = button.label || '알 수 없는 버튼';
									console.log(`버튼 라벨 변경 - 이전: "${currentLabel}", 사용자: "${userName}"`);
									builder = builder.setLabel(`${currentLabel} (${userName})`);
									console.log(`버튼 라벨 변경 완료 - 새 라벨: "${currentLabel} (${userName})"`);
								}

								// 클릭된 버튼 비활성화
								if (isOneTime) {
									builder = builder.setDisabled(true);
									console.log(`버튼 비활성화 완료`);
								}
							}

							return builder;
						});
						return newRow;
					});

					console.log(`메시지 컴포넌트 업데이트 시도`);
					await interaction.message.edit({ components: newComponents }).catch(err => {
						console.warn(`버튼 색상/상태 업데이트 실패:`, err.message);
					});
					console.log(`메시지 컴포넌트 업데이트 완료`);
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
			let hasPermissionForAnyContent = false;
			let blockedByRoleCount = 0;

			for (const content of contents) {
				const text = content.text;
				const channelId = content.channelId;
				const roleId = content.roleId;
				const emoji = content.emoji;

				// 빈 콘텐츠 건너뛰기
				if (!text || text.trim().length === 0) continue;

				// 역할 권한 검사
				if (roleId && roleId !== "ALL") {
					const hasRole = interaction.member.roles.cache.has(roleId);
					if (!hasRole) {
						console.log(`[권한 검사] 사용자 ${interaction.user.tag} (${interaction.user.id})가 역할 ID ${roleId}를 가지고 있지 않아 콘텐츠 접근이 차단됨`);
						blockedByRoleCount++;
						continue; // 권한이 없으면 이 콘텐츠를 건너뜀
					} else {
						console.log(`[권한 검사] 사용자 ${interaction.user.tag} (${interaction.user.id})가 역할 ID ${roleId}를 가지고 있어 콘텐츠 접근 허용`);
					}
				} else {
					console.log(`[권한 검사] 콘텐츠가 모든 사용자에게 공개됨 (roleId: ${roleId || 'undefined'})`);
				}

				hasPermissionForAnyContent = true;

				// 역할옵션이 켜져 있고 역할 권한이 있는 경우
				if (isRoleOption && roleId) {
					if (isDesignatedChannel) {
						// 지정채널 모드: channelId로 직접 전송
						try {
							if (!channelId || channelId === 'none') {
								// 지정된 채널이 없으면 콘텐츠 전송 차단
								console.log(`[지정채널] 채널 ID가 없어서 콘텐츠 전송 차단: ${channelId || 'undefined'}`);

								await interaction.followUp({
									content: `⚠️ 지정된 채널이 없어서 콘텐츠 전송을 하지 않습니다. 컨텐츠에 채널설정을 해 주세요\n💡 자동 채널 생성을 원하면 '지정채널' 옵션을 꺼주세요.`,
									ephemeral: true
								}).catch(() => { });

								errorCount++;
								continue; // 다음 콘텐츠로
							}

							// 지정된 채널로 전송
							const targetChannel = await client.channels.fetch(channelId);

							if (!targetChannel) {
								throw new Error(`지정된 채널을 찾을 수 없습니다: ${channelId}`);
							}

							// 봇의 메시지 전송 권한 확인
							const permissions = targetChannel.permissionsFor(targetChannel.guild.members.me);
							if (!permissions.has(PermissionFlagsBits.SendMessages)) {
								throw new Error(`지정된 채널에 메시지 전송 권한이 없습니다: ${targetChannel.name}`);
							}

							console.log(`[지정채널] 지정된 채널로 전송: ${targetChannel.name} (${targetChannel.id})`);

							const success = await safeSendMessage({
								channel: targetChannel,
								content: text,
								interaction,
								channelId,
								emoji
							});

							if (success) successCount++;
							else errorCount++;

							continue; // 다음 콘텐츠로

						} catch (designatedChannelError) {
							console.error(`[지정채널] 처리 중 오류:`, designatedChannelError);

							await interaction.followUp({
								content: `❌ 지정채널 처리 중 오류가 발생했습니다: ${designatedChannelError.message}`,
								ephemeral: true
							}).catch(() => { });

							errorCount++;
							continue;
						}
					} else {
						// 개인채널 모드: 기존 로직 유지
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

								console.log(`[역할옵션] 새 채널 생성 시작 - 사용자: ${interaction.user.tag}, 관전자 역할: ${observerRoleId || '없음'}, roleId: ${roleId}`);

								// roleId가 'ALL'이면 null로 전달 (사용자 최상위 역할 사용)
								const actualRoleId = roleId === 'ALL' ? null : roleId;

								targetChannel = await createPrivateChannel(
									interaction.guild,
									interaction.member,
									observerRoleId,
									actualRoleId
								);

								// Redis에 저장 (actualRoleId 대신 원본 roleId 저장)
								await channelManager.setUserPrivateChannel(
									interaction.user.id,
									interaction.guild.id,
									targetChannel.id,
									roleId
								);

								console.log(`[역할옵션] 새 채널 생성 완료: ${targetChannel.name} (${targetChannel.id})`);
							} else {
								// 기존 채널 사용
								try {
									targetChannel = await client.channels.fetch(channelData.channelId);
									await channelManager.updateChannelLastUsed(interaction.user.id, interaction.guild.id);
									console.log(`[역할옵션] 기존 채널 사용: ${targetChannel.name} (${targetChannel.id})`);
								} catch (channelError) {
									// 채널이 삭제된 경우 Redis에서도 제거하고 새로 생성
									console.warn(`[역할옵션] 기존 채널이 삭제됨. 새로 생성합니다: ${channelError.message}`);
									await channelManager.deleteUserPrivateChannel(interaction.user.id, interaction.guild.id);

									// 새 채널 생성
									const observerData = await getGuildObserverSet(interaction.guild.id);
									const observerRoleId = observerData?.data?.roleSnowFlake;

									console.log(`[역할옵션] 복구 채널 생성 시작 - roleId: ${roleId}`);
									
									// roleId가 'ALL'이면 null로 전달 (사용자 최상위 역할 사용)
									const actualRoleId = roleId === 'ALL' ? null : roleId;
									
									targetChannel = await createPrivateChannel(
										interaction.guild,
										interaction.member,
										observerRoleId,
										actualRoleId
									);

									await channelManager.setUserPrivateChannel(
										interaction.user.id,
										interaction.guild.id,
										targetChannel.id,
										roleId
									);

									console.log(`[역할옵션] 복구 채널 생성 완료: ${targetChannel.name} (${targetChannel.id})`);
								}
							}

							// 전용 채널로 콘텐츠 전송
							const success = await safeSendMessage({
								channel: targetChannel,
								content: text,
								interaction,
								channelId: targetChannel.id,
								emoji
							});

							if (success) successCount++;
							else errorCount++;

							continue; // 다음 콘텐츠로

						} catch (roleOptionError) {
							console.error(`[역할옵션] 처리 중 오류:`, roleOptionError);

							// 오류 발생 시 사용자에게 알림
							await interaction.followUp({
								content: `❌ 개인 채널 처리 중 오류가 발생했습니다: ${roleOptionError.message}`,
								ephemeral: true
							}).catch(() => { });

							errorCount++;
							continue;
						}
					}
				}

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
						channelId: interaction.channel?.id || 'unknown',
						emoji
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
						channelId,
						emoji
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

			// 최종 응답 (권한 피드백 포함)
			let summaryMessage;
			if (!hasPermissionForAnyContent && blockedByRoleCount > 0) {
				summaryMessage = `🚫 해당 버튼을 사용할 권한이 없습니다. 필요한 역할을 확인해주세요.`;
			} else {
				summaryMessage = `✅ 버튼 \`${buttonName}\`을 눌렀습니다.`;
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