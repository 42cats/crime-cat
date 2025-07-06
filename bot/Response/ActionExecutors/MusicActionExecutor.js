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
        const { searchQuery, trackId, trackTitle, volume, seek, shuffle, loop, playMode } = action.parameters;
        const { member: executorMember, guild, channel } = context;

        // 디버깅: member 정보 확인
        console.log(`🔍 [음악] Member 정보:`, {
            userId: executorMember.user.id,
            username: executorMember.user.username,
            voiceChannelId: executorMember.voice.channel?.id,
            voiceChannelName: executorMember.voice.channel?.name,
            hasVoiceChannel: !!executorMember.voice.channel
        });

        // 최신 멤버 정보로 다시 fetch (캐시된 정보가 오래된 경우)
        const freshMember = await guild.members.fetch(executorMember.user.id);
        console.log(`🔄 [음악] Fresh Member 정보:`, {
            userId: freshMember.user.id,
            username: freshMember.user.username,
            voiceChannelId: freshMember.voice.channel?.id,
            voiceChannelName: freshMember.voice.channel?.name,
            hasVoiceChannel: !!freshMember.voice.channel
        });

        // 실행자가 음성 채널에 연결되어 있는지 확인 (fresh 정보 사용)
        const voiceChannel = freshMember.voice.channel;
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
                        trackId,
                        trackTitle,
                        volume,
                        seek: action.parameters.duration,  // duration을 seek로 전달
                        shuffle,
                        loop,
                        playMode  // playMode 파라미터 추가
                    }, context);  // context 전달
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
    async playMusic(searchQuery, voiceChannel, textChannel, options = {}, context = null) {
        // searchQuery, trackId, trackTitle 중 하나라도 있으면 됨
        if (!searchQuery && !options.trackId && !options.trackTitle) {
            throw new Error('재생할 음악을 검색어, 트랙 ID 또는 트랙 제목으로 지정해주세요.');
        }

        try {
            const musicService = this.getMusicService();
            
            if (!musicService) {
                throw new Error('음악 서비스를 사용할 수 없습니다.');
            }

            // 음악 검색 또는 트랙 정보 사용
            let track;
            
            if (options.trackId && options.trackTitle) {
                // 트랙 ID와 제목이 있는 경우 바로 사용
                track = {
                    id: options.trackId,
                    title: options.trackTitle,
                    duration: '알 수 없음',
                    url: `https://youtube.com/watch?v=${options.trackId.replace('yt_', '')}`
                };
                console.log(`🎵 [음악] 사전 선택된 트랙 사용: "${track.title}" (${track.id})`);
            } else {
                // searchQuery로 검색
                const query = searchQuery || options.trackTitle;
                track = await musicService.search(query);
                if (!track) {
                    throw new Error('음악을 찾을 수 없습니다.');
                }
                console.log(`🔍 [음악] 검색으로 트랙 발견: "${track.title}"`);
            }

            // ButtonAutomationHandler의 playMusic 메서드 호출
            let memberToUse;
            if (context) {
                // context가 있으면 이미 fresh member를 사용
                const { member: executorMember, guild: contextGuild } = context;
                memberToUse = await contextGuild.members.fetch(executorMember.user.id);
            } else {
                // 직접 호출인 경우 기본값 사용
                memberToUse = textChannel.guild.members.me;
            }
            
            const result = await musicService.playMusic(voiceChannel, textChannel, track, {
                source: options.source || 'youtube',  // 파라미터에서 받은 소스 사용
                duration: options.seek,  // 재생 시간 제한
                volume: options.volume,
                playMode: options.playMode,  // 재생 모드 추가
                requestedBy: memberToUse
            });

            if (!result.success) {
                throw new Error(result.message);
            }

            return {
                success: true,
                message: result.message || `🎵 **${track.title}** 재생을 시작했습니다.`,
                data: {
                    track: {
                        title: track.title,
                        duration: track.duration,
                        url: track.url
                    },
                    ...result.data
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
     * 실제 MusicPlayerV4와 직접 연동
     */
    getMusicService() {
        const MusicPlayerV4 = require('../../Commands/utility/v4/MusicPlayerV4');
        
        return {
            // 실제 음악 재생 로직 구현
            playMusic: async (voiceChannel, textChannel, track, options) => {
                try {
                    const guild = voiceChannel.guild;
                    const member = options.requestedBy;
                    
                    // client.serverMusicData 초기화
                    if (!guild.client.serverMusicData) {
                        guild.client.serverMusicData = new Map();
                    }
                    
                    // 기존 플레이어 가져오기 또는 새로 생성
                    let musicData = guild.client.serverMusicData.get(guild.id);
                    
                    if (!musicData) {
                        console.log(`[자동화] 새 음악 플레이어 생성: ${guild.id}`);
                        musicData = new MusicPlayerV4(guild.id, guild.client, member.user);
                        guild.client.serverMusicData.set(guild.id, musicData);
                    }
                    
                    // 플레이리스트 소스 확인 및 로드 (기존/신규 플레이어 모두)
                    const sourceToLoad = options.source || 'youtube';
                    if (musicData.queue.source !== sourceToLoad) {
                        console.log(`[자동화] 소스 전환: ${musicData.queue.source || 'none'} -> ${sourceToLoad}`);
                    } else {
                        console.log(`[자동화] 소스 재확인: ${sourceToLoad}`);
                    }
                    
                    // 항상 지정된 소스로 로드 (캐시된 데이터가 있어도 새로 로드)
                    console.log(`[자동화] ${sourceToLoad} 소스 강제 로드 시작`);
                    const loaded = await musicData.queue.loadFromSource(sourceToLoad, member.user.id);
                    if (!loaded) {
                        console.warn(`[자동화] ${sourceToLoad} 플레이리스트 로드 실패`);
                        throw new Error(`${sourceToLoad} 음악 목록을 불러올 수 없습니다.`);
                    }
                    
                    // 기존 음악 정지
                    if (musicData.state.isPlaying) {
                        console.log('🛑 기존 음악 정지 후 새 음악 재생');
                        await musicData.audio.stop();
                    }
                    
                    // 음성 채널 연결
                    if (!musicData.audio.connection || musicData.audio.connection.state.status !== 'ready') {
                        console.log(`🔗 음성 채널 연결: ${voiceChannel.name}`);
                        await musicData.audio.connectToVoice(member);
                    }
                    
                    // 트랙 찾기 (trackTitle 우선, 그 다음 trackId)
                    console.log(`🔍 [음악] 트랙 검색 중: "${track.title}" (ID: ${track.id})`);
                    console.log(`📋 [음악] 사용 가능한 트랙들:`, musicData.queue.tracks.map(t => ({
                        title: t.title,
                        id: t.id,
                        url: t.youtubeUrl || t.url
                    })));
                    
                    let trackIndex = musicData.queue.tracks.findIndex(t => 
                        t.title === track.title || t.title.includes(track.title) || track.title.includes(t.title)
                    );
                    
                    // trackTitle로 못 찾았으면 trackId로 시도
                    if (trackIndex === -1) {
                        trackIndex = musicData.queue.tracks.findIndex(t => 
                            t.id === track.id || (t.youtubeUrl && t.youtubeUrl.includes(track.id.replace('yt_', '')))
                        );
                    }
                    
                    // 그래도 못 찾았으면 첫 번째 트랙으로 대체 (안전장치)
                    if (trackIndex === -1 && musicData.queue.tracks.length > 0) {
                        console.warn(`⚠️ [음악] "${track.title}" 트랙을 찾을 수 없어 첫 번째 트랙으로 대체합니다.`);
                        trackIndex = 0;
                    }
                    
                    if (trackIndex === -1) {
                        throw new Error('재생할 수 있는 음악이 없습니다. 먼저 음악을 등록해주세요.');
                    }
                    
                    console.log(`✅ [음악] 트랙 찾음: 인덱스 ${trackIndex}, 제목: "${musicData.queue.tracks[trackIndex].title}"`);
                    
                    // 트랙 설정 및 재생
                    musicData.state.currentIndex = trackIndex;
                    // 재생 모드가 single-track이 아닌 경우 자동재생 허용
                    const selectedPlayMode = options.playMode || 'single-track';
                    musicData.state.isDirectSelection = (selectedPlayMode === 'single-track');
                    
                    // v4 플레이어에서는 tracks 배열에서 직접 트랙 가져오기
                    const currentTrack = musicData.queue.tracks[trackIndex];
                    if (!currentTrack) {
                        throw new Error('현재 트랙 정보를 가져올 수 없습니다.');
                    }
                    
                    console.log(`▶️ 음악 재생 시작: ${currentTrack.title}`);
                    
                    // 재생 모드 설정 (파라미터로 받은 값 또는 기본값 single-track)
                    await musicData.setMode(selectedPlayMode);
                    console.log(`🎵 재생 모드를 ${selectedPlayMode}로 설정`);
                    // v4 AudioEngine은 트랙 객체와 사용자를 파라미터로 받음
                    await musicData.audio.play(currentTrack, member);
                    
                    // 재생 시간 제한 (duration)
                    if (options.duration && options.duration > 0) {
                        setTimeout(() => {
                            if (musicData.state.isPlaying) {
                                console.log(`⏰ 재생 시간 만료로 음악 정지: ${options.duration}초`);
                                musicData.audio.stop();
                            }
                        }, options.duration * 1000);
                    }
                    
                    // 볼륨 설정
                    if (options.volume && options.volume !== musicData.state.volume) {
                        musicData.audio.setVolume(options.volume / 100);
                    }
                    
                    return {
                        success: true,
                        message: `음악이 재생되었습니다: ${currentTrack.title}`,
                        data: {
                            track: currentTrack,
                            voiceChannel: voiceChannel.name,
                            duration: options.duration
                        }
                    };
                    
                } catch (error) {
                    console.error('음악 재생 오류:', error);
                    return {
                        success: false,
                        message: error.message,
                        data: {}
                    };
                }
            },
            
            // 기본 음악 서비스 메서드들
            search: async (query) => {
                // 실제로는 사용되지 않음 (track이 이미 선택됨)
                return {
                    title: query,
                    duration: '알 수 없음',
                    url: `https://youtube.com/results?search_query=${encodeURIComponent(query)}`
                };
            },
            
            getQueue: (guildId) => {
                const client = require('../../main').client;
                const musicData = client.serverMusicData?.get(guildId);
                return musicData?.queue?.tracks || [];
            },
            
            addToQueue: async (guildId, track, options) => {
                // playMusic 메서드에서 처리
                return true;
            },
            
            play: async (guildId) => {
                // playMusic 메서드에서 처리
                return true;
            },
            
            stop: async (guildId) => {
                const client = require('../../main').client;
                const musicData = client.serverMusicData?.get(guildId);
                
                if (musicData && musicData.audio) {
                    await musicData.audio.stop();
                    return true;
                }
                return false;
            },
            
            pause: async (guildId) => {
                const client = require('../../main').client;
                const musicData = client.serverMusicData?.get(guildId);
                
                if (musicData && musicData.audio) {
                    musicData.audio.pause();
                    return true;
                }
                return false;
            },
            
            resume: async (guildId) => {
                const client = require('../../main').client;
                const musicData = client.serverMusicData?.get(guildId);
                
                if (musicData && musicData.audio) {
                    musicData.audio.resume();
                    return true;
                }
                return false;
            },
            
            disconnect: async (guildId) => {
                const client = require('../../main').client;
                const musicData = client.serverMusicData?.get(guildId);
                
                if (musicData && musicData.audio) {
                    musicData.audio.disconnect();
                    musicData.destroy();
                    client.serverMusicData.delete(guildId);
                    return true;
                }
                return false;
            },
            
            isPaused: (guildId) => {
                const client = require('../../main').client;
                const musicData = client.serverMusicData?.get(guildId);
                return musicData?.state?.isPaused || false;
            },
            
            setVolume: async (guildId, volume) => {
                const client = require('../../main').client;
                const musicData = client.serverMusicData?.get(guildId);
                
                if (musicData && musicData.audio) {
                    musicData.audio.setVolume(volume / 100);
                    return true;
                }
                return false;
            },
            
            shuffle: async (guildId) => {
                const client = require('../../main').client;
                const musicData = client.serverMusicData?.get(guildId);
                
                if (musicData && musicData.queue) {
                    musicData.queue.shuffle();
                    return true;
                }
                return false;
            },
            
            setLoop: async (guildId, mode) => {
                const client = require('../../main').client;
                const musicData = client.serverMusicData?.get(guildId);
                
                if (musicData) {
                    musicData.state.loopMode = mode;
                    return true;
                }
                return false;
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

        // play_music 액션의 경우 검색어, 트랙 ID 또는 트랙 제목 중 하나 필수
        if (action.type === 'play_music' && !action.parameters.searchQuery && !action.parameters.trackId && !action.parameters.trackTitle) {
            throw new Error('재생할 음악의 검색어, 트랙 ID 또는 트랙 제목이 필요합니다.');
        }
    }
}

module.exports = { MusicActionExecutor };