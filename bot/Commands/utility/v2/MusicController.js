/**
 * MusicController v2.0
 * 음악 플레이어 통합 제어 시스템
 * 
 * 설계 원칙:
 * - Single Responsibility: 각 컴포넌트는 하나의 책임만
 * - Event-Driven: 모든 상태 변화는 이벤트 기반
 * - Immutable State: 상태 변경은 새 객체 생성
 * - Atomic Operations: 모든 작업은 원자적 실행
 */

const { EventBus } = require('./EventBus');
const { PlayerCore } = require('./PlayerCore');
const { UIManager } = require('./UIManager');
const { DataService } = require('./DataService');

class MusicController {
    constructor(guildId, client, user) {
        if (!guildId) {
            throw new Error('guildId is required');
        }

        // 기본 정보
        this.guildId = guildId;
        this.client = client;
        this.user = user;
        
        // 현재 상태 (불변 객체)
        this.state = Object.freeze({
            playback: 'IDLE', // IDLE, LOADING, PLAYING, PAUSED, STOPPING
            playlist: {
                items: [],
                currentIndex: 0,
                mode: 'REPEAT_ONE', // REPEAT_ONE, NORMAL, ONCE, SHUFFLE
                sort: 'DATE' // DATE, ABC
            },
            ui: {
                currentPage: 0,
                isLocal: false,
                volume: 0.5
            },
            internal: {
                isProcessing: false,
                lastUpdateTime: Date.now(),
                manualNavigation: false, // 수동 네비게이션 플래그
                shuffleHistory: [], // 셔플 재생 기록
                shuffleNextTrack: null // 미리 계산된 다음 셔플 트랙
            }
        });

        // 핵심 컴포넌트 초기화
        this.eventBus = new EventBus();
        this.playerCore = new PlayerCore(this.guildId, this.eventBus);
        this.uiManager = new UIManager(this.guildId, this.eventBus);
        this.dataService = new DataService(this.guildId, this.eventBus);

        // 컴포넌트 간 통신 설정
        this.setupEventHandlers();
        
        // 상태 변경 로그
        this.eventBus.on('state.changed', (newState) => {
            console.log(`[MUSIC v2.0] State changed for guild ${this.guildId}:`, {
                playback: newState.playback,
                currentIndex: newState.playlist.currentIndex,
                processing: newState.internal.isProcessing
            });
        });

        console.log(`[MUSIC v2.0] Controller initialized for guild: ${this.guildId}`);
    }

    /**
     * 이벤트 핸들러 설정
     */
    setupEventHandlers() {
        // 플레이어 상태 변화 처리
        this.eventBus.on('player.stateChanged', this.handlePlayerStateChange.bind(this));
        
        // 트랙 종료 처리 (자동 진행)
        this.eventBus.on('player.trackEnded', this.handleTrackEnded.bind(this));
        
        // 플레이리스트 변화 처리
        this.eventBus.on('playlist.updated', this.handlePlaylistUpdate.bind(this));
        
        // UI 상호작용 처리
        this.eventBus.on('ui.interaction', this.handleUIInteraction.bind(this));
        
        // 에러 처리
        this.eventBus.on('error', this.handleError.bind(this));
    }

    /**
     * 상태 업데이트 (불변성 보장)
     */
    updateState(updates) {
        const newState = this.deepMerge(this.state, {
            ...updates,
            internal: {
                ...this.state.internal,
                lastUpdateTime: Date.now()
            }
        });
        
        this.state = Object.freeze(newState);
        this.eventBus.emit('state.changed', this.state);
        return this.state;
    }

    /**
     * 깊은 객체 병합 (불변성 유지)
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * 원자적 작업 실행 (동시 실행 방지)
     */
    async executeAtomicOperation(operation, operationName = 'unknown') {
        if (this.state.internal.isProcessing) {
            console.warn(`[MUSIC v2.0] Operation ${operationName} blocked - already processing`);
            return false;
        }

        this.updateState({ internal: { isProcessing: true } });
        
        try {
            console.log(`[MUSIC v2.0] Executing: ${operationName}`);
            const result = await operation();
            console.log(`[MUSIC v2.0] Completed: ${operationName}`);
            return result;
        } catch (error) {
            console.error(`[MUSIC v2.0] Failed: ${operationName}`, error);
            this.eventBus.emit('error', { operation: operationName, error });
            throw error;
        } finally {
            this.updateState({ internal: { isProcessing: false } });
        }
    }

    // ============================================
    // 공개 API (기존 인터페이스 호환)
    // ============================================

    /**
     * 플레이리스트 새로고침
     */
    async refreshPlaylist() {
        return this.executeAtomicOperation(async () => {
            console.log(`[MUSIC v2.0] Refreshing playlist (isLocal: ${this.state.ui.isLocal})`);
            const data = await this.dataService.refresh(this.state.ui.isLocal);
            console.log(`[MUSIC v2.0] Refresh completed, got ${data?.length || 0} items`);
            return data;
        }, 'refreshPlaylist');
    }

    /**
     * 곡 재생
     */
    async play(index, isSelect = false) {
        return this.executeAtomicOperation(async () => {
            // 플레이리스트 확인
            if (!this.state.playlist.items || this.state.playlist.items.length === 0) {
                throw new Error('Playlist is empty. Please add songs first.');
            }
            
            // 인덱스 유효성 확인
            if (index < 0 || index >= this.state.playlist.items.length) {
                throw new Error(`Invalid index ${index}. Playlist has ${this.state.playlist.items.length} items.`);
            }
            
            if (isSelect) {
                this.updateState({ playlist: { currentIndex: index } });
            }
            
            // 트랙 데이터 가져오기
            const track = this.state.playlist.items[index];
            if (!track) {
                throw new Error(`No track found at index ${index}`);
            }
            
            console.log(`[MUSIC v2.0] Playing track: ${track.title} at index ${index}`);
            
            // 인덱스 업데이트
            this.updateState({ playlist: { currentIndex: index } });
            
            // 셔플 모드에서 곡 재생 시 다음 트랙 미리 계산
            if (this.state.playlist.mode === 'SHUFFLE' && this.state.playlist.items.length > 1) {
                setTimeout(() => {
                    if (this.state.internal.shuffleNextTrack === null) {
                        this.preCalculateNextShuffle();
                    }
                }, 100); // 상태 업데이트 후 실행
            }
            
            await this.playerCore.play(track, index, this.user);
        }, `play(${index})`);
    }

    /**
     * 다음 곡
     */
    async next() {
        return this.executeAtomicOperation(async () => {
            const nextIndex = this.calculateNextIndex();
            const track = this.state.playlist.items[nextIndex];
            if (!track) {
                throw new Error(`No track found at next index ${nextIndex}`);
            }
            
            // 수동 네비게이션 플래그 설정
            this.updateState({ 
                playlist: { currentIndex: nextIndex },
                internal: { manualNavigation: true }
            });
            console.log(`[MUSIC v2.0] Manual navigation flag set for NEXT`);
            await this.playerCore.play(track, nextIndex, this.user);
        }, 'next');
    }

    /**
     * 이전 곡
     */
    async prev() {
        return this.executeAtomicOperation(async () => {
            const prevIndex = this.calculatePrevIndex();
            const track = this.state.playlist.items[prevIndex];
            if (!track) {
                throw new Error(`No track found at prev index ${prevIndex}`);
            }
            
            // 수동 네비게이션 플래그 설정
            this.updateState({ 
                playlist: { currentIndex: prevIndex },
                internal: { manualNavigation: true }
            });
            console.log(`[MUSIC v2.0] Manual navigation flag set for PREV`);
            await this.playerCore.play(track, prevIndex, this.user);
        }, 'prev');
    }

    /**
     * 일시정지
     */
    async pause() {
        return this.executeAtomicOperation(async () => {
            await this.playerCore.pause();
        }, 'pause');
    }

    /**
     * 재개
     */
    resume() {
        return this.executeAtomicOperation(async () => {
            this.playerCore.resume();
        }, 'resume');
    }

    /**
     * 정지
     */
    async stop() {
        return this.executeAtomicOperation(async () => {
            await this.playerCore.stop();
        }, 'stop');
    }

    // ============================================
    // 이벤트 핸들러
    // ============================================

    async handlePlayerStateChange(data) {
        const { status, track } = data;
        
        // currentIndex 보존 - track이 없어도 기존 인덱스 유지
        const playlistUpdate = track && track.index !== undefined 
            ? { currentIndex: track.index }
            : {}; // 빈 객체로 두어 기존 currentIndex 보존
        
        this.updateState({
            playback: status,
            playlist: playlistUpdate
        });

        // UI 업데이트 요청
        this.eventBus.emit('ui.updateRequired');
    }

    async handleTrackEnded(data) {
        const { track, index, reason } = data;
        console.log(`[MUSIC v2.0] Track ended: ${track?.title}, reason: ${reason}`);
        
        if (reason === 'natural') {
            // 수동 네비게이션 플래그 상태 로그
            console.log(`[MUSIC v2.0] Manual navigation flag: ${this.state.internal.manualNavigation}`);
            
            // 수동 네비게이션 중이면 자동 진행 무시
            if (this.state.internal.manualNavigation) {
                console.log(`[MUSIC v2.0] Skipping auto advance - manual navigation in progress`);
                // 수동 네비게이션 플래그 재설정
                this.updateState({ internal: { manualNavigation: false } });
                return;
            }
            
            // 자연스러운 종료 - 자동 진행 실행
            await this.executeAtomicOperation(async () => {
                const { mode } = this.state.playlist;
                
                if (mode === 'REPEAT_ONE') {
                    // 같은 곡 반복
                    const currentTrack = this.state.playlist.items[this.state.playlist.currentIndex];
                    if (currentTrack) {
                        await this.playerCore.play(currentTrack, this.state.playlist.currentIndex, this.user);
                    }
                } else if (mode === 'ONCE') {
                    // 한번재생 모드 - 어떤 곡이든 끝나면 정지
                    console.log(`[MUSIC v2.0] ONCE mode - stopping after track ended`);
                    this.updateState({ playback: 'IDLE' });
                } else if (mode === 'NORMAL' || mode === 'SHUFFLE') {
                    // 다음곡으로
                    const nextIndex = this.calculateNextIndex();
                    const nextTrack = this.state.playlist.items[nextIndex];
                    if (nextTrack) {
                        this.updateState({ playlist: { currentIndex: nextIndex } });
                        await this.playerCore.play(nextTrack, nextIndex, this.user);
                    }
                }
            }, 'autoAdvance');
        }
    }

    async handlePlaylistUpdate(data) {
        console.log(`[MUSIC v2.0] Playlist updated: ${data.count} items from ${data.source}`);
        
        // currentIndex 계산 - 빈 목록이 아닌 경우 적절히 설정
        let newCurrentIndex;
        if (data.items.length === 0) {
            newCurrentIndex = -1; // 빈 목록인 경우
        } else if (this.state.playlist.currentIndex < 0 || this.state.playlist.currentIndex >= data.items.length) {
            newCurrentIndex = 0; // 유효하지 않은 인덱스인 경우 첫 번째 아이템으로
        } else {
            newCurrentIndex = this.state.playlist.currentIndex; // 유효한 인덱스 유지
        }
        
        this.updateState({
            playlist: {
                items: data.items,
                currentIndex: newCurrentIndex
            }
        });
        
        // 셔플 모드에서 플레이리스트 업데이트 시 다음 트랙 미리 계산
        if (this.state.playlist.mode === 'SHUFFLE' && data.items.length > 1) {
            setTimeout(() => {
                this.preCalculateNextShuffle();
            }, 100);
        }
        
        console.log(`[MUSIC v2.0] State updated with ${this.state.playlist.items.length} items, currentIndex: ${newCurrentIndex}`);
    }

    async handleUIInteraction(data) {
        const { action, payload } = data;
        
        switch (action) {
            case 'next':
                await this.next();
                break;
            case 'prev':
                await this.prev();
                break;
            case 'play':
                await this.play(payload.index, payload.isSelect);
                break;
            case 'pause':
                await this.pause();
                break;
            case 'resume':
                await this.resume();
                break;
            case 'stop':
                await this.stop();
                break;
            case 'setVolume':
                this.updateState({ ui: { volume: payload.volume } });
                this.playerCore.setVolume(payload.volume);
                break;
            case 'toggleMode':
                this.togglePlayMode();
                break;
            case 'toggleSort':
                this.toggleSort();
                break;
            case 'toggleLocal':
                await this.toggleLocal();
                break;
        }
    }

    async handleError(data) {
        console.error(`[MUSIC v2.0] Error in ${data.operation}:`, data.error);
        
        // 에러 상태로 전환
        this.updateState({
            playback: 'IDLE',
            internal: { isProcessing: false }
        });
    }

    // ============================================
    // 유틸리티 메서드
    // ============================================

    calculateNextIndex() {
        const { items, currentIndex, mode } = this.state.playlist;
        
        if (items.length === 0) return 0;
        
        switch (mode) {
            case 'REPEAT_ONE':
                return currentIndex;
            case 'NORMAL':
                return (currentIndex + 1) % items.length;
            case 'SHUFFLE':
                return this.calculateShuffleNext();
            case 'ONCE':
                return currentIndex < items.length - 1 ? currentIndex + 1 : currentIndex;
            default:
                return (currentIndex + 1) % items.length;
        }
    }

    /**
     * 셔플 모드 다음 인덱스 계산
     */
    calculateShuffleNext() {
        const { items, currentIndex } = this.state.playlist;
        const { shuffleHistory } = this.state.internal;
        
        if (items.length <= 1) return currentIndex;
        
        // 미리 계산된 다음 트랙이 있으면 사용하고 새로 계산
        if (this.state.internal.shuffleNextTrack !== null) {
            const nextIndex = this.state.internal.shuffleNextTrack;
            console.log(`[MUSIC v2.0] Using pre-calculated shuffle next: ${items[nextIndex]?.title} (index: ${nextIndex})`);
            
            // 사용된 트랙을 히스토리에 추가하고 다음 다음 트랙 계산
            this.updateState({
                internal: {
                    shuffleHistory: [...shuffleHistory, currentIndex].slice(-items.length),
                    shuffleNextTrack: null // 일단 리셋
                }
            });
            
            // 새로운 다음 트랙 미리 계산
            setTimeout(() => {
                this.preCalculateNextShuffle();
            }, 50);
            
            return nextIndex;
        }
        
        // 처음 셔플이거나 기록이 없는 경우
        const nextIndex = this.generateRandomIndex(currentIndex, shuffleHistory);
        console.log(`[MUSIC v2.0] Generated new shuffle next: ${items[nextIndex]?.title} (index: ${nextIndex})`);
        
        // 즉시 상태 업데이트하고 다음 트랙 미리 계산
        this.updateState({
            internal: {
                shuffleNextTrack: nextIndex,
                shuffleHistory: [...shuffleHistory, currentIndex].slice(-items.length)
            }
        });
        
        return nextIndex;
    }

    /**
     * 다음 셔플 트랙 미리 계산
     */
    preCalculateNextShuffle() {
        const { items, currentIndex } = this.state.playlist;
        const { shuffleHistory } = this.state.internal;
        
        if (items.length <= 1) return;
        
        const nextIndex = this.generateRandomIndex(currentIndex, [...shuffleHistory, currentIndex]);
        
        console.log(`[MUSIC v2.0] Shuffle next track calculated: ${items[nextIndex]?.title} (index: ${nextIndex})`);
        
        this.updateState({
            internal: {
                shuffleNextTrack: nextIndex,
                shuffleHistory: [...shuffleHistory, currentIndex].slice(-items.length) // 최대 플레이리스트 길이만큼 기록
            }
        });
    }

    /**
     * 랜덤 인덱스 생성 (중복 방지)
     */
    generateRandomIndex(currentIndex, history) {
        const { items } = this.state.playlist;
        
        if (items.length <= 1) return currentIndex;
        
        // 가능한 인덱스들 (현재 곡과 최근 기록 제외)
        const availableIndices = [];
        for (let i = 0; i < items.length; i++) {
            if (i !== currentIndex && !history.includes(i)) {
                availableIndices.push(i);
            }
        }
        
        // 모든 곡을 재생했으면 기록 초기화하고 다시 선택
        if (availableIndices.length === 0) {
            const resetIndices = [];
            for (let i = 0; i < items.length; i++) {
                if (i !== currentIndex) {
                    resetIndices.push(i);
                }
            }
            return resetIndices[Math.floor(Math.random() * resetIndices.length)];
        }
        
        return availableIndices[Math.floor(Math.random() * availableIndices.length)];
    }

    calculatePrevIndex() {
        const { items, currentIndex } = this.state.playlist;
        
        if (items.length === 0) return 0;
        return (currentIndex - 1 + items.length) % items.length;
    }

    togglePlayMode() {
        const modes = ['REPEAT_ONE', 'NORMAL', 'ONCE', 'SHUFFLE'];
        const currentMode = this.state.playlist.mode;
        const currentIndex = modes.indexOf(currentMode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        
        this.updateState({ playlist: { mode: nextMode } });
        
        // 셔플 모드로 전환 시 다음 트랙 미리 계산
        if (nextMode === 'SHUFFLE' && this.state.playlist.items.length > 1) {
            this.preCalculateNextShuffle();
        } else if (currentMode === 'SHUFFLE') {
            // 셔플 모드에서 나갈 때 셔플 상태 초기화
            this.updateState({
                internal: {
                    shuffleHistory: [],
                    shuffleNextTrack: null
                }
            });
        }
    }

    toggleSort() {
        const newSort = this.state.playlist.sort === 'DATE' ? 'ABC' : 'DATE';
        this.updateState({ playlist: { sort: newSort } });
        this.dataService.setSortMode(newSort);
    }

    async toggleLocal() {
        const newLocal = !this.state.ui.isLocal;
        this.updateState({ ui: { isLocal: newLocal } });
        await this.refreshPlaylist();
    }

    // ============================================
    // 기존 호환성 메서드
    // ============================================

    get playlistManager() {
        return this.dataService;
    }

    get audioPlayerManager() {
        return this.playerCore;
    }

    get interactionMsg() {
        return this.uiManager.interactionMsg;
    }

    set interactionMsg(msg) {
        this.uiManager.interactionMsg = msg;
    }

    async reply() {
        return this.uiManager.generateComponents(this.state);
    }

    volumeUp() {
        const newVolume = Math.min(1, this.state.ui.volume + 0.1);
        this.handleUIInteraction({ action: 'setVolume', payload: { volume: newVolume } });
    }

    volumeDown() {
        const newVolume = Math.max(0, this.state.ui.volume - 0.1);
        this.handleUIInteraction({ action: 'setVolume', payload: { volume: newVolume } });
    }

    /**
     * 리소스 정리
     */
    async destroy() {
        console.log(`[MUSIC v2.0] Destroying controller for guild: ${this.guildId}`);
        
        await this.playerCore.destroy();
        await this.uiManager.destroy();
        await this.dataService.destroy();
        this.eventBus.removeAllListeners();
        
        // 참조 해제
        this.state = null;
        this.eventBus = null;
        this.playerCore = null;
        this.uiManager = null;
        this.dataService = null;
        
        return true;
    }
}

module.exports = { MusicController };