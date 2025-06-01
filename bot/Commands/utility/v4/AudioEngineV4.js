const { EventEmitter } = require('events');
const {
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    getVoiceConnection,
    VoiceConnectionStatus,
    AudioPlayerStatus,
    StreamType
} = require('@discordjs/voice');
const { spawn } = require('child_process');
const { PassThrough } = require('stream');
const DebugLogger = require('./DebugLogger');

/**
 * Audio Engine v4
 * 심플하고 안정적인 오디오 처리 엔진
 */
class AudioEngineV4 extends EventEmitter {
    constructor(guildId, player) {
        super();
        
        this.guildId = guildId;
        this.player = player;
        this.logger = new DebugLogger('AudioEngineV4', guildId);
        
        // 오디오 플레이어
        this.audioPlayer = createAudioPlayer({
            behaviors: {
                noSubscriber: 'pause',
                maxMissedFrames: 100
            }
        });
        
        // 연결 및 리소스
        this.connection = null;
        this.currentResource = null;
        this.currentProcess = null;
        this.currentTrack = null;
        
        // 볼륨 및 페이드
        this.volume = 0.5;
        this.fadeInterval = null;
        
        // 이벤트 설정
        this.setupEventListeners();
        
        this.logger.info('✅ Audio Engine v4 initialized');
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        this.logger.debug('Setting up audio player event listeners');
        
        // 플레이어 상태 변경
        this.audioPlayer.on('stateChange', (oldState, newState) => {
            this.logger.stateChange(
                `player: ${oldState.status}`,
                newState.status
            );
            
            this.handlePlayerStateChange(oldState, newState);
        });
        
        // 에러 처리
        this.audioPlayer.on('error', (error) => {
            this.logger.error('Audio player error', error);
            this.emit('error', error);
        });
    }

    /**
     * 플레이어 상태 변경 처리
     */
    handlePlayerStateChange(oldState, newState) {
        const { status: oldStatus } = oldState;
        const { status: newStatus } = newState;
        
        // 재생 시작
        if (newStatus === AudioPlayerStatus.Playing && oldStatus !== AudioPlayerStatus.Playing) {
            this.logger.playerEvent('Playback started');
            this.startFadeIn();
            this.emit('trackStart', this.currentTrack);
        }
        
        // 자연스러운 종료
        if (newStatus === AudioPlayerStatus.Idle && oldStatus === AudioPlayerStatus.Playing) {
            this.logger.playerEvent('Track ended naturally');
            this.emit('trackEnd', 'finished');
        }
    }

    /**
     * 음성 채널 연결
     */
    async connectToVoice(user) {
        this.logger.trace('connectToVoice', [user.id]);
        const timer = this.logger.startTimer('voice connection');
        
        try {
            if (!user?.voice?.channel) {
                throw new Error('User is not in a voice channel');
            }
            
            const channelId = user.voice.channel.id;
            this.logger.debug(`Connecting to voice channel: ${channelId}`);
            
            // 기존 연결 확인
            let connection = getVoiceConnection(this.guildId);
            
            if (!connection || connection.state.status === VoiceConnectionStatus.Disconnected) {
                // 새 연결 생성
                connection = joinVoiceChannel({
                    channelId: channelId,
                    guildId: this.guildId,
                    adapterCreator: user.voice.channel.guild.voiceAdapterCreator,
                    selfDeaf: true
                });
                
                this.logger.info('New voice connection created');
            }
            
            // 연결 대기
            await this.waitForConnection(connection);
            
            // 플레이어 구독
            connection.subscribe(this.audioPlayer);
            this.connection = connection;
            
            this.logger.info('✅ Voice channel connected successfully');
            timer.end(true);
            return true;
            
        } catch (error) {
            this.logger.error('Voice connection failed', error);
            timer.end(false);
            return false;
        }
    }

    /**
     * 연결 대기
     */
    async waitForConnection(connection) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 10000);
            
            connection.on(VoiceConnectionStatus.Ready, () => {
                clearTimeout(timeout);
                resolve();
            });
            
            connection.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    /**
     * 트랙 재생
     */
    async play(track, user) {
        this.logger.trace('play', [track.title]);
        const timer = this.logger.startTimer(`play track: ${track.title}`);
        
        try {
            // 음성 채널 연결 확인
            if (!this.isConnected()) {
                const connected = await this.connectToVoice(user);
                if (!connected) {
                    throw new Error('Failed to connect to voice channel');
                }
            }
            
            // 현재 재생 중이면 페이드 아웃 후 정지
            if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
                this.logger.debug('Stopping current playback with fade out');
                await this.fadeOut();
                await this.cleanup();
            }
            
            // 리소스 생성
            this.currentTrack = track;
            const resource = await this.createResource(track);
            
            if (!resource) {
                throw new Error('Failed to create audio resource');
            }
            
            // 재생 시작
            this.currentResource = resource;
            this.audioPlayer.play(resource);
            
            this.logger.info(`🎵 Now playing: ${track.title}`);
            timer.end(true);
            return true;
            
        } catch (error) {
            this.logger.error('Play failed', error);
            this.currentTrack = null;
            timer.end(false);
            return false;
        }
    }

    /**
     * 오디오 리소스 생성
     */
    async createResource(track) {
        this.logger.debug('Creating audio resource', { url: track.url });
        
        try {
            if (track.source === 'local') {
                return this.createLocalResource(track.url);
            } else {
                return await this.createYouTubeResource(track.url);
            }
        } catch (error) {
            this.logger.error('Resource creation failed', error);
            return null;
        }
    }

    /**
     * YouTube 리소스 생성
     */
    async createYouTubeResource(url) {
        this.logger.network('GET', url, 'yt-dlp');
        
        return new Promise((resolve, reject) => {
            // yt-dlp 프로세스 생성
            const args = [
                '--no-warnings',
                '--quiet',
                '-f', 'bestaudio[ext=webm]/bestaudio',
                '-o', '-',
                url
            ];
            
            this.currentProcess = spawn('yt-dlp', args);
            const stream = new PassThrough();
            
            this.currentProcess.stdout.pipe(stream);
            
            this.currentProcess.on('error', (error) => {
                this.logger.error('yt-dlp process error', error);
                reject(error);
            });
            
            this.currentProcess.on('spawn', () => {
                this.logger.debug('yt-dlp process spawned');
                
                // 리소스 생성
                const resource = createAudioResource(stream, {
                    inputType: StreamType.WebmOpus,
                    inlineVolume: true
                });
                
                // 볼륨 설정
                if (resource.volume) {
                    resource.volume.setVolume(this.volume);
                }
                
                resolve(resource);
            });
            
            // 에러 스트림 로깅
            this.currentProcess.stderr.on('data', (data) => {
                this.logger.debug(`yt-dlp stderr: ${data}`);
            });
        });
    }

    /**
     * 로컬 파일 리소스 생성
     */
    createLocalResource(filePath) {
        this.logger.debug('Creating local file resource', { path: filePath });
        
        const resource = createAudioResource(filePath, {
            inlineVolume: true
        });
        
        if (resource.volume) {
            resource.volume.setVolume(this.volume);
        }
        
        return resource;
    }

    /**
     * 일시정지
     */
    pause() {
        this.logger.trace('pause');
        
        if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
            const success = this.audioPlayer.pause();
            this.logger.stateChange('player', 'paused');
            return success;
        }
        
        return false;
    }

    /**
     * 재개
     */
    resume() {
        this.logger.trace('resume');
        
        if (this.audioPlayer.state.status === AudioPlayerStatus.Paused) {
            const success = this.audioPlayer.unpause();
            this.logger.stateChange('player', 'resumed');
            return success;
        }
        
        return false;
    }

    /**
     * 정지
     */
    async stop() {
        this.logger.trace('stop');
        
        await this.fadeOut();
        const success = this.audioPlayer.stop();
        await this.cleanup();
        
        this.logger.stateChange('player', 'stopped');
        return success;
    }

    /**
     * 볼륨 설정
     */
    setVolume(volume) {
        this.logger.trace('setVolume', [volume]);
        
        this.volume = volume;
        
        if (this.currentResource?.volume) {
            this.currentResource.volume.setVolume(volume);
            this.logger.audio('volume changed', { volume: Math.round(volume * 100) + '%' });
        }
        
        return true;
    }

    /**
     * 페이드 인
     */
    startFadeIn() {
        this.logger.audio('fade in starting');
        
        if (!this.currentResource?.volume) return;
        
        this.clearFade();
        
        let currentVolume = 0;
        const targetVolume = this.volume;
        const step = targetVolume / 10;
        
        this.currentResource.volume.setVolume(0);
        
        this.fadeInterval = setInterval(() => {
            currentVolume = Math.min(currentVolume + step, targetVolume);
            this.currentResource.volume.setVolume(currentVolume);
            
            if (currentVolume >= targetVolume) {
                this.clearFade();
                this.logger.audio('fade in completed');
            }
        }, 30);
    }

    /**
     * 페이드 아웃
     */
    async fadeOut() {
        this.logger.audio('fade out starting');
        
        if (!this.currentResource?.volume) return;
        
        return new Promise((resolve) => {
            this.clearFade();
            
            let currentVolume = this.volume;
            const step = currentVolume / 10;
            
            this.fadeInterval = setInterval(() => {
                currentVolume = Math.max(currentVolume - step, 0);
                this.currentResource.volume.setVolume(currentVolume);
                
                if (currentVolume <= 0) {
                    this.clearFade();
                    this.logger.audio('fade out completed');
                    resolve();
                }
            }, 30);
            
            // 타임아웃 설정
            setTimeout(resolve, 300);
        });
    }

    /**
     * 페이드 효과 정리
     */
    clearFade() {
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }
    }

    /**
     * 리소스 정리
     */
    async cleanup() {
        this.logger.resource('audio', 'cleanup starting');
        
        // 프로세스 정리
        if (this.currentProcess) {
            try {
                this.currentProcess.stdout?.destroy();
                this.currentProcess.stderr?.destroy();
                this.currentProcess.kill('SIGTERM');
                
                // 강제 종료 타임아웃
                setTimeout(() => {
                    if (this.currentProcess && !this.currentProcess.killed) {
                        this.currentProcess.kill('SIGKILL');
                    }
                }, 1000);
                
                this.logger.debug('Process terminated');
            } catch (error) {
                this.logger.warn('Process cleanup error', error);
            }
            
            this.currentProcess = null;
        }
        
        // 리소스 정리
        this.currentResource = null;
        this.currentTrack = null;
        
        this.logger.resource('audio', 'cleanup completed');
    }

    /**
     * 연결 상태 확인
     */
    isConnected() {
        return this.connection && 
               this.connection.state.status === VoiceConnectionStatus.Ready;
    }

    /**
     * 상태 정보
     */
    getStatus() {
        return {
            connected: this.isConnected(),
            playerState: this.audioPlayer.state.status,
            volume: Math.round(this.volume * 100),
            hasResource: !!this.currentResource,
            currentTrack: this.currentTrack?.title || null
        };
    }

    /**
     * 정리
     */
    async destroy() {
        this.logger.info('🔚 Destroying Audio Engine v4...');
        const timer = this.logger.startTimer('destroy audio engine');
        
        try {
            // 페이드 정리
            this.clearFade();
            
            // 재생 정지
            if (this.audioPlayer.state.status !== AudioPlayerStatus.Idle) {
                await this.fadeOut();
                this.audioPlayer.stop();
            }
            
            // 리소스 정리
            await this.cleanup();
            
            // 연결 해제
            if (this.connection) {
                this.connection.destroy();
                this.connection = null;
                this.logger.debug('Voice connection destroyed');
            }
            
            // 이벤트 리스너 제거
            this.audioPlayer.removeAllListeners();
            this.removeAllListeners();
            
            this.logger.info('✅ Audio Engine v4 destroyed successfully');
            timer.end(true);
            
        } catch (error) {
            this.logger.error('Destroy failed', error);
            timer.end(false);
        }
    }
}

module.exports = AudioEngineV4;