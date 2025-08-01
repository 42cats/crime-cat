// commands/clearSuspect.js
const { Message, SlashCommandBuilder } = require('discord.js');
const path = require('path');

// Redis에 저장된 대화 이력을 삭제하는 함수
async function clearConversation(redisClient, fieldName) {
  const key = "aiHistory";
  // fieldName = `${suspectName}_${guildId}`
  try {
    // Redis hash에서 해당 field만 삭제
    await redisClient.deleteField(key, fieldName);
    console.log(`🗑️ Redis: [${key}]에서 필드 [${fieldName}] 삭제`);
  } catch (err) {
    console.error('❌ Redis 대화 이력 삭제 중 오류:', err);
    throw err;
  }
}

const commandName = "심문초기화";
const commandDesc = "해당 용의자의 대화 이력을 초기화합니다.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(commandName)
    .setDescription(commandDesc),

  async execute(interaction) {
    await interaction.reply('Pong! 심문초기화 슬래시 명령어');
  },

  prefixCommand: {
    name: commandName,
    description: commandDesc,
    /**
     * @param {Message} message
     * @param {Array} args
     */
    async execute(message, args) {
      const redisManager = message.client.redis;

      // 1) 용의자 이름 파라미터 받기
      // ex: "!심문초기화 김창식"
	  console.log(args);
      if (!args[0]) {
        return message.reply(`❌ 용의자 이름을 입력해주세요. 예: \`!${commandName} 김창식\``);
      }
      const suspectName = args[0];
      // 현재 길드ID
      const guildId = message.guild?.id;
      if (!guildId) {
        return message.reply('❌ 길드 정보가 없습니다.');
      }

      // 2) Redis 필드 네임
      //    심문 명령어에서 사용했던 `${suspectName}_${guildId}`와 동일해야 함
      const fieldName = `${suspectName}_${guildId}`;

      // 3) Redis에서 해당 대화이력 삭제
      try {
        await clearConversation(redisManager, fieldName);
        message.reply(`✅ 용의자 [${suspectName}]과의 대화 이력이 초기화되었습니다.`);
      } catch (err) {
        message.reply('❌ 대화 이력 초기화 중 오류가 발생했습니다.');
      }
    }
  },

  upload: false,
  permissionLevel: -1,
  isCacheCommand: false,
};
