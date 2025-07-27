// commands/ping.js
const { Client, SlashCommandBuilder, Message, CommandInteraction, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType, PermissionFlagsBits } = require('discord.js');

const nameOfCommand = "타이머";
const description = "카운트다운 타이머 출력";

module.exports = {
	// 슬래시 명령어 정의
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addNumberOption((v) =>
			v.setName('분')
				.setDescription('분단위로 시간을 입력해 주세요')
				.setMinValue(1)
				.setMaxValue(420)
				.setRequired(true)
		),
	// 슬래시 명령어 실행
	/**
	 * 
	 * @param {CommandInteraction} interaction 
	 */
	async execute(interaction) {
		const timeM = await interaction.options.getNumber('분');
		if (!timeM || timeM < 1) {
			await interaction.reply('단위를 제대로 입력해 주세요');
			return;
		}
		console.log("타이머 ", timeM);

		try {
			// 초기 응답 (수정 가능하도록)
			await interaction.reply({ content: "⏰ 타이머를 준비하고 있습니다...", fetchReply: true });
			const msg = await interaction.fetchReply();

			// 메시지 존재 확인
			if (!msg || !msg.editable) {
				console.error("❌ 타이머 메시지를 편집할 수 없습니다.");
				return await interaction.editReply("❌ 타이머 설정 중 오류가 발생했습니다.");
			}

			await timerSet(interaction.client, msg, timeM);
		} catch (error) {
			console.error("❌ 타이머 설정 오류:", error);
			if (interaction.replied) {
				await interaction.editReply("❌ 타이머 설정 중 오류가 발생했습니다.");
			} else {
				await interaction.reply("❌ 타이머 설정 중 오류가 발생했습니다.");
			}
		}
	},

	// Prefix 명령어 정의
	prefixCommand: {
		name: nameOfCommand,
		description: description,
		/**
		 * 
		 * @param {Message} message 
		 * @param {Array} args 
		 * @returns 
		 */
		async execute(message, args) {
			if (args.length != 1) {
				message.channel.send("``!타이머 시간(분)  으로 숫자로 분을 입력해주세요 최대 420분``");
				return;
			}
			const time = parseInt(args[0]);
			if (!Number.isInteger(time) || (Number.isInteger(time) && time < 1) || (Number.isInteger(time) && time > 420))
				message.channel.send("``!타이머 시간(분)  으로 숫자로 분을 입력해주세요 최대 420분``");
			else {
				try {
					const msg = await message.channel.send("⏰ 타이머를 준비하고 있습니다...");

					// 메시지 존재 확인
					if (!msg || !msg.editable) {
						console.error("❌ 타이머 메시지를 편집할 수 없습니다.");
						return await msg.edit("❌ 타이머 설정 중 오류가 발생했습니다.");
					}

					await timerSet(message.client, msg, time);
				} catch (error) {
					console.error("❌ 타이머 설정 오류:", error);
					await message.channel.send("❌ 타이머 설정 중 오류가 발생했습니다.");
				}
			}
		}
	},
	upload: true,
	permissionLevel: PermissionFlagsBits.Administrator
};
/**
 * 
 * @param {Client}client 
 * @param {Message}message 
 * @param time 
 */
async function timerSet(client, message, time) {
	const startTime = new Date();
	const targetTime = new Date(startTime.getTime() + time * 60 * 1000);

	// Unix timestamp 생성 (Discord에서 사용)
	const startTimeUnix = Math.floor(startTime.getTime() / 1000);
	const targetTimeUnix = Math.floor(targetTime.getTime() / 1000);

	// 종료 버튼 생성
	const button = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId('deleteMsg')
			.setLabel('타이머 종료')
			.setStyle(ButtonStyle.Danger)
	);

	// 초기 타이머 임베드 생성 함수
	const createTimerEmbed = (remainingMs = null) => {
		const color = remainingMs === null ? '#0099ff' : (remainingMs <= 60000 ? '#ff4444' : '#0099ff');

		let description;
		if (remainingMs === null) {
			// 초기 상태
			description = `
				🎯 **남은 시간: <t:${targetTimeUnix}:R>**
				⏰ **종료 시간: <t:${targetTimeUnix}:T>**
			`;
		} else if (remainingMs <= 0) {
			// 타이머 완료
			description = `
				🔔 **타이머 완료!**
				⏰ **종료 시간: <t:${targetTimeUnix}:T>**
			`;
		} else {
			// 실시간 카운트다운 (분:초)
			const minutes = Math.floor(remainingMs / (1000 * 60));
			const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

			const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

			description = `
				⏱️ **남은 시간: ${timeStr}**
				⏰ **종료 시간: <t:${targetTimeUnix}:T>**
			`;
		}

		return new EmbedBuilder()
			.setColor(color)
			.setTitle('⏰ 타이머 진행 중')
			.setDescription(description)
			.addFields(
				{ name: '📅 시작 시간', value: `<t:${startTimeUnix}:F>`, inline: true },
				{ name: '🏁 종료 시간', value: `<t:${targetTimeUnix}:F>`, inline: true },
				{ name: '⏳ 설정 시간', value: `${time}분`, inline: true }
			)
			.setFooter({ text: '타이머 ', iconURL: client.user.displayAvatarURL() })
			.setTimestamp();
	};

	// 초기 타이머 임베드
	const timerEmbed = createTimerEmbed();

	// 초기 메시지 설정
	try {
		// 메시지 존재 및 편집 가능 여부 확인
		if (!message.editable) {
			console.error("❌ 타이머 메시지를 편집할 수 없습니다.");
			return;
		}

		await message.edit({ content: "", embeds: [timerEmbed], components: [button] });
	} catch (error) {
		console.error("❌ 타이머 메시지 편집 실패:", error);
		return;
	}

	// 실시간 업데이트 interval 설정
	const interval = setInterval(async () => {
		const now = new Date();
		const remainingTime = targetTime - now;

		try {
			if (remainingTime <= 0 || !message.editable) {
				// 타이머 종료
				clearInterval(interval);

				const endEmbed = createTimerEmbed(0);
				if (message.editable) {
					await message.edit({ embeds: [endEmbed], components: [] });
				}
				return;
			}

			// 실시간 카운트다운 업데이트 (매초)
			const updatedEmbed = createTimerEmbed(remainingTime);
			if (message.editable) {
				await message.edit({ embeds: [updatedEmbed], components: [button] });
			}
		} catch (error) {
			console.error("❌ 타이머 업데이트 실패:", error);
			clearInterval(interval);
		}
	}, 1000); // 1초마다 업데이트

	// 컬렉터 설정 (버튼 클릭 처리)
	const collector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
		time: time * 60 * 1000
	});

	collector.on('collect', async i => {
		if (i.customId === 'deleteMsg') {
			if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) {
				return i.reply({ content: '❌ 이 타이머를 종료할 권한이 없습니다.', ephemeral: true });
			}

			const cancelEmbed = new EmbedBuilder()
				.setColor('#ff9900')
				.setTitle('⏹️ 타이머가 수동으로 종료되었습니다')
				.setDescription(`관리자에 의해 타이머가 조기 종료되었습니다.`)
				.addFields(
					{ name: '📅 시작 시간', value: `<t:${startTimeUnix}:F>`, inline: true },
					{ name: '⏹️ 종료 시간', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
					{ name: '👤 종료한 사용자', value: `${i.user.tag}`, inline: true }
				)
				.setFooter({ text: '타이머 종료', iconURL: client.user.displayAvatarURL() })
				.setTimestamp();

			await i.update({ embeds: [cancelEmbed], components: [] });
			clearInterval(interval); // interval 정리
			collector.stop();
		}
	});

	// 타이머 종료 시 처리
	collector.on('end', async (collected, reason) => {
		clearInterval(interval); // interval 정리

		if (reason === 'time') {
			// 시간 만료로 종료
			const endEmbed = new EmbedBuilder()
				.setColor('#ff0000')
				.setTitle('🔔 타이머 종료!')
				.setDescription(`**${time}분** 타이머가 완료되었습니다!`)
				.addFields(
					{ name: '📅 시작 시간', value: `<t:${startTimeUnix}:F>`, inline: true },
					{ name: '🏁 종료 시간', value: `<t:${targetTimeUnix}:F>`, inline: true },
					{ name: '⏱️ 경과 시간', value: `${time}분`, inline: true }
				)
				.setFooter({ text: '타이머 완료', iconURL: client.user.displayAvatarURL() })
				.setTimestamp();

			// 메시지 편집 (버튼 제거)
			try {
				if (message.editable) {
					await message.edit({ embeds: [endEmbed], components: [] });
				}
			} catch (error) {
				console.error("❌ 타이머 종료 메시지 편집 실패:", error);
				// 편집 실패해도 알림 메시지는 보냄
			}

			// 알림 메시지 전송
			await message.channel.send(`🔔 **타이머 완료!** ${time}분이 지났습니다!`);
		}
	});
}
