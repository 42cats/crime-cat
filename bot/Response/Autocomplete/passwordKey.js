const { Client, Interaction } = require('discord.js');
const { getPasswordContents, deletePasswordContent } = require('../../Commands/api/passwordNote/passwordNote');

module.exports = {
	name: "비밀번호",
	/**
	 * @param {Client} client 
	 * @param {Interaction} interaction 
	 * @returns 
	 */
	execute: async (client, interaction) => {
		const focusedOption = interaction.options.getFocused(true);
		if (focusedOption.name === '비밀번호') {
			try {
				const passwordNotes = await getPasswordContents(interaction.guildId);
				if (!passwordNotes) {
					console.log("없음");
					return interaction.respond([]);
				}
				console.log("get password data", passwordNotes);
				const inputValue = focusedOption.value.normalize("NFC").toLowerCase();
				const passwordNoteData = await Promise.all(
					passwordNotes.map(async (v) => {
					  const channel = interaction.guild.channels.cache.get(v.channelSnowflake);
				  
					  if (!channel) {
						// ❌ 채널이 캐시에 없으면 비동기로 삭제하고 이 항목은 필터에서 제외
						try {
						  await deletePasswordContent(interaction.guildId, v.passwordKey);
						  console.log(`삭제됨: ${v.passwordKey}`);
						} catch (error) {
						  console.error(`삭제 실패: ${v.passwordKey}`, error);
						}
						return null; // 🔥 이 항목은 반환하지 않음
					  }
				  
					  const name = `[${channel.name}]${v.passwordKey}`.slice(0,100);
					  // name 길이 제한 체크
				  
					  return {
						name,
						value: v.passwordKey
					  };
					})
				  );
				  const filteredPasswordNotes = passwordNoteData
				  .filter(Boolean) // null 제거
				  .filter(v => {
					if (!inputValue) return true; // 🔥 입력값 없으면 모두 허용
					return v.name.normalize("NFC").toLowerCase().includes(inputValue);
				  })
				  .slice(0, 25);
				
				await interaction.respond(filteredPasswordNotes); 
				
			} catch (error) {
				await interaction.respond([]);
				return;
			}
		}
	},
};
