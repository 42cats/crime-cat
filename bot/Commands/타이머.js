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
		await interaction.reply("타이머 시작");
		const msg = await interaction.fetchReply();
		timerSet(interaction.client, msg, timeM);
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
				const msg = await message.channel.send("타이머 시작!");
				await timerSet(message.client, msg, time);

			}
		}
	},
	upload: true,
	permissionLevel: 0
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
	const endEmbed = new EmbedBuilder()
		.setColor('#0099ff')
		.setTitle('타이머를 시작합니다')
		.addFields(
			{ name: '시작 시간', value: startTime.toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), inline: false },
			{ name: '종료 시간', value: targetTime.toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), inline: false }
		)
		.setFooter({ text: '타이머 기능', iconURL: client.user.displayAvatarURL() });
	message.edit({ content: "", embeds: [endEmbed] });
	const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: time * 60 * 1000 });

	collector.on('collect', async i => {
		if (i.customId === 'deleteMsg') {
			console.log(i.member);
			if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) {
				return i.reply({ content: '이 타이머를 종료할 권한이 없습니다.', ephemeral: true });
			}
			if (message.deletable && !message.system)
				i.message.delete();
			collector.stop(); // 이벤트 수집 종료
			clearInterval(interval);
		}
	});
	const interval = setInterval(async () => {
		const now = new Date();
		const remainingTime = targetTime - now;

		// 남은 시간이 0보다 작거나 같으면 타이머 종료
		if (remainingTime <= 0 || !message.editable) {
			clearInterval(interval);
			const endEmbed = new EmbedBuilder()
				.setColor('#ff0000')
				.setTitle('타이머 종료')
				.setDescription(`시간이 모두 지났습니다!`)
				.addFields(
					{ name: '시작 시간', value: startTime.toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), inline: false },
					{ name: '종료 시간', value: targetTime.toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), inline: false }
				)
				.setFooter({ text: '타이머 기능', iconURL: client.user.displayAvatarURL() });
			message.channel.send("지정한 타이머 시간이 되었습니다!");
			if (message.editable)
				message.edit({ embeds: [endEmbed], components: [] }); // 버튼 제거
			return;
		}

		const button = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('deleteMsg')
				.setLabel('타이머 종료')
				.setStyle(ButtonStyle.Danger)
		);

		// 남은 시간을 시:분:초로 변환
		const hours = Math.floor(remainingTime / (1000 * 60 * 60));
		const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

		const updatedEmbed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle('타이머 진행 중')
			.setDescription(
				`남은 시간: **${hours.toString().padStart(2, '0')}:${minutes
					.toString()
					.padStart(2, '0')}:${seconds.toString().padStart(2, '0')}**`
			)
			.addFields(
				{ name: '시작 시간', value: startTime.toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), inline: false },
				{ name: '종료 시간', value: targetTime.toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), inline: false }
			)
			.setFooter({ text: '타이머 기능', iconURL: client.user.displayAvatarURL() });

		message.edit({ content: "", embeds: [updatedEmbed], components: [button] });
	}, 5000);
}
