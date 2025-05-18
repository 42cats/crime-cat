const { deleteChannelClean } = require('../api/channel/channel');
const delayedDeleteMessage = require('./deleteMsg');

/**
 * 채널의 모든 메시지를 삭제하는 함수
 * @param {string} guildId 서버 ID
 * @param {string} channelId 채널 ID
 * @param {Client} client 디스코드 클라이언트 객체
 */
async function deleteAllMessages(guildId, channelId, client) {
	try {
		const channel = await client.channels.fetch(channelId);
		if (!channel || !channel.isTextBased()) {
			console.log('찾을 수 없는 채널이거나 텍스트 채널이 아닙니다.');
			await deleteChannelClean(guildId, channelId);
			return;
		}

		let totalDeleted = 0;
		let lastMessageId = null;
		const now = Date.now();
		const limitDays = 15 * 24 * 60 * 60 * 1000; // 15일(밀리초)

		while (true) {
			try {
				// 최신 메시지 최대 100개 가져오기
				const fetchedMessages = await channel.messages.fetch({ limit: 100, before: lastMessageId });

				if (fetchedMessages.size === 0) break;

				// 마지막 메시지 ID 저장 (다음 반복에 사용)
				const lastMessage = fetchedMessages.last();
				lastMessageId = lastMessage ? lastMessage.id : null;

				// 시스템 메시지가 아니고 15일 이내인 메시지만 필터링
				const recentMessages = fetchedMessages.filter(msg => {
					return !msg.system && (now - msg.createdTimestamp <= limitDays);
				});

				const oldMessages = fetchedMessages.filter(msg => {
					return !msg.system && (now - msg.createdTimestamp > limitDays);
				});

				// 최신 메시지 대량 삭제
				if (recentMessages.size > 0) {
					try {
						await channel.bulkDelete(recentMessages, true);
						totalDeleted += recentMessages.size;
					} catch (bulkError) {
						console.error('bulkDelete() 실행 오류:', bulkError.code || bulkError.message);

						// 대량 삭제 실패 시 개별 삭제 시도
						for (const msg of recentMessages.values()) {
							try {
								await msg.delete();
								totalDeleted++;
								// 개별 삭제 성공 로그 (디버깅용, 필요시 주석 해제)
								// console.log(`메시지 ${msg.id} 삭제 성공`);
							} catch (individualError) {
								// 시스템 메시지 관련 오류(50021)는 무시하고 계속 진행
								if (individualError.code !== 50021) {
									console.error(`개별 메시지 삭제 실패 ${msg.id}:`, individualError.code || individualError.message);
								}
							}

							// API 제한 방지를 위한 짧은 대기
							await new Promise(resolve => setTimeout(resolve, 100));
						}
					}
				}

				// 15일 이상 지난 메시지는 개별 삭제 (느림)
				for (const msg of oldMessages.values()) {
					try {
						await msg.delete();
						totalDeleted++;
					} catch (oldMsgError) {
						// 시스템 메시지 관련 오류는 무시
						if (oldMsgError.code !== 50021) {
							console.error(`오래된 메시지 삭제 실패 ${msg.id}:`, oldMsgError.code || oldMsgError.message);
						}
					}

					// API 제한 방지를 위한 짧은 대기
					await new Promise(resolve => setTimeout(resolve, 100));
				}

				// API 제한 방지를 위한 대기
				await new Promise(resolve => setTimeout(resolve, 1000));
			} catch (fetchError) {
				console.error('메시지 가져오기 오류:', fetchError.message || fetchError);

				// lastMessageId가 없으면 더 이상 진행할 수 없음
				if (lastMessageId === null) break;

				// 오류 후 대기 시간 증가
				await new Promise(resolve => setTimeout(resolve, 2000));
			}
		}

		// 삭제 완료 메시지 전송
		try {
			const msg = await channel.send(`${channel.name}의 ${totalDeleted}개 메시지 삭제 완료`);
			await delayedDeleteMessage(msg, 5); // 완료 메시지를 5초 후 삭제
		} catch (finalError) {
			console.error('완료 메시지 전송 실패:', finalError.message || finalError);
		}
	} catch (mainError) {
		console.error('전체 메시지 삭제 중 치명적 오류:', mainError.message || mainError);
		// 치명적 오류가 발생해도 프로세스가 종료되지 않도록 예외를 처리함
	}
}

/**
 * 채널의 최근 메시지를 제한된 수량만큼 삭제하는 함수
 * @param {string} guildId 서버 ID
 * @param {string} channelId 채널 ID
 * @param {Client} client 디스코드 클라이언트 객체
 * @param {number|null} limit 삭제할 메시지 수량 제한 (null=제한없음)
 */
async function deleteRecentMessages(guildId, channelId, client, limit = null) {
	try {
		const channel = await client.channels.fetch(channelId);
		if (!channel || !channel.isTextBased()) {
			console.log('찾을 수 없는 채널이거나 텍스트 채널이 아닙니다.');
			await deleteChannelClean(guildId, channelId);
			return;
		}

		let deletedCount = 0;
		let lastMessageId = null;
		let errorCount = 0;
		const maxErrors = 5; // 최대 오류 허용 횟수
		const now = Date.now();
		const limitDays = 15 * 24 * 60 * 60 * 1000; // 15일을 밀리초로 변환

		while ((limit === null || deletedCount < limit) && errorCount < maxErrors) {
			try {
				// 남은 개수 계산
				const fetchLimit = limit === null ? 100 : Math.min(100, limit - deletedCount);

				// 메시지 가져오기
				const fetchedMessages = await channel.messages.fetch({ limit: fetchLimit, before: lastMessageId });
				if (fetchedMessages.size === 0) break;

				// 마지막 메시지 ID 저장
				const lastMessage = fetchedMessages.last();
				lastMessageId = lastMessage ? lastMessage.id : null;

				// 시스템 메시지가 아니고 15일 이내인 메시지만 필터링
				const recentMessages = fetchedMessages.filter(msg => {
					return !msg.system && (now - msg.createdTimestamp <= limitDays);
				});

				if (recentMessages.size === 0) {
					// 더 이상 15일 이내 메시지가 없으면 종료
					if (fetchedMessages.size > 0) {
						// 하지만 가져온 메시지는 있었다면 (15일 이전 메시지만 있음)
						continue; // 다음 배치 확인
					}
					break; // 아무 메시지도 없으면 종료
				}

				try {
					// bulkDelete 시도
					await channel.bulkDelete(recentMessages, true);
					deletedCount += recentMessages.size;
					errorCount = 0; // 성공하면 오류 카운트 리셋
				} catch (bulkError) {
					console.error("대량 삭제 중 오류:", bulkError.code || bulkError.message);
					errorCount++;

					// 개별 삭제 시도
					for (const msg of recentMessages.values()) {
						try {
							await msg.delete();
							deletedCount++;
						} catch (individualError) {
							// 시스템 메시지 관련 오류는 무시
							if (individualError.code !== 50021) {
								console.error(`개별 메시지 삭제 실패 ${msg.id}:`, individualError.code || individualError.message);
							}
						}

						// API 제한 방지를 위한 짧은 대기
						await new Promise(resolve => setTimeout(resolve, 100));
					}
				}

				// API 제한 방지를 위한 대기
				await new Promise(resolve => setTimeout(resolve, 1000));
			} catch (fetchError) {
				console.error('메시지 가져오기 오류:', fetchError.message || fetchError);
				errorCount++;

				// 오류 후 대기 시간 증가
				await new Promise(resolve => setTimeout(resolve, 2000));
			}
		}

		// 삭제 결과 메시지 전송
		try {
			const msg = await channel.send(
				`${channel.name}의 최근 15일 이내 메시지 ${deletedCount}개 삭제됨`
			);
			await delayedDeleteMessage(msg, 5); // 5초 후 삭제
		} catch (finalError) {
			console.error('완료 메시지 전송 실패:', finalError.message || finalError);
		}
	} catch (mainError) {
		console.error('최근 메시지 삭제 중 치명적 오류:', mainError.message || mainError);
		// 치명적 오류가 발생해도 프로세스가 종료되지 않도록 예외를 처리함
	}
}

module.exports = {
	deleteAllMessages,
	deleteRecentMessages
};