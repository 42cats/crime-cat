// commands/ping.js
const { Client, SlashCommandBuilder, Message, CommandInteraction, EmbedBuilder, Guild, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType, PermissionFlagsBits, User } = require('discord.js');
const { guildAddProcess } = require('../api/guild/guild');

const TERMS = `\`\`\`Md
### **디스코드 봇 서비스 이용 약관**

**최종 수정일:** [2025-01-24]

... (약관 내용 생략) ...

**위 약관에 동의하시겠습니까?**

1분 내로 동의하지 않으면 거절로 인식하고 봇은 추가하신 서버에서 나가게 됩니다.
\`\`\``;

module.exports = {
	/**
	 * @param {Client} client
	 * @param {User} user
	 * @param {Guild} guild
	 * @param {Number} time
	 */
	execute: async (client, target, guild, time) => {
		try {
			await termsReply(client, target, guild, time);
		} catch (error) {
			console.error("Error executing termsReply:", error);
		}
	}
};

/**
 * @param {Client} client 
 * @param {User} target
 * @param {Guild} guild 
 * @param {Number} time 
 */
async function termsReply(client, target, guild, time) {
	try {
		const startTime = new Date();
		const targetTime = new Date(startTime.getTime() + time * 60 * 1000);
		const channelName = target.id + "_Terms:";

		const button = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId(channelName + 'accept')
				.setLabel('동의')
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId(channelName + 'refuse')
				.setLabel('거절')
				.setStyle(ButtonStyle.Danger)
		);

		let message;
		try {
			message = await target.send({ content: TERMS, components: [button] });
		} catch (error) {
			console.error("Error sending terms message:", error);
			return;
		}

		const collector = message.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: time * 60 * 1000
		});

		const interval = setInterval(async () => {
			try {
				const now = new Date();
				if (now >= targetTime || !message.editable) {
					clearInterval(interval);
					collector.stop();
					if (target) await target.send("약관 동의 거절로 봇이 서버에서 나갑니다.");
					const targetGuild = client.guilds.cache.get(guild.id);
					if (targetGuild) {
						await targetGuild.leave();
						console.log(`길드 ${guild.name}에서 나갔습니다.`);
					} else {
						console.log("길드를 찾을 수 없음.");
					}
				}
			} catch (error) {
				console.error("Error in interval check:", error);
			}
		}, 5000);

		collector.on('collect', async i => {
			try {
				if (i.customId === channelName + 'accept') {
					console.log("약관 수락", guild.name);
					if (message.deletable && !message.system) await i.message.delete();
					target.send("협조에 감사드립니다!");
					await guildAddProcess(client, guild);
				} else if (i.customId === channelName + 'refuse') {
					console.log("약관 거절", guild.name);
					if (message.deletable && !message.system) await i.message.delete();
					try {
						target.send("약관에 동의하지 않으면 사용할 수 없습니다.");

					} catch (error) {
						console.error("약관 거절 에러");
					}
					await guild.leave();
				}
				collector.stop();
				clearInterval(interval);
			} catch (error) {
				console.error("Error in button collection:", error);
			}
		});

	} catch (error) {
		console.error("Error in termsReply function:", error);
	}
}