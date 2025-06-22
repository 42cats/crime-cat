const { BaseActionExecutor } = require('./BaseActionExecutor');

/**
 * 음악 관리 액션 실행기
 * play_music, stop_music, pause_music 액션 처리
 * 기존 음악 시스템과 연동
 */
class MusicActionExecutor extends BaseActionExecutor {
    constructor(type) {
        super(type);
        this.requiredPermissions = ['CONNECT', 'SPEAK'];
        this.supportedTargets = ['executor']; // 음악은 실행자의 음성 채널에서만 작동
        this.retryable = true;
        this.rollbackable = false; // 음악 재생은 롤백 개념이 적합하지 않음
    }

    /**
     * 음악 액션 실행
     */
    async performAction(action, context) {
        const { type } = action;
        const { searchQuery, volume, seek, shuffle, loop } = action.parameters;
        const { member: executorMember, guild, channel } = context;

        // 실행자가 음성 채널에 연결되어 있는지 확인
        const voiceChannel = executorMember.voice.channel;
        if (!voiceChannel) {
            throw new Error('음성 채널에 연결된 후 사용해주세요.');
        }

        // 봇이 음성 채널에 연결할 권한이 있는지 확인
        const permissions = voiceChannel.permissionsFor(guild.members.me);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            throw new Error('해당 음성 채널에 연결하거나 말할 권한이 없습니다.');
        }

        try {
            let result;

            switch (type) {
                case 'play_music':
                    result = await this.playMusic(searchQuery, voiceChannel, channel, {
                        volume,
                        seek,
                        shuffle,
                        loop
                    });
                    break;

                case 'stop_music':
                    result = await this.stopMusic(voiceChannel, guild);
                    break;

                case 'pause_music':
                    result = await this.pauseMusic(voiceChannel, guild);
                    break;

                default:
                    throw new Error(`지원하지 않는 음악 액션: ${type}`);
            }

            return this.formatResult(
                result.success,
                {
                    actionType: type,
                    voiceChannelId: voiceChannel.id,
                    voiceChannelName: voiceChannel.name,
                    ...result.data
                },
                result.message,
                result.success ? null : new Error(result.message)
            );

        } catch (error) {
            return this.formatResult(
                false,
                {
                    actionType: type,
                    voiceChannelId: voiceChannel.id,
                    error: error.message
                },
                `음악 ${this.getActionName(type)} 실패: ${error.message}`,
                error
            );
        }
    }

    /**
     * 음악 재생
     */
    async playMusic(searchQuery, voiceChannel, textChannel, options = {}) {
        if (!searchQuery) {
            throw new Error('재생할 음악을 검색어로 입력해주세요.');
        }

        try {
            // 기존 음악 시스템의 play 명령어 로직을 재사용
            // 실제 구현에서는 기존 MusicService 또는 play 명령어와 연동
            const musicService = this.getMusicService();
            
            if (!musicService) {
                throw new Error('음악 서비스를 사용할 수 없습니다.');
            }

            // 큐에 음악 추가 및 재생
            const track = await musicService.search(searchQuery);
            if (!track) {
                throw new Error('음악을 찾을 수 없습니다.');
            }

            const queue = musicService.getQueue(voiceChannel.guild.id);
            const wasEmpty = !queue || queue.length === 0;

            await musicService.addToQueue(voiceChannel.guild.id, track, {
                voiceChannel,
                textChannel,
                requestedBy: textChannel.guild.members.me
            });

            // 옵션 적용
            if (options.volume !== undefined) {
                await musicService.setVolume(voiceChannel.guild.id, options.volume);
            }

            if (options.shuffle) {
                await musicService.shuffle(voiceChannel.guild.id);
            }

            if (options.loop !== undefined) {
                await musicService.setLoop(voiceChannel.guild.id, options.loop);
            }

            // 즉시 재생 (큐가 비어있었던 경우) 또는 큐에 추가
            if (wasEmpty) {
                await musicService.play(voiceChannel.guild.id);
            }

            return {
                success: true,
                message: wasEmpty ? 
                    `🎵 **${track.title}** 재생을 시작했습니다.` :
                    `🎵 **${track.title}** 을(를) 대기열에 추가했습니다.`,
                data: {
                    track: {
                        title: track.title,
                        duration: track.duration,
                        url: track.url
                    },
                    queuePosition: wasEmpty ? 0 : queue.length,
                    options
                }
            };

        } catch (error) {
            return {
                success: false,
                message: error.message,
                data: { searchQuery, options }
            };
        }
    }

    /**
     * 음악 정지
     */
    async stopMusic(voiceChannel, guild) {
        try {
            const musicService = this.getMusicService();
            
            if (!musicService) {
                return {
                    success: false,
                    message: '음악 서비스를 사용할 수 없습니다.',
                    data: {}
                };
            }

            const queue = musicService.getQueue(guild.id);
            if (!queue || queue.length === 0) {
                return {
                    success: true,
                    message: '현재 재생 중인 음악이 없습니다.',
                    data: { wasPlaying: false }
                };
            }

            await musicService.stop(guild.id);
            await musicService.disconnect(guild.id);

            return {
                success: true,
                message: '🛑 음악 재생을 정지하고 음성 채널에서 나갔습니다.',
                data: { 
                    wasPlaying: true,
                    clearedQueueCount: queue.length
                }
            };

        } catch (error) {
            return {
                success: false,
                message: error.message,
                data: {}
            };
        }
    }

    /**
     * 음악 일시정지/재개
     */
    async pauseMusic(voiceChannel, guild) {
        try {
            const musicService = this.getMusicService();
            
            if (!musicService) {
                return {
                    success: false,
                    message: '음악 서비스를 사용할 수 없습니다.',
                    data: {}
                };
            }

            const queue = musicService.getQueue(guild.id);
            if (!queue || queue.length === 0) {
                return {
                    success: false,
                    message: '현재 재생 중인 음악이 없습니다.',
                    data: { wasPlaying: false }
                };
            }

            const isPaused = musicService.isPaused(guild.id);
            
            if (isPaused) {
                await musicService.resume(guild.id);
                return {
                    success: true,
                    message: '▶️ 음악 재생을 재개했습니다.',
                    data: { action: 'resumed', wasPaused: true }
                };
            } else {
                await musicService.pause(guild.id);
                return {
                    success: true,
                    message: '⏸️ 음악을 일시정지했습니다.',
                    data: { action: 'paused', wasPaused: false }
                };
            }

        } catch (error) {
            return {
                success: false,
                message: error.message,
                data: {}
            };
        }
    }

    /**
     * 음악 서비스 인스턴스 가져오기
     * 실제 구현에서는 기존 음악 시스템의 서비스 클래스와 연동
     */
    getMusicService() {
        // 실제 구현 시 기존 음악 시스템과 연동
        // 예: return require('../../../music/MusicService').getInstance();
        
        // 임시 모킹 (실제 구현 필요)
        return {
            search: async (query) => {
                // YouTube/Spotify 검색 로직
                return {
                    title: query,
                    duration: '3:30',
                    url: 'https://example.com/music'
                };
            },
            getQueue: (guildId) => {
                // 길드별 음악 큐 반환
                return [];
            },
            addToQueue: async (guildId, track, options) => {
                // 큐에 트랙 추가
                return true;
            },
            play: async (guildId) => {
                // 음악 재생 시작
                return true;
            },
            stop: async (guildId) => {
                // 음악 정지 및 큐 클리어
                return true;
            },
            pause: async (guildId) => {
                // 음악 일시정지
                return true;
            },
            resume: async (guildId) => {
                // 음악 재개
                return true;
            },
            disconnect: async (guildId) => {
                // 음성 채널 연결 해제
                return true;
            },
            isPaused: (guildId) => {
                // 일시정지 상태 확인
                return false;
            },
            setVolume: async (guildId, volume) => {
                // 볼륨 설정
                return true;
            },
            shuffle: async (guildId) => {
                // 큐 셔플
                return true;
            },
            setLoop: async (guildId, mode) => {
                // 반복 모드 설정
                return true;
            }
        };
    }

    /**
     * 액션 이름 반환
     */
    getActionName(actionType) {
        const names = {
            'play_music': '재생',
            'stop_music': '정지',
            'pause_music': '일시정지'
        };
        return names[actionType] || '처리';
    }

    /**
     * 음악 액션 유효성 검증 (오버라이드)
     */
    async validate(action, context) {
        await super.validate(action, context);

        // 음악 액션은 실행자만 대상으로 함
        if (action.target !== 'executor') {
            throw new Error('음악 액션은 버튼을 누른 사람만 대상으로 할 수 있습니다.');
        }

        // play_music 액션의 경우 검색어 필수
        if (action.type === 'play_music' && !action.parameters.searchQuery) {
            throw new Error('재생할 음악의 검색어가 필요합니다.');
        }
    }
}

module.exports = { MusicActionExecutor };