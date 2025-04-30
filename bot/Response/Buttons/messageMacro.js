// handlers/messageMacro.js
const { PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getContents } = require('../../Commands/api/messageMacro/messageMacro');

const COLORS = [ButtonStyle.Primary, ButtonStyle.Danger, ButtonStyle.Success];
function getNextColor(currentStyle) {
	const index = COLORS.indexOf(currentStyle);
	if (index === -1) return COLORS[0]; // fallback
	return COLORS[(index + 1) % COLORS.length];
}


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
		const changeColor = option?.[3] === '1';
		const toDm = option?.[4] === '1';
		const showOnlyMe = option?.[5] === '1';
		const buttonName = interaction.component.label;

		await interaction.deferReply({ ephemeral: true }); // 👈 가장 첫 줄에 추가
		// 관리자 제한
		if (isAdminOnly && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return await interaction.reply({
				content: '🚫 관리자만 사용할 수 있는 버튼입니다.',
				ephemeral: true
			});
		}

		// 로그 남기기
		if (showPressDetail) {
			const originalContent = interaction.message.content || '';
			const lines = originalContent.split('\n');
			const userName = interaction.member.displayName;
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

		if (changeColor || isOneTime) {
			const newComponents = interaction.message.components.map(row => {
				const newRow = ActionRowBuilder.from(row);
				newRow.components = row.components.map(button => {
					// 링크 버튼은 skip
					if (button.style === ButtonStyle.Link) return button;

					let builder = ButtonBuilder.from(button);

					// 모든 버튼에 색상 순환 적용
					if (changeColor) {
						builder = builder.setStyle(getNextColor(button.style));
					}

					// 클릭된 버튼만 비활성화
					if (isOneTime && button.customId === interaction.customId) {
						builder = builder.setDisabled(true);
					}

					return builder;
				});
				return newRow;
			});
			await interaction.message.edit({ components: newComponents });
		}



		try {
			const contents = await getContents(head);
			for (const content of contents) {
				const text = content.text;
				const channelId = content.channelId;

				if (!text || text.trim().length === 0) continue;
				// ✅ 버튼 누른 유저에게 DM 전송
				if (toDm) {
					try {
						await interaction.user.send(text);
					} catch (err) {
						console.error(`❌ DM 전송 실패`, err);
						await interaction.followUp({
							content: `❌ DM 전송에 실패했습니다. 디엠이 차단되어 있거나, 설정이 막혀 있을 수 있어요.`,
							ephemeral: true
						});
					}
					continue; // DM 전송했으면 다음 콘텐츠로
				}

				// ✅ 인터랙션 응답자에게만 보이는 메시지 (ephemeral)
				if (showOnlyMe) {
					await interaction.followUp({
						content: text,
						ephemeral: true
					});
					continue;
				}

				// ✅ 일반 채널 전송
				if (!channelId || channelId === 'none') {
					await interaction.channel.send(text);
					continue;
				}

				try {
					const channel = await client.channels.fetch(channelId);
					if (!channel || !channel.isTextBased()) throw new Error('텍스트 채널 아님');
					await channel.send(text);
				} catch (err) {
					console.error(`❌ 채널 전송 실패: ${channelId}`, err);
					await interaction.followUp({
						content: `❌ 채널 \`${channelId}\`에 메시지를 전송할 수 없습니다.`,
						ephemeral: true
					});
				}
			}
		} catch (error) {
			console.error("버튼 콘텐츠 출력 에러:", error);
			return await interaction.followUp({ content: `❌ 오류: ${String(error)}`, ephemeral: true });
		}

		// 기본 응답
		await interaction.followUp({
			content: `✅ 버튼 \`${buttonName}\`을 눌렀습니다.`,
			ephemeral: true
		});
	}
};
