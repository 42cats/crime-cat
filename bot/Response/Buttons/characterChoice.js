const { Client, ButtonBuilder, ActionRowBuilder, ButtonInteraction } = require('discord.js');
const path = require('node:path');
const dotenv = require('dotenv');
const delayedDeleteMessage = require('../../Commands/utility/deleteMsg');
dotenv.config();
const delimiterGeter = require('../../Commands/utility/delimiterGeter');
const GamePlayInfo = require('../../Commands/utility/UserinfoInRedis');
const { sendGameStartDM } = require('../../Commands/utility/broadcastGameStart');
module.exports = {
	name: "characterChoice",
	/**
	 * @param {Client} client 
	 * @param {ButtonInteraction} interaction 
	 * @returns 
	 */
	execute: async (client, interaction) => {
		try {
			const targetUserId = interaction.user.id;
			const { guild } = interaction;
			const { option, otherOption } = delimiterGeter(interaction.customId);
			console.log("button interacion ", option, otherOption);
			const member = interaction.guild.members.cache.get(targetUserId);
			// 타겟 유저 가져오기
			if (!member) {
				await interaction.reply({ content: "타겟 유저를 찾을 수 없습니다.", ephemeral: true });
				return;
			}

			console.log("롤 이름:", member.displayName, member.nickname);
			// 닉네임 변경
			if (option) {
				await member.setNickname(option);
				console.log(`${member.user.tag}의 닉네임이 ${option}(으)로 변경되었습니다.`);
			}
			let playinfo = null;

			if (await client.redis.exists(guild.id)) {
				const object = JSON.parse(await client.redis.get(guild.id));
				console.log(typeof object, object);

				// 기존 object를 GamePlayInfo 인스턴스로 변환
				playinfo = new GamePlayInfo(object.guild);
				playinfo.setPlayers(new Map(Object.entries(object.players))); // players 복원
				playinfo.isBrodcast = object.isBrodcast; // isBrodcast 상태 유지

			} else {
				playinfo = new GamePlayInfo(guild);
			}

			playinfo.addUser(option, member);
			await client.redis.set(guild.id, JSON.stringify(playinfo));
			// 역할 부여
			if (otherOption && otherOption !== 'null') {
				const role = interaction.guild.roles.cache.find(r => r.id === otherOption);

				if (!role) {
					await interaction.reply({ content: `역할 을(를) 찾을 수 없습니다. 역할이 삭제되고 다시 추가되었거나 수정되었는지 진행자에게 문의하세요`, ephemeral: true });
					return;
				}

				if (!member.roles.cache.has(role.id)) {
					try {
						await member.roles.add(role);
					} catch (e) {
						await interaction.reply({
							content: `봇에게 해당 유저의 권한을 변경할 권한이 없습니다. 
							해당 유저보다 권한 레벨이 낮거나 봇이 현재 가지고 있는 권한 레벨보다 높은 권한을 부여하려고 할 때 발생합니다.`,
							ephemeral: true,
						});
						return;
					}
					console.log(`${member.user.tag}에게 역할 ${role.name}(이)가 부여되었습니다.`);
				}
			}

			// 버튼 비활성화 처리
			let disableCount = 0;
			const updatedComponents = interaction.message.components.map((row) => {
				const actionRow = ActionRowBuilder.from(row);
				actionRow.components = row.components.map((button) => {
					const buttonBuilder = ButtonBuilder.from(button);
					if (button.customId === interaction.customId) {
						buttonBuilder.setDisabled(true);
						buttonBuilder.setLabel(`${member.user.globalName} 님이 ${option}역 준비됨`);
					}
					if (buttonBuilder.data.disabled) disableCount++;
					return buttonBuilder;
				});
				return actionRow;
			});
			console.log("disable count ", disableCount, interaction.message.components.length);
			if (disableCount === interaction.message.components.length) {
				//brodcast Funcuion run;
				await sendGameStartDM(client, guild.id, playinfo.getUsersName());
				console.log("브로드캐스트 ", playinfo.getUsersName());
				await client.redis.del(guild.id);
			}
			// 메시지 업데이트
			await interaction.update({
				components: updatedComponents,
			});
			const msg = await interaction.message.channel.send({ content: `${interaction.user.username || interaction.user.globalName} 님이 ${option}역 준비 완료되었습니다.`, });
			await delayedDeleteMessage(msg, 2);
			console.log("성공적으로 업데이트 완료");
		} catch (error) {
			console.error("Error in responseCharacterSelect:", error);
			try {
				await interaction.reply({ content: "오류가 발생했습니다. 다시 시도해주세요.", ephemeral: true });
			} catch (err) {
				console.error("Additional error while replying:", err);
			}
		}
	},
};