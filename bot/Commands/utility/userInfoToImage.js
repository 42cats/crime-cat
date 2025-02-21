const { getUserInfo, getUserHistory, getUserRank, getUsersInfo } = require("./discord_db");
const { User, EmbedBuilder } = require("discord.js");
const { showPermisson, KO_PERMISSION } = require('./UserGrade');

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
 * @returns {EmbedBuilder} - 생성된 Discord Embed
 */
function createUserEmbed(userData) {
	// Fallback values
	const username = userData.username || 'Unknown User';
	const avatarUrl = userData.avatarUrl || 'https://example.com/default_avatar.png'; // 기본 이미지 URL 설정
	const points = userData.points !== undefined ? userData.points.toString() : '0';
	const permission = userData.permission || 'No Permission';
	const playCount = userData.playCount !== undefined ? userData.playCount.toString() : '0';
	const playRank = (userData.playRank !== undefined && userData.playRank > 0) ? userData.playRank.toString() : '-';
	const pointRank = userData.pointRank !== undefined ? userData.pointRank.toString() : '-';
	const permissionRank = userData.permissionRank !== undefined ? userData.permissionRank.toString() : '-';

	const themeColor = userData.themeColor || "#2C2F33";

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
			{ name: "포인트 랭킹", value: `\`${pointRank} 위\``, inline: true },
			{ name: "권한 랭킹", value: `\`${permissionRank} 위\``, inline: true },
			{ name: "플레이 랭킹", value: `\`${playRank} 위\``, inline: true }
		)
		.setThumbnail(avatarUrl)
		.setFooter({ text: `${username}`, iconURL: avatarUrl });
}
/**
 * 주어진 BigInt 값에서 설정된 비트(1)의 개수를 계산합니다.
 * @param {BigInt} value - 비트마스크 값
 * @returns {number} - 설정된 비트의 수
 */
function countSetBits(value) {
	let bingInt = BigInt(value);
	let count = 0n;
	while (bingInt) {
		count += bingInt & 1n;
		bingInt >>= 1n;
	}
	return Number(count);
}

/**
 * 
 * @param {User} user 
 */
async function UserInfoImage(user) {
	try {
		const { point, grade } = await getUserInfo(user);
		// const history = await getUserHistory(user);
		const rank = await getUserRank();
		const keysArray = Array.from(rank.keys());
		const myRank = keysArray.indexOf(user.id) + 1;
		const usersInfo = await getUsersInfo();
		const pointRnak = usersInfo.sort((a, b) => b.point - a.point).findIndex(v => v.user_id === user.id) + 1;
		const permissionRnak = usersInfo.sort((a, b) => countSetBits(b.grade) - countSetBits(a.grade)).findIndex(v => v.user_id === user.id) + 1;
		const permissions = await showPermisson(user);
		const koPermission = permissions.map(v => KO_PERMISSION[v]);
		return createUserEmbed({
			avatarUrl: user.avatarURL(),
			username: user.globalName || user.displayName,
			points: point,
			permission: `${koPermission.flat()}`,
			playCount: rank.get(user.id),
			playRank: myRank,
			permissionRank: permissionRnak,
			pointRank: pointRnak,
			themeColor: "#2C2F33"
		})
	} catch (error) {
		console.log("image to html error ", error.stack);
	}
}

module.exports = UserInfoImage;