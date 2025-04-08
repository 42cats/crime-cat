const { SlashCommandBuilder, PermissionFlagsBits, Message, Client } = require('discord.js');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const { getGuildMusic, addGuildMusic } = require('./api/guild/music');
const { isPermissionHas } = require('./api/user/permission');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const API = process.env.GOOGLE_API;

const nameOfCommand = "주소추가";
const description = "길드에 유튜브 url을 추가";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option =>
			option.setName('title')
				.setDescription('제목')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('url')
				.setDescription('URL 주소')
				.setRequired(true)),

	async execute(interaction) {
		let title = interaction.options.getString('title');
		const url = interaction.options.getString('url');
		if (title.length > 20) title = title.slice(0, 20);
		console.log("title ", title, "url ", url);
		const guildId = interaction.guildId;
		try {
			const endMsg = await addUrl(guildId, title, url, interaction.user);
			await interaction.reply({ content: endMsg, ephemeral: true });
			updatePlayer(interaction.client, guildId);
		}
		catch (e) {
			await interaction.reply({ content: String(e), ephemeral: true });
		}
	},
	prefixCommand: {
		name: nameOfCommand,
		description,
		/**
		 * 
		 * @param {Message} message 
		 * @param {Array} args 
		 * @returns 
		 */
		async execute(message, args) {
			// if (message.guildId === '1328921864252293130') {
			// 	await bulkAddUrls();
			// 	message.channel.send("추가 완료");
			// 	return;
			// }
			if (args.length != 2) {
				if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
				await message.channel.send({ content: "타이틀과 Ulr 두개의 인자가 필요합니다.", ephemeral: true });
				return;
			}
			const client = message;
			console.log(message);
			const guildId = message.guildId;
			try {
				const endMsg = await addUrl(guildId, args[0], args[1], client.author);
				// const endMsg = bulkAddUrls();
				await message.channel.send({ content: endMsg, ephemeral: true });
				updatePlayer(client, guildId);
			}
			catch (e) {
				await message.channel.send({ content: String(e), ephemeral: true });
			}
		}
	},
	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};


async function bulkAddUrls() {
	const urls = [
		{ guildId: '1328921864252293130', title: '태양물기', url: 'https://www.youtube.com/watch?v=ehX7MAhc5iA', userid: '111111', thumbnail: "https://imgur.com/jCVVLrp.png", duration: "1", },
		{ guildId: '1328921864252293130', title: '포인트 니모', url: 'https://www.youtube.com/watch?v=GCKSrC6XVOk', userid: '111111', thumbnail: "https://imgur.com/jCVVLrp.png", duration: "1", },
		{ guildId: '1328921864252293130', title: '노력', url: 'https://www.youtube.com/watch?v=9peNcUO9ONY', userid: '111111', thumbnail: "https://imgur.com/jCVVLrp.png", duration: "1", },
		{ guildId: '1328921864252293130', title: 'you raseme up', url: 'https://www.youtube.com/watch?v=Wtm5Jva5PZc', userid: '111111', thumbnail: "https://imgur.com/jCVVLrp.png", duration: "1", },
		{ guildId: '1328921864252293130', title: '낮에 뜨는달', url: 'https://www.youtube.com/watch?v=DwJrlDTjUVk', userid: '111111', thumbnail: "https://imgur.com/jCVVLrp.png", duration: "1", },
		{ guildId: '1328921864252293130', title: '꽃이피고', url: 'https://www.youtube.com/watch?v=y-sqDi4cgdI', userid: '111111', thumbnail: "https://imgur.com/jCVVLrp.png", duration: "1", },
		{ guildId: '1328921864252293130', title: '지는듯이', url: 'https://www.youtube.com/watch?v=y-sqDi4cgdI', userid: '111111', thumbnail: "https://imgur.com/jCVVLrp.png", duration: "1", },
		{ guildId: '1328921864252293130', title: '황금별', url: 'https://www.youtube.com/watch?v=ymXpj7ifij0', userid: '111111', thumbnail: "https://imgur.com/jCVVLrp.png", duration: "1", },
		{ guildId: '1328921864252293130', title: '편지', url: 'https://www.youtube.com/watch?v=PRfbCM_lWYw', userid: '111111', thumbnail: "https://imgur.com/jCVVLrp.png", duration: "1", },
		{ guildId: '1328921864252293130', title: '창귀', url: 'https://www.youtube.com/watch?v=DIXKdHkncZk', userid: '111111', thumbnail: "https://imgur.com/jCVVLrp.png", duration: "1", },
		{ guildId: '1328921864252293130', title: '상사화', url: 'https://www.youtube.com/watch?v=YMle1suRKeg', userid: '111111', thumbnail: "https://imgur.com/jCVVLrp.png", duration: "1", },
		{ guildId: '1328921864252293130', title: '비익련리', url: 'https://www.youtube.com/watch?v=u9TNem1h6uM', userid: '111111', thumbnail: "https://imgur.com/jCVVLrp.png", duration: "1", },
		{ guildId: '1328921864252293130', title: '꽃별', url: 'https://www.youtube.com/watch?v=oBFoAhHY7Mk', userid: '111111', thumbnail: "https://imgur.com/jCVVLrp.png", duration: "1", },
		{ guildId: '1328921864252293130', title: '인연', url: 'https://www.youtube.com/watch?v=97QZfFnaDuU', userid: '111111', thumbnail: "https://imgur.com/jCVVLrp.png", duration: "1", },
		{ guildId: '1328921864252293130', title: '문단속', url: 'https://www.youtube.com/watch?v=nWFR2Kp6f4M', userid: '111111', thumbnail: "https://imgur.com/jCVVLrp.png", duration: "1", },
		{ guildId: '1328921864252293130', title: '시대를초월한마음', url: 'https://www.youtube.com/watch?v=HAZAzaya3SE', userid: '111111', thumbnail: "https://imgur.com/jCVVLrp.png", duration: "1", },
		{ guildId: '1328921864252293130', title: '호랑수월가', url: 'https://www.youtube.com/watch?v=Fc-H3AaQGTs', userid: '111111', thumbnail: "https://imgur.com/jCVVLrp.png", duration: "1", },
		{ guildId: '1328921864252293130', title: '불씨', url: 'https://www.youtube.com/watch?v=ApMBidJwVmk', userid: '111111', thumbnail: "https://imgur.com/jCVVLrp.png", duration: "1", },
		// Add more entries as needed
	];
	const promises = urls.map(async ({ guildId, title, url, thumbnail, duration }) => {
		try {
			const result = await addGuildMusic(guildId, {
				title,
				url,
				thumbnail,
				duration,
			});
			console.log(`URL added successfully: ${title}`, result);
		} catch (error) {
			console.error(`Failed to add URL: ${url}`, error.message);
		}
	});

	// 모든 요청 완료를 기다림
	await Promise.all(promises);
}





async function addUrl(guildId, title, url, user) {

	if (!guildId) {
		throw Error('길드아이디 오류. 관리자에게 문의');
	}

	const count = await getGuildMusic(guildId);
	if (count.count > 14) {
		if (!await isPermissionHas(user.id, "주소추가"))
			throw Error(`기본 사용자의 최대 추가목록은 15개 입니다. 당신은 ${count.count}개의 목록을 가지고 있습니다.`);
	}

	console.log("count = ", count);
	// Validate URL format
	const videoIdMatch = url.match(/(?:v=|youtu\.be\/|youtube\.com\/.*\/)([a-zA-Z0-9_-]{11})/);
	if (!videoIdMatch) {
		throw Error('유튜브 링크주소 오류. 다시한번 확인해주세요.' + url);
	}

	const videoId = videoIdMatch[1];
	const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${API}`;

	try {
		// Fetch video details from YouTube API
		const response = await axios.get(apiUrl);
		const videoData = response.data.items[0];

		if (!videoData) {
			throw Error('해당주소로 정상적인 비디오 를 찾을수 없습니다.');
		}
		console.log(videoData.snippet);
		// Extract relevant details
		const thumbnail = videoData.snippet.thumbnails.high.url;
		const durationISO = videoData.contentDetails.duration;

		const durationReadable = durationISO.replace(/PT(\d+H)?(\d+M)?(\d+S)?/, (_, h, m, s) => {
			const hours = h ? h.replace('H', '') : null;
			const minutes = m ? m.replace('M', '') : '00';
			const seconds = s ? s.replace('S', '') : '00';

			return hours
				? `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`
				: `${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
		});


		// Add URL, thumbnail, and duration to the GuildURL table
		await addGuildMusic(guildId, {
			title,
			url,
			thumbnail,
			duration: durationReadable,
		});

		return `✅ Successfully added the URL!\n**Title:** ${title}\n**URL:** ${url}\n**Duration:** ${durationReadable}`;
	} catch (error) {
		console.error('Error processing the URL:', error);

		const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error occurred.';
		throw Error(`❌ url 추가중 오류로 인해 추가되지 않았습니다. \nDetails: ${errorMessage}`);
	}
}

/**
 * 
 * @param {Client} client 
 */
async function updatePlayer(client, guildId) {
	if (!client.serverMusicData?.has(guildId)) {
		return;
	}
	const musicData = client.serverMusicData.get(guildId);
	await musicData.playlistManager.refresh();
	const components = await musicData.reply();
	await musicData.interactionMsg.edit(components);
}