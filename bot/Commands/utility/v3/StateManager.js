/**
 * StateManager v3.0
 * Redux 패턴 기반 중앙 상태 관리
 * 
 * 핵심 원칙:
 * - Immutable State: 상태는 절대 직접 변경하지 않음
 * - Pure Reducers: 사이드 이펙트 없는 순수 함수
 * - Predictable Flow: 액션 → 리듀서 → 새로운 상태
 */

const { 
    ACTION_TYPES, 
    INITIAL_STATE, 
    PLAYBACK_STATES, 
    PLAY_MODES,
    SOURCE_TYPES 
} = require('./types');

class StateManager {
    constructor(guildId) {
        this.guildId = guildId;
        this.state = this.deepFreeze({
            ...INITIAL_STATE,
            meta: {
                ...INITIAL_STATE.meta,
                guildId: guildId
            }
        });
        
        // 상태 변경 구독자들
        this.subscribers = new Set();
        
        // 액션 히스토리 (디버깅용)
        this.actionHistory = [];
        
        console.log(`[StateManager v3.0] Initialized for guild: ${guildId}`);
    }

    /**
     * 상태 구독
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    /**
     * 현재 상태 반환 (읽기 전용)
     */
    getState() {
        return this.state;
    }

    /**
     * 액션 디스패치 (Redux 패턴)
     */
    dispatch(action) {
        // 액션 유효성 검사
        if (!action || !action.type) {
            throw new Error('Invalid action: must have type property');
        }

        console.log(`[StateManager] Dispatching: ${action.type}`, action.payload || '');

        // 이전 상태 저장
        const prevState = this.state;
        
        // 리듀서를 통해 새로운 상태 계산
        const newState = this.rootReducer(prevState, action);
        
        // 상태가 실제로 변경된 경우에만 업데이트
        if (newState !== prevState) {
            this.state = this.deepFreeze(newState);
            
            // 액션 히스토리 저장 (최근 50개만)
            this.actionHistory.push({
                type: action.type,
                timestamp: Date.now(),
                payload: action.payload
            });
            if (this.actionHistory.length > 50) {
                this.actionHistory.shift();
            }
            
            // 구독자들에게 상태 변경 알림
            this.notifySubscribers(prevState, this.state, action);
        }

        return this.state;
    }

    /**
     * 루트 리듀서 (모든 액션 처리)
     */
    rootReducer(state, action) {
        const timestamp = Date.now();
        
        // 메타 정보 업데이트
        const baseState = {
            ...state,
            meta: {
                ...state.meta,
                lastAction: action.type,
                lastActionTime: timestamp
            }
        };

        switch (action.type) {
            case ACTION_TYPES.PLAY_TRACK:
                return this.playTrackReducer(baseState, action.payload);
                
            case ACTION_TYPES.PAUSE_TRACK:
                return this.playbackStateReducer(baseState, PLAYBACK_STATES.PAUSED);
                
            case ACTION_TYPES.RESUME_TRACK:
                return this.playbackStateReducer(baseState, PLAYBACK_STATES.PLAYING);
                
            case ACTION_TYPES.STOP_TRACK:
                return this.stopTrackReducer(baseState);
                
            case ACTION_TYPES.NEXT_TRACK:
                return this.navigationReducer(baseState, 'next');
                
            case ACTION_TYPES.PREV_TRACK:
                return this.navigationReducer(baseState, 'prev');
                
            case ACTION_TYPES.LOAD_PLAYLIST:
                return this.loadPlaylistReducer(baseState, action.payload);
                
            case ACTION_TYPES.CHANGE_SOURCE:
                return this.changeSourceReducer(baseState, action.payload);
                
            case ACTION_TYPES.CHANGE_MODE:
                return this.changeModeReducer(baseState, action.payload);
                
            case ACTION_TYPES.CHANGE_SORT:
                return this.changeSortReducer(baseState, action.payload);
                
            case ACTION_TYPES.SET_VOLUME:
                return this.setVolumeReducer(baseState, action.payload);
                
            case ACTION_TYPES.SET_PLAYBACK_STATE:
                return this.playbackStateReducer(baseState, action.payload);
                
            case ACTION_TYPES.TRACK_ENDED:
                return this.trackEndedReducer(baseState, action.payload);
                
            case ACTION_TYPES.AUDIO_ERROR:
                return this.audioErrorReducer(baseState, action.payload);
                
            default:
                console.warn(`[StateManager] Unknown action type: ${action.type}`);
                return state;
        }
    }

    /**
     * 트랙 재생 리듀서
     */
    playTrackReducer(state, { index, track, isManual = false }) {
        const { playlist } = state;
        
        // 유효성 검사
        if (!playlist.items || playlist.items.length === 0) {
            throw new Error('Playlist is empty');
        }
        
        if (index < 0 || index >= playlist.items.length) {
            throw new Error(`Invalid index: ${index}`);
        }

        const targetTrack = track || playlist.items[index];
        
        return {
            ...state,
            playback: {
                ...state.playback,
                state: PLAYBACK_STATES.LOADING,
                currentTrack: targetTrack,
                currentIndex: index,
                position: 0
            },
            // 셔플 모드인 경우 셔플 인덱스도 업데이트
            shuffle: playlist.mode === PLAY_MODES.SHUFFLE ? {
                ...state.shuffle,
                currentIndex: this.findShuffleIndex(state.shuffle.queue, index)
            } : state.shuffle
        };
    }

    /**
     * 재생 상태 리듀서
     */
    playbackStateReducer(state, newPlaybackState) {
        return {
            ...state,
            playback: {
                ...state.playback,
                state: newPlaybackState
            }
        };
    }

    /**
     * 정지 리듀서
     */
    stopTrackReducer(state) {
        return {
            ...state,
            playback: {
                ...state.playback,
                state: PLAYBACK_STATES.IDLE,
                currentTrack: null,
                currentIndex: -1,
                position: 0,
                duration: 0
            }
        };
    }

    /**
     * 네비게이션 리듀서 (다음/이전)
     */
    navigationReducer(state, direction) {
        const { playlist, shuffle } = state;
        
        if (!playlist.items || playlist.items.length === 0) {
            return state;
        }

        let nextIndex;
        
        if (playlist.mode === PLAY_MODES.SHUFFLE && shuffle.isActive) {
            // 셔플 모드: 셔플 큐 기반 네비게이션
            nextIndex = this.calculateShuffleNavigation(shuffle, direction);
        } else {
            // 일반 모드: 순차적 네비게이션
            nextIndex = this.calculateSequentialNavigation(
                playlist.items.length, 
                state.playback.currentIndex, 
                direction, 
                playlist.mode
            );
        }

        const nextTrack = playlist.items[nextIndex];
        if (!nextTrack) {
            return state;
        }

        return this.playTrackReducer(state, { 
            index: nextIndex, 
            track: nextTrack, 
            isManual: true 
        });
    }

    /**
     * 플레이리스트 로드 리듀서
     */
    loadPlaylistReducer(state, { items, source }) {
        const newPlaylist = {
            ...state.playlist,
            items: items || [],
            source: source || state.playlist.source,
            totalCount: items?.length || 0
        };

        // 현재 인덱스 유효성 검사
        const validIndex = items && items.length > 0 
            ? Math.max(0, Math.min(state.playback.currentIndex, items.length - 1))
            : -1;

        // 셔플 모드인 경우 새로운 셔플 큐 생성
        const newShuffle = newPlaylist.mode === PLAY_MODES.SHUFFLE
            ? this.generateShuffleQueue(items?.length || 0, validIndex)
            : { ...state.shuffle, isActive: false };

        return {
            ...state,
            playlist: newPlaylist,
            shuffle: newShuffle,
            playback: {
                ...state.playback,
                currentIndex: validIndex,
                currentTrack: validIndex >= 0 ? items[validIndex] : null
            },
            ui: {
                ...state.ui,
                lastUpdate: Date.now()
            }
        };
    }

    /**
     * 소스 변경 리듀서
     */
    changeSourceReducer(state, newSource) {
        return {
            ...state,
            playlist: {
                ...state.playlist,
                source: newSource,
                items: [], // 소스 변경 시 플레이리스트 초기화
                totalCount: 0
            },
            playback: {
                ...state.playback,
                currentIndex: -1,
                currentTrack: null
            },
            ui: {
                ...state.ui,
                currentPage: 0,
                isLoading: true
            }
        };
    }

    /**
     * 재생 모드 변경 리듀서
     */
    changeModeReducer(state, newMode) {
        const newPlaylist = {
            ...state.playlist,
            mode: newMode
        };

        // 셔플 모드 전환 처리
        let newShuffle = state.shuffle;
        if (newMode === PLAY_MODES.SHUFFLE) {
            // 셔플 모드로 전환: 새로운 셔플 큐 생성
            newShuffle = this.generateShuffleQueue(
                state.playlist.items.length, 
                state.playback.currentIndex
            );
        } else if (state.playlist.mode === PLAY_MODES.SHUFFLE) {
            // 셔플 모드에서 나감: 셔플 상태 초기화
            newShuffle = {
                queue: [],
                currentIndex: -1,
                isActive: false
            };
        }

        return {
            ...state,
            playlist: newPlaylist,
            shuffle: newShuffle
        };
    }

    /**
     * 정렬 변경 리듀서
     */
    changeSortReducer(state, newSort) {
        return {
            ...state,
            playlist: {
                ...state.playlist,
                sort: newSort
            },
            ui: {
                ...state.ui,
                isLoading: true
            }
        };
    }

    /**
     * 볼륨 설정 리듀서
     */
    setVolumeReducer(state, volume) {
        return {
            ...state,
            playback: {
                ...state.playback,
                volume: Math.max(0, Math.min(1, volume))
            }
        };
    }

    /**
     * 트랙 종료 리듀서
     */
    trackEndedReducer(state, { reason }) {
        if (reason !== 'natural') {
            return state;
        }

        const { playlist } = state;
        
        switch (playlist.mode) {
            case PLAY_MODES.REPEAT_ONE:
                // 같은 곡 반복
                return state;
                
            case PLAY_MODES.ONCE:
                // 정지
                return this.stopTrackReducer(state);
                
            case PLAY_MODES.NORMAL:
            case PLAY_MODES.SHUFFLE:
                // 다음 곡으로 자동 진행
                return this.navigationReducer(state, 'next');
                
            default:
                return state;
        }
    }

    /**
     * 오디오 에러 리듀서
     */
    audioErrorReducer(state, { error }) {
        return {
            ...state,
            playback: {
                ...state.playback,
                state: PLAYBACK_STATES.ERROR
            }
        };
    }

    // ==========================================
    // 유틸리티 함수들
    // ==========================================

    /**
     * 순차적 네비게이션 계산
     */
    calculateSequentialNavigation(length, currentIndex, direction, mode) {
        if (length === 0) return -1;

        switch (direction) {
            case 'next':
                if (mode === PLAY_MODES.ONCE) {
                    return currentIndex < length - 1 ? currentIndex + 1 : currentIndex;
                }
                return (currentIndex + 1) % length;
                
            case 'prev':
                return (currentIndex - 1 + length) % length;
                
            default:
                return currentIndex;
        }
    }

    /**
     * 셔플 네비게이션 계산
     */
    calculateShuffleNavigation(shuffle, direction) {
        const { queue, currentIndex } = shuffle;
        
        if (queue.length === 0) return -1;

        switch (direction) {
            case 'next':
                const nextShuffleIndex = (currentIndex + 1) % queue.length;
                return queue[nextShuffleIndex];
                
            case 'prev':
                const prevShuffleIndex = (currentIndex - 1 + queue.length) % queue.length;
                return queue[prevShuffleIndex];
                
            default:
                return queue[currentIndex] || -1;
        }
    }

    /**
     * 셔플 큐 생성
     */
    generateShuffleQueue(length, startIndex = 0) {
        if (length <= 1) {
            return {
                queue: length === 1 ? [0] : [],
                currentIndex: length === 1 ? 0 : -1,
                isActive: length > 1
            };
        }

        // Fisher-Yates 셔플 알고리즘
        const queue = Array.from({ length }, (_, i) => i);
        for (let i = queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queue[i], queue[j]] = [queue[j], queue[i]];
        }

        // 현재 재생 중인 트랙을 첫 번째로 이동
        if (startIndex >= 0 && startIndex < length) {
            const currentTrackShuffleIndex = queue.indexOf(startIndex);
            if (currentTrackShuffleIndex > 0) {
                queue.splice(currentTrackShuffleIndex, 1);
                queue.unshift(startIndex);
            }
        }

        return {
            queue,
            currentIndex: 0,
            isActive: true
        };
    }

    /**
     * 셔플 큐에서 실제 인덱스 찾기
     */
    findShuffleIndex(shuffleQueue, realIndex) {
        return shuffleQueue.indexOf(realIndex);
    }

    /**
     * 객체 깊은 동결 (불변성 보장)
     */
    deepFreeze(obj) {
        Object.getOwnPropertyNames(obj).forEach(prop => {
            if (obj[prop] !== null && typeof obj[prop] === 'object') {
                this.deepFreeze(obj[prop]);
            }
        });
        return Object.freeze(obj);
    }

    /**
     * 구독자들에게 상태 변경 알림
     */
    notifySubscribers(prevState, newState, action) {
        this.subscribers.forEach(callback => {
            try {
                callback(newState, prevState, action);
            } catch (error) {
                console.error('[StateManager] Subscriber error:', error);
            }
        });
    }

    /**
     * 디버깅 정보 반환
     */
    getDebugInfo() {
        return {
            guildId: this.guildId,
            currentState: this.state,
            subscriberCount: this.subscribers.size,
            recentActions: this.actionHistory.slice(-10)
        };
    }

    /**
     * 리소스 정리
     */
    destroy() {
        this.subscribers.clear();
        this.actionHistory = [];
        this.state = null;
        console.log(`[StateManager] Destroyed for guild: ${this.guildId}`);
    }
}

module.exports = { StateManager };