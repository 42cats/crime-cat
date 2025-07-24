const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus,
    VoiceConnectionStatus,
    getVoiceConnection,
    entersState
} = require('@discordjs/voice');
const { PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

/**
 * Discord 음성 채널 관리자
 * TTS 오디오 재생을 담당
 */
class VoiceManager {
    constructor() {
        this.connections = new Map(); // 길드별 연결 관리
        this.players = new Map(); // 길드별 플레이어 관리
        this.queues = new Map(); // 길드별 TTS 큐 관리
        this.cooldowns = new Map(); // 사용자별 쿨다운 관리
        
        this.maxConcurrentRequests = parseInt(process.env.TTS_MAX_CONCURRENT_REQUESTS) || 3;
        this.cooldownSeconds = parseInt(process.env.TTS_COOLDOWN_SECONDS) || 5;
        
        console.log('[VoiceManager] 음성 관리자가 초기화되었습니다.');
    }

    /**
     * 사용자 권한 확인
     * @param {GuildMember} member - 확인할 멤버
     * @param {VoiceChannel} voiceChannel - 음성 채널
     * @returns {Object} 권한 확인 결과
     */
    checkPermissions(member, voiceChannel) {
        // 사용자가 음성 채널에 있는지 확인
        if (!member.voice.channel) {
            return { 
                allowed: false, 
                error: '🔊 먼저 음성 채널에 접속해주세요!' 
            };
        }

        // 봇이 해당 채널에 접속할 권한이 있는지 확인
        const botPermissions = voiceChannel.permissionsFor(member.guild.members.me);
        if (!botPermissions.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])) {
            return { 
                allowed: false, 
                error: '❌ 해당 음성 채널에 접속하거나 말할 권한이 없습니다!' 
            };
        }

        return { allowed: true };
    }

    /**
     * 쿨다운 확인
     * @param {string} userId - 사용자 ID
     * @returns {Object} 쿨다운 확인 결과
     */
    checkCooldown(userId) {
        const now = Date.now();
        const userCooldown = this.cooldowns.get(userId);
        
        if (userCooldown && (now - userCooldown) < (this.cooldownSeconds * 1000)) {
            const remainingTime = Math.ceil((this.cooldownSeconds * 1000 - (now - userCooldown)) / 1000);
            return {
                onCooldown: true,
                remainingTime,
                error: `⏱️ ${remainingTime}초 후에 다시 시도해주세요!`
            };
        }

        return { onCooldown: false };
    }

    /**
     * 쿨다운 설정
     * @param {string} userId - 사용자 ID
     */
    setCooldown(userId) {
        this.cooldowns.set(userId, Date.now());
        
        // 10분 후 쿨다운 데이터 정리
        setTimeout(() => {
            this.cooldowns.delete(userId);
        }, 10 * 60 * 1000);
    }

    /**
     * 음성 채널 연결
     * @param {VoiceChannel} voiceChannel - 연결할 음성 채널
     * @returns {Promise<VoiceConnection>} 음성 연결 객체
     */
    async joinChannel(voiceChannel) {
        try {
            const guildId = voiceChannel.guild.id;
            
            // 기존 연결이 있는지 확인
            let connection = getVoiceConnection(guildId);
            
            if (connection) {
                // 이미 같은 채널에 연결되어 있는 경우
                if (connection.joinConfig.channelId === voiceChannel.id) {
                    console.log(`[VoiceManager] 이미 연결됨: ${voiceChannel.name}`);
                    return connection;
                }
                
                // 다른 채널에 연결되어 있는 경우 연결 해제
                connection.destroy();
            }

            // 새로운 연결 생성
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guildId,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: true, // 봇이 다른 소리를 듣지 않도록
                selfMute: false
            });

            // 연결 상태 이벤트 처리
            connection.on(VoiceConnectionStatus.Ready, () => {
                console.log(`[VoiceManager] 음성 채널 연결 완료: ${voiceChannel.name}`);
            });

            connection.on(VoiceConnectionStatus.Disconnected, async () => {
                try {
                    console.log(`[VoiceManager] 음성 채널 연결 끊김: ${voiceChannel.name}`);
                    
                    // 5초 내에 재연결 시도
                    await Promise.race([
                        entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                        entersState(connection, VoiceConnectionStatus.Connecting, 5000),
                    ]);
                } catch (error) {
                    // 재연결 실패 시 정리
                    console.log(`[VoiceManager] 재연결 실패, 연결 정리: ${voiceChannel.name}`);
                    this.leaveChannel(guildId);
                }
            });

            connection.on('error', (error) => {
                console.error(`[VoiceManager] 음성 연결 오류: ${error.message}`);
                this.leaveChannel(guildId);
            });

            // 연결 저장
            this.connections.set(guildId, connection);
            
            // 연결 준비 대기
            await entersState(connection, VoiceConnectionStatus.Ready, 30000);
            
            return connection;

        } catch (error) {
            console.error(`[VoiceManager] 음성 채널 연결 실패:`, error);
            throw new Error(`음성 채널 연결에 실패했습니다: ${error.message}`);
        }
    }

    /**
     * 오디오 재생
     * @param {string} guildId - 길드 ID
     * @param {string} audioPath - 재생할 오디오 파일 경로
     * @returns {Promise<void>}
     */
    async playAudio(guildId, audioPath) {
        try {
            const connection = this.connections.get(guildId);
            if (!connection) {
                throw new Error('음성 채널에 연결되지 않았습니다.');
            }

            // 파일 존재 확인
            if (!fs.existsSync(audioPath)) {
                throw new Error('오디오 파일을 찾을 수 없습니다.');
            }

            // 기존 플레이어가 있다면 정리
            const existingPlayer = this.players.get(guildId);
            if (existingPlayer) {
                existingPlayer.stop();
            }

            // 새 플레이어 생성
            const player = createAudioPlayer();
            const resource = createAudioResource(audioPath, {
                inlineVolume: true
            });

            // 볼륨 설정 (50%)
            if (resource.volume) {
                resource.volume.setVolume(0.5);
            }

            // 플레이어 이벤트 처리
            player.on(AudioPlayerStatus.Playing, () => {
                console.log(`[VoiceManager] 오디오 재생 시작: ${audioPath}`);
            });

            player.on(AudioPlayerStatus.Idle, () => {
                console.log(`[VoiceManager] 오디오 재생 완료: ${audioPath}`);
                
                // 큐에 다음 항목이 있는지 확인
                const queue = this.queues.get(guildId);
                if (queue && queue.length > 0) {
                    const nextItem = queue.shift();
                    this.playAudio(guildId, nextItem.audioPath)
                        .then(() => nextItem.cleanup())
                        .catch(console.error);
                } else {
                    // 큐가 비어있으면 30초 후 채널에서 나가기
                    setTimeout(() => {
                        const currentQueue = this.queues.get(guildId);
                        if (!currentQueue || currentQueue.length === 0) {
                            this.leaveChannel(guildId);
                        }
                    }, 30000);
                }
            });

            player.on('error', (error) => {
                console.error(`[VoiceManager] 오디오 재생 오류:`, error);
                this.leaveChannel(guildId);
            });

            // 플레이어를 연결에 구독
            connection.subscribe(player);
            this.players.set(guildId, player);

            // 리소스 재생 시작
            player.play(resource);

            return new Promise((resolve, reject) => {
                player.once(AudioPlayerStatus.Playing, resolve);
                player.once('error', reject);
                
                // 30초 타임아웃
                setTimeout(() => {
                    reject(new Error('오디오 재생 시작 타임아웃'));
                }, 30000);
            });

        } catch (error) {
            console.error(`[VoiceManager] 오디오 재생 실패:`, error);
            throw error;
        }
    }

    /**
     * TTS 큐에 추가
     * @param {string} guildId - 길드 ID
     * @param {string} audioPath - 오디오 파일 경로
     * @param {Function} cleanup - 정리 함수
     */
    addToQueue(guildId, audioPath, cleanup) {
        if (!this.queues.has(guildId)) {
            this.queues.set(guildId, []);
        }
        
        const queue = this.queues.get(guildId);
        queue.push({ audioPath, cleanup });
        
        console.log(`[VoiceManager] TTS 큐에 추가됨 (${queue.length}번째): ${audioPath}`);
    }

    /**
     * 현재 재생 중인지 확인
     * @param {string} guildId - 길드 ID
     * @returns {boolean} 재생 중 여부
     */
    isPlaying(guildId) {
        const player = this.players.get(guildId);
        return player && player.state.status === AudioPlayerStatus.Playing;
    }

    /**
     * 음성 채널에서 나가기
     * @param {string} guildId - 길드 ID
     */
    leaveChannel(guildId) {
        try {
            // 플레이어 정리
            const player = this.players.get(guildId);
            if (player) {
                player.stop();
                this.players.delete(guildId);
            }

            // 연결 정리
            const connection = this.connections.get(guildId);
            if (connection) {
                connection.destroy();
                this.connections.delete(guildId);
            }

            // 큐 정리
            const queue = this.queues.get(guildId);
            if (queue) {
                // 큐에 있는 모든 파일의 cleanup 함수 실행
                queue.forEach(item => {
                    if (item.cleanup) {
                        item.cleanup();
                    }
                });
                this.queues.delete(guildId);
            }

            console.log(`[VoiceManager] 음성 채널에서 나갔습니다: ${guildId}`);

        } catch (error) {
            console.error(`[VoiceManager] 음성 채널 나가기 실패:`, error);
        }
    }

    /**
     * 현재 연결 상태 가져오기
     * @param {string} guildId - 길드 ID
     * @returns {Object} 연결 상태 정보
     */
    getConnectionStatus(guildId) {
        const connection = this.connections.get(guildId);
        const player = this.players.get(guildId);
        const queue = this.queues.get(guildId);

        return {
            connected: !!connection,
            connectionState: connection?.state?.status || 'disconnected',
            playing: this.isPlaying(guildId),
            playerState: player?.state?.status || 'idle',
            queueLength: queue?.length || 0
        };
    }

    /**
     * 모든 연결 정리 (봇 종료 시)
     */
    cleanup() {
        console.log('[VoiceManager] 모든 음성 연결을 정리합니다...');
        
        for (const guildId of this.connections.keys()) {
            this.leaveChannel(guildId);
        }
        
        this.connections.clear();
        this.players.clear();
        this.queues.clear();
        this.cooldowns.clear();
    }
}

module.exports = VoiceManager;