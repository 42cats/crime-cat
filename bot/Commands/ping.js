const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');
const { exec } = require('child_process');
const http = require('http');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('핑')
		.setDescription('서버 상태, 핑, Nginx 상태를 확인합니다.'),

	async execute(interaction) {
		const start = Date.now();
		await interaction.deferReply(); // 잠시 기다려달라고 알림

		const latency = Date.now() - start;
		const apiLatency = interaction.client.ws.ping;

		// 시스템 정보
		const totalMem = (os.totalmem() / 1024 / 1024).toFixed(2); // MB
		const freeMem = (os.freemem() / 1024 / 1024).toFixed(2);   // MB
		const usedMem = (totalMem - freeMem).toFixed(2);
		const cpuLoad = os.loadavg()[0].toFixed(2); // 1분 평균

		// 디스크 사용량
		const diskInfo = await new Promise((resolve) => {
			exec("df / | tail -1 | awk '{print $5}'", (error, stdout) => {
				if (error) {
					resolve('Unknown');
				} else {
					resolve(stdout.trim());
				}
			});
		});


		// Nginx Stub Status 가져오기
		const nginxStatus = await new Promise((resolve) => {
			http.get('http://nginx:8080/nginx_status', (res) => {
				let data = '';
				res.on('data', chunk => { data += chunk; });
				res.on('end', () => resolve(data));
			}).on('error', () => resolve('Nginx status 조회 실패'));
		});

		// Nginx 데이터 파싱
		let nginxInfo = {
			activeConnections: 'N/A',
			accepts: 'N/A',
			handled: 'N/A',
			requests: 'N/A',
			reading: 'N/A',
			writing: 'N/A',
			waiting: 'N/A'
		};

		if (nginxStatus && nginxStatus.includes('Active connections')) {
			const lines = nginxStatus.split('\n').map(line => line.trim());
			nginxInfo.activeConnections = lines[0]?.split(':')[1]?.trim();
			const [accepts, handled, requests] = lines[2]?.split(/\s+/);
			const [, reading, , writing, , waiting] = lines[3]?.split(/\s+/);

			nginxInfo.accepts = accepts;
			nginxInfo.handled = handled;
			nginxInfo.requests = requests;
			nginxInfo.reading = reading;
			nginxInfo.writing = writing;
			nginxInfo.waiting = waiting;
		}

		const embed = new EmbedBuilder()
			.setTitle('📡 서버 & Nginx 상태')
			.setColor(0x3498db)
			.addFields(
				{ name: '🏓 핑', value: `\`${latency}ms\``, inline: true },
				{ name: '🌐 API 레이턴시', value: `\`${apiLatency}ms\``, inline: true },
				{ name: '🧠 메모리 사용량', value: `\`${usedMem}MB / ${totalMem}MB\``, inline: true },
				{ name: '🖥️ CPU Load (1m)', value: `\`${cpuLoad}\``, inline: true },
				{ name: '💾 디스크 사용량', value: `\`${diskInfo}\``, inline: true },
				{ name: '🌐 Nginx 활성 연결', value: `\`${nginxInfo.activeConnections}\``, inline: true },
				{ name: '📥 요청 수', value: `\`${nginxInfo.requests}\``, inline: true },
				{ name: '📤 읽기/쓰기/대기', value: `읽기 \`${nginxInfo.reading}\` / 쓰기 \`${nginxInfo.writing}\` / 대기 \`${nginxInfo.waiting}\``, inline: false }
			)
			.setTimestamp();

		await interaction.editReply({ embeds: [embed] });
	},

	upload: true,
	permissionLevel: -1
};
