/**
 * AudioEngine v3.0
 * 순수 오디오 재생 엔진
 * 
 * 핵심 원칙:
 * - Pure Audio Logic: 오디오 재생만 담당
 * - No State Management: 상태 관리는 StateManager에 위임
 * - Event Driven: 모든 상태 변화를 이벤트로 알림
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

const { PLAYBACK_STATES, ACTION_TYPES } = require('./types');

class AudioEngine {
    constructor(guildId, stateManager) {
        this.guildId = guildId;
        this.stateManager = stateManager;
        
        // Discord.js 음성 관련
        this.connection = null;
        this.player = createAudioPlayer();
        
        // 리소스 관리
        this.currentProcess = null;
        this.currentResource = null;
        this.volumeControl = null;
        
        // 페이드 효과
        this.fadeInterval = null;
        
        // 플레이어 이벤트 리스너 설정
        this.setupPlayerEvents();
        
        console.log(`[AudioEngine v3.0] Initialized for guild: ${this.guildId}`);
    }

    /**
     * 플레이어 이벤트 리스너 설정
     */
    setupPlayerEvents() {
        this.player.on('stateChange', (oldState, newState) => {
            console.log(`[AudioEngine] Player state: ${oldState.status} → ${newState.status}`);
            this.handlePlayerStateChange(oldState.status, newState.status);
        });

        this.player.on('error', (error) => {
            console.error('[AudioEngine] Player error:', error);
            this.stateManager.dispatch({
                type: ACTION_TYPES.AUDIO_ERROR,
                payload: { error }
            });
        });
    }

    /**
     * 플레이어 상태 변화 처리
     */
    handlePlayerStateChange(oldStatus, newStatus) {
        const state = this.stateManager.getState();
        
        // Discord.js 상태를 내부 상태로 매핑
        const stateMapping = {
            [AudioPlayerStatus.Idle]: PLAYBACK_STATES.IDLE,
            [AudioPlayerStatus.Buffering]: PLAYBACK_STATES.LOADING,
            [AudioPlayerStatus.Playing]: PLAYBACK_STATES.PLAYING,
            [AudioPlayerStatus.Paused]: PLAYBACK_STATES.PAUSED
        };

        const newPlaybackState = stateMapping[newStatus] || PLAYBACK_STATES.IDLE;
        
        // 상태가 실제로 변경된 경우에만 업데이트
        if (state.playback.state !== newPlaybackState) {
            this.stateManager.dispatch({
                type: ACTION_TYPES.SET_PLAYBACK_STATE,
                payload: newPlaybackState
            });
        }

        // 특별한 상황 처리
        this.handleSpecialTransitions(oldStatus, newStatus, state);
    }

    /**
     * 특별한 상태 전환 처리
     */
    handleSpecialTransitions(oldStatus, newStatus, state) {
        // 재생 시작 시 페이드 인
        if (newStatus === AudioPlayerStatus.Playing && oldStatus === AudioPlayerStatus.Buffering) {
            this.startFadeIn(state.playback.volume);
        }

        // 자연스러운 종료 감지
        if (newStatus === AudioPlayerStatus.Idle && oldStatus === AudioPlayerStatus.Playing) {
            this.stateManager.dispatch({
                type: ACTION_TYPES.TRACK_ENDED,
                payload: { 
                    reason: 'natural',
                    track: state.playback.currentTrack,
                    index: state.playback.currentIndex
                }
            });
        }
    }

    /**
     * 음성 채널 연결
     */
    async connectToVoice(user) {
        try {
            if (!user?.voice?.channel) {
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
            this.setupConnectionEvents();
            
            // 플레이어 구독
            this.connection.subscribe(this.player);
            
            console.log('[AudioEngine] Voice connection established');
            return true;

        } catch (error) {
            console.error('[AudioEngine] Failed to connect to voice:', error);
            this.stateManager.dispatch({
                type: ACTION_TYPES.AUDIO_ERROR,
                payload: { error }
            });
            return false;
        }
    }

    /**
     * 음성 연결 이벤트 설정
     */
    setupConnectionEvents() {
        if (!this.connection) return;

        this.connection.on('stateChange', (oldState, newState) => {
            console.log(`[AudioEngine] Voice connection: ${oldState.status} → ${newState.status}`);
            
            if (newState.status === VoiceConnectionStatus.Disconnected) {
                this.stateManager.dispatch({
                    type: ACTION_TYPES.SET_PLAYBACK_STATE,
                    payload: PLAYBACK_STATES.IDLE
                });
            }
        });

        this.connection.on('error', (error) => {
            console.error('[AudioEngine] Voice connection error:', error);
            this.stateManager.dispatch({
                type: ACTION_TYPES.AUDIO_ERROR,
                payload: { error }
            });
        });
    }

    /**
     * 트랙 재생
     */
    async playTrack(track, user = null) {
        try {
            console.log(`[AudioEngine] Starting playback: ${track?.title}`);
            
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
            
            // 볼륨 설정
            const state = this.stateManager.getState();
            this.setVolume(state.playback.volume);

            // 재생 시작
            this.player.play(resource);
            
            console.log(`[AudioEngine] Playback started for: ${track?.title}`);
            return true;

        } catch (error) {
            console.error('[AudioEngine] Playback failed:', error);
            this.stateManager.dispatch({
                type: ACTION_TYPES.AUDIO_ERROR,
                payload: { error }
            });
            return false;
        }
    }

    /**
     * 오디오 리소스 생성
     */
    async createAudioResource(track) {
        try {
            if (!track?.url) {
                throw new Error('Invalid track data');
            }

            // 로컬 파일 처리
            if (fs.existsSync(track.url)) {
                console.log('[AudioEngine] Creating resource from local file');
                return createAudioResource(track.url, {
                    inputType: StreamType.Arbitrary,
                    inlineVolume: true,
                });
            }

            // YouTube URL 처리
            console.log('[AudioEngine] Creating resource from YouTube URL');
            return await this.createYouTubeResource(track.url);

        } catch (error) {
            console.error('[AudioEngine] Failed to create audio resource:', error);
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
                console.error('[AudioEngine] yt-dlp spawn error:', error);
                reject(error);
            });

            // stderr 모니터링
            process.stderr.on('data', (data) => {
                const message = data.toString();
                if (message.includes('Requested format is not available')) {
                    console.error('[AudioEngine] Format not available');
                    reject(new Error('Format not supported'));
                }
            });

            // 종료 처리
            process.on('close', (code) => {
                if (code !== 0) {
                    console.error(`[AudioEngine] yt-dlp exited with code ${code}`);
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
        if (this.player.state.status === AudioPlayerStatus.Playing) {
            console.log('[AudioEngine] Pausing playback');
            
            const state = this.stateManager.getState();
            await this.startFadeOut(state.playback.volume, 500);
            this.player.pause();
            return true;
        }
        return false;
    }

    /**
     * 재개
     */
    resume() {
        if (this.player.state.status === AudioPlayerStatus.Paused) {
            console.log('[AudioEngine] Resuming playback');
            
            this.player.unpause();
            const state = this.stateManager.getState();
            this.startFadeIn(state.playback.volume);
            return true;
        }
        return false;
    }

    /**
     * 정지
     */
    async stop() {
        console.log('[AudioEngine] Stopping playback');
        
        const state = this.stateManager.getState();
        if (state.playback.state === PLAYBACK_STATES.PLAYING) {
            await this.startFadeOut(state.playback.volume, 800);
        }
        
        this.player.stop();
        await this.cleanupCurrentResources();
        return true;
    }

    /**
     * 볼륨 설정
     */
    setVolume(volume) {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        
        if (this.volumeControl) {
            this.volumeControl.setVolume(clampedVolume);
        }
        
        console.log(`[AudioEngine] Volume set to: ${(clampedVolume * 100).toFixed(0)}%`);
    }

    /**
     * 페이드 인 효과
     */
    startFadeIn(targetVolume, duration = 1500) {
        if (!this.volumeControl) return;
        
        this.clearFadeEffect();
        
        let currentVolume = 0;
        const step = targetVolume / (duration / 50);
        
        this.volumeControl.setVolume(0);
        
        this.fadeInterval = setInterval(() => {
            currentVolume = Math.min(currentVolume + step, targetVolume);
            this.volumeControl.setVolume(currentVolume);
            
            if (currentVolume >= targetVolume) {
                this.clearFadeEffect();
            }
        }, 50);
    }

    /**
     * 페이드 아웃 효과
     */
    startFadeOut(startVolume, duration = 1000) {
        return new Promise((resolve) => {
            if (!this.volumeControl) {
                resolve();
                return;
            }
            
            this.clearFadeEffect();
            
            let currentVolume = startVolume;
            const step = startVolume / (duration / 50);
            
            this.fadeInterval = setInterval(() => {
                currentVolume = Math.max(currentVolume - step, 0);
                this.volumeControl.setVolume(currentVolume);
                
                if (currentVolume <= 0) {
                    this.clearFadeEffect();
                    // 원래 볼륨으로 복원
                    this.volumeControl.setVolume(startVolume);
                    resolve();
                }
            }, 50);
        });
    }

    /**
     * 페이드 효과 정리
     */
    clearFadeEffect() {
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
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
                console.log('[AudioEngine] Process cleanup completed');
                
            } catch (error) {
                console.error('[AudioEngine] Process cleanup error:', error);
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
     * 음성 채널 연결 해제
     */
    disconnect() {
        if (this.connection) {
            this.connection.disconnect();
            this.connection = null;
            console.log('[AudioEngine] Voice connection disconnected');
        }
    }

    /**
     * 현재 상태 정보 반환
     */
    getStatus() {
        return {
            playerStatus: this.player.state.status,
            connected: this.isConnectedToVoice(),
            hasResource: !!this.currentResource,
            hasProcess: !!this.currentProcess
        };
    }

    /**
     * 리소스 정리
     */
    async destroy() {
        console.log('[AudioEngine] Destroying...');
        
        // 재생 정지
        await this.stop();
        
        // 페이드 효과 정리
        this.clearFadeEffect();
        
        // 현재 리소스 정리
        await this.cleanupCurrentResources();
        
        // 플레이어 정리
        if (this.player) {
            this.player.removeAllListeners();
            this.player.stop();
        }
        
        // 음성 연결 해제
        this.disconnect();
        
        console.log('[AudioEngine] Destroyed');
    }
}

module.exports = { AudioEngine };