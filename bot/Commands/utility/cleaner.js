
const delayedDeleteMessage = require('./deleteMsg');
// 모든 메시지 삭제 함수
async function deleteAllMessages(channelId, client) {
	try {
		const channel = await client.channels.fetch(channelId);

		if (!channel || !channel.isTextBased()) {
			const msg = await channel.send('찾을수 없는 채널이거나 택스트 채널이 아닙니다.');
			await delayedDeleteMessage(msg, 1);
			return;
		}

		let totalDeleted = 0;
		let lastMessageId = null;

		while (true) {
			const fetchedMessages = await channel.messages.fetch({
				limit: 100,
				...(lastMessageId ? { before: lastMessageId } : {}),
			});

			if (fetchedMessages.size === 0) break; // 더 이상 가져올 메시지가 없으면 종료

			await Promise.all(
				fetchedMessages.map(async (message) => {
					try {
						await message.delete();
						totalDeleted++;
					} catch (error) {
						console.error(`Failed to delete message ${message.id}:`, error);
					}
				})
			);

			lastMessageId = fetchedMessages.lastKey(); // 마지막 메시지 ID 저장
			console.log(`Deleted ${fetchedMessages.size} messages so far.`);
		}

		const msg = await channel.send(`${channel.name}의  ${totalDeleted}개 메시지 삭제함`);
		await delayedDeleteMessage(msg, 1);
	} catch (error) {
		console.error('Error deleting messages:', error);
	}
}



async function deleteRecentMessages(channelId, client, limit = null) {
	try {
		const channel = await client.channels.fetch(channelId);

		if (!channel || !channel.isTextBased()) {
			console.log('Invalid channel ID or the channel is not a text channel.');
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

			// 메시지 삭제
			await channel.bulkDelete(recentMessages, true);
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