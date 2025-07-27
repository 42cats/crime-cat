// voiceStateUpdate.js
const { Events, ChannelType } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const redisManager = require('../../Commands/utility/redis');

const NO_TTL = 0;
module.exports = {
	name: "voiceStateUpdate",
	once: false, // 매 이벤트마다 실행

	/**
	 * @param {import('discord.js').VoiceState} oldState
	 * @param {import('discord.js').VoiceState} newState
	 */
	execute: async (oldState, newState) => {
		const client = oldState.client;  // 또는 newState.client (같은 Client 객체)
		const guild = newState.guild;    // oldState.guild도 동일

		// ---- '옛 채널'과 '새 채널' 구분 ----
		const oldChannel = oldState.channel;
		const newChannel = newState.channel;

		// ──────────────────────────────────────────
		// 🔍 DEBUG: 음성 상태 변경 이벤트 로그
		// ──────────────────────────────────────────
		const user = newState.member.user;
		console.log(`🎤 Voice State Update: ${user.tag} (${user.id})`);
		console.log(`   Old Channel: ${oldChannel ? oldChannel.name : 'None'}`);
		console.log(`   New Channel: ${newChannel ? newChannel.name : 'None'}`);
		console.log(`   Is Bot: ${user.bot}`);
		console.log(`   Guild: ${guild.name} (${guild.id})`);

		// ──────────────────────────────────────────
		// 따라가기 기능: 유저가 새 채널로 이동했을 때 처리
		// ──────────────────────────────────────────
		if (newChannel && newChannel.type === ChannelType.GuildVoice && !newState.member.user.bot) {
			console.log(`🎯 FOLLOW CHECK: User ${user.tag} moved to ${newChannel.name} - checking for followers...`);
			await handleFollowSystem(newState, guild);
		}

		// Redis 키로 guild.id를 추천 (guild.name은 변경 가능)
		const redisKey = guild.id;

		// ───────────────────────────────────
		// 1) "새 채널"이 존재하면 -> 유저가 들어옴 (또는 이동)
		// ───────────────────────────────────
		// if (newChannel && newChannel.type === ChannelType.GuildVoice) {
		// 	// 봇 제외 멤버 수
		// 	const nonBotMembers = newChannel.members.filter(m => !m.user.bot);
		// 	const count = nonBotMembers.size;

		// 	// 인원이 2명 이상이라면 Redis에 저장
		// 	if (count >= 4) {
		// 		await client.redis.set(redisKey, count);
		// 		console.log(`[INFO] '${newChannel.name}' 멤버 수(${count}) → Redis 저장`);
		// 	}
		// 	else {
		// 		// 인원이 1명 이하라면 Redis에서 삭제
		// 		if (await client.redis.exists(redisKey)) {
		// 			await client.redis.del(redisKey);
		// 			console.log(`[INFO] '${newChannel.name}' 멤버 ${count}명 → Redis에서 키(${redisKey}) 삭제`);
		// 		}
		// 	}
		// }

		// ───────────────────────────────────
		// 2) "옛 채널"이 존재하면 -> 유저가 떠남 (또는 이동)
		// ───────────────────────────────────
		if (oldChannel && oldChannel.type === ChannelType.GuildVoice) {
			const nonBotMembers = oldChannel.members.filter(m => !m.user.bot);
			const count = nonBotMembers.size;

			if (count <= 2) {
				// 인원이 2명 이하라면 Redis에서 삭제
				await client.redis.deleteField("players",redisKey);
					console.log(`[INFO] '${oldChannel.name}' 멤버 ${count}명 → Redis에서 키(${redisKey}) 삭제`);
			}
		}

		// ───────────────────────────────────
		// 3) 봇이 음성 채널에 연결 중이면, 0명(또는 n명 이하)이면 봇 퇴장
		// (원한다면 구현)
		// ───────────────────────────────────
		const connection = getVoiceConnection(guild.id);
		// ↑ 상황에 따라 연결 가져오는 방식이 다를 수 있으니 맞춰서 사용
		if (connection) {
			const botChannelId = connection.joinConfig?.channelId;
			const botChannel = guild.channels.cache.get(botChannelId);

			if (botChannel && botChannel.type === ChannelType.GuildVoice) {
				const members = botChannel.members.filter(m => !m.user.bot);
				if (members.size === 0) {
					// 봇 퇴장 처리
					console.log(`봇 퇴장 로직 실행...`);
					connection.destroy();  // 등등
				}
			}
		}
	},
};

/**
 * 따라가기 시스템 처리 함수 (O(1) 최적화)
 * @param {import('discord.js').VoiceState} newState 
 * @param {import('discord.js').Guild} guild 
 */
async function handleFollowSystem(newState, guild) {
	const movedUser = newState.member;
	const targetChannel = newState.channel;
	
	console.log(`📍 FOLLOW SYSTEM: Checking followers for ${movedUser.displayName} (${movedUser.id})`);
	
	try {
		// O(1) Redis 조회: 이 유저를 타깃으로 하는 팔로워들 직접 조회
		const targetKey = `target:${guild.id}:${movedUser.id}`;
		console.log(`🔍 Checking Redis key: ${targetKey}`);
		
		const followers = await redisManager.getValue(targetKey);
		console.log(`📋 Followers data from Redis:`, followers);
		
		if (!followers || !Array.isArray(followers) || followers.length === 0) {
			console.log(`❌ No followers found for ${movedUser.displayName}`);
			return; // 팔로워가 없으면 바로 종료
		}
		
		console.log(`✅ Found ${followers.length} followers: [${followers.join(', ')}]`);
		
		// 배치 조회로 성능 최적화
		const followerKeys = followers.map(id => `follower:${guild.id}:${id}`);
		const followerDataArray = await redisManager.getMultipleValues(followerKeys);
		
		const expiredFollowers = [];
		
		for (let i = 0; i < followers.length; i++) {
			const followerId = followers[i];
			const followerData = followerDataArray[i];
			
			if (!followerData) {
				// 팔로워 데이터가 없으면 (TTL 만료) 목록에서 제거
				expiredFollowers.push(followerId);
				continue;
			}
			
			const follower = guild.members.cache.get(followerId);
			
			if (!follower) {
				// 팔로워가 길드에 없으면 Redis에서 제거
				expiredFollowers.push(followerId);
				const followerKey = `follower:${guild.id}:${followerId}`;
				await redisManager.delete(followerKey); // 개별 데이터도 삭제
				continue;
			}
			
			// 팔로워가 현재 음성 채널에 있는지 확인
			if (follower.voice.channel) {
				try {
					// 팔로워를 타깃의 새 채널로 이동
					await follower.voice.setChannel(targetChannel);
					console.log(`🎯 Follow: ${follower.displayName} → ${targetChannel.name} (following ${movedUser.displayName})`);
				} catch (moveError) {
					console.log(`❌ Follow move failed: ${follower.displayName} → ${targetChannel.name} (${moveError.message})`);
					// 권한 없음, 채널 가득참 등의 경우 무시하고 계속
				}
			}
		}
		
		// 만료된 팔로워들을 타깃 목록에서 제거
		if (expiredFollowers.length > 0) {
			await cleanupExpiredFollowers(guild.id, movedUser.id, expiredFollowers);
		}
	} catch (error) {
		console.error('❌ Follow system error:', error);
	}
}

/**
 * 특정 타깃에서 팔로워 제거 (스노우플레이크 기반 정리)
 * @param {string} guildId 
 * @param {string} targetUserId 
 * @param {string} followerId 
 */
async function removeFollowerFromTarget(guildId, targetUserId, followerId) {
	const targetKey = `target:${guildId}:${targetUserId}`;
	let followers = await redisManager.getValue(targetKey) || [];
	
	const updatedFollowers = followers.filter(id => id !== followerId);
	
	if (updatedFollowers.length === 0) {
		// 팔로워가 없으면 키 삭제
		await redisManager.delete(targetKey);
		console.log(`🗑️ Removed empty target key: ${targetKey}`);
	} else {
		// 업데이트된 팔로워 목록 저장 (TTL 없음)
		await redisManager.setValue(updatedFollowers, NO_TTL, targetKey);
		console.log(`🔄 Updated followers for ${targetKey}: ${updatedFollowers.length} remaining`);
	}
}

/**
 * 만료된 팔로워들을 타깃 목록에서 일괄 제거
 * @param {string} guildId 
 * @param {string} targetUserId 
 * @param {Array<string>} expiredFollowers 
 */
async function cleanupExpiredFollowers(guildId, targetUserId, expiredFollowers) {
	const targetKey = `target:${guildId}:${targetUserId}`;
	let followers = await redisManager.getValue(targetKey) || [];
	
	// 만료된 팔로워들 제거
	const updatedFollowers = followers.filter(id => !expiredFollowers.includes(id));
	
	if (updatedFollowers.length === 0) {
		// 팔로워가 없으면 키 삭제
		await redisManager.delete(targetKey);
		console.log(`🗑️ Removed empty target key after cleanup: ${targetKey}`);
	} else {
		// 업데이트된 팔로워 목록 저장 (TTL 없음)
		await redisManager.setValue(updatedFollowers, 0, targetKey);
		console.log(`🧹 Cleaned up ${expiredFollowers.length} expired followers from ${targetKey}`);
	}
}
