const { EventEmitter } = require('events');
const DebugLogger = require('./DebugLogger');
const AudioEngineV4 = require('./AudioEngineV4');
const QueueManagerV4 = require('./QueueManagerV4');
const UIManagerV4 = require('./UIManagerV4');
const { isPermissionHas } = require('../../api/user/permission');

class MusicPlayerV4 extends EventEmitter {
    constructor(guildId, client, user) {
        super();

        this.guildId = guildId;
        this.client = client;
        this.user = user;
        this.version = 'v4';

        this.logger = new DebugLogger('MusicPlayerV4', guildId);
        this.logger.info('🎵 Music Player v4 initializing...', { userId: user.id });

        this.audio = new AudioEngineV4(guildId, this);
        this.queue = new QueueManagerV4(guildId, this);
        this.ui = new UIManagerV4(guildId, this);

        this.state = {
            isPlaying: false,
            isPaused: false,
            volume: 0.5,
            mode: 'single-track', // 기본값을 single-track으로 변경
            currentIndex: -1,
            autoplay: true,
            isDirectSelection: false,  // 직접 선택 플래그 추가
            isManualStop: false,       // 수동 정지 플래그 추가
            audioMode: 'VOLUME_CONTROL', // 기본값은 조절 모드
            availableAudioModes: ['HIGH_QUALITY', 'VOLUME_CONTROL'],
            hasLocalMusicPermission: false // 로컬 음악 권한 체크
        };

        this.uiState = {
            currentPage: 0,
            pageSize: 15
        };

        this.interactionMsg = null;
        this.lastInteraction = null;
        this.lastVolumeBlockMessage = null; // 볼륨 차단 메시지

        this.setupEventListeners();

        // 로컬 음악 권한 체크 (비동기)
        this.checkLocalMusicPermission().catch(error => {
            this.logger.warn('Local music permission check failed', error);
        });

        this.logger.info('✅ Music Player v4 initialized successfully');
    }

    setupEventListeners() {
        this.logger.debug('Setting up event listeners');

        this.audio.on('trackStart', (track) => {
            this.logger.playerEvent('Track started', { track: track.title });
            this.state.isPlaying = true;
            this.state.isPaused = false;

            // 실제 재생되는 트랙에 맞게 currentIndex 동기화
            const actualIndex = this.queue.tracks.findIndex(t =>
                t.title === track.title && t.url === track.url
            );
            if (actualIndex >= 0 && actualIndex !== this.state.currentIndex) {
                this.logger.debug(`Syncing currentIndex: ${this.state.currentIndex} -> ${actualIndex}`);
                this.state.currentIndex = actualIndex;

                // 셔플 모드인 경우 셔플 인덱스도 동기화
                if (this.state.mode === 'shuffle' && this.queue.isShuffled) {
                    this.queue.forceSyncShuffleIndex(actualIndex);
                }
            }

            this.updateUI('Track started');
        });

        this.audio.on('trackEnd', (reason) => {
            this.logger.playerEvent('Track ended', { reason });
            this.handleTrackEnd(reason);
        });

        this.audio.on('error', (error) => {
            this.logger.error('Audio engine error', error);
            this.state.isPlaying = false;
            this.state.isPaused = false;
            this.updateUI('Audio error');
        });

        // 볼륨 차단 이벤트 추가
        this.audio.on('volumeBlocked', async (data) => {
            this.logger.userAction('volume blocked', {
                mode: data.mode,
                userId: this.user?.id
            });

            // UI 업데이트 시 볼륨 차단 메시지 표시
            this.lastVolumeBlockMessage = data.message;
            await this.updateUI('Volume blocked');

            // 3초 후 메시지 클리어
            setTimeout(() => {
                this.lastVolumeBlockMessage = null;
                this.updateUI('Volume block message cleared');
            }, 3000);
        });

        this.logger.debug('Event listeners setup complete');
    }

    /**
     * 사용자 안내 메시지 전송
     */
    async sendUserGuidance(message) {
        this.logger.debug('sendUserGuidance called', { 
            hasLastInteraction: !!this.lastInteraction,
            messageLength: message.length 
        });
        
        if (this.lastInteraction) {
            try {
                this.logger.info('Sending user guidance message');
                await this.lastInteraction.followUp({
                    content: message,
                    ephemeral: true
                });
                this.logger.info('User guidance message sent successfully');
            } catch (error) {
                this.logger.error('User guidance message failed', error);
            }
        } else {
            this.logger.warn('Cannot send user guidance - no lastInteraction available');
        }
    }

    /**
     * 로컬 음악 권한 체크
     */
    async checkLocalMusicPermission() {
        this.logger.trace('checkLocalMusicPermission', [this.user.id]);

        try {
            const hasPermission = await isPermissionHas(this.user.id, "로컬음악");
            this.state.hasLocalMusicPermission = hasPermission;

            this.logger.info('Local music permission checked', {
                userId: this.user.id,
                hasPermission
            });

            // UI 업데이트 (권한 상태 변경 시)
            await this.updateUI('Permission updated');

            return hasPermission;
        } catch (error) {
            this.logger.error('Local music permission check failed', error);
            this.state.hasLocalMusicPermission = false;
            return false;
        }
    }

    async play(index = null, isDirectSelection = false) {
        this.logger.trace('play', [index, isDirectSelection]);

        // 봇이 음성채널에 연결되어 있지 않은 경우
        if (!this.audio.isConnected()) {
            await this.sendUserGuidance('🔊 **음성채널 접속이 필요합니다!**\n\n' +
                '음악을 재생하려면 먼저 음성채널에 접속해야 합니다.\n' +
                '사용자가 음성채널에 접속후 봇의 초록색 🔇 버튼,\n' +
                '🔇 **음성채널 On/Off 버튼**을 클릭하여 음성채널에 접속해주세요.');
            return false;
        }

        let targetIndex = index;
        if (targetIndex === null) {
            targetIndex = this.state.currentIndex >= 0 ? this.state.currentIndex : 0;
        }

        if (targetIndex < 0 || targetIndex >= this.queue.length) {
            this.logger.warn('Invalid track index', { index: targetIndex, queueLength: this.queue.length });
            await this.sendUserGuidance('⚠️ **재생할 곡을 찾을 수 없습니다.**\n\n' +
                '선택한 곡의 인덱스가 유효하지 않습니다.');
            return false;
        }

        const track = this.queue.getTrack(targetIndex);
        if (!track) {
            this.logger.warn('Track not found', { index: targetIndex });
            await this.sendUserGuidance('⚠️ **재생할 곡을 찾을 수 없습니다.**\n\n' +
                '플레이리스트를 다시 로드해주세요.');
            return false;
        }

        this.logger.userAction('play', {
            track: track.title,
            index: targetIndex,
            isDirectSelection,
            userId: this.user?.id || 'unknown'
        });

        try {
            // 직접 선택 플래그 설정
            this.state.isDirectSelection = isDirectSelection;

            if (this.state.isPlaying) {
                // 직접 선택인 경우 자동재생 방지를 위해 특별한 정지 방식 사용
                if (isDirectSelection) {
                    await this.audio.stopForTrackChange();
                } else {
                    await this.audio.stop();
                }
            }

            this.state.currentIndex = targetIndex;
            this.state.isPlaying = false;
            this.state.isPaused = false;

            // 셔플 모드에서 직접 선택된 곡인 경우 셔플 인덱스 조정
            if (this.state.mode === 'shuffle' && this.queue.isShuffled && isDirectSelection) {
                this.queue.updateShuffleIndexForDirectSelection(targetIndex);
                this.logger.debug(`Direct selection in shuffle mode: updated to index ${targetIndex}`);
            }

            await this.audio.play(track, this.user);

            return true;

        } catch (error) {
            this.logger.error('Play failed', error);
            this.state.isPlaying = false;
            this.state.isPaused = false;
            await this.sendUserGuidance('❌ **재생 중 오류가 발생했습니다.**\n\n' +
                '잠시 후 다시 시도해주세요.');
            return false;
        }
    }

    async togglePlayPause() {
        this.logger.trace('togglePlayPause');

        // 봇이 음성채널에 연결되어 있지 않은 경우
        const isConnected = this.audio.isConnected();
        this.logger.debug('Voice connection check', { 
            isConnected, 
            hasLastInteraction: !!this.lastInteraction 
        });
        
        if (!isConnected) {
            this.logger.info('Voice not connected - sending guidance message');
            await this.sendUserGuidance('🔊 **음성채널 접속이 필요합니다!**\n\n' +
                '음악을 재생하려면 먼저 음성채널에 접속해야 합니다.\n' +
                '사용자가 음성채널에 접속후 봇의 초록색 🔇 버튼,\n' +
                '🔇 **음성채널 On/Off 버튼**을 클릭하여 음성채널에 접속해주세요.');
            return false;
        }

        if (!this.state.isPlaying && !this.state.isPaused) {
            return await this.play();
        }

        if (this.state.isPaused) {
            const success = await this.audio.resume();
            if (success) {
                this.state.isPaused = false;
                this.state.isPlaying = true;
                this.logger.userAction('resume', { userId: this.user?.id });
                await this.updateUI('Resumed');
            } else {
                await this.sendUserGuidance('❌ **재생 재개에 실패했습니다.**\n\n' +
                    '잠시 후 다시 시도해주세요.');
            }
            return success;
        } else {
            const success = await this.audio.pause();
            if (success) {
                this.state.isPaused = true;
                this.state.isPlaying = false;
                this.logger.userAction('pause', { userId: this.user?.id });
                await this.updateUI('Paused');
            } else {
                await this.sendUserGuidance('❌ **일시정지에 실패했습니다.**\n\n' +
                    '잠시 후 다시 시도해주세요.');
            }
            return success;
        }
    }

    async stop() {
        this.logger.trace('stop');

        // 수동 정지 플래그 설정 (자동재생 방지)
        this.state.isManualStop = true;

        const success = await this.audio.stop();

        if (success) {
            this.state.isPlaying = false;
            this.state.isPaused = false;
            this.logger.userAction('stop', { userId: this.user?.id });
            await this.updateUI('Stopped');
        }

        return success;
    }

    async next() {
        this.logger.trace('next');

        // 봇이 음성채널에 연결되어 있지 않은 경우
        if (!this.audio.isConnected()) {
            await this.sendUserGuidance('🔊 **음성채널 접속이 필요합니다!**\n\n' +
                '음악을 재생하려면 먼저 음성채널에 접속해야 합니다.\n' +
                '사용자가 음성채널에 접속후 봇의 초록색 🔇 버튼,\n' +
                '🔇 **음성채널 On/Off 버튼**을 클릭하여 음성채널에 접속해주세요.');
            return false;
        }

        const currentIndex = this.state.currentIndex;

        // 셔플 모드에서 인덱스 동기화
        if (this.state.mode === 'shuffle' && this.queue.isShuffled) {
            this.queue.forceSyncShuffleIndex(currentIndex);
        }

        const nextIndex = this.queue.getNextIndex(currentIndex, this.state.mode);

        if (nextIndex === -1) {
            this.logger.debug('No next track available');
            await this.sendUserGuidance('ℹ️ **다음 곡이 없습니다.**\n\n' +
                '플레이리스트의 마지막 곡입니다.');
            if (this.state.mode === 'normal') {
                await this.stop();
            }
            return false;
        }

        this.logger.debug(`Next: ${currentIndex} -> ${nextIndex} (mode: ${this.state.mode})`);
        return await this.play(nextIndex);
    }

    async prev() {
        this.logger.trace('prev');

        // 봇이 음성채널에 연결되어 있지 않은 경우
        if (!this.audio.isConnected()) {
            await this.sendUserGuidance('🔊 **음성채널 접속이 필요합니다!**\n\n' +
                '음악을 재생하려면 먼저 음성채널에 접속해야 합니다.\n' +
                '사용자가 음성채널에 접속후 봇의 초록색 🔇 버튼,\n' +
                '🔇 **음성채널 On/Off 버튼**을 클릭하여 음성채널에 접속해주세요.');
            return false;
        }

        const currentIndex = this.state.currentIndex;

        // 셔플 모드에서 인덱스 동기화
        if (this.state.mode === 'shuffle' && this.queue.isShuffled) {
            this.queue.forceSyncShuffleIndex(currentIndex);
        }

        const prevIndex = this.queue.getPreviousIndex(currentIndex, this.state.mode);

        if (prevIndex === -1) {
            // 첫 번째 곡에서 이전 버튼을 누르면 마지막 곡으로 이동
            this.logger.debug('First track - moving to last track');
            const lastIndex = this.queue.length - 1;
            if (lastIndex >= 0) {
                this.logger.debug(`Previous: ${currentIndex} -> ${lastIndex} (wrap to last)`);
                return await this.play(lastIndex);
            }
            return false;
        }

        this.logger.debug(`Previous: ${currentIndex} -> ${prevIndex} (mode: ${this.state.mode})`);
        return await this.play(prevIndex);
    }

    async handleTrackEnd(reason) {
        this.logger.trace('handleTrackEnd', [reason]);

        this.state.isPlaying = false;
        this.state.isPaused = false;

        this.logger.debug('Track end details', {
            reason,
            autoplay: this.state.autoplay,
            mode: this.state.mode,
            currentIndex: this.state.currentIndex,
            queueLength: this.queue.length,
            isDirectSelection: this.state.isDirectSelection,
            isManualStop: this.state.isManualStop
        });

        // 수동 정지인 경우 자동재생 건너뛰기
        if (this.state.isManualStop && reason === 'finished') {
            this.logger.info('🛑 Manual stop - skipping autoplay');
            this.state.isManualStop = false; // 플래그 초기화
            await this.updateUI('Manually stopped');
            return;
        }

        // 직접 선택으로 인한 정지인 경우 자동재생 건너뛰기
        if (this.state.isDirectSelection && reason === 'finished') {
            this.logger.info('🎯 Direct selection - skipping autoplay');
            this.state.isDirectSelection = false; // 플래그 초기화
            await this.updateUI('Track changed');
            return;
        }

        if (reason === 'finished' && this.state.autoplay) {
            // single-track 모드면 자동재생 하지 않음
            if (this.state.mode === 'single-track') {
                this.logger.info('🎵 Single track completed - stopping playback');
                await this.updateUI('Single track completed');
                return;
            }
            
            this.logger.info('🔄 Auto-playing next track...');
            const success = await this.next();
            if (!success) {
                this.logger.warn('Auto-play failed - no next track available');
                await this.updateUI('Playback ended');
            }
        } else {
            this.logger.info('🛑 Playback stopped', {
                reason: reason !== 'finished' ? reason : 'autoplay disabled'
            });
            await this.updateUI('Track ended');
        }

        // 플래그 초기화
        this.state.isDirectSelection = false;
        this.state.isManualStop = false;
    }

    async setVolume(volume) {
        this.logger.trace('setVolume', [volume]);

        // 고음질 모드 체크
        if (this.state.audioMode === 'HIGH_QUALITY') {
            this.logger.warn('Volume control blocked in high quality mode');

            // 사용자에게 직접 알림
            if (this.lastInteraction) {
                try {
                    await this.lastInteraction.followUp({
                        content: '🎧 **고음질 모드**에서는 볼륨 조절이 불가능합니다.\n🎛️ **조절 모드**로 전환 후 사용해주세요.',
                        ephemeral: true
                    });
                } catch (error) {
                    this.logger.debug('Follow up failed', error);
                }
            }

            return false;
        }

        // 조절 모드에서만 실행
        const normalizedVolume = Math.max(0, Math.min(1, volume));
        const success = await this.audio.setVolume(normalizedVolume);

        if (success) {
            this.state.volume = normalizedVolume;
            this.logger.stateChange('volume', normalizedVolume);
            await this.updateUI('Volume changed');
        }

        return success;
    }

    async volumeUp(step = 0.1) {
        if (this.state.audioMode === 'HIGH_QUALITY') {
            return await this.setVolume(this.state.volume); // 차단 메시지 표시
        }

        const newVolume = Math.min(1, this.state.volume + step);
        return await this.setVolume(newVolume);
    }

    async volumeDown(step = 0.1) {
        if (this.state.audioMode === 'HIGH_QUALITY') {
            return await this.setVolume(this.state.volume); // 차단 메시지 표시
        }

        const newVolume = Math.max(0, this.state.volume - step);
        return await this.setVolume(newVolume);
    }

    async setMode(mode) {
        this.logger.trace('setMode', [mode]);

        const validModes = ['normal', 'repeat-one', 'repeat-all', 'shuffle', 'single-track'];
        if (!validModes.includes(mode)) {
            this.logger.warn('Invalid mode', { mode });
            return false;
        }

        const oldMode = this.state.mode;
        this.state.mode = mode;

        // 모드 변경 시 Direct Selection 플래그 초기화 (사용자 의도 변경으로 간주)
        this.state.isDirectSelection = false;

        if (mode === 'shuffle' && oldMode !== 'shuffle') {
            this.queue.enableShuffle(this.state.currentIndex);
        } else if (mode !== 'shuffle' && oldMode === 'shuffle') {
            this.queue.disableShuffle();
        }

        this.logger.stateChange('mode', mode);
        this.logger.debug('Direct selection flag reset due to mode change', {
            oldMode,
            newMode: mode,
            directSelectionReset: true
        });
        await this.updateUI('Mode changed');

        return true;
    }

    async toggleMode() {
        const modes = ['single-track', 'normal', 'repeat-one', 'repeat-all', 'shuffle'];
        const currentIndex = modes.indexOf(this.state.mode);
        const nextIndex = (currentIndex + 1) % modes.length;

        return await this.setMode(modes[nextIndex]);
    }

    async setAudioMode(mode) {
        this.logger.trace('setAudioMode', [mode]);

        if (!this.state.availableAudioModes.includes(mode)) {
            this.logger.warn('Invalid audio mode', { mode });
            return false;
        }

        const wasPlaying = this.state.isPlaying;
        const currentTrack = this.audio.currentTrack;
        const currentIndex = this.state.currentIndex;

        // 재생 중이면 정지
        if (wasPlaying) {
            await this.audio.stop();
        }

        // 모드 변경
        const oldMode = this.state.audioMode;
        this.state.audioMode = mode;

        // AudioEngine에 모드 변경 알림
        await this.audio.setAudioMode(mode);

        // 재생 중이었다면 재개
        if (wasPlaying && currentTrack && currentIndex >= 0) {
            await this.play(currentIndex);
        }

        this.logger.stateChange('audioMode', `${oldMode} → ${mode}`);
        await this.updateUI('Audio mode changed');
        return true;
    }

    async toggleSort() {
        this.logger.trace('toggleSort');

        const success = await this.queue.sort();
        if (success) {
            await this.updateUI('Sort changed');
        }

        return success;
    }

    async toggleSource() {
        this.logger.trace('toggleSource');

        const currentSource = this.queue.source;
        const newSource = currentSource === 'youtube' ? 'local' : 'youtube';

        // 로컬 음악으로 전환하려는데 권한이 없는 경우
        if (newSource === 'local' && !this.state.hasLocalMusicPermission) {
            await this.sendUserGuidance('🔒 **로컬 음악 권한이 필요합니다!**\n\n' +
                '로컬 음악을 사용하려면 권한이 필요합니다.\n' +
                'https://mystery-place.com 에 로그인후 마이페이지에서 구입 또는 관리하세요');
            return false;
        }

        const success = await this.queue.loadFromSource(newSource, this.user?.id);

        if (success) {
            if (this.state.isPlaying || this.state.isPaused) {
                await this.stop();
            }

            this.state.currentIndex = -1;

            const sourceNames = {
                'youtube': 'YouTube',
                'local': '로컬 파일'
            };

            await this.sendUserGuidance(`🔄 **음악 소스가 변경되었습니다!**\n\n` +
                `📍 **${sourceNames[newSource]}** 플레이리스트로 전환되었습니다.`);

            this.logger.userAction('source changed', { from: currentSource, to: newSource, userId: this.user?.id });
            await this.updateUI('Source changed');
        } else {
            const sourceNames = {
                'youtube': 'YouTube',
                'local': '로컬 파일'
            };
            await this.sendUserGuidance(`❌ **${sourceNames[newSource]} 로드에 실패했습니다.**\n\n` +
                '플레이리스트가 비어있거나 오류가 발생했습니다.');
        }

        return success;
    }

    async updateUI(reason = 'Update') {
        this.logger.trace('updateUI', [reason]);

        try {
            if (this.interactionMsg && this.interactionMsg.edit) {
                const uiData = this.ui.render(this.getFullState());
                await this.interactionMsg.edit(uiData);
                this.logger.debug('UI updated', { reason });
            }
        } catch (error) {
            this.logger.warn('UI update failed', error);
        }
    }

    toggleAutoplay() {
        this.state.autoplay = !this.state.autoplay;
        this.logger.stateChange('autoplay', this.state.autoplay);
        this.updateUI('Autoplay toggled');
        return this.state.autoplay;
    }

    async toggleVoiceConnection(user) {
        this.logger.trace('toggleVoiceConnection', [user?.id]);

        try {
            if (this.audio.isConnected()) {
                // 현재 연결되어 있으면 해제
                this.logger.userAction('voice disconnect', { userId: user?.id });

                // 재생 중이면 정지
                if (this.state.isPlaying || this.state.isPaused) {
                    await this.stop();
                }

                // 연결 해제
                if (this.audio.connection) {
                    this.audio.connection.destroy();
                    this.audio.connection = null;
                }

                this.logger.info('🔌 Voice channel disconnected');
                await this.sendUserGuidance('🔇 **음성채널에서 연결이 해제되었습니다.**\n\n' +
                    '음악 재생이 중지되었습니다.');
                await this.updateUI('Voice disconnected');
                return false;

            } else {
                // 연결되어 있지 않으면 연결
                this.logger.userAction('voice connect', { userId: user?.id });

                if (!user?.voice?.channel) {
                    this.logger.warn('User not in voice channel');
                    await this.sendUserGuidance('🔊 **음성채널 접속이 필요합니다!**\n\n' +
                        '먼저 음성채널에 입장한 후 다시 시도해주세요.');
                    return false;
                }

                const connected = await this.audio.connectToVoice(user);
                if (connected) {
                    this.logger.info('🔌 Voice channel connected');
                    // const channelName = user.voice.channel.name;
                    // await this.sendUserGuidance(`🔊 **음성채널에 접속했습니다!**\n\n` +
                    //     `📍 **${channelName}** 채널에서 음악을 재생할 수 있습니다.`);
                    await this.updateUI('Voice connected');
                    return true;
                } else {
                    this.logger.warn('Voice connection failed');
                    await this.sendUserGuidance('❌ **음성채널 접속에 실패했습니다.**\n\n' +
                        '잠시 후 다시 시도해주세요.');
                    return false;
                }
            }
        } catch (error) {
            this.logger.error('Voice connection toggle failed', error);
            await this.sendUserGuidance('❌ **음성채널 연결 중 오류가 발생했습니다.**\n\n' +
                '잠시 후 다시 시도해주세요.');
            return false;
        }
    }

    getFullState() {
        // 실제 재생 중인 트랙 정보를 AudioEngine에서 가져오기
        const actualCurrentTrack = this.audio.currentTrack;
        const queueInfo = this.queue.getInfo();

        return {
            ...this.state,
            currentTrack: actualCurrentTrack, // AudioEngine의 실제 트랙 사용
            queue: queueInfo,
            audio: this.audio.getStatus(),
            ui: this.uiState,
            version: this.version,
            lastVolumeBlockMessage: this.lastVolumeBlockMessage
        };
    }

    async reply() {
        this.logger.trace('reply');
        return this.ui.render(this.getFullState());
    }

    setPage(page) {
        const maxPage = Math.ceil(this.queue.length / this.uiState.pageSize) - 1;
        this.uiState.currentPage = Math.max(0, Math.min(page, maxPage));
        this.logger.userAction('Page changed', { page: this.uiState.currentPage, userId: this.user?.id });
        this.updateUI('Page changed');
    }

    goToFirstPage() {
        this.setPage(0);
    }

    goToLastPage() {
        const maxPage = Math.ceil(this.queue.length / this.uiState.pageSize) - 1;
        this.setPage(maxPage);
    }

    nextPage() {
        this.setPage(this.uiState.currentPage + 1);
    }

    prevPage() {
        this.setPage(this.uiState.currentPage - 1);
    }

    async destroy() {
        this.logger.info('🔚 Destroying Music Player v4...');
        const timer = this.logger.startTimer('destroy player');

        try {
            // 1. 먼저 플레이어 메시지 삭제 시도
            await this.deletePlayerMessage();

            // 2. 오디오 엔진 정리
            await this.audio.destroy();

            // 3. 큐 정리
            this.queue.clear();

            // 4. 상태 초기화
            this.state.isPlaying = false;
            this.state.isPaused = false;
            this.state.currentIndex = -1;

            // 5. 참조 제거
            this.interactionMsg = null;
            this.lastInteraction = null;

            timer.end(true);
            this.logger.info('✅ Music Player v4 destroyed successfully');

        } catch (error) {
            this.logger.error('Destroy failed', error);
            timer.end(false);
        }
    }

    async deletePlayerMessage() {
        this.logger.trace('deletePlayerMessage');

        if (!this.interactionMsg) {
            this.logger.debug('No message to delete');
            return;
        }

        try {
            // 메시지 삭제 시도
            if (this.interactionMsg.delete && typeof this.interactionMsg.delete === 'function') {
                await this.interactionMsg.delete();
                this.logger.info('🗑️ Player message deleted successfully');
            } else if (this.interactionMsg.edit && typeof this.interactionMsg.edit === 'function') {
                // 삭제가 불가능한 경우 메시지를 비활성화
                await this.disablePlayerMessage();
            }
        } catch (error) {
            this.logger.warn('Message deletion failed, attempting to disable', error);
            // 삭제 실패 시 메시지 비활성화 시도
            await this.disablePlayerMessage();
        }
    }

    async disablePlayerMessage() {
        this.logger.trace('disablePlayerMessage');

        try {
            if (this.interactionMsg.edit && typeof this.interactionMsg.edit === 'function') {
                // 모든 컴포넌트 비활성화
                const disabledUI = this.ui.createDisabledUI();
                await this.interactionMsg.edit(disabledUI);
                this.logger.info('🔒 Player message disabled successfully');
            }
        } catch (error) {
            this.logger.warn('Message disable failed', error);
        }
    }

    healthCheck() {
        const health = {
            status: 'healthy',
            version: this.version,
            guildId: this.guildId,
            isPlaying: this.state.isPlaying,
            isPaused: this.state.isPaused,
            currentIndex: this.state.currentIndex,
            queueLength: this.queue.length,
            audio: this.audio.getStatus(),
            queue: this.queue.getInfo(),
            uptime: process.uptime()
        };

        this.logger.debug('Health check', health);
        return health;
    }
}

module.exports = MusicPlayerV4;