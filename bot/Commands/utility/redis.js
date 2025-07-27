const redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
dotenv.config();
const redisHost = process.env.REDIS_HOST;

class RedisManager {
	constructor() {
		if (!RedisManager.instance) {
			this.client = redis.createClient({
				socket: {
					host: redisHost, // Redis 컨테이너 이름 또는 호스트
					port: 6379,    // Redis 기본 포트
				},
			});

			// 에러 핸들링
			this.client.on('error', (err) => console.error('Redis Client Error:', err));

			RedisManager.instance = this;
		}
		return RedisManager.instance;
	}

	async connect() {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
				console.log('✅ Redis connected');
			}
		} catch (error) {
			console.error('❌ Failed to connect to Redis:', error);
		}
	}
	async exists(key) {
		try {
			const result = await this.client.exists(key);
			return result === 1; // 1이면 존재, 0이면 존재하지 않음
		} catch (error) {
			console.error('❌ Redis EXISTS Error:', error);
			return false;
		}
	}

	async setValue(dataObject, ttl = 3600 * 24, key = null) { // 기본 TTL: 3600 * 24 초 (24시간)
		if (!this.client || typeof this.client.set !== 'function') {
			console.error("❌ Invalid Redis client provided to redisSetKey");
			throw new Error("Invalid Redis client");
		}
		if (key === null)
			key = uuidv4();

		try {
			if (ttl === 0) {
				// TTL이 0이면 무제한 저장 (PERSIST 효과)
				await this.client.set(key, JSON.stringify(dataObject));
				console.log(`✅ Data stored in Redis with key: ${key} (TTL: unlimited)`);
			} else {
				// TTL이 있으면 setEx 사용
				await this.client.setEx(key, ttl, JSON.stringify(dataObject));
				console.log(`✅ Data stored in Redis with key: ${key} (TTL: ${ttl}s)`);
			}
		} catch (error) {
			console.error(`❌ Redis set error: ${error}`);
		}

		return key;
	}

	async getValue(key) {
		if (!this.client || typeof this.client.get !== 'function') {
			console.error("❌ Invalid Redis client provided to redisGetKey");
			throw new Error("Invalid Redis client");
		}

		try {
			// 키의 데이터 타입 확인
			const type = await this.client.type(key);

			if (type === "hash") {
				// Hash 타입이면 hGetAll 사용
				const hashData = await this.client.hGetAll(key);
				console.log(`✅ Hash data retrieved from Redis: ${JSON.stringify(hashData)}`);
				return Object.keys(hashData).length ? hashData : null;
			} else if (type === "string") {
				// String 타입이면 기존 로직 유지
				const jsonData = await this.client.get(key);
				if (!jsonData) {
					return null;
				}
				// console.log(`✅ String data retrieved from Redis: ${jsonData}`);
				return JSON.parse(jsonData);
			} else {
				console.warn(`⚠️ Unsupported Redis data type (${type}) for key: ${key}`);
				return null;
			}
		} catch (error) {
			console.error(`❌ Redis get error: ${error}`);
			return null;
		}
	}


	async delete(key) {
		try {
			await this.client.del(key);
			console.log(`🗑 Deleted key: ${key}`);
		} catch (error) {
			console.error('❌ Redis DELETE Error:', error);
		}
	}

	async disconnect() {
		try {
			await this.client.quit();
			console.log('🚪 Redis disconnected');
		} catch (error) {
			console.error('❌ Redis Disconnect Error:', error);
		}
	}

	/**
	 * 원자적 카운터 증가 (Hash 필드)
	 * @param {string} key Redis 키
	 * @param {string} field Hash 필드 (사용자 이름)
	 * @param {number} increment 증가값 (기본값: 1)
	 * @param {number} ttl TTL (기본값: 24시간)
	 * @returns {number} 증가 후 값
	 */
	async incrementHashCounter(key, field, increment = 1, ttl = 3600 * 24) {
		try {
			// HINCRBY는 원자적 연산
			const newValue = await this.client.hIncrBy(key, field, increment);
			
			// TTL 설정 (키가 새로 생성되었을 때만)
			const keyExists = await this.client.exists(key);
			if (keyExists === 1) {
				await this.client.expire(key, ttl);
			}
			
			console.log(`✅ Atomic counter incremented: ${key}.${field} = ${newValue}`);
			return newValue;
		} catch (error) {
			console.error('❌ Redis HINCRBY Error:', error);
			throw error;
		}
	}

	/**
	 * Hash의 모든 카운터 값 가져오기
	 * @param {string} key Redis 키
	 * @returns {Object} 필드별 카운트 객체
	 */
	async getHashCounters(key) {
		try {
			const data = await this.client.hGetAll(key);
			
			// 숫자로 변환
			const counters = {};
			for (const [field, value] of Object.entries(data)) {
				counters[field] = parseInt(value) || 0;
			}
			
			return counters;
		} catch (error) {
			console.error('❌ Redis HGETALL Error:', error);
			return {};
		}
	}

	async setHash(key, field, value, ttl = 3600 * 24) {
		try {
			if (typeof value === 'object') value = JSON.stringify(value);
			await this.client.hSet(key, field, value);
			await this.client.expire(key, ttl); // TTL 설정
			console.log(`✅ Hash set: ${key} -> ${field} (TTL: ${ttl}s)`);
		} catch (error) {
			console.error('❌ Redis HSET Error:', error);
		}
	}

	async getHash(key, field) {
		try {
			const data = await this.client.hGet(key, field);
			return data ? JSON.parse(data) : null;
		} catch (error) {
			console.error('❌ Redis HGET Error:', error);
			return null;
		}
	}
	async getAllHashFields(key) {
		try {
			const data = await this.client.hGetAll(key);
			if (Object.keys(data).length === 0) return null; // 데이터가 없을 경우 null 반환

			// JSON 데이터 파싱 (필드 값이 JSON 문자열인 경우)
			for (const field in data) {
				try {
					data[field] = JSON.parse(data[field]);
				} catch (e) {
					// JSON 변환이 불가능하면 그대로 둠
				}
			}

			// console.log(`✅ Retrieved all fields from Redis Hash: ${key}`);
			return data;
		} catch (error) {
			console.error('❌ Redis HGETALL Error:', error);
			return null;
		}
	}
	async updateArrayInHashSet(key, field, newValue, ttl = 3600 * 24) {
		try {
			let existingData = await this.getHash(key, field);

			// 기존 데이터가 `null`, `undefined`, 또는 `배열이 아닌 경우` → 빈 배열로 초기화
			if (!existingData || !Array.isArray(existingData)) existingData = [];

			// 중복 제거를 위해 Map 사용 (ID 기준)
			const uniqueData = new Map(existingData.map(item => [item.id, item]));

			if (!uniqueData.has(newValue.id)) {
				uniqueData.set(newValue.id, newValue);
			}

			// 업데이트된 데이터 저장
			const updatedData = Array.from(uniqueData.values());
			console.log("update data ", updatedData);
			await this.setHash(key, field, updatedData, ttl);

			// 저장된 데이터 확인 로그 추가
			const checkStoredData = await this.getHash(key, field);
			console.log(`✅ Redis에 저장된 데이터: ${JSON.stringify(checkStoredData)}`);
			return updatedData;

		} catch (error) {
			console.error('❌ Redis Update Error:', error);
		}
	}
	async updateArrayInHash(key, field, newValue, ttl = 3600 * 24) {
		try {
			let existingData = await this.getHash(key, field);

			// 기존 데이터가 `null`, `undefined`, 또는 `배열이 아닌 경우` → 빈 배열로 초기화
			if (!existingData || !Array.isArray(existingData)) existingData = [];

			// 중복 제거를 위해 Map 사용 (ID 기준)


			// 업데이트된 데이터 저장
			const updatedData = [...existingData, newValue];
			console.log("update data ", updatedData);
			await this.setHash(key, field, updatedData, ttl);

			// 저장된 데이터 확인 로그 추가
			const checkStoredData = await this.getHash(key, field);
			console.log(`✅ Redis에 저장된 데이터: ${JSON.stringify(checkStoredData)}`);
			return updatedData;

		} catch (error) {
			console.error('❌ Redis Update Error:', error);
		}
	}


	async deleteField(key, field) {
		try {
			await this.client.hDel(key, field);
			console.log(`🗑 Deleted field: ${field} from ${key}`);
		} catch (error) {
			console.error('❌ Redis DELETE Error:', error);
		}
	}

	/**
	 * 여러 키를 한 번에 조회 (MGET)
	 * @param {Array<string>} keys 조회할 키 배열
	 * @returns {Array} 조회 결과 배열 (null 포함)
	 */
	async getMultipleValues(keys) {
		try {
			if (keys.length === 0) return [];
			
			const values = await this.client.mGet(keys);
			return values.map(value => {
				if (value === null) return null;
				try {
					return JSON.parse(value);
				} catch (e) {
					return value; // JSON이 아니면 원본 반환
				}
			});
		} catch (error) {
			console.error('❌ Redis MGET Error:', error);
			return new Array(keys.length).fill(null);
		}
	}

	async getNowPlaying(client) {
		const maps = await this.getValue("nowPlaying");
		const gamePlayGuildList = [];
		if (maps) {
			for (const [guildId, userNames] of Object.entries(maps)) {
				const guild = client.guilds.cache.get(guildId);
				const channelName = guild ? guild.name : "Unknown Guild";

				if (userNames.length > 3) {
					gamePlayGuildList.push(`Now!! ${channelName}`);
				}
			}
		}
		return gamePlayGuildList;
	}

	/**
	 * 통합 Pub/Sub 시스템과 연동 (기존 Pub/Sub 기능 제거됨)
	 * Sleep Timer 기능은 UnifiedPubSubManager에서 처리
	 */
	getDeprecatedPubSubMessage() {
		console.log('🔄 Redis Manager의 Pub/Sub 기능이 UnifiedPubSubManager로 이전되었습니다.');
		console.log('📢 Sleep Timer 기능은 통합 시스템에서 자동으로 처리됩니다.');
	}
}

// 싱글턴 인스턴스 생성
const redisManager = new RedisManager();
module.exports = redisManager;
