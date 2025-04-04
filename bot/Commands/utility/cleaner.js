
const { deleteChannelClean } = require('../api/channel/channel');
const delayedDeleteMessage = require('./deleteMsg');
async function deleteAllMessages(guildId,channelId, client) {
	try {
		const channel = await client.channels.fetch(channelId);

		if (!channel || !channel.isTextBased()) {
			const msg = await channel.send('찾을 수 없는 채널이거나 텍스트 채널이 아닙니다.');
			await deleteChannelClean(guildId, channelId);
			await delayedDeleteMessage(msg, 1);
			return;
		}

		let totalDeleted = 0;
		let lastMessageId = null;
		const now = Date.now();
		const limitDays = 15 * 24 * 60 * 60 * 1000; // 15일(밀리초)

		while (true) {
			// 최신 메시지 최대 100개 가져오기
			const fetchedMessages = await channel.messages.fetch({ limit: 100, before: lastMessageId });

			if (fetchedMessages.size === 0) break;

			// 15일 이내 메시지만 필터링
			const recentMessages = fetchedMessages.filter(msg => now - msg.createdTimestamp <= limitDays);
			const oldMessages = fetchedMessages.filter(msg => now - msg.createdTimestamp > limitDays);

			if (recentMessages.size > 0) {
				try {
					await channel.bulkDelete(recentMessages, true); // 최신 메시지 대량 삭제
					totalDeleted += recentMessages.size;
				} catch (error) {
					console.error('bulkDelete() 실행 오류:', error);
				}
			}

			// 15일 이상 지난 메시지는 개별 삭제 (느림)
			for (const msg of oldMessages.values()) {
				try {
					msg.delete();
					totalDeleted++;
				} catch (error) {
					console.error(`Failed to delete old message ${msg.id}:`, error);
				}
			}

			lastMessageId = fetchedMessages.last()?.id;

			// 1초 대기 (디스코드 API 제한 방지)
			await new Promise(resolve => setTimeout(resolve, 1000));
		}

		// 삭제 완료 메시지 전송
		const msg = await channel.send(`${channel.name}의 ${totalDeleted}개 메시지 삭제 완료`);
		await delayedDeleteMessage(msg, 1);
	} catch (error) {
		console.error('Error deleting messages:', error);
	}
}



async function deleteRecentMessages(guildId,channelId, client, limit = null) {
	try {
		const channel = await client.channels.fetch(channelId);

		if (!channel || !channel.isTextBased()) {
			console.log('찾을 수 없는 채널이거나 텍스트 채널이 아닙니다.');
			await deleteChannelClean(guildId, channelId);
			return;
		}

		let deletedCount = 0;
		let lastMessageId = null;
		const now = Date.now();
		const limitDays = 15 * 24 * 60 * 60 * 1000; // 15일을 밀리초로 변환

		while (limit === null || deletedCount < limit) {
			// 남은 개수 계산
			const fetchLimit = limit === null ? 100 : Math.min(100, limit - deletedCount);

			// 메시지 가져오기
			const fetchedMessages = await channel.messages.fetch({ limit: fetchLimit, before: lastMessageId });

			if (fetchedMessages.size === 0) break;

			// 15일 이내 메시지만 필터링
			const recentMessages = fetchedMessages.filter(msg => now - msg.createdTimestamp <= limitDays);

			if (recentMessages.size === 0) break;
			try {
				channel.bulkDelete(recentMessages, true);
				
			} catch (error) {
				console.error("삭제중 에러.",error.stack);	
			}	
			// 메시지 삭제
			deletedCount += recentMessages.size;

			// 다음 반복을 위한 마지막 메시지 ID 저장
			lastMessageId = recentMessages.last()?.id;

			// 1초 대기 (API 과부하 방지)
			await new Promise(resolve => setTimeout(resolve, 1000));
		}

		// 삭제 결과 메시지 전송
		const msg = await channel.send(
			`${channel.name}의 최근 15일 이내 메시지 ${deletedCount}개 삭제됨`
		);
		await delayedDeleteMessage(msg, 1);
	} catch (error) {
		console.error('Error deleting messages:', error);
	}
}


module.exports = {
	deleteAllMessages,
	deleteRecentMessages
};