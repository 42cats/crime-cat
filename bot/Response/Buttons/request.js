const { Client, ButtonInteraction } = require('discord.js');
const dotenv = require('dotenv');
const delayedDeleteMessage = require('../../Commands/utility/deleteMsg');
dotenv.config();
const { decodeFromString } = require('../../Commands/utility/delimiterGeter');
const {
	AudioPlayerStatus,
} = require('@discordjs/voice');


module.exports = {

	name: "request",
	/**
	 * 
	 * @param {Client} client 
	 * @param {ButtonInteraction} interaction 
	 * @returns 
	*/
	execute: async (client, interaction) => {
		const { head, command, option } = decodeFromString(interaction.customId);
		if (option === 'accept') {
			if (this.interactionMsg) {
				// 시스템 메시지 확인 추가
				if (this.interactionMsg.deletable && !this.interactionMsg.system) {
					this.interactionMsg.delete().catch(err => console.error('메시지 삭제 오류:', err));
					return true;
				} else {
					console.log("시스템 메시지이거나 삭제할 수 없는 메시지입니다.");
					return false;
				}
			}
			const target = await client.user.fetch(head);
			target?.send("협조에 감사드립니다!");
		}
		else if (option === 'refuse') {
			if (this.interactionMsg) {
				// 시스템 메시지 확인 추가
				if (this.interactionMsg.deletable && !this.interactionMsg.system) {
					this.interactionMsg.delete().catch(err => console.error('메시지 삭제 오류:', err));
					return true;
				} else {
					console.log("시스템 메시지이거나 삭제할 수 없는 메시지입니다.");
					return false;
				}
			}
			const target = await client.user.fetch(head);
			target?.send("약관에 동의하지 않으면 사용할 수 없습니다.");
			const list = [...client.guilds.valueOf().values()];
			list.map(v => {
				if (v.ownerId === head)
					v.leave();
			})
		}
	}
}