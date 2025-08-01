const { Client, Message, AttachmentBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const prefix = process.env.PRIFIX;
const nameOfCommand = "이미지";
const description = "이미지를 생성합니다";
const model = genAI.getGenerativeModel({
	model: "gemini-2.0-flash-exp-image-generation", // 안정적인 모델 사용
	generationConfig: {
		responseModalities: ['Text', 'Image'] // 응답 모달리티 설정
	},
});

const generationConfigBase = {
	temperature: 1,
	topP: 0.95,
	topK: 40,
	maxOutputTokens: 8192,
};

const defaultPrompt = "A detailed image filled with rich texture and vivid colors, showcasing a fascinating subject, perhaps a surreal or abstract scene, with a soft glow and intricate details, with the composition centered and a cinematic feel using a Canon EOS R5 camera in a contemporary style with dynamic range, offering a thought-provoking and captivating visual experience. **Ensure the output is a visual image.** If an image cannot be generated, return a descriptive text. you dont need detail jut draw anythings**";

module.exports = {
	// 슬래시 명령어 정의
	data: new SlashCommandBuilder()
		.setName(nameOfCommand)
		.setDescription('입력한 설명을 기반으로 이미지를 생성합니다!')
		.addStringOption(option =>
			option.setName('prompt')
				.setDescription('생성할 이미지의 설명을 입력하세요')
				.setRequired(false) // Changed to false, so it's optional
		),

	// 슬래시 명령어 실행
	async execute(interaction) {
		await interaction.deferReply();
		let prompt = interaction.options.getString('prompt');

		if (!prompt) {
			prompt = defaultPrompt;
		}

		try {
			const result = await model.generateContent(prompt);

			const response = result.response;
			if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts || response.candidates[0].content.parts.length === 0) {
				await interaction.editReply('이미지 생성에 실패했습니다. 응답 형식을 확인해주세요.');
				return;
			}

			const parts = response.candidates[0].content.parts;
			const attachments = [];
			let textResponse = '';

			for (const part of parts) {
				if (part.text) {
					textResponse += part.text + '\n';
				} else if (part.inlineData) {
					const imageData = part.inlineData.data;
					const buffer = Buffer.from(imageData, 'base64');
					const attachment = new AttachmentBuilder(buffer, { name: 'generated_image.png' });
					attachments.push(attachment);
				}
			}

			if (attachments.length > 0) {
				await interaction.editReply({ content: textResponse || '이미지 생성 완료!', files: attachments });
			} else if (textResponse) {
				await interaction.editReply({ content: `이미지 생성 실패. 텍스트 결과:\n${textResponse}` });
			} else {
				await interaction.editReply('이미지 데이터를 찾을 수 없습니다.');
			}

		} catch (error) {
			console.error(error);
			if (error.message && (error.message.includes('quota') || error.message.includes('rate limit'))) {
				await interaction.editReply('토큰 할당량이 초과되어 더 이상 사용할 수 없습니다.');
			} else {
				await interaction.editReply('이미지 생성 중 오류가 발생했습니다.');
			}
		}
	},

	// Prefix 명령어 정의
	prefixCommand: {
		name: nameOfCommand,
		description: '입력한 설명을 기반으로 이미지를 생성합니다!',
		/**
		 * @param {Message} message
		 * @param {Array} args
		 */
		async execute(message, args) {
			let prompt = args.join(' ');

			if (!prompt) {
				prompt = defaultPrompt;
			}

			try {
				const result = await model.generateContent(prompt);

				const response = result.response;
				if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts || response.candidates[0].content.parts.length === 0) {
					await message.reply('이미지 생성에 실패했습니다. 응답 형식을 확인해주세요.');
					return;
				}

				const parts = response.candidates[0].content.parts;
				const attachments = [];
				let textResponse = '';

				for (const part of parts) {
					if (part.text) {
						textResponse += part.text + '\n';
					} else if (part.inlineData) {
						const imageData = part.inlineData.data;
						const buffer = Buffer.from(imageData, 'base64');
						const attachment = new AttachmentBuilder(buffer, { name: 'generated_image.png' });
						attachments.push(attachment);
					}
				}

				if (attachments.length > 0) {
					await message.reply({ content: textResponse || '이미지 생성 완료!', files: attachments });
				} else if (textResponse) {
					await message.reply({ content: `이미지 생성 실패. 텍스트 결과:\n${textResponse}` });
				} else {
					await message.reply('이미지 데이터를 찾을 수 없습니다.');
				}

			} catch (error) {
				console.error(error);
				if (error.message && (error.message.includes('quota') || error.message.includes('rate limit'))) {
					await message.reply('토큰 할당량이 초과되어 더 이상 사용할 수 없습니다.');
				} else {
					await message.reply('이미지 생성 중 오류가 발생했습니다.');
				}
			}
		}
	},
	upload: false,
	permissionLevel: PermissionFlagsBits.Administrator,
	isCacheCommand: false,
};