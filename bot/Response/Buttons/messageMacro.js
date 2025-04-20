const { PermissionFlagsBits } = require('discord.js');

/**
 * @typedef {Object} ButtonMetaData
 * @property {string} id - 버튼 고유 ID
 * @property {string} command - "messageMacro"
 * @property {string} option - "101" 형식의 옵션값 (isOneTime, isAdminOnly, showPressDetail)
 */

module.exports = {
	name: 'messageMacro',

	/**
	 * @param {import('discord.js').Client} client
	 * @param {import('discord.js').ButtonInteraction} interaction
	 * @param {ButtonMetaData} data
	 */
	execute: async (client, interaction, data) => {
		const { id, option } = data;

		// 옵션 해석
		const isOneTime = option?.[0] === '1';
		const isAdminOnly = option?.[1] === '1';
		const showPressDetail = option?.[2] === '1';

		// 관리자 전용 검사
		if (isAdminOnly && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return await interaction.reply({
				content: '🚫 관리자만 사용할 수 있는 버튼입니다.',
				ephemeral: true
			});
		}

		// 1회 클릭 제한 검사 (Redis 기반)
		if (isOneTime) {
			const redisKey = `button:clicked:${id}:${interaction.user.id}`;
			const alreadyClicked = await client.redis.getValue(redisKey);
			if (alreadyClicked) {
				return await interaction.reply({
					content: '⚠️ 이 버튼은 이미 한 번 사용하셨습니다.',
					ephemeral: true
				});
			}
			await client.redis.setValue(redisKey, '1', 3600); // TTL: 1시간
		}

		// 로그 기록 및 메시지 콘텐츠 에디팅
		if (showPressDetail) {
			const originalContent = interaction.message.content || '';
			const lines = originalContent.split('\n');

			const userTag = interaction.user.tag;
			const userLogLines = lines.filter(line => line.startsWith('👤'));

			let updated = false;

			const updatedLogLines = userLogLines.map(line => {
				if (line.includes(userTag)) {
					const match = line.match(/: (\d+)/);
					const count = match ? parseInt(match[1]) + 1 : 1;
					updated = true;
					return `👤 ${userTag}: ${count}`;
				}
				return line;
			});

			if (!updated) {
				updatedLogLines.push(`👤 ${userTag}: 1`);
			}

			const headerLine = lines.find(line => !line.startsWith('👤')) || '**버튼 로그**';
			const newContent = [headerLine, ...updatedLogLines].join('\n');

			await interaction.message.edit({ content: newContent });
		}

		// 기본 응답
		await interaction.reply({
			content: `✅ 버튼 \`${id}\`을 눌렀습니다.`,
			ephemeral: true
		});
	}
};
