const {
	SlashCommandBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	PermissionFlagsBits
} = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const { encodeToString } = require('./utility/delimiterGeter');

const nameOfCommand = "커스텀투표";
const description = "사용자 정의 투표를 진행합니다";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.addStringOption(option =>
			option.setName('선택지')
				.setDescription('투표 선택지를 쉼표로 구분하여 입력하세요 (예: 고양이,사자,호랑이)')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('시간')
				.setDescription('투표 제한 시간(초). 미입력시 무제한')
				.setMinValue(10)
				.setMaxValue(3600))
		.addBooleanOption(option =>
			option.setName('실시간표시')
				.setDescription('투표 현황을 실시간으로 표시할지 여부 (기본값: false)')
				.setRequired(false)),

	async execute(interaction) {
		const optionsString = interaction.options.getString('선택지');
		const timeLimit = interaction.options.getInteger('시간');
		const showRealtime = interaction.options.getBoolean('실시간표시') ?? false;

		// 선택지 파싱
		const options = optionsString.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);

		if (options.length < 2) {
			return await interaction.reply({
				content: '❌ 최소 2개 이상의 선택지가 필요합니다.',
				ephemeral: true
			});
		}

		if (options.length > 24) {
			return await interaction.reply({
				content: `❌ 선택지는 최대 24개까지 가능합니다. (종료 버튼 포함하여 25개 제한)\n현재 입력: ${options.length}개`,
				ephemeral: true
			});
		}

		// 중복 선택지 검증
		const duplicates = options.filter((option, index) => options.indexOf(option) !== index);
		if (duplicates.length > 0) {
			const uniqueDuplicates = [...new Set(duplicates)];
			return await interaction.reply({
				content: `❌ 중복된 선택지가 있습니다: ${uniqueDuplicates.join(', ')}\n각 선택지는 고유해야 합니다.`,
				ephemeral: true
			});
		}

		// 투표 ID 생성
		const voteId = uuidv4();
		const redis = interaction.client.redis;

		// Redis에 투표 메타데이터 저장
		const voteData = {
			title: "커스텀투표",
			guildId: interaction.guildId,
			channelId: interaction.channelId,
			creatorId: interaction.user.id,
			options: options.join(','),
			createdAt: Date.now(),
			endTime: timeLimit ? Date.now() + (timeLimit * 1000) : null,
			showRealtime: showRealtime
		};

		console.log(`📊 [커스텀투표] 투표 메타데이터 저장:`, {
			voteId,
			guildId: interaction.guildId,
			guildName: interaction.guild?.name,
			channelId: interaction.channelId,
			channelName: interaction.channel?.name,
			creatorId: interaction.user.id,
			creatorName: interaction.user.username,
			isVirtualInteraction: !interaction.replied && !interaction.deferred && interaction.id && interaction.id.startsWith('virtual_')
		});

		await redis.setHash(`vote:${voteId}:meta`, 'data', voteData, timeLimit ? timeLimit + 3600 : 86400);

		// 각 선택지별 투표자 SET 초기화
		for (const option of options) {
			// SET은 자동으로 생성되므로 초기화 불필요
		}

		// 버튼 생성 (최대 24개 선택지 + 1개 종료 버튼 = 25개)
		const rows = [];
		let currentRow = new ActionRowBuilder();
		let buttonCount = 0;
		let rowIndex = 0;

		options.forEach((option, index) => {
			// 5개 버튼마다 새 Row 생성
			if (buttonCount === 5) {
				rows.push(currentRow);
				currentRow = new ActionRowBuilder();
				buttonCount = 0;
				rowIndex++;
			}

			currentRow.addComponents(
				new ButtonBuilder()
					.setCustomId(encodeToString(voteId, "customVoteChoice", option))
					.setLabel(option)
					.setStyle(ButtonStyle.Primary)
					.setEmoji(getEmoji(index))
			);
			buttonCount++;
		});

		// 종료 버튼 추가 로직
		const endButton = new ButtonBuilder()
			.setCustomId(encodeToString(voteId, "customVoteEnd"))
			.setLabel('투표 종료')
			.setStyle(ButtonStyle.Danger)
			.setEmoji('🔚');

		// 마지막 Row에 공간이 있으면 (5개 미만) 거기에 추가
		if (currentRow.components.length > 0 && currentRow.components.length < 5) {
			currentRow.addComponents(endButton);
			rows.push(currentRow);
		} else {
			// 마지막 Row가 가득 찼거나 비어있으면
			if (currentRow.components.length > 0) {
				rows.push(currentRow); // 기존 Row 추가
			}
			// 새 Row에 종료 버튼 추가
			const endRow = new ActionRowBuilder().addComponents(endButton);
			rows.push(endRow);
		}

		// 초기 메시지 생성
		const embed = await createVoteEmbed(voteId, options, timeLimit, redis, showRealtime);

		const message = await interaction.reply({
			embeds: [embed],
			components: rows,
			fetchReply: true
		});

		// 메시지 ID 저장
		await redis.setHash(`vote:${voteId}:meta`, 'messageId', message.id);

		// 타이머 및 업데이트 시작
		if (timeLimit) {
			startVoteTimer(interaction.client, voteId, message, timeLimit);
		}

		// 5초마다 업데이트 (타이머 없어도 실행)
		startVoteUpdater(interaction.client, voteId, message);
	},
	upload: true,
	permissionLevel: PermissionFlagsBits.DeafenMembers,
	isCacheCommand: true,
};

// 투표 임베드 생성
async function createVoteEmbed(voteId, options, timeLimit, redis, showRealtime = false) {
	const embed = new EmbedBuilder()
		.setTitle(showRealtime ? '🗳️ **커스텀투표**' : '🗳️ **커스텀투표** (비밀투표)')
		.setColor(0x5865F2)
		.setTimestamp();

	// 각 선택지별 투표 수 계산
	let description = '';
	let totalVotes = 0;

	for (const option of options) {
		const voters = await redis.client.sCard(`vote:${voteId}:voters:${option}`) || 0;
		totalVotes += voters;

		if (showRealtime) {
			description += `${getEmoji(options.indexOf(option))} **${option}** - ${voters}표\n`;
		} else {
			description += `${getEmoji(options.indexOf(option))} **${option}**\n`;
		}
	}

	if (!showRealtime) {
		description += '\n※ 투표 결과는 종료 시 공개됩니다';
	}

	embed.setDescription(description);

	// 남은 시간 표시 (메타데이터에서 시간 정보 가져오기)
	const metaData = await redis.getHash(`vote:${voteId}:meta`, 'data');
	if (metaData && metaData.endTime) {
		const remaining = Math.max(0, Math.floor((metaData.endTime - Date.now()) / 1000));
		if (remaining > 10) {
			embed.setFooter({ text: `⏱️ 남은 시간: ${remaining}초 | 총 투표수: ${totalVotes}명` });
		} else {
			embed.setFooter({ text: `총 투표수: ${totalVotes}명` });
		}
	} else {
		embed.setFooter({ text: `총 투표수: ${totalVotes}명` });
	}

	return embed;
}

// 이모지 헬퍼 (24개까지 지원)
function getEmoji(index) {
	const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟',
		'🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯',
		'🇰', '🇱', '🇲', '🇳'];
	return emojis[index] || '▪️';
}

// 투표 업데이터
function startVoteUpdater(client, voteId, message) {
	const redis = client.redis;

	const interval = setInterval(async () => {
		try {
			// 투표가 종료되었는지 확인
			const metaData = await redis.getHash(`vote:${voteId}:meta`, 'data');
			if (!metaData) {
				clearInterval(interval);
				return;
			}

			// 메시지가 삭제되었는지 확인
			try {
				await message.fetch();
			} catch {
				clearInterval(interval);
				await redis.delete(`vote:${voteId}:meta`);
				return;
			}

			// 임베드 업데이트
			const options = metaData.options.split(',');
			const timeLimit = metaData.endTime ? Math.floor((metaData.endTime - Date.now()) / 1000) : null;
			const showRealtime = metaData.showRealtime ?? false;

			if (timeLimit !== null && timeLimit <= 0) {
				clearInterval(interval);
				return;
			}

			const embed = await createVoteEmbed(voteId, options, timeLimit, redis, showRealtime);
			await message.edit({ embeds: [embed] });

		} catch (error) {
			console.error('Vote updater error:', error);
			clearInterval(interval);
		}
	}, 5000); // 5초마다

	// 24시간 후 자동 정리
	setTimeout(() => clearInterval(interval), 24 * 60 * 60 * 1000);
}

// 투표 타이머
function startVoteTimer(client, voteId, message, timeLimit) {
	const redis = client.redis;

	setTimeout(async () => {
		try {
			// 투표 자동 종료
			await endVote(client, voteId, message);
		} catch (error) {
			console.error('Vote timer error:', error);
		}
	}, timeLimit * 1000);
}

// 투표 종료 함수
async function endVote(client, voteId, message) {
	const redis = client.redis;

	try {
		// 메타데이터 가져오기
		const metaData = await redis.getHash(`vote:${voteId}:meta`, 'data');
		if (!metaData) return;

		const options = metaData.options.split(',');
		const creator = await client.users.fetch(metaData.creatorId);
		const guild = client.guilds.cache.get(metaData.guildId);

		// 결과 집계
		let resultMsg = `📊 **커스텀투표 결과** (서버: ${guild.name})\n\n`;
		const results = [];

		for (const option of options) {
			const voterIds = await redis.client.sMembers(`vote:${voteId}:voters:${option}`) || [];
			const voters = [];

			// 유저 이름과 ID 가져오기
			for (const userId of voterIds) {
				try {
					const member = await guild.members.fetch(userId);
					const displayName = member.displayName || member.user.username;
					voters.push(`${displayName} (${userId})`);
				} catch {
					voters.push(`(알 수 없음) (${userId})`);
				}
			}

			results.push({
				option,
				count: voterIds.length,
				voters: voters.sort()
			});
		}

		// 투표 수 기준 정렬
		results.sort((a, b) => b.count - a.count);

		// 결과 메시지 생성
		const medals = ['🥇', '🥈', '🥉'];
		results.forEach((result, index) => {
			const medal = medals[index] || '▫️';
			resultMsg += `${medal} **${result.option}** (${result.count}표)\n`;
			if (result.voters.length > 0) {
				resultMsg += `   → 투표자: ${result.voters.join(', ')}\n`;
			}
			resultMsg += '\n';
		});

		const totalVotes = results.reduce((sum, r) => sum + r.count, 0);
		resultMsg += `총 참여자: ${totalVotes}명`;

		// DM 전송
		try {
			await creator.send(resultMsg);
		} catch (error) {
			console.error('Failed to send DM:', error);
		}

		// 버튼 비활성화
		const disabledComponents = message.components.map(row => {
			const newRow = ActionRowBuilder.from(row);
			newRow.components.forEach(button => button.setDisabled(true));
			return newRow;
		});

		await message.edit({
			components: disabledComponents,
			embeds: [
				EmbedBuilder.from(message.embeds[0])
					.setFooter({ text: '✅ 투표가 종료되었습니다' })
					.setColor(0x57F287)
			]
		});

		// Redis 데이터 정리 (1시간 후)
		setTimeout(async () => {
			await redis.delete(`vote:${voteId}:meta`);
			await redis.delete(`vote:${voteId}:userChoice`);
			for (const option of options) {
				await redis.delete(`vote:${voteId}:voters:${option}`);
			}
		}, 3600000);

	} catch (error) {
		console.error('End vote error:', error);
	}
}

module.exports.endVote = endVote;