const { User, EmbedBuilder } = require("discord.js");
const { getUserRank } = require("../api/user/user");

/**
 * 사용자 정보를 기반으로 임베디드 메시지를 생성하는 함수
 * @param {Object} userData - 사용자 정보 객체
 * @param {string} userData.avatarUrl - 사용자의 아바타 URL
 * @param {string} userData.username - 사용자의 글로벌 이름
 * @param {number} userData.points - 사용자의 포인트
 * @param {string} userData.permission - 사용자의 권한
 * @param {number} userData.playCount - 사용자의 플레이 횟수
 * @param {number} userData.playRank - 사용자의 플레이 횟수
 * @param {number} userData.permissionRank - 사용자의 플레이 횟수
 * @param {number} userData.pointRank - 사용자의 플레이 횟수
 * @param {string} userData.themeColor - 임베디드 테마 색상
 * @param {number} userData.totalUsers - 사용자의 플레이 횟수
 * @returns {EmbedBuilder} - 생성된 Discord Embed
 */
function createUserEmbed(userData) {
	// Fallback values
	const username = userData.username ?? 'Unknown User';
	const avatarUrl = userData.avatarUrl ?? 'https://cdn.discordapp.com/embed/avatars/0.png'; // 기본 이미지 URL 설정
	const points = userData.points !== undefined ? userData.points.toString() : '0';
	const permission = userData.permission ?? 'No Permission';
	const playCount = userData.playCount !== undefined ? userData.playCount.toString() : '0';
	const playRank = (userData.playRank !== undefined && userData.playRank > 0) ? userData.playRank.toString() : '-';
	const pointRank = userData.pointRank !== undefined ? userData.pointRank.toString() : '-';
	const permissionRank = userData.permissionRank !== undefined ? userData.permissionRank.toString() : '-';
	const totalUsers = userData.totalUsers;
	const themeColor = userData.themeColor ?? "#2C2F33";

	return new EmbedBuilder()
		.setColor(themeColor)
		.setAuthor({ name: username, iconURL: avatarUrl })
		.setTitle("사용자 정보")
		.addFields(
			{ name: "포인트", value: `\`${points} point\``, inline: true },
			{ name: "권한", value: `\`${permission}\``, inline: true },
			{ name: "플레이 횟수", value: `\`${playCount} 회\``, inline: true },
		)
		.addFields(
			{ name: "포인트 랭킹", value: `\`${pointRank} \\ ${totalUsers}위\``, inline: true },
			{ name: "플레이 랭킹", value: `\`${playRank} \\ ${totalUsers}위\``, inline: true }
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
		return createUserEmbed({
			avatarUrl: user.avatarURL() ?? "https://cdn.discordapp.com/embed/avatars/0.png",
			username: user.globalName ?? user.displayName,
			points: point,
			permission: `none`,
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