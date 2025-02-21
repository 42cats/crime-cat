// discord_db.js

const {
	User: DbUser,
	Guild,
	History,
	sequelize,
	GuildURL,
	Clean,
	Characters,
	UserURL,
	Record
} = require('./db');
const { User: DiscordUser, Guild: DiscordGuild } = require('discord.js');
const { Op } = require('sequelize');


//히스토리에 유저추가

/**
 * 길드 참여 기록을 History 테이블에 저장하는 함수
 * 
 * @param {import('discord.js').Guild} guild - Discord 길드 객체
 * @param {import('discord.js').User} user - Discord 유저 객체
 * @param {boolean} isWin - 승리 여부 (기본값: false)
 */
async function addHistoryRecord(guild, user, isWin = false) {
    try {
        // 기존 기록이 있는지 확인
        const existingRecord = await History.findOne({
            where: { guild_id: guild.id, user_id: user.id },
        });

        if (existingRecord) {
            console.log(`⚠️ 이미 기록된 유저 (${user.id}) - 길드 (${guild.id})`);
            return false;
        }

        // 새 기록 추가
        await History.create({
            user_id: user.id,
            guild_id: guild.id,
            is_win: isWin,
            created_at: new Date(),
        });

        console.log(`✅ 기록 추가: 유저(${user.id}) - 길드(${guild.id})`);
        return true;
    } catch (error) {
        console.error(`❌ addHistoryRecord 오류:`, error);
    }
}


/**
 * 
 * @param {DiscordUser} user 
 */
async function getUsersInfo() {
	const target = await DbUser.findAll();
	return target.map(v=>v.dataValues);
}

/**
 * 
 * @param {DiscordUser} user 
 */
async function getUserInfo(user) {
	const { id } = user;
	const target = await findUser(user)
	return target.dataValues;
}

/**
 * 
 * @param {DiscordUser} user 
 */
async function getUserHistory(user) {
	const { id } = user;
	const history = await History.findAll({ where: { user_id: id } });
	return history;
}
/**
 * 
 * @param {DiscordUser} user 
 * @returns {Map}
 */
async function getUserRank() {
		const allRank = (await History.findAll()).map(v=>v.dataValues);
		const userIdCounts = new Map();

		// 배열을 순회하며 user_id의 출현 횟수 계산
		allRank.forEach((item) => {
			const userId = item.user_id;
			if (userId) {
				userIdCounts.set(userId, (userIdCounts.get(userId) || 0) + 1);
			}
		});
	
		// Map을 배열로 변환하여 [user_id, count] 쌍의 배열 생성
		const sortedUserIdCounts = Array.from(userIdCounts.entries());
	
		// count를 기준으로 내림차순 정렬
		sortedUserIdCounts.sort((a, b) => b[1] - a[1]);
	
		// 정렬된 배열을 다시 Map 객체로 변환하여 반환
		return new Map(sortedUserIdCounts);
}
// 캐릭터 추가
async function addCharacterName(guildId, characterName, role = null) {
	try {
		const isAlready = await Characters.findOne({ where: { guild_id: guildId, character_name: characterName } });
		if (isAlready) return false;
		// if (isAlready) return "❌ 이미 추가된 캐릭터 이름입니다.";
		await Characters.upsert({
			guild_id: guildId,          // 문자열
			character_name: characterName,
			role_id: role
		});
		return true;
		// return `\`\`\`${characterName}을 캐릭터셋에 추가하였습니다.\`\`\``;
	} catch (error) {
		console.error('Error processing addCharacterName :', error);
		const errorMessage = error.message || 'Unknown error occurred.';
		throw Error(`❌ ${errorMessage} `);
	}
}

// 캐릭터 조회
async function getCharacterName(guildId) {
	try {
		return await Characters.findAll({
			where: { guild_id: guildId }, // 조건:              문자열
			attributes: ['character_name', 'role_id'],
		});
	}
	catch (e) {
		console.log(e.stack);
	}
}

// 캐릭터 삭제
async function deleteCharacterName(guildId, characterName) {
	try {
		const rowsDeleted = await Characters.destroy({
			where: {
				guild_id: guildId,
				character_name: characterName,
			},
		});
		if (rowsDeleted > 0) {
			return `✅ 캐릭터 ${characterName}이 제거되었습니다.`;
		} else {
			return `⚠️ 제거할 데이터가 없습니다.`;
		}
	} catch (error) {
		console.error('Error deleting characterName:', error);
		throw Error(`❌ ${error.message} `);
	}
}

// 삭제 채널 제거
async function delDeleteChannel(guildId, channelId) {
	try {
		await Clean.destroy({
			where: {
				guild_id: guildId,
				channel_id: channelId,
			}
		});
		return `✅ 제거됨`;
	} catch (error) {
		console.error('Error processing delDeleteChannel :', error);
		throw Error(`❌ ${error.message} `);
	}
}

// 삭제 채널 추가
async function addDeleteChannel(guildId, channelId) {
	try {
		await Clean.upsert({
			guild_id: guildId,
			channel_id: channelId
		});
		return `✅ 추가됨`;
	} catch (error) {
		console.error('Error processing addDeleteChannel :', error);
		throw Error(`❌ ${error.message} `);
	}
}

// 삭제 채널 목록 조회
async function getDeleteChannel(guildId) {
	try {
		// 주의: findAll() 할 때 조건(where)을 빼먹으면 전체가 조회됨
		const list = await Clean.findAll({
			where: { guild_id: guildId },
		});
		return list;
	} catch (error) {
		console.error('Error getDeleteChannel :', error);
		throw Error(`❌ ${error.message} `);
	}
}
//history 에서 기록찾기

/**
 * 
 * @param {DiscordGuild} targetGuild 
 * @param {DiscordUser} targetUser 
 */
async function findHistory(targetUser) {
	const { id: user_id } = targetUser;
	try {
		const target = await History.findAll({ where: { user_id } });
		return target;
	}
	catch (e) {
		console.log("find history error in discord_db", e.stack);
	}
}

// 특정 Guild URL 삭제
async function deleteUrl(owner_id, title) {
	try {
		await GuildURL.destroy({
			where: {
				owner_id,
				title,
			}
		});
		console.log('삭제 완료 또는 삭제할 데이터가 없습니다.');
	} catch (error) {
		console.error('데이터 삭제 중 에러 발생:', error);
	}
}

/**
 * @param {User} user 
 */
async function findUser(user) {
	const { id, bot, username } = user;
	if (bot) return;

	let transaction;
	try {
		transaction = await sequelize.transaction();

		// 트랜잭션을 포함해서 조회
		let targetUser = await DbUser.findOne({
			where: { user_id: id },
			transaction
		});

		if (!targetUser) {
			const now = new Date();
			// upsert 결과가 [instance, created] 형태라면 구조분해 할당
			const [instance, created] = await DbUser.upsert(
				{
					user_id: id,
					name: username,
					auth_token: null,    // 필요하다면 토큰 할당
					last_play_date: null,
					last_online: now,
					created_at: now
				},
				{ transaction, returning: true }
			);
			targetUser = instance;
		}

		await transaction.commit();
		return targetUser;

	} catch (error) {
		if (transaction) await transaction.rollback();
		console.log("user find func in discord_db", error.stack);
		throw error; // 에러를 호출한 곳에서 처리할 수 있도록 다시 throw
	}
}


// === 유저 추가 (Discord.js User 객체 -> DB) ===
/**
 * @param {DiscordUser} user 
 */
async function addUser(user) {
	const { id, bot, username } = user; // Discord에서 온 user.id는 문자열
	if (bot) return; // 봇 계정은 스킵

	const transaction = await sequelize.transaction();
	try {
		// user_id = user.id (문자열)
		const existingUser = await DbUser.findOne({ where: { user_id: id }, transaction });
		const now = new Date();
		if (!existingUser) {
			await DbUser.upsert({
				user_id: id,
				name: username,      // 새로 추가된 name 열
				auth_token: null,    // 필요하다면 토큰 할당
				last_play_date: now,
				last_online: now,
				created_at: now
			}, { transaction });
			await transaction.commit();
			console.log("add user complete");
		} else {
			await transaction.commit();
			console.log("이미 존재하는 유저입니다.");
		}
	} catch (e) {
		if (transaction) await transaction.rollback();
		console.error("Db addUser = ", e.stack);
	}
}
/**
 * 사용자의 포인트를 업데이트합니다.
 * @param {DiscordUser} user - Discord 사용자 객체
 * @param {number} newPoint - 새로운 포인트 값
 * @returns {Promise<boolean>} - 업데이트 성공 여부
 */
async function updatePoint(user, newPoint) {
    const { id } = user;
    let transaction;

    try {
        transaction = await sequelize.transaction();

        const target = await DbUser.findOne({ where: { user_id: id }, transaction });
        if (!target) {
            return false;
        }

        await target.update({ point: newPoint }, { transaction });
        await transaction.commit();
        return true;
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Error updating user point:', error);
        return false;
    }
}
// === Discord Guild -> 유저 DB 삽입 ===
async function insertUserInDb(discordUser) {
	try {
		// 이 함수 내부는 Guild 객체가 아니라, "User"를 삽입하는 용도로 보이는 예시.
		// 필요하다면 변경. 현재는 예시만 살려둠
		await DbUser.upsert({
			user_id: discordUser.id, // 문자열
			name: discordUser.name || null,
			created_at: discordUser.createdAt
		});
		console.log("User data inserted/updated successfully.");
	} catch (err) {
		console.error("Error inserting User:", err);
	}
}

// 길드/유저 히스토리 추가
async function inserteGuildHistory(params) {
	try {
		const { user_id, guild_id, created_at } = params;
		await History.create({
			user_id,
			guild_id,
			is_win: false,
			created_at,
		});
		console.log("Guild and User History data inserted/updated successfully.");
	} catch (err) {
		console.error("Error inserting guild:", err);
	}
}

/**
 * 하나의 함수에서:
 *   1. 길드 DB 입력/갱신 (insertGuildFromDiscord)
 *   2. 길드 오너 유저 DB 입력/갱신 (addUser)
 *   3. 길드 멤버 DB 입력/갱신 (insertUsersFromDiscordGuild)
 *   4. 히스토리 DB 입력 (insertHistoryForGuildMembers)
 * 
 * 단, 트랜잭션을 분리해서 단계별로 수행.
 */
async function processGuildAndUsersWithHistory(client, discordGuild, isWin = false) {
	console.log("db 생성 시작");
	try {
		// (1) 길드 오너(User) DB 삽입/업서트 (별도 트랜잭션)
		{
			const guildOwner = await client.users.fetch(discordGuild.ownerId);
			const transaction = await sequelize.transaction();
			try {
				await addUser(guildOwner, transaction);
				await transaction.commit();
				console.log("[2] Guild owner inserted/updated successfully.");
			} catch (err) {
				await transaction.rollback();
				throw err;
			}
		}
		// (2) 길드 정보 삽입/업서트 (별도 트랜잭션)
		{
			const transaction = await sequelize.transaction();
			try {
				await insertGuildFromDiscord(discordGuild, transaction);
				await transaction.commit();
				console.log("[1] Guild data inserted/updated successfully.");
			} catch (err) {
				await transaction.rollback();
				throw err; // 상위 try-catch로 던짐
			}
		}


		// (3) 길드 멤버 전체 DB 삽입/업서트 (별도 트랜잭션)
		{
			const transaction = await sequelize.transaction();
			try {
				await insertUsersFromDiscordGuild(discordGuild, transaction);
				await transaction.commit();
				console.log("[3] Guild members inserted/updated successfully.");
			} catch (err) {
				await transaction.rollback();
				throw err;
			}
		}

		// (4) 히스토리 기록 (별도 트랜잭션)
		{
			const transaction = await sequelize.transaction();
			try {
				await insertHistoryForGuildMembers(discordGuild, isWin, transaction);
				await transaction.commit();
				console.log("[4] Guild history inserted/updated successfully.");
			} catch (err) {
				await transaction.rollback();
				throw err;
			}
		}

		console.log("All records processed successfully (guild, owner, members, history).");
	} catch (err) {
		console.error("Error in processGuildAndUsersWithHistory:", err);
	}
}
// (예시) 길드 정보 삽입 함수
async function insertGuildFromDiscord(discordGuild, transaction = null) {
	try {
		// 오너의 이름을 저장하기 위해, ownerId를 이용하여 DiscordUser 가져오기
		// (guild_owner_name 필드에 넣기 위함)
		const guildOwner = await discordGuild.client.users.fetch(discordGuild.ownerId);
		await Guild.upsert({
			guild_id: discordGuild.id,
			owner_id: discordGuild.ownerId,
			guild_name: discordGuild.name,               // 길드 이름
			guild_owner_name: guildOwner.username,       // 길드 오너 표시용 이름
			last_play_date: null,
			created_at: discordGuild.joinedTimestamp
		}, { transaction });

		console.log("Guild data inserted/updated successfully.");
	} catch (err) {
		console.error("Error inserting guild:", err);
		throw err;
	}
}

// (예시) 길드 멤버 전체를 User 테이블에 삽입/갱신
async function insertUsersFromDiscordGuild(discordGuild, transaction = null) {
	try {
		const members = await discordGuild.members.fetch();
		for (const [memberId, member] of members) {
			// 봇이면 스킵할 수도 있음(원하면 로직 추가)
			if (member.user.bot) continue;
			const existingUser = await DbUser.findOne({ where: { user_id: memberId }, transaction });
			if (!existingUser) {
				await DbUser.upsert({
					user_id: memberId,
					name: member.user.username,
					auth_token: null,
					created_at: member.joinedAt || new Date(),
				}, { transaction });
			}
		}
		console.log("Guild members inserted/updated successfully.");
	} catch (err) {
		console.error("Error inserting users from guild:", err);
		throw err;
	}
}

// (예시) 히스토리 기록 함수
async function insertHistoryForGuildMembers(discordGuild, isWin = false, transaction = null) {
	try {
		const members = await discordGuild.members.fetch();
		for (const [memberId, member] of members) {
			// 어드민, 오너 제외 등 로직
			if (member.permissions.has("Administrator")) continue;
			if (member.user.bot) continue;
			if (memberId === discordGuild.ownerId) continue;
			await ensureUserExists(memberId, member.user.username);
			const existingHistory = await History.findOne({
				where: { user_id: memberId, guild_id: discordGuild.id },
				transaction
			});
			if (!existingHistory) {
				await History.create({
					user_id: memberId,
					guild_id: discordGuild.id,
					is_win: isWin,
					created_at: member.joinedAt || new Date()
				}, { transaction });
			}
		}
		console.log("History records inserted/updated, excluding admins & owner.");
	} catch (err) {
		console.error("Error inserting history:", err);
		throw err;
	}
}
// ensureUserExists 함수
async function ensureUserExists(userId, username, transaction = null) {
	const user = await DbUser.findOne({ where: { user_id: userId }, transaction });
	if (!user) {
		const now = new Date();
		await DbUser.create(
			{
				user_id: userId,
				name: username,
				created_at: now,
			},
			{ transaction }
		);
	}
}

module.exports = {
	processGuildAndUsersWithHistory,
	insertGuildFromDiscord,
	insertHistoryForGuildMembers,
	insertUsersFromDiscordGuild,
	insertUserInDb,
	inserteGuildHistory,
	deleteUrl,
	addDeleteChannel,
	getDeleteChannel,
	addCharacterName,
	deleteCharacterName,
	getCharacterName,
	addUser,
	delDeleteChannel,
	findUser,
	findHistory,
	getUserInfo,
	getUsersInfo,
	getUserHistory,
	updatePoint,
	getUserRank,
	addHistoryRecord
};
