const { findUser } = require("../utility/discord_db");
const { User } = require("./db");
const { User: DiscordUser } = require("discord.js");
const USER_PERMISSION = {
  NONE: 0n,
  URL_UNLIMIT: 1n, // 2^0 = 1
  OBSERVER: 2n, // 2^1 = 2
  AUDIO_BIT_RATE: 4n, // 2^2 = 4
  // AUTO_CLEAN: 8n,       // 2^3 = 8
  ADD_GUILD_ABLE: 16n, // 2^4 = 16
  LOCAL_MUSIC: 32n, // 2^5 = 32
  LOCAL_MUSIC_UP: 64n,
};
const PRICE_PERMISSION = {
  URL_UNLIMIT: 1000,
  OBSERVER: 1000,
  AUDIO_BIT_RATE: 1500,
  // AUTO_CLEAN: 1000,
  LOCAL_MUSIC: 2000,
  LOCAL_MUSIC_UP: 2000,
};
const KO_PERMISSION = {
  URL_UNLIMIT: "무제한 유튜브 링크 추가", // 2^0 = 1
  OBSERVER: "관전명령 사용", // 2^1 = 2
  AUDIO_BIT_RATE: "고음질 음악플레이", // 2^2 = 4
  // AUTO_CLEAN: "자동 청소기능",       // 2^3 = 8
  ADD_GUILD_ABLE: "길드 추가", // 2^4 = 16
  LOCAL_MUSIC: "음악파일 저장및 플레이(100MB)",
  LOCAL_MUSIC_UP: "음악파일 저장및 플레이(200MB)",
};
/**
 *
 * @param {DiscordUser} user
 */
async function getUserGrade(user) {
  const { id } = user;
  const target = await findUser(user);
  const { grade } = target.dataValues;
  return grade;
}
/**
 *
 * @param {DiscordUser} target
 * @param {USER_PERMISSION} permission
 */
async function hasPermission(target, permission) {
  const targetGrade = await getUserGrade(target);
  return (BigInt(targetGrade) & permission) !== 0n;
}
/**
 * 사용자의 권한을 설정합니다. (트랜잭션 지원)
 * @param {DiscordUser} target - 대상 사용자
 * @param {USER_PERMISSION} permission - 부여할 권한
 * @param {Object} [transaction=null] - Sequelize 트랜잭션 객체 (선택 사항)
 * @returns {Promise<boolean>} - 성공 여부
 */
async function setPermisson(target, permission, transaction = null) {
  try {
    const { id, username } = target;
    let findOne = await User.findOne({ where: { user_id: id } });

    if (!findOne) {
      const now = new Date();
      await User.upsert(
        {
          user_id: id,
          name: username,
          auth_token: null,
          last_play_date: null,
          last_online: now,
          created_at: now,
          grade: permission,
        },
        { transaction } // 트랜잭션 적용
      );
      return true;
    }

    // 기존 권한과 새로운 권한을 합산하여 업데이트
    console.log(
      "basic grade ",
      findOne.grade,
      findOne.dataValues.grade | permission,
      typeof permission,
      USER_PERMISSION[permission]
    );
    await findOne.update(
      { grade: BigInt(findOne.dataValues.grade) | USER_PERMISSION[permission] },
      { transaction } // 트랜잭션 적용
    );

    return true;
  } catch (e) {
    console.error("setPermission error:", e.stack);
    return false;
  }
}

/**
 *
 * @param {DiscordUser} target
 * @param {USER_PERMISSION} permission
 */
async function delPermisson(target, permission) {
  try {
    const { id, username } = target;
    let findOnde = await User.findOne({ where: { user_id: id } });
    if (!findOnde) {
      const now = new Date();
      await User.upsert({
        user_id: id,
        name: username,
        auth_token: null, // 필요하다면 토큰 할당
        last_play_date: null,
        last_online: now,
        created_at: now,
        grade: USER_PERMISSION.NONE,
      });
      return true;
    }
    await findOnde.update({
      grade: findOnde.grade & ~permission,
    });
    return true;
  } catch (e) {
    console.log("delPermission error = ", e.stack);
    return false;
  }
}

/**
 * 특정 유저가 가진 권한을 문자열 배열로 반환
 * @param {DiscordUser} user
 * @returns {Promise<string[]>} 유저가 가진 권한 목록
 */
async function showPermisson(user) {
  try {
    const userGrade = BigInt(await getUserGrade(user));
    if (userGrade === USER_PERMISSION.NONE) return ["없음"];
    const permissions = [];
    console.log("user grade = ", userGrade, USER_PERMISSION.NONE);
    // 각 권한을 검사하여 해당 권한이 있는 경우 배열에 추가
    for (const [key, value] of Object.entries(USER_PERMISSION)) {
      if ((userGrade & value) !== 0n) {
        permissions.push(key);
      }
    }

    return permissions;
  } catch (e) {
    console.log("showPermisson error = ", e.stack);
    return [];
  }
}

/**
 * Retrieves the permissions a user does not have and their corresponding prices.
 * @param {DiscordUser} user - The Discord user object.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of objects, each containing a permission name and its price.
 */
async function getPermissionPrice(user) {
  try {
    // Get the user's current grade
    const userGrade = BigInt(await getUserGrade(user));
    // Initialize an array to hold missing permissions and their prices
    const missingPermissions = [];
    // Iterate over all defined permissions
    for (const [permissionName, permissionValue] of Object.entries(
      USER_PERMISSION
    )) {
      // Check if the user lacks this permission
      if ((userGrade & permissionValue) === 0n) {
        // Retrieve the price for this permission
        const price = PRICE_PERMISSION[permissionName];
        // If a price is defined, add the permission and its price to the array
        if (price !== undefined) {
          const translate = KO_PERMISSION[permissionName];
          missingPermissions.push({
            permission: `${translate} [${price}]`,
            permissionName,
          });
        }
      }
    }
    return missingPermissions;
  } catch (error) {
    console.error("Error in getMissingPermissionsWithPrices:", error.stack);
    return [];
  }
}

module.exports = {
  getUserGrade,
  setPermisson,
  delPermisson,
  showPermisson,
  hasPermission,
  getPermissionPrice,
  PRICE_PERMISSION,
  USER_PERMISSION,
  KO_PERMISSION,
};
