const { Client, ButtonBuilder, ActionRowBuilder, ButtonInteraction } = require('discord.js');
const dotenv = require('dotenv');
const delayedDeleteMessage = require('../../Commands/utility/deleteMsg');
dotenv.config();

const { decodeFromString } = require('../../Commands/utility/delimiterGeter');
const { getCharacterNames } = require('../../Commands/api/character/character');
const { sendGameStartDM } = require('../../Commands/utility/broadcastGameStart');

module.exports = {
	name: "characterChoice",
	/**
	 * @param {Client} client 
	 * @param {ButtonInteraction} interaction 
	 */
	execute: async (client, interaction) => {
		try {
			const targetUserId = interaction.user.id;
			const { guild } = interaction;
			const { option: characterName } = decodeFromString(interaction.customId);
			const member = guild.members.cache.get(targetUserId);

			if (!member) {
				await interaction.reply({ content: "타겟 유저를 찾을 수 없습니다.", ephemeral: true });
				return;
			}

			// 닉네임 변경
			if (characterName) {
				await member.setNickname(characterName);
				console.log(`${member.user.tag}의 닉네임이 ${characterName}(으)로 변경되었습니다.`);
			}

			// Redis에 플레이어 정보 저장
			await client.redis.updateArrayInHashSet(
				"players",
				guild.id,
				{
					name: interaction.user.globalName,
					id: interaction.user.id,
					characterName,
					guildName: guild.name
				},
				3600 * 3
			);

			// 캐릭터 이름과 일치하는 roles 찾기
			const result = await getCharacterNames(guild.id);
			const matchedCharacter = result?.characters?.find(c => c.name === characterName);

			if (matchedCharacter && Array.isArray(matchedCharacter.roles)) {
				for (const roleId of matchedCharacter.roles) {
					const role = guild.roles.cache.get(roleId);
					if (role && !member.roles.cache.has(role.id)) {
						try {
							await member.roles.add(role);
							console.log(`${member.user.tag}에게 역할 ${role.name} 부여됨`);
						} catch (e) {
							await interaction.reply({
								content: `역할(${role.name}) 부여 실패: 봇 권한 문제일 수 있습니다.`,
								ephemeral: true
							});
							return;
						}
					}
				}
			}

			// 버튼 비활성화 및 이름 변경
			const updatedComponents = interaction.message.components.map((row) => {
				const actionRow = ActionRowBuilder.from(row);
				actionRow.components = row.components.map((button) => {
					const buttonBuilder = ButtonBuilder.from(button);
					if (button.customId === interaction.customId) {
						buttonBuilder.setDisabled(true);
						buttonBuilder.setLabel(`${member.user.globalName} 님이 ${characterName}역 준비됨`);
					}
					return buttonBuilder;
				});
				return actionRow;
			});

			// 모든 버튼이 비활성화 되었는지 체크
			const allButtons = updatedComponents.flatMap(row => row.components);
			const allDisabled = allButtons.every(button => button.data.disabled);

			if (allDisabled) {
				await sendGameStartDM(client, guild.id);
				console.log("모든 버튼 비활성화 → 게임 시작 브로드캐스트");
			}

			// 메시지 업데이트
			await interaction.update({ components: updatedComponents });


			const msg = await interaction.message.channel.send({
				content: `${interaction.user.username || interaction.user.globalName} 님이 ${characterName}역 준비 완료되었습니다.`,
			});
			await delayedDeleteMessage(msg, 2);

			console.log("캐릭터 선택 처리 성공");

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
