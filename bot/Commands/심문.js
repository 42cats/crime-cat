// commands/questionSuspect.js

const { Message, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');


// (1) 길드별 요청 진행 상태를 저장할 전역 객체
//     key: guildId, value: boolean (true = 진행중, false or undefined = 미진행)
const ongoingRequests = {};

// Redis에 대화 메시지 하나 저장
async function saveMessageToRedis(client, field, messageObj) {
  const redisManager = client.redis;
  const key = "aiHistory";
  try {
    await redisManager.updateArrayInHash(key, field, messageObj);
    console.log(`✅ Redis에 [${field}] 대화 메시지 추가 완료:`, messageObj);
  } catch (error) {
    console.error('❌ Redis 저장 에러:', error);
  }
}

/**
 * Ollama 스트리밍 함수 (system+prompt 분리)
 * - 한 번만 메시지 에디트
 * - done/close/error 시 ongoingRequests[guildId] = false 로 해제
 */
async function queryOllamaStreamSingleEdit({
  client,
  systemMsg,
  userPrompt,
  channel,
  messageIdToEdit,
  fieldName,
  userQuestion,
  suspectName,
  guildId
}) {
  let accumulatedText = '';

  try {
    const response = await axios({
      method: 'post',
      url: 'http://host.docker.internal:11434/api/generate',
      responseType: 'stream',
      data: {
        model: 'gemma3:12b',
        system: systemMsg,
        prompt: userPrompt,
        stream: true
      },
    });

    response.data.on('data', async (chunk) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        try {
          const jsonData = JSON.parse(line);
          if (jsonData.done) {
            // 스트리밍 끝
            if (accumulatedText.trim()) {
              await saveMessageToRedis(client, fieldName, {
                role: 'assistant',
                content: accumulatedText,
                timestamp: Date.now()
              });
            }
            const finalMessage = `${userQuestion} 라는 질문에 ${suspectName}이 대답한다\n\n${accumulatedText}`;
            await channel.messages.edit(messageIdToEdit, finalMessage || '(응답이 비어있습니다)');

            // (A) 요청 종료 → 플래그 해제
            ongoingRequests[guildId] = false;
            return;
          }
          // 중간 토큰 누적
          if (jsonData.response) {
            accumulatedText += jsonData.response;
          }
        } catch (err) {
          // JSON 파싱 실패 → 무시
        }
      }
    });

    response.data.on('close', async () => {
      console.log('Ollama stream closed.');
      // done 신호 없이 끊겼을 경우
      if (accumulatedText.trim()) {
        await saveMessageToRedis(client, fieldName, {
          role: 'assistant',
          content: accumulatedText,
          timestamp: Date.now()
        });
      }
      const finalMessage = `${userQuestion} 라는 질문에 ${suspectName}이 대답한다\n\n${accumulatedText}`;
      await channel.messages.edit(messageIdToEdit, finalMessage || '(응답이 비어있습니다)');

      // (B) 스트림 close → 플래그 해제
      ongoingRequests[guildId] = false;
    });

  } catch (error) {
    console.error('Ollama stream error:', error);
    await channel.messages.edit(messageIdToEdit, '답변 생성 중 오류가 발생했습니다.');

    // (C) 에러 발생 → 플래그 해제
    ongoingRequests[guildId] = false;
  }
}


// 실제 명령어 구현
const nameOfCommand = "심문";
const description = "심문";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(nameOfCommand)
    .setDescription(description),

  async execute(interaction) {
    await interaction.reply('Pong! 심문 슬래시 명령어');
  },

  prefixCommand: {
    name: nameOfCommand,
    description,
    /**
     * @param {Message} message
     * @param {Array} args
     */
    async execute(message, args) {
      const guildId = message.guild?.id;
      if (!guildId) {
        return message.reply('❌ 길드 정보가 없습니다.');
      }

      // (1) 이미 이 길드에서 스트리밍 요청이 진행 중인지 확인
      if (ongoingRequests[guildId]) {
        // 진행 중이면 무시 (or 안내 메시지)
        return message.reply('⚠️ 현재 다른 심문 응답이 진행 중입니다. 잠시 후 다시 시도해주세요.');
      }

      // 진행 중이 아님 → 지금부터 요청 시작!
      ongoingRequests[guildId] = true;

      // 명령어 파싱
      if (!args[0]) {
        ongoingRequests[guildId] = false; // 입력 부족 에러로 종료
        return message.reply('❌ 용의자 이름을 입력해주세요. 예: `!심문 김창식 ...`');
      }
      const suspectName = args[0];
      const userQuestion = args.slice(1).join(' ') || '';
      if (!userQuestion.trim()) {
        ongoingRequests[guildId] = false;
        return message.reply('❌ 질문 내용을 입력해주세요. 예: `!심문 김창식 어제 뭐했어?`');
      }

      // Redis key
      const fieldName = `${suspectName}_${guildId}`;

      // (2) 유저 메시지 Redis에 추가
      const userMsgObj = { role: 'user', content: userQuestion, timestamp: Date.now() };
      try {
        await saveMessageToRedis(message.client, fieldName, userMsgObj);
      } catch (err) {
        ongoingRequests[guildId] = false;
        return message.reply('❌ Redis에 질문 저장 중 오류가 발생했습니다.');
      }

      // (3) 용의자 프로필(시스템 지침) 로드
      const prptFilePath = path.join(__dirname, '..', 'prompt', guildId, `${suspectName}.prpt`);
      let systemMsg = '';
      if (fs.existsSync(prptFilePath)) {
        systemMsg = fs.readFileSync(prptFilePath, 'utf8');
        console.log(`✅ 용의자 프로필 로드: ${prptFilePath}`);
      } else {
        console.warn(`⚠️ 용의자 프로필 파일 없음: ${prptFilePath}`);
      }

      // (4) 대화 이력 → prompt 생성
      const redisManager = message.client.redis;
      let conversationData = [];
      try {
        conversationData = await redisManager.getHash("aiHistory", fieldName) || [];
      } catch (err) {
        console.error('❌ Redis에서 대화 이력 로드 오류:', err);
      }

      const userPrompt = conversationData
        .map(msg => `(${msg.role}): ${msg.content}`)
        .join('\n');

      // (5) 초기 메시지
      const initialMessage = await message.reply(
        `${userQuestion} 라는 질문에 용의자가 대답하려고 한다...`
      );

      // (6) Ollama API 호출
      await queryOllamaStreamSingleEdit({
        client: message.client,
        systemMsg,
        userPrompt,
        channel: message.channel,
        messageIdToEdit: initialMessage.id,
        fieldName,
        userQuestion,
        suspectName,
        guildId  // 스트리밍 후 플래그 해제를 위해
      });
    }
  },

  upload: false,
  permissionLevel: -1
};
