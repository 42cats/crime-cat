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
        
        // 오디오 모드 설정
        this.audioMode = 'VOLUME_CONTROL'; // 기본값
        this.audioModeConfig = {
            HIGH_QUALITY: {
                inlineVolume: false,
                streamType: StreamType.WebmOpus,
                volumeControl: false,
                fadeInEffect: false,
                fadeOutEffect: false
            },
            VOLUME_CONTROL: {
                inlineVolume: true,
                streamType: StreamType.Arbitrary,
                volumeControl: true,
                fadeInEffect: true,
                fadeOutEffect: true
            }
        };
        
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
        
        // 에러 처리 개선
        this.audioPlayer.on('error', (error) => {
            // EBML 태그 오류는 WebM 파싱 문제이지만 재생은 계속 가능할 수 있음
            if (error.message && error.message.includes('EBML tag')) {
                this.logger.warn('WebM parsing warning (playback may continue)', error);
                // 에러 이벤트를 발생시키지 않고 계속 진행
                return;
            }
            
            // 다른 실제 오류들은 처리
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
            // async 함수이지만 await 없이 호출하여 블로킹 방지
            this.startFadeIn().catch(error => {
                this.logger.warn('Fade in failed, continuing playback', error);
            });
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
            
            // 현재 재생 중이면 완전히 정지 후 새 트랙 준비
            if (this.audioPlayer.state.status === AudioPlayerStatus.Playing || 
                this.audioPlayer.state.status === AudioPlayerStatus.Paused) {
                this.logger.debug('Stopping current playback with fade out');
                
                // 빠른 페이드 아웃과 정지
                await this.fadeOut(2000); // 1500ms 페이드
                this.audioPlayer.stop(true); // 강제 정지
                await this.cleanup();
                
                // 잠시 대기하여 완전한 정지 보장
                await new Promise(resolve => setTimeout(resolve, 50));
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
                return await this.createLocalResource(track.url);
            } else {
                return await this.createYouTubeResource(track.url);
            }
        } catch (error) {
            this.logger.error('Resource creation failed', error);
            return null;
        }
    }

    /**
     * YouTube 리소스 생성 (모드별) - 하이브리드 방식
     */
    async createYouTubeResource(url) {
        const config = this.audioModeConfig[this.audioMode];
        this.logger.network('GET', url, 'yt-dlp');
        
        return new Promise((resolve, reject) => {
            // 모드별 yt-dlp 설정
            const args = [
                '--no-warnings',
                '--quiet',
                '-f', config.inlineVolume ? 'bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio' : 'bestaudio[ext=webm]/bestaudio',
                '--audio-format', config.inlineVolume ? 'mp3' : 'opus',
                '--audio-quality', config.inlineVolume ? '3' : '5',
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
            
            this.currentProcess.on('spawn', async () => {
                this.logger.debug(`yt-dlp process spawned for ${config.inlineVolume ? 'volume control' : 'high quality'} mode`);
                
                // 모드별 리소스 생성
                const resource = createAudioResource(stream, {
                    inputType: config.streamType,
                    inlineVolume: config.inlineVolume
                });
                
                // 조절 모드에서 볼륨 객체 준비 대기
                if (config.volumeControl && config.inlineVolume) {
                    this.logger.debug('Waiting for volume control to be ready...');
                    
                    // 스트림 시작 대기
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    const volumeReady = await this.waitForVolumeReady(resource, 5000); // 더 긴 타임아웃
                    if (volumeReady) {
                        this.logger.debug('Volume control enabled for YouTube resource');
                        resolve(resource);
                    } else {
                        this.logger.warn('Volume control setup failed, but proceeding with resource');
                        resolve(resource); // 볼륨 실패해도 리소스는 반환
                    }
                } else {
                    this.logger.debug('Volume control disabled for high quality mode');
                    resolve(resource);
                }
            });
            
            // 에러 스트림 로깅
            this.currentProcess.stderr.on('data', (data) => {
                this.logger.debug(`yt-dlp stderr: ${data}`);
            });
        });
    }

    /**
     * 로컬 파일 리소스 생성 (모드별)
     */
    async createLocalResource(filePath) {
        const config = this.audioModeConfig[this.audioMode];
        this.logger.debug('Creating local file resource', { path: filePath });
        
        const resource = createAudioResource(filePath, {
            inlineVolume: config.inlineVolume
        });
        
        // 조절 모드에서 볼륨 객체 준비 대기
        if (config.volumeControl && config.inlineVolume) {
            this.logger.debug('Waiting for volume control to be ready for local file...');
            const volumeReady = await this.waitForVolumeReady(resource, 2000); // 더 긴 타임아웃
            if (volumeReady) {
                this.logger.debug('Volume control enabled for local resource');
                return resource;
            } else {
                this.logger.error('Volume control setup failed for local resource');
                throw new Error('Volume control initialization failed for local resource');
            }
        } else {
            this.logger.debug('Volume control disabled for high quality mode');
            return resource;
        }
    }

    /**
     * 일시정지 (모드별 페이드 아웃 지원)
     */
    async pause() {
        this.logger.trace('pause');
        
        if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
            const config = this.audioModeConfig[this.audioMode];
            
            if (config.fadeOutEffect) {
                // 조절 모드: 부드러운 페이드 아웃 후 일시정지
                this.logger.audio('pause with fade out');
                await this.fadeOut(2000);
            } else {
                // 고음질 모드: 즉시 일시정지
                this.logger.audio('pause without fade');
            }
            
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
            if (success) {
                // 재개 후 페이드 인 (비동기로 실행하여 블로킹 방지)
                this.startFadeIn().catch(error => {
                    this.logger.warn('Fade in on resume failed, continuing playback', error);
                });
            }
            this.logger.stateChange('player', 'resumed');
            return success;
        }
        
        return false;
    }

    /**
     * 정지 (모드별 페이드 아웃 지원)
     */
    async stop() {
        this.logger.trace('stop');
        
        const config = this.audioModeConfig[this.audioMode];
        
        if (config.fadeOutEffect) {
            // 조절 모드: 부드러운 페이드 아웃 후 정지
            this.logger.audio('stop with fade out');
            await this.fadeOut(2000);
        } else {
            // 고음질 모드: 즉시 정지
            this.logger.audio('stop without fade');
        }
        
        const success = this.audioPlayer.stop();
        await this.cleanup();
        
        this.logger.stateChange('player', 'stopped');
        return success;
    }

    /**
     * 트랙 변경을 위한 정지 (페이드 포함)
     */
    async stopForTrackChange() {
        this.logger.trace('stopForTrackChange');
        
        // 이벤트 리스너 임시 제거
        this.audioPlayer.removeAllListeners('stateChange');
        
        const config = this.audioModeConfig[this.audioMode];
        
        if (config.fadeOutEffect) {
            // 조절 모드: 빠른 페이드 아웃 (트랙 변경용)
            await this.fadeOut(2000); // 모든 페이드 아웃을 1500ms로 통일
        }
        
        const success = this.audioPlayer.stop();
        
        // 짧은 대기 후 정리
        await new Promise(resolve => setTimeout(resolve, 30));
        await this.cleanup();
        
        // 이벤트 리스너 복원
        this.setupEventListeners();
        
        this.logger.stateChange('player', 'stopped for track change');
        return success;
    }

    /**
     * 이벤트 없이 정지 (직접 선택 시 사용) - 레거시 호환
     */
    async stopWithoutEvent() {
        return await this.stopForTrackChange();
    }

    /**
     * 볼륨 설정 (고음질 모드에서 완전 차단)
     */
    setVolume(volume) {
        this.logger.trace('setVolume', [volume]);
        
        const config = this.audioModeConfig[this.audioMode];
        
        // 고음질 모드에서는 볼륨 조절 완전 차단
        if (!config.volumeControl) {
            this.logger.warn('Volume control blocked in high quality mode', {
                requestedVolume: volume,
                currentMode: this.audioMode
            });
            
            // 에러 이벤트 발생시켜 상위 컴포넌트에 알림
            this.emit('volumeBlocked', {
                mode: this.audioMode,
                message: '고음질 모드에서는 볼륨 조절이 불가능합니다.'
            });
            
            return false;
        }
        
        // 조절 모드에서만 실행
        const normalizedVolume = Math.max(0, Math.min(1, volume));
        this.volume = normalizedVolume;
        
        if (this.currentResource?.volume) {
            try {
                this.currentResource.volume.setVolume(normalizedVolume);
                this.logger.audio('volume changed', { 
                    volume: Math.round(normalizedVolume * 100) + '%',
                    mode: this.audioMode 
                });
                return true;
            } catch (error) {
                this.logger.warn('Volume set failed', error);
                return false;
            }
        }
        
        this.logger.debug('Volume stored for next track', { 
            volume: Math.round(normalizedVolume * 100) + '%' 
        });
        return true;
    }

    /**
     * 페이드 인 (모드별 지원) - 강제 동기화 적용
     */
    async startFadeIn() {
        const config = this.audioModeConfig[this.audioMode];
        
        if (!config.fadeInEffect) {
            this.logger.audio('fade in skipped - high quality mode');
            // 고음질 모드에서는 즉시 정상 볼륨으로 설정
            return this.setInstantVolume();
        }
        
        this.logger.audio('fade in starting - volume control mode');
        
        // 볼륨 객체 사용 가능성 확인 후 페이드 또는 즉시 설정
        if (!this.currentResource?.volume) {
            this.logger.warn('Fade in failed - no volume control available, using instant volume');
            return this.setInstantVolume();
        }
        
        // 🚀 강제 동기화: 페이드 시작 전 볼륨 테스트 + 안정화 대기
        try {
            this.currentResource.volume.setVolume(0); // 볼륨 객체 테스트
            await new Promise(resolve => setTimeout(resolve, 100)); // 안정화 대기 (100ms)
            
            // 볼륨 객체 재검증
            this.currentResource.volume.setVolume(0); // 다시 한번 테스트
            this.logger.debug('Volume control synchronized successfully for fade in');
        } catch (error) {
            this.logger.warn('Volume synchronization failed, using instant volume', error);
            return this.setInstantVolume();
        }
        
        // 조절 모드에서만 실행되는 페이드 인 로직
        this.clearFade();
        
        let currentVolume = 0;
        const targetVolume = Math.max(0, Math.min(1, this.volume || 0.5));
        const fadeDuration = 3000; // 페이드 인 지속시간 3000ms
        const steps = Math.floor(fadeDuration / 50); // 50ms 간격으로 스텝 계산
        const step = targetVolume / steps;
        
        this.fadeInterval = setInterval(() => {
            currentVolume = Math.min(currentVolume + step, targetVolume);
            
            // 각 스텝마다 볼륨 객체 재검증
            if (this.currentResource?.volume) {
                try {
                    this.currentResource.volume.setVolume(currentVolume);
                    this.logger.debug(`Fade in progress: ${Math.round(currentVolume * 100)}%`);
                } catch (error) {
                    this.logger.warn('Fade in volume set failed, completing with instant volume', error);
                    this.clearFade();
                    this.setInstantVolume();
                    return;
                }
            } else {
                this.clearFade();
                this.logger.warn('Fade in stopped - resource unavailable, using instant volume');
                this.setInstantVolume();
                return;
            }
            
            if (currentVolume >= targetVolume) {
                this.clearFade();
                this.logger.audio('fade in completed', { finalVolume: Math.round(currentVolume * 100) + '%' });
            }
        }, 50); // 3000ms 동안 50ms 간격으로 페이드 인
    }

    /**
     * 페이드 아웃 (조절 모드에서 완전 지원)
     */
    async fadeOut(duration = 2000) {
        const config = this.audioModeConfig[this.audioMode];
        
        if (!config.fadeOutEffect) {
            this.logger.audio('fade out skipped - high quality mode');
            // 고음질 모드에서는 즉시 음소거
            return this.setInstantMute();
        }
        
        this.logger.audio('fade out starting - volume control mode', { duration });
        
        // 리소스 참조를 원자적으로 캡처하여 레이스 컨디션 방지
        const fadeResource = this.currentResource;
        
        if (!fadeResource?.volume) {
            this.logger.warn('Volume not ready for fade out, attempting to wait...');
            const volumeReady = await this.waitForVolumeReady(fadeResource, 1000);
            
            if (!volumeReady || !fadeResource?.volume) {
                this.logger.warn('Fade out failed - volume still unavailable after wait. This indicates a resource initialization problem.');
                return this.setInstantMute();
            }
            
            this.logger.debug('Volume became available for fade out');
        }
        
        return new Promise((resolve) => {
            this.clearFade();
            
            // 현재 볼륨에서 시작 (더 자연스러운 페이드)
            let currentVolume;
            try {
                currentVolume = fadeResource.volume.volume || this.volume || 0.5;
            } catch (error) {
                currentVolume = this.volume || 0.5;
            }
            
            const steps = Math.max(10, Math.floor(duration / 50)); // 50ms 간격 기준 스텝 계산
            const step = currentVolume / steps;
            const interval = Math.max(50, Math.floor(duration / steps)); // 타이밍 안전장치: 최소 50ms 보장
            
            this.logger.debug(`Fade out details: ${steps} steps, ${interval}ms interval, starting from ${Math.round(currentVolume * 100)}%`);
            
            this.fadeInterval = setInterval(() => {
                currentVolume = Math.max(currentVolume - step, 0);
                
                // 캡처된 리소스 참조 사용으로 레이스 컨디션 방지
                if (fadeResource?.volume) {
                    try {
                        fadeResource.volume.setVolume(currentVolume);
                        this.logger.debug(`Fade out progress: ${Math.round(currentVolume * 100)}%`);
                    } catch (error) {
                        this.logger.warn('Fade out volume set failed', error);
                        this.clearFade();
                        resolve();
                        return;
                    }
                } else {
                    this.clearFade();
                    this.logger.debug('Fade out stopped - resource unavailable');
                    resolve();
                    return;
                }
                
                if (currentVolume <= 0) {
                    this.clearFade();
                    this.logger.audio('fade out completed successfully');
                    resolve();
                }
            }, interval);
            
            // 안전장치: 최대 시간 초과 시 강제 완료
            setTimeout(() => {
                if (this.fadeInterval) {
                    this.clearFade();
                    this.logger.debug('Fade out timeout - force complete');
                }
                resolve();
            }, duration + 200);
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
     * 고음질 모드용 즉시 볼륨 설정
     */
    setInstantVolume() {
        if (this.currentResource?.volume) {
            try {
                this.currentResource.volume.setVolume(this.volume);
                this.logger.audio('instant volume set', { volume: Math.round(this.volume * 100) + '%' });
            } catch (error) {
                this.logger.debug('Instant volume set failed (expected in high quality mode)', error);
            }
        }
    }

    /**
     * 고음질 모드용 즉시 음소거
     */
    setInstantMute() {
        if (this.currentResource?.volume) {
            try {
                this.currentResource.volume.setVolume(0);
                this.logger.audio('instant mute set');
            } catch (error) {
                this.logger.debug('Instant mute failed (expected in high quality mode)', error);
            }
        }
    }

    /**
     * 오디오 모드 설정
     */
    async setAudioMode(mode) {
        this.logger.trace('setAudioMode', [mode]);
        
        if (!this.audioModeConfig[mode]) {
            this.logger.warn('Invalid audio mode', { mode });
            return false;
        }
        
        const oldMode = this.audioMode;
        this.audioMode = mode;
        
        this.logger.stateChange('audioMode', `${oldMode} → ${mode}`);
        return true;
    }

    /**
     * 볼륨 객체 준비 대기 (조절 모드용)
     */
    async waitForVolumeReady(resource, timeout = 2000) {
        if (!resource) {
            this.logger.warn('waitForVolumeReady called with null resource');
            return false;
        }
        
        return new Promise((resolve) => {
            const startTime = Date.now();
            let checkCount = 0;
            
            const checkVolume = () => {
                checkCount++;
                
                if (resource.volume) {
                    try {
                        // Test if volume control actually works
                        const testVolume = this.volume || 0.5;
                        resource.volume.setVolume(testVolume);
                        this.logger.debug(`Volume control ready and initialized after ${checkCount} checks (${Date.now() - startTime}ms)`);
                        resolve(true);
                    } catch (error) {
                        this.logger.warn(`Volume initialization failed on check ${checkCount}`, error);
                        resolve(false);
                    }
                } else if (Date.now() - startTime < timeout) {
                    // Check more frequently initially, then less frequently
                    const interval = checkCount < 20 ? 25 : 100;
                    setTimeout(checkVolume, interval);
                } else {
                    this.logger.warn(`Volume control timeout after ${checkCount} checks (${Date.now() - startTime}ms) - volume object not available`);
                    resolve(false);
                }
            };
            
            checkVolume();
        });
    }

    /**
     * 리소스 정리
     */
    async cleanup() {
        this.logger.resource('audio', 'cleanup starting');
        
        // 페이드 효과 먼저 정리
        this.clearFade();
        
        // 프로세스 정리
        if (this.currentProcess) {
            try {
                // 스트림부터 정리
                if (this.currentProcess.stdout && !this.currentProcess.stdout.destroyed) {
                    this.currentProcess.stdout.destroy();
                }
                if (this.currentProcess.stderr && !this.currentProcess.stderr.destroyed) {
                    this.currentProcess.stderr.destroy();
                }
                
                // 프로세스 종료
                if (!this.currentProcess.killed) {
                    this.currentProcess.kill('SIGTERM');
                    
                    // 강제 종료 타임아웃
                    await new Promise((resolve) => {
                        const timeout = setTimeout(() => {
                            if (this.currentProcess && !this.currentProcess.killed) {
                                this.logger.warn('Force killing process');
                                this.currentProcess.kill('SIGKILL');
                            }
                            resolve();
                        }, 1000);
                        
                        this.currentProcess.on('exit', () => {
                            clearTimeout(timeout);
                            resolve();
                        });
                    });
                }
                
                this.logger.debug('Process terminated');
            } catch (error) {
                this.logger.debug('Process cleanup error (may be normal)', { 
                    message: error.message,
                    killed: this.currentProcess?.killed 
                });
            }
            
            this.currentProcess = null;
        }
        
        // 리소스 정리
        if (this.currentResource) {
            try {
                // 볼륨을 0으로 설정하여 갑작스러운 끊김 방지
                if (this.currentResource.volume) {
                    this.currentResource.volume.setVolume(0);
                }
                
                if (this.currentResource.readable && !this.currentResource.destroyed) {
                    this.currentResource.destroy();
                }
            } catch (error) {
                this.logger.debug('Resource cleanup error (may be normal)', {
                    message: error.message,
                    destroyed: this.currentResource?.destroyed
                });
            }
            this.currentResource = null;
        }
        
        this.currentTrack = null;
        
        this.logger.resource('audio', 'cleanup completed');
    }

    /**
     * 연결 상태 확인
     */
    isConnected() {
        return !!(this.connection && 
                  this.connection.state.status === VoiceConnectionStatus.Ready);
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
                await this.fadeOut(2000);
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