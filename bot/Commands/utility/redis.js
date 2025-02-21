const redis = require('redis');

// Redis 클라이언트 초기화
const client = redis.createClient({
	socket: {
		host: 'redis', // Redis 컨테이너 이름 또는 호스트
		port: 6379,    // Redis 기본 포트
	},
});

// 에러 핸들링
client.on('error', (err) => console.error('Redis Client Error:', err));

// Redis 연결
(async () => {
	try {
		await client.connect();
		console.log('Redis connected ');
	} catch (error) {
		console.error('Failed to connect to Redis:', error);
	}
})();

// 클라이언트 모듈로 내보내기
module.exports = client;
