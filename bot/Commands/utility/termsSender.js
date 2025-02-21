// commands/ping.js
const { Client, SlashCommandBuilder, Message, CommandInteraction, EmbedBuilder, Guild, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType, PermissionFlagsBits, User } = require('discord.js');
const { processGuildAndUsersWithHistory } = require('./discord_db');
const TERMS =
	`\`\`\`Md
### **디스코드 봇 서비스 이용 약관**

**최종 수정일:** [2025-01-24]

#### 1. **개요**
본 약관은 디스코드 봇 및 관련 서비스(이하 "서비스")를 이용하는 디스코드 사용자(이하 "사용자")와 길드 관리자 및 구성원(이하 "길드")에 적용됩니다. 서비스를 이용함으로써, 사용자는 본 약관에 동의한 것으로 간주됩니다.

---

#### 2. **데이터 수집 및 사용**
1. **수집 데이터**:
   - 길드 정보(길드 이름, ID, 소유자 ID, 생성 날짜 등)
   - 길드 멤버 정보(사용자 ID, 닉네임, 활동 내역 등)
   - 서비스 이용 기록(명령어 사용 내역, 상호작용 기록 등)

2. **데이터 사용 목적**:
   - 디스코드 봇의 기능 제공 및 최적화
   - 사용자 및 길드를 위한 맞춤형 서비스 제공
   - 길드 데이터를 활용한 상업적 목적의 분석 및 서비스 개선
   - 길드 정보의 웹사이트 및 기타 플랫폼 연계

3. **상업적 활용**:
   - 길드 및 사용자의 데이터는 봇 운영자의 상업적 목적(예: 광고, 분석, 유료 서비스 제공 등)을 위해 사용될 수 있습니다.
   - 사용자는 이러한 데이터 활용에 명시적으로 동의해야 하며, 동의하지 않을 경우 서비스 이용이 제한될 수 있습니다.

---

#### 3. **길드 권한 사용**
1. **필수 권한**:
   - 봇은 길드에서 적절한 권한(예: 메시지 읽기/쓰기, 멤버 관리, 채널 접근 등)을 요청할 수 있습니다.
   - 제공된 권한은 서비스 기능 수행에만 사용됩니다.

2. **권한 철회**:
   - 길드 관리자는 언제든지 권한을 철회할 수 있으며, 이로 인해 특정 기능이 비활성화될 수 있습니다.

---

#### 4. **웹사이트 및 타 플랫폼 연계**
1. 서비스는 길드와 사용자의 데이터를 웹사이트 또는 기타 플랫폼에서 표시하거나 활용할 수 있습니다.
2. 연계된 데이터는 서비스 약관과 개인정보 보호정책에 따라 관리됩니다.

---

#### 5. **사용자의 권리와 책임**
1. 사용자는 본인의 데이터 사용 내역에 대해 열람 및 수정 요청을 할 수 있습니다.
2. 길드 관리자 및 구성원은 제공된 데이터가 본 약관에서 명시한 목적 외로 사용되지 않도록 보호받을 권리가 있습니다.
3. 사용자는 서비스 이용 시 디스코드 및 관련 플랫폼의 정책을 준수해야 합니다.

---

#### 6. **면책 조항**
1. 봇 운영자는 사용자 및 길드의 부주의로 인해 발생한 문제에 대해 책임지지 않습니다.
2. 기술적 오류나 제3자 서비스 장애로 인한 데이터 손실에 대해 면책됩니다.

---

#### 7. **약관 변경**
1. 운영자는 필요 시 본 약관을 수정할 수 있으며, 변경된 약관은 공지 후 효력이 발생합니다.
2. 사용자는 변경된 약관에 동의하지 않을 경우, 서비스 이용을 중단할 권리가 있습니다.

---

**위 약관에 동의하시겠습니까?**

동의 후 약관에 대한 피드백이나 추가 요구사항이 있다면 말씀해 주세요.

1분내로 동의하지 않으면 거절로 인식하고 봇은 추가하신 서버에서 나가게 됩니다.
\`\`\``;
module.exports = {
	/**
	 * @param {Client} client
	 * @param {User} user
	 * @param {Guild} guild
	 * @param {Number} time
	 */
	execute: async (client, target, guild, time) => {
		await termsReply(client, target, guild, time);
	}
};
/**
 * 
 * @param {Client} client 
 * @param {User} target
 * @param {Guild} guild 
 * @param {Number} time 
 */
async function termsReply(client, target, guild, time) {
	try {

		const startTime = new Date();
		const targetTime = new Date(startTime.getTime() + time * 60 * 1000);
		const channelNmae = target.id + "_Terms:"
		const button = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId(channelNmae + 'accept')
				.setLabel('동의')
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId(channelNmae + 'refuse')
				.setLabel('거절')
				.setStyle(ButtonStyle.Danger)
		);
		const message = await target.send({ content: TERMS, components: [button] });
		const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: time * 60 * 1000 });
		collector.on('collect', async i => {
			if (i.customId === channelNmae + 'accept') {
				console.log("약관 수락", guild.name);
				if (i.message.deletable)
					i.message.delete();
				collector.stop(); // 이벤트 수집 종료
				target.send("협조에 감사드립니다!");
				processGuildAndUsersWithHistory(client, guild);
				clearInterval(interval);
			}
			else if (i.customId === channelNmae + 'refuse') {
				console.log("약관 거절 ", guild.name);
				if (i.message.deletable)
					i.message.delete();
				collector.stop(); // 이벤트 수집 종료
				target.send("약관에 동의하지 않으면 사용할 수 없습니다.");
				guild.leave();
				clearInterval(interval);
			}
			collector.stop();
		});
		const interval = setInterval(async () => {
			const now = new Date();
			const remainingTime = targetTime - now;
			// 남은 시간이 0보다 작거나 같으면 타이머 종료
			if (remainingTime <= 0 || !message.editable) {
				clearInterval(interval);
				collector.stop();
				const targetGuild = client.guilds.cache.get(guild.id);
				try {
					if (target)
						target.send("약관동의 거절로 봇이 서버에서 나갑니다.");
					if (targetGuild) {
						await targetGuild.leave();
						console.log(`길드 ${guild.name}에서 나갔습니다.`);
					} else {
						console.log("길드가 캐시에서 찾을 수 없습니다.");
					}
				}
				catch (e) {
					console.log("동의 거절 오류", e.stack);
				}
			}
		}, time);
	}
	catch (e) {
		console.error("Terms reply error", e.stack);
	}
}
