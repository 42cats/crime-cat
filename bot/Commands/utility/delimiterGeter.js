function delimiterGeter(str) {
    // `_` 기준으로 첫 번째 부분과 나머지 부분을 나누기
    const [part1, rest] = str.split('_');
    client
    let part2a = '';
    let part3a = '';
    let part4 = '';
    console.log("rest type ", typeof rest, rest, str);
    // `:`가 있을 경우 rest를 `:` 기준으로 나누기
    if (rest.includes(':')) {
        [part2a, part3a] = rest.split(':');
    } else {
        part2a = rest; // :가 없으면 rest를 그대로 part2a에 할당
    }

    // `?`가 있을 경우 part3a를 `?` 기준으로 나누기
    if (part3a.includes('?')) {
        [part3a, part4] = part3a.split('?');
    } else {
        part4 = part3a; // ?가 없으면 part3a를 그대로 part4에 할당
    }

    return {
        "head": part1,
        "command": part2a,
        "option": part3a,
        "otherOption": part4
    };
}




// 구분자로 사용할 상수들 (각 문자를 encodeURIComponent를 사용해 변환)
const HEAD_SEPARATOR = encodeURIComponent("#");    // "%23"
const COMMAND_SEPARATOR = encodeURIComponent("%"); // "%25"
const OPTION_SEPARATOR = encodeURIComponent("&");  // "%26"

// 동적 인코딩 함수
// head와 command는 필수이며, option과 option2는 선택적으로 추가합니다.
function encodeToString(head, command, option = null, option2 = null) {
    // head와 command 사이에는 HEAD_SEPARATOR를 사용
    let result = `${head}${HEAD_SEPARATOR}${command}`;
    // option이 존재하면 command와 option 사이에 COMMAND_SEPARATOR를 사용
    if (option !== null) {
        result += `${COMMAND_SEPARATOR}${option}`;
    }
    // option2가 존재하면 option과 option2 사이에 OPTION_SEPARATOR를 사용
    if (option2 !== null) {
        result += `${OPTION_SEPARATOR}${option2}`;
    }
    return result;
}

// 동적 디코딩 함수
// 인코딩된 문자열을 각각의 구분자를 기준으로 분리하여 원래 값을 복원합니다.
function decodeFromString(encodedStr) {
    // 1. head와 나머지 분리: head와 (command+option들)을 구분
    const parts = encodedStr.split(HEAD_SEPARATOR);
    const head = parts[0] || '';
    const rest = parts[1] || '';

    // 2. command와 option 부분 분리: command와 나머지 옵션 문자열 분리
    const commandParts = rest.split(COMMAND_SEPARATOR);
    const command = commandParts[0] || '';
    let option = null;
    let otherOption = null;

    // 3. 옵션 문자열이 있다면 option과 option2로 나누기
    if (commandParts.length > 1) {
        const optionPart = commandParts[1];
        const optionParts = optionPart.split(OPTION_SEPARATOR);
        option = optionParts[0] || null;
        if (optionParts.length > 1) {
            otherOption = optionParts[1] || null;
        }
    }

    return { head, command, option, otherOption };
}
const { v4: uuidv4 } = require('uuid');

/**
 * 객체를 Redis에 저장하고 UUID를 반환하는 함수
 * UUID를 먼저 반환하고 Redis 저장을 비동기 처리하며 TTL 설정 가능
 */
async function redisSetKey(redisClient, dataObject, ttl = 3600 * 24) { // 기본 TTL: 3600 * 24 초 (24시간)
    if (!redisClient || typeof redisClient.set !== 'function') {
        console.error("❌ Invalid Redis client provided to redisSetKey");
        throw new Error("Invalid Redis client");
    }

    const uuid = uuidv4();

    try {
        // Redis에 비동기 저장 + TTL 설정 (기본 1시간)
        await redisClient.setEx(uuid, ttl, JSON.stringify(dataWithTimestamp));
        console.log(`✅ Data stored in Redis with UUID: ${uuid} (TTL: ${ttl}s)`);
    } catch (error) {
        console.error(`❌ Redis set error: ${error}`);
    }

    return uuid;
}


/**
 * UUID를 사용하여 Redis에서 객체를 가져오는 함수
 */
async function redisGetKey(redisClient, uuid) {
    if (!redisClient || typeof redisClient.get !== 'function') {
        console.error("❌ Invalid Redis client provided to redisGetKey");
        throw new Error("Invalid Redis client");
    }

    try {
        const jsonData = await redisClient.get(uuid);
        if (!jsonData) {
            console.log(`⚠️ No data found for UUID: ${uuid}`);
            return null;
        }

        console.log(`✅ Data retrieved from Redis: ${jsonData}`);
        return JSON.parse(jsonData);
    } catch (error) {
        console.error(`❌ Redis get error: ${error}`);
        return null;
    }
}

module.exports = {
    delimiterGeter,
    encodeToString,
    decodeFromString,
    redisSetKey,
    redisGetKey
};
