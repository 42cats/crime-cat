/**
 * MusicPlayer v3.0 Types & Constants
 * 중앙 집중식 타입 정의 및 상수 관리
 */

// 재생 상태
const PLAYBACK_STATES = {
    IDLE: 'IDLE',
    LOADING: 'LOADING', 
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    ERROR: 'ERROR'
};

// 재생 모드
const PLAY_MODES = {
    REPEAT_ONE: 'REPEAT_ONE',  // 한곡반복
    NORMAL: 'NORMAL',          // 순차재생
    ONCE: 'ONCE',              // 한번재생
    SHUFFLE: 'SHUFFLE'         // 셔플재생
};

// 정렬 모드
const SORT_MODES = {
    DATE: 'DATE',              // 날짜순
    ABC: 'ABC'                 // 가나다순
};

// 소스 타입
const SOURCE_TYPES = {
    YOUTUBE: 'YOUTUBE',
    LOCAL: 'LOCAL'
};

// 액션 타입 (Redux 패턴)
const ACTION_TYPES = {
    // 재생 제어
    PLAY_TRACK: 'PLAY_TRACK',
    PAUSE_TRACK: 'PAUSE_TRACK', 
    RESUME_TRACK: 'RESUME_TRACK',
    STOP_TRACK: 'STOP_TRACK',
    NEXT_TRACK: 'NEXT_TRACK',
    PREV_TRACK: 'PREV_TRACK',
    
    // 플레이리스트
    LOAD_PLAYLIST: 'LOAD_PLAYLIST',
    CHANGE_SOURCE: 'CHANGE_SOURCE',
    CHANGE_SORT: 'CHANGE_SORT',
    
    // 설정
    CHANGE_MODE: 'CHANGE_MODE',
    SET_VOLUME: 'SET_VOLUME',
    
    // 내부 상태
    SET_PLAYBACK_STATE: 'SET_PLAYBACK_STATE',
    TRACK_ENDED: 'TRACK_ENDED',
    AUDIO_ERROR: 'AUDIO_ERROR'
};

// 초기 상태 정의
const INITIAL_STATE = {
    // 재생 상태
    playback: {
        state: PLAYBACK_STATES.IDLE,
        currentTrack: null,
        currentIndex: -1,
        volume: 0.5,
        position: 0,
        duration: 0
    },
    
    // 플레이리스트
    playlist: {
        items: [],
        mode: PLAY_MODES.REPEAT_ONE,
        sort: SORT_MODES.DATE,
        source: SOURCE_TYPES.YOUTUBE,
        totalCount: 0
    },
    
    // 셔플 관리 (완전 분리)
    shuffle: {
        queue: [],           // 미리 계산된 셔플 순서 [3,1,5,2,7,...]
        currentIndex: -1,    // 셔플 큐에서의 현재 위치
        isActive: false      // 셔플 모드 활성화 여부
    },
    
    // UI 상태
    ui: {
        currentPage: 0,
        pageSize: 15,
        isLoading: false,
        lastUpdate: 0
    },
    
    // 메타데이터
    meta: {
        guildId: null,
        lastAction: null,
        lastActionTime: 0,
        version: '3.0.0'
    }
};

// 에러 타입
const ERROR_TYPES = {
    PLAYLIST_EMPTY: 'PLAYLIST_EMPTY',
    TRACK_NOT_FOUND: 'TRACK_NOT_FOUND',
    AUDIO_LOAD_FAILED: 'AUDIO_LOAD_FAILED',
    VOICE_CONNECTION_FAILED: 'VOICE_CONNECTION_FAILED',
    INVALID_INDEX: 'INVALID_INDEX'
};

// 캐시 설정
const CACHE_CONFIG = {
    YOUTUBE_TTL: 30 * 60 * 1000,  // 30분
    LOCAL_TTL: 5 * 60 * 1000,     // 5분
    UI_TTL: 2 * 60 * 1000,        // 2분
    MAX_CACHE_SIZE: 1000
};

module.exports = {
    PLAYBACK_STATES,
    PLAY_MODES,
    SORT_MODES,
    SOURCE_TYPES,
    ACTION_TYPES,
    INITIAL_STATE,
    ERROR_TYPES,
    CACHE_CONFIG
};