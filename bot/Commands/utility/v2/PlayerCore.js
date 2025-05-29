/**
 * PlayerCore v2.0
 * 순수 재생 로직 시스템
 * 
 * 설계 원칙:
 * - Pure Function: 상태 변경 없는 순수 함수
 * - Single Purpose: 오직 재생 관련 기능만
 * - Event-Driven: 모든 상태 변화는 이벤트로 알림
 * - Resource Management: 자동 리소스 정리
 */

const { spawn } = require('child_process');
const fs = require('fs');
const {
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    joinVoiceChannel,
    getVoiceConnection,
    VoiceConnectionStatus,
    StreamType,
} = require('@discordjs/voice');

class PlayerCore {
    constructor(guildId, eventBus) {
        this.guildId = guildId;
        this.eventBus = eventBus;
        
        // 재생 상태
        this.currentState = 'IDLE'; // IDLE, LOADING, PLAYING, PAUSED, STOPPING
        this.currentTrack = null;
        this.currentIndex = -1;
        
        // Discord.js 음성 관련
        this.connection = null;
        this.player = createAudioPlayer();
        this.volume = 0.5;
        
        // 리소스 관리
        this.currentProcess = null;
        this.currentResource = null;
        this.volumeControl = null;
        
        // 페이드 효과
        this.fadeInInterval = null;
        this.fadeOutInterval = null;
        
        // 상태 변화 추적
        this.setupPlayerEventHandlers();
        
        console.log(`[PlayerCore v2.0] Initialized for guild: ${this.guildId}`);
    }

    /**
     * 플레이어 이벤트 핸들러 설정 (한 번만)
     */
    setupPlayerEventHandlers() {
        // 상태 변화 추적
        this.player.on('stateChange', (oldState, newState) => {
            console.log(`[PlayerCore] Player state: ${oldState.status} → ${newState.status}`);
            
            this.handleStateChange(oldState.status, newState.status);
        });

        // 에러 처리
        this.player.on('error', (error) => {
            console.error('[PlayerCore] Player error:', error);
            this.eventBus.emit('player.error', { error, track: this.currentTrack });
            this.setState('IDLE');
        });
        
        console.log('[PlayerCore] Event handlers attached');
    }

    /**
     * 상태 변화 처리
     */
    handleStateChange(oldStatus, newStatus) {
        const stateMap = {
            [AudioPlayerStatus.Idle]: 'IDLE',
            [AudioPlayerStatus.Buffering]: 'LOADING', 
            [AudioPlayerStatus.Playing]: 'PLAYING',
            [AudioPlayerStatus.Paused]: 'PAUSED'
        };

        const newState = stateMap[newStatus] || 'IDLE';
        const oldState = stateMap[oldStatus] || 'IDLE';

        if (newState !== this.currentState) {
            console.log(`[PlayerCore] State transition: ${this.currentState} → ${newState}`);
            this.setState(newState);
        }

        // 특별한 상황 처리
        if (newStatus === AudioPlayerStatus.Playing && oldStatus === AudioPlayerStatus.Buffering) {
            // 재생 시작 - 페이드 인 효과
            this.startFadeIn();
            
            this.eventBus.emit('player.stateChanged', {
                status: 'PLAYING',
                track: this.currentTrack,
                index: this.currentIndex
            });
        }

        if (newStatus === AudioPlayerStatus.Idle && oldStatus === AudioPlayerStatus.Playing) {
            // 자연스러운 종료
            this.eventBus.emit('player.trackEnded', {
                track: this.currentTrack,
                index: this.currentIndex,
                reason: 'natural'
            });
        }
    }

    /**
     * 내부 상태 설정
     */
    setState(newState) {
        if (this.currentState !== newState) {
            const oldState = this.currentState;
            this.currentState = newState;
            
            console.log(`[PlayerCore] Internal state: ${oldState} → ${newState}`);
        }
    }

    /**
     * 음성 채널 연결
     */
    async connectToVoice(user) {
        try {
            if (!user.voice?.channel) {
                throw new Error('User is not in a voice channel');
            }

            // 기존 연결 확인
            const existingConnection = getVoiceConnection(this.guildId);
            if (existingConnection && existingConnection.state.status !== VoiceConnectionStatus.Disconnected) {
                this.connection = existingConnection;
                this.connection.subscribe(this.player);
                return true;
            }

            // 새 연결 생성
            this.connection = joinVoiceChannel({
                channelId: user.voice.channel.id,
                guildId: this.guildId,
                adapterCreator: user.voice.channel.guild.voiceAdapterCreator,
            });

            // 연결 이벤트 처리
            this.connection.on('stateChange', (oldState, newState) => {
                console.log(`[PlayerCore] Voice connection: ${oldState.status} → ${newState.status}`);
                
                if (newState.status === VoiceConnectionStatus.Disconnected) {
                    this.eventBus.emit('player.disconnected');
                }
            });

            this.connection.on('error', (error) => {
                console.error('[PlayerCore] Voice connection error:', error);
                this.eventBus.emit('player.error', { error, type: 'connection' });
            });

            // 플레이어 구독
            this.connection.subscribe(this.player);
            
            console.log('[PlayerCore] Voice connection established');
            return true;

        } catch (error) {
            console.error('[PlayerCore] Failed to connect to voice:', error);
            this.eventBus.emit('player.error', { error, type: 'connection' });
            return false;
        }
    }

    /**
     * 트랙 재생
     */
    async play(track, index = 0, user = null) {
        try {
            console.log(`[PlayerCore] Starting playback: ${track?.title} (index: ${index})`);
            
            // 상태 설정
            this.setState('LOADING');
            this.currentTrack = track;
            this.currentIndex = index;
            
            // 음성 채널 연결 확인
            if (user && !this.isConnectedToVoice()) {
                const connected = await this.connectToVoice(user);
                if (!connected) {
                    throw new Error('Failed to connect to voice channel');
                }
            }

            // 기존 리소스 정리
            await this.cleanupCurrentResources();

            // 오디오 리소스 생성
            const resource = await this.createAudioResource(track);
            if (!resource) {
                throw new Error('Failed to create audio resource');
            }

            this.currentResource = resource;
            this.volumeControl = resource.volume;
            this.volumeControl?.setVolume(this.volume);

            // 재생 시작
            this.player.play(resource);
            
            console.log(`[PlayerCore] Playback started for: ${track?.title}`);
            return true;

        } catch (error) {
            console.error('[PlayerCore] Playback failed:', error);
            this.setState('IDLE');
            this.eventBus.emit('player.error', { error, track, index });
            return false;
        }
    }

    /**
     * 오디오 리소스 생성
     */
    async createAudioResource(track) {
        try {
            if (!track || !track.url) {
                throw new Error('Invalid track data');
            }

            // 로컬 파일 처리
            if (fs.existsSync(track.url)) {
                console.log('[PlayerCore] Creating resource from local file');
                return createAudioResource(track.url, {
                    inputType: StreamType.Arbitrary,
                    inlineVolume: true,
                });
            }

            // YouTube URL 처리
            console.log('[PlayerCore] Creating resource from YouTube URL');
            return await this.createYouTubeResource(track.url);

        } catch (error) {
            console.error('[PlayerCore] Failed to create audio resource:', error);
            return null;
        }
    }

    /**
     * YouTube 리소스 생성
     */
    async createYouTubeResource(url) {
        return new Promise((resolve, reject) => {
            const process = spawn('yt-dlp', [
                '-f', 'bestaudio',
                '-o', '-',
                '--audio-format', 'opus',
                '--audio-quality', '5',
                url
            ]);

            this.currentProcess = process;

            // 에러 처리
            process.on('error', (error) => {
                console.error('[PlayerCore] yt-dlp spawn error:', error);
                reject(error);
            });

            // stderr 모니터링
            process.stderr.on('data', (data) => {
                const message = data.toString();
                
                if (message.includes('Requested format is not available')) {
                    console.error('[PlayerCore] Format not available');
                    this.eventBus.emit('player.error', { 
                        error: new Error('Format not supported'), 
                        track: this.currentTrack 
                    });
                }
            });

            // 종료 처리
            process.on('close', (code) => {
                if (code !== 0) {
                    console.error(`[PlayerCore] yt-dlp exited with code ${code}`);
                }
            });

            // 리소스 생성
            try {
                const resource = createAudioResource(process.stdout, { 
                    inlineVolume: true,
                    inputType: StreamType.Arbitrary
                });
                resolve(resource);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 일시정지
     */
    async pause() {
        if (this.currentState === 'PLAYING') {
            console.log('[PlayerCore] Pausing playback');
            
            // 페이드 아웃 후 일시정지
            await this.startFadeOut(1000);
            this.player.pause();
            this.setState('PAUSED');
            
            this.eventBus.emit('player.stateChanged', {
                status: 'PAUSED',
                track: this.currentTrack,
                index: this.currentIndex
            });
            
            return true;
        }
        return false;
    }

    /**
     * 재개
     */
    resume() {
        if (this.currentState === 'PAUSED') {
            console.log('[PlayerCore] Resuming playback');
            
            this.player.unpause();
            this.setState('PLAYING');
            
            // 페이드 인 효과
            this.startFadeIn();
            
            this.eventBus.emit('player.stateChanged', {
                status: 'PLAYING',
                track: this.currentTrack,
                index: this.currentIndex
            });
            
            return true;
        }
        return false;
    }

    /**
     * 정지
     */
    async stop() {
        console.log('[PlayerCore] Stopping playback');
        
        this.setState('STOPPING');
        
        // 페이드 아웃 후 정지
        await this.startFadeOut(800);
        
        this.player.stop();
        await this.cleanupCurrentResources();
        
        this.setState('IDLE');
        this.currentTrack = null;
        this.currentIndex = -1;
        
        this.eventBus.emit('player.stateChanged', {
            status: 'IDLE',
            track: null,
            index: -1
        });
        
        return true;
    }

    /**
     * 볼륨 설정
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        if (this.volumeControl) {
            this.volumeControl.setVolume(this.volume);
        }
        
        console.log(`[PlayerCore] Volume set to: ${(this.volume * 100).toFixed(0)}%`);
    }

    /**
     * 페이드 인 효과
     */
    startFadeIn(duration = 2000) {
        if (!this.volumeControl) return;
        
        this.clearFadeEffects();
        
        let currentVolume = 0;
        const targetVolume = this.volume;
        const step = targetVolume / (duration / 50);
        
        this.volumeControl.setVolume(0);
        
        this.fadeInInterval = setInterval(() => {
            currentVolume = Math.min(currentVolume + step, targetVolume);
            this.volumeControl.setVolume(currentVolume);
            
            if (currentVolume >= targetVolume) {
                clearInterval(this.fadeInInterval);
                this.fadeInInterval = null;
            }
        }, 50);
    }

    /**
     * 페이드 아웃 효과
     */
    startFadeOut(duration = 1500) {
        return new Promise((resolve) => {
            if (!this.volumeControl) {
                resolve();
                return;
            }
            
            this.clearFadeEffects();
            
            let currentVolume = this.volume;
            const step = this.volume / (duration / 50);
            
            this.fadeOutInterval = setInterval(() => {
                currentVolume = Math.max(currentVolume - step, 0);
                this.volumeControl.setVolume(currentVolume);
                
                if (currentVolume <= 0) {
                    clearInterval(this.fadeOutInterval);
                    this.fadeOutInterval = null;
                    // 원래 볼륨으로 복원
                    this.volumeControl.setVolume(this.volume);
                    resolve();
                }
            }, 50);
        });
    }

    /**
     * 페이드 효과 정리
     */
    clearFadeEffects() {
        if (this.fadeInInterval) {
            clearInterval(this.fadeInInterval);
            this.fadeInInterval = null;
        }
        
        if (this.fadeOutInterval) {
            clearInterval(this.fadeOutInterval);
            this.fadeOutInterval = null;
        }
    }

    /**
     * 현재 리소스 정리
     */
    async cleanupCurrentResources() {
        // yt-dlp 프로세스 정리
        if (this.currentProcess) {
            try {
                if (this.currentProcess.stdout) {
                    this.currentProcess.stdout.destroy();
                }
                if (this.currentProcess.stderr) {
                    this.currentProcess.stderr.destroy();
                }
                
                this.currentProcess.removeAllListeners();
                
                if (!this.currentProcess.killed) {
                    this.currentProcess.kill('SIGTERM');
                    
                    // 강제 종료 타이머
                    setTimeout(() => {
                        if (this.currentProcess && !this.currentProcess.killed) {
                            this.currentProcess.kill('SIGKILL');
                        }
                    }, 1000);
                }
                
                this.currentProcess = null;
                console.log('[PlayerCore] Process cleanup completed');
                
            } catch (error) {
                console.error('[PlayerCore] Process cleanup error:', error);
            }
        }

        // 리소스 참조 정리
        this.currentResource = null;
        this.volumeControl = null;
    }

    /**
     * 음성 채널 연결 상태 확인
     */
    isConnectedToVoice() {
        return this.connection && 
               this.connection.state.status !== VoiceConnectionStatus.Disconnected;
    }

    /**
     * 현재 상태 정보 반환
     */
    getStatus() {
        return {
            state: this.currentState,
            track: this.currentTrack,
            index: this.currentIndex,
            volume: this.volume,
            connected: this.isConnectedToVoice(),
            playerStatus: this.player.state.status
        };
    }

    /**
     * 음성 채널 연결 해제
     */
    disconnect() {
        if (this.connection) {
            this.connection.disconnect();
            this.connection = null;
            console.log('[PlayerCore] Voice connection disconnected');
        }
    }

    /**
     * 리소스 정리
     */
    async destroy() {
        console.log('[PlayerCore] Destroying...');
        
        // 재생 정지
        await this.stop();
        
        // 페이드 효과 정리
        this.clearFadeEffects();
        
        // 현재 리소스 정리
        await this.cleanupCurrentResources();
        
        // 플레이어 정리
        if (this.player) {
            this.player.removeAllListeners();
            this.player.stop();
        }
        
        // 음성 연결 해제
        this.disconnect();
        
        // 참조 해제
        this.currentTrack = null;
        this.eventBus = null;
        
        console.log('[PlayerCore] Destroyed');
    }
}

module.exports = { PlayerCore };