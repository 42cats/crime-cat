async function ytdlpUpdate(params) {

	const { spawn } = require('child_process');

	// pip 명령어로 yt-dlp 업데이트 실행
	const process = spawn('pip', ['install', '--user', '--upgrade', 'yt-dlp']);


	process.stdout.on('data', (data) => {
		console.log(`stdout: ${data}`);
	});

	process.stderr.on('data', (data) => {
		console.error(`stderr: ${data}`);
	});

	process.on('close', (code) => {
		if (code === 0) {
			console.log('yt-dlp successfully updated.');
		} else {
			console.error(`Process exited with code ${code}`);
		}
	});
}

module.exports = ytdlpUpdate;