const { SlashCommandBuilder } = require('@discordjs/builders');
const dotenv = require('dotenv');
const { Client, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
dotenv.config();

const nameOfCommand = "설문";
const description = "설문조사 폼 호출";

module.exports = {
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription(description),

	async execute(interaction) {
		await interaction.reply('설문을 실행합니다.');
	},

	prefixCommand: {
		name: nameOfCommand,
		description,
		async execute(message, args) {
			if (message.author.id !== '317655426868969482') return;
			const client = message.client;
			const msg = args.join(" ");
			await message.reply(msg);

			const guilds = client.guilds.cache;
			const ownerSet = new Set();

			// 중복 제거 후 유저 리스트 수집
			for (const guild of guilds.values()) {
				ownerSet.add(guild.ownerId);
			}

			const targetUsers = [];
			for (const ownerId of ownerSet) {
				if (ownerId === "288302173912170497")
					continue;
				try {
					const owner = await client.users.fetch(ownerId);
					targetUsers.push(owner);
					await message.channel.send(`${owner.globalName} 님 추가`);
				} catch (err) {
					console.error('Error processing guild:', err);
				}
			}

			// 동적으로 버튼 생성 예제 (3개 선택지)
			const options = [
				{ label: "동의", style: ButtonStyle.Primary, value: "yes" },
				{ label: "거절", style: ButtonStyle.Danger, value: "no" },
				// { label: "옵션 3", value: "option_3" }
			];

			await sendSurvey(client, msg, targetUsers, options)
			await message.reply(`설문 전송 완료. 대상 유저: ${targetUsers.length}명`);
		}
	},
	upload: false,
	permissionLevel: -1,
	isCacheCommand: false,
};

const { v4: uuidv4 } = require('uuid');

async function sendSurvey(client, message, targetUsers, options) {
	const users = [];
	const formKey = uuidv4(); // 설문별 고유 키 생성

	for (const user of targetUsers) {
		try {
			const row = new ActionRowBuilder();

			for (const option of options) {
				const buttonId = await client.redis.setValue({
					command: "form",
					user: user.id,
					userName: user.globalName,
					data: option.value,
					formKey,  // 설문 고유 키 추가
					message: message.slice(0, 10)
				});

				row.addComponents(
					new ButtonBuilder()
						.setCustomId(buttonId)
						.setLabel(option.label)
						.setStyle(option.style)
				);
			}

			const dmChannel = await user.createDM();
			users.push(user.globalName);
			await dmChannel.send({ content: message, components: [row] });

		} catch (error) {
			console.error(`${user.tag}에게 DM을 보낼 수 없습니다.`, error);
		}
	}

	await client.master.send(`📩 설문 발송 완료: ${users.length}명 (Form Key: ${formKey})`);
}
