module.exports = {
	apps: [
		{
			name: "discord-bot",
			script: "main.js",
			watch: true, // 파일 변경 감지
			autorestart: true, // 크래시 시 자동 재시작
			exec_mode: "fork", // 싱글 프로세스로 실행
			instances: 1, // 한 개의 인스턴스 실행
			max_memory_restart: "200M", // 200MB 메모리 초과 시 재시작
		},
	],
};
