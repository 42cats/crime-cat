/**
 * MusicPlayer v3.0
 * 통합 음악 플레이어 시스템
 * 
 * 설계 철학:
 * - Single Responsibility: 각 엔진은 하나의 책임만
 * - Centralized State: Redux 패턴으로 예측 가능한 상태 관리
 * - Event Driven: 모든 상호작용은 액션을 통해 처리
 * - Performance First: 캐싱과 최적화로 빠른 반응
 */

const { StateManager } = require('./StateManager');
const { AudioEngine } = require('./AudioEngine');
const { PlaylistEngine } = require('./PlaylistEngine');
const { UIEngine } = require('./UIEngine');
const { 
    ACTION_TYPES, 
    PLAYBACK_STATES, 
    PLAY_MODES, 
    SOURCE_TYPES, 
    ERROR_TYPES 
} = require('./types');

class MusicPlayer {
    constructor(guildId, client = null, user = null) {
        if (!guildId) {
            throw new Error('guildId is required');
        }

        // 기본 정보
        this.guildId = guildId;
        this.client = client;
        this.user = user;
        
        // 상태 관리자 초기화
        this.stateManager = new StateManager(guildId);
        
        // 엔진들 초기화
        this.audioEngine = new AudioEngine(guildId, this.stateManager);
        this.playlistEngine = new PlaylistEngine(guildId, this.stateManager);
        this.uiEngine = new UIEngine(guildId, this.stateManager, this.playlistEngine);
        
        // UI 메시지 참조 (v2 호환성)
        this.interactionMsg = null;
        
        // 상태 변경 구독
        this.setupStateSubscription();
        
        // 초기화 플래그
        this.isInitialized = false;
        
        console.log(`[MusicPlayer v3.0] Initialized for guild: ${guildId}`);
    }

    /**
     * 상태 변경 구독 설정
     */
    setupStateSubscription() {
        this.stateManager.subscribe((newState, prevState, action) => {
            this.handleStateChange(newState, prevState, action);
        });
    }

    /**
     * 초기화
     */
    async initialize() {
        if (this.isInitialized) {
            return true;
        }
        
        try {
            // 기본 YouTube 플레이리스트 로드
            await this.playlistEngine.loadPlaylist(SOURCE_TYPES.YOUTUBE);
            this.isInitialized = true;
            console.log('[MusicPlayer] Initialization completed');
            return true;
        } catch (error) {
            console.error('[MusicPlayer] Initialization failed:', error);
            return false;
        }
    }

    /**
     * 상태 변경 처리
     */
    handleStateChange(newState, prevState, action) {
        // 디버깅 로그
        if (action.type !== ACTION_TYPES.SET_PLAYBACK_STATE) {
            console.log(`[MusicPlayer] State changed: ${action.type}`);
        }
        
        // 특정 액션에 대한 후처리
        this.handlePostActionEffects(newState, prevState, action);
    }

    /**
     * 액션 후처리 (사이드 이펙트)
     */
    async handlePostActionEffects(newState, prevState, action) {
        switch (action.type) {
            case ACTION_TYPES.PLAY_TRACK:
                // 트랙 재생 시 오디오 엔진에 재생 요청
                const track = newState.playback.currentTrack;
                if (track) {
                    await this.audioEngine.playTrack(track, this.user);
                }
                break;
                
            case ACTION_TYPES.NEXT_TRACK:
            case ACTION_TYPES.PREV_TRACK:
                // 네비게이션 후 자동 재생
                const nextTrack = newState.playback.currentTrack;
                if (nextTrack && prevState.playback.state === PLAYBACK_STATES.PLAYING) {
                    // 이전에 재생 중이었다면 다음/이전 트랙도 자동 재생
                    await this.audioEngine.playTrack(nextTrack, this.user);
                }
                break;
                
            case ACTION_TYPES.TRACK_ENDED:
                // 트랙이 자연스럽게 종료된 경우
                const trackAfterEnd = newState.playback.currentTrack;
                // REPEAT_ONE 모드에서는 같은 트랙 재재생
                if (trackAfterEnd && newState.playlist.mode === PLAY_MODES.REPEAT_ONE) {
                    await this.audioEngine.playTrack(trackAfterEnd, this.user);
                }
                // NORMAL, SHUFFLE 모드에서는 다음 트랙으로 진행 (navigationReducer가 처리)
                else if (trackAfterEnd && (newState.playlist.mode === PLAY_MODES.NORMAL || newState.playlist.mode === PLAY_MODES.SHUFFLE)) {
                    await this.audioEngine.playTrack(trackAfterEnd, this.user);
                }
                break;
                
            case ACTION_TYPES.PAUSE_TRACK:
                await this.audioEngine.pause();
                break;
                
            case ACTION_TYPES.RESUME_TRACK:
                this.audioEngine.resume();
                break;
                
            case ACTION_TYPES.STOP_TRACK:
                await this.audioEngine.stop();
                break;
                
            case ACTION_TYPES.SET_VOLUME:
                this.audioEngine.setVolume(newState.playback.volume);
                break;
                
            case ACTION_TYPES.CHANGE_SOURCE:
                // 소스 변경 시 플레이리스트 재로드
                await this.playlistEngine.loadPlaylist(newState.playlist.source);
                break;
                
            case ACTION_TYPES.CHANGE_SORT:
                // 정렬 변경 시 플레이리스트 재로드
                await this.playlistEngine.loadPlaylist(
                    newState.playlist.source, 
                    newState.playlist.sort
                );
                break;
        }
    }

    // ==========================================
    // 공개 API (v2 호환성 포함)
    // ==========================================

    /**
     * 트랙 재생
     */
    async play(index, isSelect = false) {
        try {
            const state = this.stateManager.getState();
            const { playlist } = state;
            
            // 유효성 검사
            if (!playlist.items || playlist.items.length === 0) {
                throw new Error(ERROR_TYPES.PLAYLIST_EMPTY);
            }
            
            if (index < 0 || index >= playlist.items.length) {
                throw new Error(`${ERROR_TYPES.INVALID_INDEX}: ${index}`);
            }
            
            const track = playlist.items[index];
            if (!track) {
                throw new Error(`${ERROR_TYPES.TRACK_NOT_FOUND}: ${index}`);
            }
            
            console.log(`[MusicPlayer] Playing: ${track.title} (index: ${index})`);
            
            // 상태 업데이트 (재생 액션 디스패치)
            this.stateManager.dispatch({
                type: ACTION_TYPES.PLAY_TRACK,
                payload: {
                    index: index,
                    track: track,
                    isManual: isSelect
                }
            });
            
            return true;
            
        } catch (error) {
            console.error('[MusicPlayer] Play failed:', error);
            this.stateManager.dispatch({
                type: ACTION_TYPES.AUDIO_ERROR,
                payload: { error }
            });
            return false;
        }
    }

    /**
     * 다음 곡
     */
    async next() {
        try {
            console.log('[MusicPlayer] Next track requested');
            
            this.stateManager.dispatch({
                type: ACTION_TYPES.NEXT_TRACK
            });
            
            return true;
            
        } catch (error) {
            console.error('[MusicPlayer] Next failed:', error);
            return false;
        }
    }

    /**
     * 이전 곡
     */
    async prev() {
        try {
            console.log('[MusicPlayer] Previous track requested');
            
            this.stateManager.dispatch({
                type: ACTION_TYPES.PREV_TRACK
            });
            
            return true;
            
        } catch (error) {
            console.error('[MusicPlayer] Previous failed:', error);
            return false;
        }
    }

    /**
     * 일시정지
     */
    async pause() {
        try {
            const state = this.stateManager.getState();
            
            if (state.playback.state === PLAYBACK_STATES.PLAYING) {
                this.stateManager.dispatch({
                    type: ACTION_TYPES.PAUSE_TRACK
                });
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('[MusicPlayer] Pause failed:', error);
            return false;
        }
    }

    /**
     * 재개
     */
    async resume() {
        try {
            const state = this.stateManager.getState();
            
            if (state.playback.state === PLAYBACK_STATES.PAUSED) {
                this.stateManager.dispatch({
                    type: ACTION_TYPES.RESUME_TRACK
                });
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('[MusicPlayer] Resume failed:', error);
            return false;
        }
    }

    /**
     * 정지
     */
    async stop() {
        try {
            this.stateManager.dispatch({
                type: ACTION_TYPES.STOP_TRACK
            });
            
            return true;
            
        } catch (error) {
            console.error('[MusicPlayer] Stop failed:', error);
            return false;
        }
    }

    /**
     * 볼륨 설정
     */
    setVolume(volume) {
        try {
            this.stateManager.dispatch({
                type: ACTION_TYPES.SET_VOLUME,
                payload: volume
            });
            
            return true;
            
        } catch (error) {
            console.error('[MusicPlayer] Set volume failed:', error);
            return false;
        }
    }

    /**
     * 볼륨 증가
     */
    volumeUp() {
        const state = this.stateManager.getState();
        const newVolume = Math.min(1, state.playback.volume + 0.1);
        return this.setVolume(newVolume);
    }

    /**
     * 볼륨 감소
     */
    volumeDown() {
        const state = this.stateManager.getState();
        const newVolume = Math.max(0, state.playback.volume - 0.1);
        return this.setVolume(newVolume);
    }

    /**
     * 재생 모드 변경
     */
    setPlayMode(mode = null) {
        try {
            const state = this.stateManager.getState();
            
            // 모드가 지정되지 않으면 순환
            let newMode = mode;
            if (!newMode) {
                const modes = [PLAY_MODES.REPEAT_ONE, PLAY_MODES.NORMAL, PLAY_MODES.ONCE, PLAY_MODES.SHUFFLE];
                const currentIndex = modes.indexOf(state.playlist.mode);
                newMode = modes[(currentIndex + 1) % modes.length];
            }
            
            this.stateManager.dispatch({
                type: ACTION_TYPES.CHANGE_MODE,
                payload: newMode
            });
            
            console.log(`[MusicPlayer] Play mode changed to: ${newMode}`);
            return true;
            
        } catch (error) {
            console.error('[MusicPlayer] Set play mode failed:', error);
            return false;
        }
    }

    /**
     * 정렬 모드 변경
     */
    sortList() {
        try {
            const state = this.stateManager.getState();
            const newSort = state.playlist.sort === 'DATE' ? 'ABC' : 'DATE';
            
            this.stateManager.dispatch({
                type: ACTION_TYPES.CHANGE_SORT,
                payload: newSort
            });
            
            console.log(`[MusicPlayer] Sort changed to: ${newSort}`);
            return true;
            
        } catch (error) {
            console.error('[MusicPlayer] Sort list failed:', error);
            return false;
        }
    }

    /**
     * 소스 토글 (YouTube ↔ Local)
     */
    togleLocal() {
        try {
            const state = this.stateManager.getState();
            const newSource = state.playlist.source === SOURCE_TYPES.LOCAL 
                ? SOURCE_TYPES.YOUTUBE 
                : SOURCE_TYPES.LOCAL;
            
            this.stateManager.dispatch({
                type: ACTION_TYPES.CHANGE_SOURCE,
                payload: newSource
            });
            
            console.log(`[MusicPlayer] Source changed to: ${newSource}`);
            return true;
            
        } catch (error) {
            console.error('[MusicPlayer] Toggle local failed:', error);
            return false;
        }
    }

    /**
     * 플레이리스트 새로고침
     */
    async refreshPlaylist() {
        try {
            const state = this.stateManager.getState();
            
            // 캐시 무효화 후 재로드
            this.playlistEngine.invalidateCache();
            const data = await this.playlistEngine.loadPlaylist(
                state.playlist.source, 
                state.playlist.sort
            );
            
            console.log(`[MusicPlayer] Playlist refreshed: ${data.length} items`);
            return data;
            
        } catch (error) {
            console.error('[MusicPlayer] Refresh playlist failed:', error);
            return [];
        }
    }

    /**
     * UI 컴포넌트 생성
     */
    async reply() {
        try {
            // 초기화 확인
            if (!this.isInitialized) {
                await this.initialize();
            }
            
            return await this.uiEngine.generateComponents();
        } catch (error) {
            console.error('[MusicPlayer] Reply failed:', error);
            return this.uiEngine.getErrorComponents();
        }
    }

    /**
     * 연결/해제 토글 (임시 구현)
     */
    async onOff() {
        try {
            const state = this.stateManager.getState();
            
            if (state.playback.state === PLAYBACK_STATES.PLAYING) {
                await this.pause();
            } else if (state.playback.state === PLAYBACK_STATES.PAUSED) {
                await this.resume();
            }
            
            return true;
            
        } catch (error) {
            console.error('[MusicPlayer] OnOff failed:', error);
            return false;
        }
    }

    // ==========================================
    // v2 호환성 속성들
    // ==========================================

    /**
     * 플레이리스트 매니저 (호환성)
     */
    get playlistManager() {
        return {
            currentIndex: this.stateManager.getState().playback.currentIndex,
            refresh: () => this.refreshPlaylist()
        };
    }

    /**
     * 오디오 플레이어 매니저 (호환성)
     */
    get audioPlayerManager() {
        return {
            player: this.audioEngine.player
        };
    }

    /**
     * UI 해시 (호환성 - 항상 변경된 것으로 처리)
     */
    getUIHash() {
        return Date.now().toString();
    }

    // ==========================================
    // 상태 조회 및 디버깅
    // ==========================================

    /**
     * 현재 상태 반환
     */
    getState() {
        return this.stateManager.getState();
    }

    /**
     * 현재 재생 중인 트랙
     */
    getCurrentTrack() {
        return this.stateManager.getState().playback.currentTrack;
    }

    /**
     * 플레이리스트 정보
     */
    getPlaylistInfo() {
        const state = this.stateManager.getState();
        return {
            items: state.playlist.items,
            currentIndex: state.playback.currentIndex,
            mode: state.playlist.mode,
            source: state.playlist.source,
            totalCount: state.playlist.totalCount
        };
    }

    /**
     * 재생 상태 정보
     */
    getPlaybackInfo() {
        const state = this.stateManager.getState();
        return {
            state: state.playback.state,
            volume: state.playback.volume,
            currentTrack: state.playback.currentTrack,
            currentIndex: state.playback.currentIndex
        };
    }

    /**
     * 시스템 통계
     */
    getSystemStats() {
        return {
            state: this.stateManager.getDebugInfo(),
            audio: this.audioEngine.getStatus(),
            playlist: this.playlistEngine.getStats(),
            ui: this.uiEngine.getCacheStats()
        };
    }

    /**
     * 헬스 체크
     */
    healthCheck() {
        const audioStatus = this.audioEngine.getStatus();
        const playlistHealth = this.playlistEngine.healthCheck();
        
        return {
            status: playlistHealth.status === 'healthy' ? 'healthy' : 'warning',
            audio: audioStatus,
            playlist: playlistHealth,
            version: '3.0.0'
        };
    }

    /**
     * 리소스 정리
     */
    async destroy() {
        console.log(`[MusicPlayer] Destroying player for guild: ${this.guildId}`);
        
        try {
            // 모든 엔진 정리
            await this.audioEngine.destroy();
            await this.uiEngine.destroy();
            await this.playlistEngine.destroy();
            await this.stateManager.destroy();
            
            // 참조 해제
            this.stateManager = null;
            this.audioEngine = null;
            this.playlistEngine = null;
            this.uiEngine = null;
            this.interactionMsg = null;
            
            console.log('[MusicPlayer] Destruction completed');
            return true;
            
        } catch (error) {
            console.error('[MusicPlayer] Destruction failed:', error);
            return false;
        }
    }
}

module.exports = { MusicPlayer };