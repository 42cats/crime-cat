const { User, EmbedBuilder } = require("discord.js");
const { getUserRank, getUserPermissons } = require("../api/user/user");

/**
 * 사용자 정보를 기반으로 임베디드 메시지를 생성하는 함수
 * @param {Object} userData - 사용자 정보 객체
 * @param {string} userData.avatarUrl - 사용자의 아바타 URL
 * @param {string} userData.username - 사용자의 글로벌 이름
 * @param {number} userData.points - 사용자의 포인트
 * @param {string} userData.userId - 사용자의 아이디
 * @param {number} userData.playCount - 사용자의 플레이 횟수
 * @param {number} userData.playRank - 사용자의 플레이 횟크
 * @param {number} userData.pointRank - 사용자의 포인트랭크
 * @param {string} userData.themeColor - 임베디드 테마 색상
 * @param {number} userData.totalUsers - 전체유저 수
 * @returns {EmbedBuilder} - 생성된 Discord Embed
 */
async function createUserEmbed(userData) {
	const username = userData.username ?? 'Unknown User';
	const avatarUrl = userData.avatarUrl ?? 'https://cdn.discordapp.com/embed/avatars/0.png';
	const points = userData.points !== undefined ? userData.points.toString() : '0';
	const permissions = await getUserPermissons(userData.userId);
	const playCount = userData.playCount !== undefined ? userData.playCount.toString() : '0';
	const playRank = (userData.playRank !== undefined && userData.playRank > 0) ? userData.playRank.toString() : '-';
	const pointRank = userData.pointRank !== undefined ? userData.pointRank.toString() : '-';
	const totalUsers = userData.totalUsers;
	const themeColor = userData.themeColor ?? "#2C2F33";

	// 권한 처리
	const permissionList = permissions?.permissions ?? [];
	let permissionFieldValue = '없음';
	if (permissionList.length > 0) {
		permissionFieldValue = permissionList
			.map(p => `• ${p.permissionName} (만료일: ${new Date(p.expiredDate).toLocaleDateString('ko-KR')})`)
			.join('\n');
	}

	return new EmbedBuilder()
	.setColor(themeColor)
	.setAuthor({ name: username, iconURL: avatarUrl })
	.setTitle("사용자 정보")
	.addFields(
		// 첫 줄: 포인트 / 플레이 횟수
		{ name: "포인트", value: `\`${points} point\``, inline: true },
		{ name: "플레이 횟수", value: `\`${playCount} 회\``, inline: true },
		{ name: "\u200B", value: "\u200B", inline: true } // 비어있는 필드로 줄 정렬 맞춤
	)
	.addFields(
		// 두 번째 줄: 포인트 랭킹 / 플레이 랭킹
		{ name: "포인트 랭킹", value: `\`${pointRank} \\ ${totalUsers}위\``, inline: true },
		{ name: "플레이 랭킹", value: `\`${playRank} \\ ${totalUsers}위\``, inline: true },
		{ name: "\u200B", value: "\u200B", inline: true }
	)
	.addFields(
		// 세 번째 줄: 전체 너비 권한 목록
		{ name: `🎖️ 보유 권한 (${permissionList.length}개)`, value: permissionFieldValue }
	)
	.setThumbnail(avatarUrl)
	.setFooter({ text: `${username}`, iconURL: avatarUrl });

}

/**
 * 
 * @param {User} user 
 */
async function UserInfoImage(user) {
	try {
		const { point, playtime,playRank,poinRank,totalUsers} = await getUserRank(user.id);
		return await createUserEmbed({
			avatarUrl: user.avatarURL() ?? "https://cdn.discordapp.com/embed/avatars/0.png",
			username: user.globalName ?? user.displayName,
			points: point,
			userId : user.id,
			playCount: playtime,
			playRank: playRank,
			pointRank: poinRank,
			themeColor: "#2C2F33",
			totalUsers
		})
	} catch (error) {
		console.log("image to html error ", error.stack);
	}
}

module.exports = UserInfoImage;