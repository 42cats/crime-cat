const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const TTSEngine = require('./utility/ttsEngine');
const VoiceManager = require('./utility/voiceManager');

// 전역 인스턴스 (봇 전체에서 공유)
let ttsEngine = null;
let voiceManager = null;

// 인스턴스 초기화
function initializeInstances() {
    if (!ttsEngine) {
        try {
            ttsEngine = new TTSEngine();
        } catch (error) {
            console.error('[TTS Command] TTS 엔진 초기화 실패:', error);
            ttsEngine = null;
        }
    }
    
    if (!voiceManager) {
        voiceManager = new VoiceManager();
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tts')
        .setDescription('텍스트를 음성으로 변환하여 음성 채널에서 재생합니다')
        .addStringOption(option =>
            option.setName('텍스트')
                .setDescription('음성으로 변환할 텍스트 (최대 500자)')
                .setRequired(true)
                .setMaxLength(500)
        )
        .addStringOption(option =>
            option.setName('언어')
                .setDescription('음성 언어 선택')
                .setRequired(false)
                .addChoices(
                    { name: '한국어', value: 'ko-KR' },
                    { name: '영어 (미국)', value: 'en-US' },
                    { name: '일본어', value: 'ja-JP' },
                    { name: '중국어 (간체)', value: 'zh-CN' }
                )
        )
        .addStringOption(option =>
            option.setName('음성')
                .setDescription('음성 타입 선택')
                .setRequired(false)
                .addChoices(
                    { name: '한국어 웨이브넷 A (여성)', value: 'ko-KR-Wavenet-A' },
                    { name: '한국어 웨이브넷 B (여성)', value: 'ko-KR-Wavenet-B' },
                    { name: '한국어 웨이브넷 C (남성)', value: 'ko-KR-Wavenet-C' },
                    { name: '한국어 웨이브넷 D (남성)', value: 'ko-KR-Wavenet-D' },
                    { name: '영어 웨이브넷 A (여성)', value: 'en-US-Wavenet-A' },
                    { name: '영어 웨이브넷 B (남성)', value: 'en-US-Wavenet-B' },
                    { name: '영어 웨이브넷 C (여성)', value: 'en-US-Wavenet-C' },
                    { name: '영어 웨이브넷 D (남성)', value: 'en-US-Wavenet-D' }
                )
        )
        .addNumberOption(option =>
            option.setName('속도')
                .setDescription('재생 속도 (0.25 ~ 4.0, 기본값: 1.0)')
                .setRequired(false)
                .setMinValue(0.25)
                .setMaxValue(4.0)
        ),

    category: 'utility',
    cooldown: 5,

    async execute(interaction) {
        try {
            // 인스턴스 초기화
            initializeInstances();

            // TTS 엔진 사용 불가 시
            if (!ttsEngine) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('❌ TTS 서비스 오류')
                    .setDescription('TTS 서비스가 현재 사용할 수 없습니다.\n관리자에게 문의해주세요.')
                    .setTimestamp();

                return await interaction.reply({ 
                    embeds: [errorEmbed], 
                    ephemeral: true 
                });
            }

            await interaction.deferReply();

            const text = interaction.options.getString('텍스트');
            const language = interaction.options.getString('언어') || 'ko-KR';
            const voice = interaction.options.getString('음성') || 'ko-KR-Wavenet-A';
            const speed = interaction.options.getNumber('속도') || 1.0;
            
            const member = interaction.member;
            const voiceChannel = member.voice.channel;

            // 권한 확인
            const permissionCheck = voiceManager.checkPermissions(member, voiceChannel);
            if (!permissionCheck.allowed) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('❌ 권한 오류')
                    .setDescription(permissionCheck.error)
                    .setTimestamp();

                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            // 쿨다운 확인
            const cooldownCheck = voiceManager.checkCooldown(member.id);
            if (cooldownCheck.onCooldown) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xffaa00)
                    .setTitle('⏱️ 쿨다운')
                    .setDescription(cooldownCheck.error)
                    .setTimestamp();

                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            // 진행 상황 표시
            const processingEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('🔄 TTS 처리 중...')
                .setDescription(`**텍스트:** ${text.length > 100 ? text.substring(0, 100) + '...' : text}\n**언어:** ${language}\n**음성:** ${voice}\n**속도:** ${speed}x`)
                .addFields(
                    { name: '단계 1', value: '✅ 텍스트 검증 완료', inline: true },
                    { name: '단계 2', value: '🔄 음성 합성 중...', inline: true },
                    { name: '단계 3', value: '⏳ 대기 중...', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [processingEmbed] });

            // TTS 옵션 설정
            const ttsOptions = {
                language: language,
                voice: voice,
                speed: speed
            };

            // TTS 생성
            let audioPath;
            try {
                audioPath = await ttsEngine.generateSpeech(text, ttsOptions);
            } catch (error) {
                console.error('[TTS Command] TTS 생성 실패:', error);
                
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('❌ TTS 생성 실패')
                    .setDescription(`음성 합성 중 오류가 발생했습니다:\n\`\`\`${error.message}\`\`\``)
                    .setTimestamp();

                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            // 음성 채널 연결 및 재생
            try {
                // 단계 2 완료 표시
                processingEmbed.setFields(
                    { name: '단계 1', value: '✅ 텍스트 검증 완료', inline: true },
                    { name: '단계 2', value: '✅ 음성 합성 완료', inline: true },
                    { name: '단계 3', value: '🔄 음성 채널 연결 중...', inline: true }
                );
                await interaction.editReply({ embeds: [processingEmbed] });

                // 음성 채널 연결
                await voiceManager.joinChannel(voiceChannel);

                // 쿨다운 설정
                voiceManager.setCooldown(member.id);

                // 현재 재생 중인지 확인
                if (voiceManager.isPlaying(interaction.guildId)) {
                    // 큐에 추가
                    voiceManager.addToQueue(interaction.guildId, audioPath, () => {
                        ttsEngine.cleanupTempFile(audioPath);
                    });

                    const queueEmbed = new EmbedBuilder()
                        .setColor(0x00aaff)
                        .setTitle('📝 TTS 큐에 추가됨')
                        .setDescription(`**텍스트:** ${text.length > 100 ? text.substring(0, 100) + '...' : text}`)
                        .addFields(
                            { name: '언어', value: language, inline: true },
                            { name: '음성', value: voice, inline: true },
                            { name: '속도', value: `${speed}x`, inline: true },
                            { name: '대기열 위치', value: `${voiceManager.queues.get(interaction.guildId)?.length || 0}번째`, inline: true }
                        )
                        .setFooter({ text: '현재 다른 TTS가 재생 중입니다. 잠시만 기다려주세요.' })
                        .setTimestamp();

                    await interaction.editReply({ embeds: [queueEmbed] });
                } else {
                    // 즉시 재생
                    await voiceManager.playAudio(interaction.guildId, audioPath);
                    
                    // 재생 완료 후 파일 정리를 위한 타이머 설정
                    setTimeout(() => {
                        ttsEngine.cleanupTempFile(audioPath);
                    }, 10000); // 10초 후 정리

                    const successEmbed = new EmbedBuilder()
                        .setColor(0x00ff00)
                        .setTitle('🔊 TTS 재생 시작!')
                        .setDescription(`**텍스트:** ${text.length > 100 ? text.substring(0, 100) + '...' : text}`)
                        .addFields(
                            { name: '언어', value: language, inline: true },
                            { name: '음성', value: voice, inline: true },
                            { name: '속도', value: `${speed}x`, inline: true },
                            { name: '채널', value: voiceChannel.name, inline: true }
                        )
                        .setFooter({ text: `요청자: ${member.displayName}` })
                        .setTimestamp();

                    await interaction.editReply({ embeds: [successEmbed] });
                }

            } catch (error) {
                console.error('[TTS Command] 음성 재생 실패:', error);
                
                // 실패 시 임시 파일 정리
                await ttsEngine.cleanupTempFile(audioPath);

                const errorEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('❌ 음성 재생 실패')
                    .setDescription(`음성 재생 중 오류가 발생했습니다:\n\`\`\`${error.message}\`\`\``)
                    .setTimestamp();

                await interaction.editReply({ embeds: [errorEmbed] });
            }

        } catch (error) {
            console.error('[TTS Command] 명령어 실행 실패:', error);

            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('❌ 시스템 오류')
                .setDescription(`명령어 실행 중 예상치 못한 오류가 발생했습니다:\n\`\`\`${error.message}\`\`\``)
                .setTimestamp();

            try {
                if (interaction.deferred) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            } catch (replyError) {
                console.error('[TTS Command] 응답 전송 실패:', replyError);
            }
        }
    },

    // 헬스 체크 함수
    async healthCheck() {
        initializeInstances();
        
        if (!ttsEngine) {
            return { healthy: false, error: 'TTS 엔진 초기화 실패' };
        }

        try {
            const isHealthy = await ttsEngine.healthCheck();
            return { 
                healthy: isHealthy, 
                error: !isHealthy ? 'TTS 서비스 응답 없음' : null 
            };
        } catch (error) {
            return { 
                healthy: false, 
                error: `TTS 헬스 체크 실패: ${error.message}` 
            };
        }
    },

    // 정리 함수 (봇 종료 시)
    cleanup() {
        if (voiceManager) {
            voiceManager.cleanup();
        }
        if (ttsEngine) {
            ttsEngine.cleanupOldTempFiles();
        }
    }
};