const { PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getContents } = require('../../Commands/api/messageMacro/messageMacro');

module.exports = {
	name: 'messageMacro',

	/**
	 * @param {import('discord.js').Client} client
	 * @param {import('discord.js').ButtonInteraction} interaction
	 * @param {import('./types').ButtonMetaData} data
	 */
	execute: async (client, interaction, data) => {
		const { head, option } = data;

		const isOneTime = option?.[0] === '1';
		const isAdminOnly = option?.[1] === '1';
		const showPressDetail = option?.[2] === '1';
		const buttonName = interaction.component.label;

		// 관리자만 접근 허용
		if (isAdminOnly && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return await interaction.reply({
				content: '🚫 관리자만 사용할 수 있는 버튼입니다.',
				ephemeral: true
			});
		}

		// 로그 표시 기능
		if (showPressDetail) {
			const originalContent = interaction.message.content || '';
			const lines = originalContent.split('\n');

			const userName = interaction.member.displayName;;
			const userLogLines = lines.filter(line => line.startsWith('👤'));

			let updated = false;

			const updatedLogLines = userLogLines.map(line => {
				if (line.includes(userName)) {
					const match = line.match(/: (\d+)/);
					const count = match ? parseInt(match[1]) + 1 : 1;
					updated = true;
					return `👤 ${userName}: ${count}`;
				}
				return line;
			});

			if (!updated) {
				updatedLogLines.push(`👤 ${userName}: 1`);
			}

			const headerLine = lines.find(line => !line.startsWith('👤')) || '**버튼 로그**';
			const newContent = [headerLine, ...updatedLogLines].join('\n');

			await interaction.message.edit({ content: newContent });
		}

		// 버튼 비활성화
		if (isOneTime) {
			const oldComponents = interaction.message.components;
			const newComponents = oldComponents.map(row => {
				const newRow = ActionRowBuilder.from(row);
				newRow.components = row.components.map(button => {
					if (button.customId === interaction.customId) {
						return ButtonBuilder.from(button).setDisabled(true);
					}
					return button;
				});
				return newRow;
			});
			await interaction.message.edit({ components: newComponents });
		}

		// 콘텐츠 출력 처리
		try {
			const contents = await getContents(head);
			for (const content of contents) {
				const text = content.text;
				const channelId = content.channelId;
				if (!text || text.trim().length === 0) continue;

				// 현재 채널에 전송
				if (!channelId || channelId === 'none') {
					await interaction.channel.send(text);
					continue;
				}

				// 채널 조회 및 전송
				try {
					const channel = await client.channels.fetch(channelId);
					if (!channel || !channel.isTextBased()) {
						throw new Error('텍스트 채널이 아닙니다.');
					}
					await channel.send(text);
				} catch (err) {
					console.error(`채널 전송 실패 [${channelId}]:`, err);
					await interaction.followUp({
						content: `❌ 채널 \`${channelId}\`에 메시지를 전송할 수 없습니다. (존재하지 않거나 권한 부족)`,
						ephemeral: true
					});
				}
			}
		} catch (error) {
			console.error("버튼 콘텐츠 출력 에러:", error);
			return await interaction.reply({ content: `❌ 오류: ${String(error)}`, ephemeral: true });
		}

		// 기본 응답
		await interaction.reply({
			content: `✅ 버튼 \`${buttonName}\`을 눌렀습니다.`,
			ephemeral: true
		});
	}
};
