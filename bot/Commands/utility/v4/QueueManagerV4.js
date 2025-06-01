const { EventEmitter } = require('events');
const DebugLogger = require('./DebugLogger');
const { getGuildMusic } = require('../../api/guild/music');
const fs = require('fs').promises;
const path = require('path');

/**
 * Queue Manager v4
 * 심플하고 직접적인 큐 관리
 */
class QueueManagerV4 extends EventEmitter {
    constructor(guildId, player) {
        super();
        
        this.guildId = guildId;
        this.player = player;
        this.logger = new DebugLogger('QueueManagerV4', guildId);
        
        // 큐 데이터
        this.tracks = [];
        this.originalOrder = [];
        this.shuffleOrder = [];
        
        // 상태
        this.source = 'youtube'; // youtube | local
        this.sortType = 'date'; // date | abc
        this.isShuffled = false;
        this.shuffleIndex = 0;
        
        this.logger.info('✅ Queue Manager v4 initialized');
    }

    /**
     * YouTube 트랙 로드
     */
    async loadYouTubeTracks() {
        this.logger.trace('loadYouTubeTracks');
        const timer = this.logger.startTimer('load YouTube tracks');
        
        try {
            const musicList = await getGuildMusic(this.guildId);
            
            if (!musicList || musicList.length === 0) {
                this.logger.info('No YouTube tracks found');
                timer.end(false);
                return false;
            }
            
            // 트랙 포맷 변환
            this.tracks = musicList.map((item, index) => ({
                id: `yt_${index}`,
                title: item.title,
                url: item.youtubeUrl || item.url,
                thumbnail: item.thumbnail,
                duration: item.duration,
                source: 'youtube',
                createdAt: item.createdAt,
                originalIndex: index
            }));
            
            this.originalOrder = [...this.tracks];
            
            this.logger.info(`Loaded ${this.tracks.length} YouTube tracks`);
            timer.end(true);
            return true;
            
        } catch (error) {
            this.logger.error('Failed to load YouTube tracks', error);
            timer.end(false);
            return false;
        }
    }

    /**
     * 로컬 파일 로드
     */
    async loadLocalFiles(userId) {
        this.logger.trace('loadLocalFiles', [userId]);
        const timer = this.logger.startTimer('load local files');
        
        try {
            const musicDir = path.join(__dirname, '../../../../MusicData', userId);
            
            // 디렉토리 확인
            try {
                await fs.access(musicDir);
            } catch {
                this.logger.info('No local music directory found');
                timer.end(false);
                return false;
            }
            
            // 파일 목록 읽기
            const files = await fs.readdir(musicDir);
            const musicFiles = files.filter(file => 
                ['.mp3', '.wav', '.ogg', '.flac', '.m4a'].some(ext => 
                    file.toLowerCase().endsWith(ext)
                )
            );
            
            if (musicFiles.length === 0) {
                this.logger.info('No local music files found');
                timer.end(false);
                return false;
            }
            
            // 트랙 생성
            this.tracks = musicFiles.map((file, index) => ({
                id: `local_${index}`,
                title: path.parse(file).name,
                url: path.join(musicDir, file),
                thumbnail: null,
                duration: '00:00',
                source: 'local',
                createdAt: new Date().toISOString(),
                originalIndex: index
            }));
            
            this.originalOrder = [...this.tracks];
            
            this.logger.info(`Loaded ${this.tracks.length} local files`);
            timer.end(true);
            return true;
            
        } catch (error) {
            this.logger.error('Failed to load local files', error);
            timer.end(false);
            return false;
        }
    }

    /**
     * 소스에서 로드
     */
    async loadFromSource(source, userId = null) {
        this.logger.trace('loadFromSource', [source]);
        
        this.source = source;
        this.isShuffled = false;
        this.shuffleOrder = [];
        
        let loaded = false;
        
        if (source === 'youtube') {
            loaded = await this.loadYouTubeTracks();
        } else if (source === 'local') {
            // userId가 없으면 player에서 가져오기
            const actualUserId = userId || this.player?.user?.id;
            if (actualUserId) {
                loaded = await this.loadLocalFiles(actualUserId);
            } else {
                this.logger.warn('No user ID available for local files');
                loaded = false;
            }
        }
        
        // 기본 정렬 적용
        if (loaded && this.sortType) {
            this.applySorting(this.sortType);
        }
        
        this.logger.queue('loaded from source', {
            source,
            trackCount: this.tracks.length,
            sorted: this.sortType
        });
        
        return loaded;
    }

    /**
     * 정렬 적용
     */
    applySorting(type) {
        this.logger.trace('applySorting', [type]);
        
        this.sortType = type;
        
        if (type === 'abc') {
            // 알파벳순 정렬
            this.tracks.sort((a, b) => 
                a.title.localeCompare(b.title, 'ko')
            );
            this.logger.queue('sorted alphabetically');
        } else {
            // 날짜순 정렬 (원래 순서)
            this.tracks = [...this.originalOrder];
            this.logger.queue('sorted by date');
        }
        
        return true;
    }

    /**
     * 정렬 (외부 호출용)
     */
    async sort(type = null) {
        if (!type) {
            // 토글
            type = this.sortType === 'date' ? 'abc' : 'date';
        }
        
        this.applySorting(type);
        return true;
    }

    /**
     * 셔플 활성화
     */
    enableShuffle(currentIndex = 0) {
        this.logger.trace('enableShuffle', [currentIndex]);
        
        if (this.tracks.length <= 1) {
            this.logger.debug('Not enough tracks to shuffle');
            return false;
        }
        
        // Fisher-Yates 셔플
        this.shuffleOrder = Array.from({ length: this.tracks.length }, (_, i) => i);
        
        for (let i = this.shuffleOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffleOrder[i], this.shuffleOrder[j]] = 
            [this.shuffleOrder[j], this.shuffleOrder[i]];
        }
        
        // 현재 트랙을 첫 번째로 이동
        if (currentIndex >= 0 && currentIndex < this.tracks.length) {
            const currentShufflePos = this.shuffleOrder.indexOf(currentIndex);
            if (currentShufflePos > 0) {
                [this.shuffleOrder[0], this.shuffleOrder[currentShufflePos]] = 
                [this.shuffleOrder[currentShufflePos], this.shuffleOrder[0]];
            }
        }
        
        this.isShuffled = true;
        this.shuffleIndex = 0;
        
        this.logger.queue('shuffle enabled', {
            order: this.shuffleOrder.slice(0, 5) + '...'
        });
        
        return true;
    }

    /**
     * 셔플 비활성화
     */
    disableShuffle() {
        this.logger.trace('disableShuffle');
        
        this.isShuffled = false;
        this.shuffleOrder = [];
        this.shuffleIndex = 0;
        
        this.logger.queue('shuffle disabled');
        return true;
    }

    /**
     * 트랙 가져오기
     */
    getTrack(index) {
        if (index < 0 || index >= this.tracks.length) {
            return null;
        }
        
        return this.tracks[index];
    }

    /**
     * 현재 트랙 가져오기
     */
    getCurrentTrack() {
        const currentIndex = this.player.state.currentIndex;
        return this.getTrack(currentIndex);
    }

    /**
     * 트랙 인덱스 찾기
     */
    findTrackIndex(track) {
        if (!track) return -1;
        
        return this.tracks.findIndex(t => 
            t.id === track.id || t.url === track.url
        );
    }

    /**
     * 다음 인덱스 계산
     */
    getNextIndex(currentIndex, mode) {
        this.logger.trace('getNextIndex', [currentIndex, mode]);
        
        if (this.tracks.length === 0) return -1;
        
        // repeat-one 모드는 같은 인덱스 반환
        if (mode === 'repeat-one') {
            return currentIndex;
        }
        
        // 셔플 모드
        if (mode === 'shuffle' && this.isShuffled) {
            this.shuffleIndex = (this.shuffleIndex + 1) % this.shuffleOrder.length;
            const nextIndex = this.shuffleOrder[this.shuffleIndex];
            
            this.logger.debug(`Shuffle next: ${this.shuffleIndex} -> track ${nextIndex}`);
            return nextIndex;
        }
        
        // 일반/반복 모드
        const nextIndex = currentIndex + 1;
        
        if (nextIndex >= this.tracks.length) {
            // repeat-all 모드면 처음으로
            if (mode === 'repeat-all') {
                return 0;
            }
            // normal 모드면 종료
            return -1;
        }
        
        return nextIndex;
    }

    /**
     * 이전 인덱스 계산
     */
    getPreviousIndex(currentIndex, mode) {
        this.logger.trace('getPreviousIndex', [currentIndex, mode]);
        
        if (this.tracks.length === 0) return -1;
        
        // repeat-one 모드는 같은 인덱스 반환
        if (mode === 'repeat-one') {
            return currentIndex;
        }
        
        // 셔플 모드
        if (mode === 'shuffle' && this.isShuffled) {
            this.shuffleIndex = (this.shuffleIndex - 1 + this.shuffleOrder.length) % this.shuffleOrder.length;
            const prevIndex = this.shuffleOrder[this.shuffleIndex];
            
            this.logger.debug(`Shuffle prev: ${this.shuffleIndex} -> track ${prevIndex}`);
            return prevIndex;
        }
        
        // 일반/반복 모드
        const prevIndex = currentIndex - 1;
        
        if (prevIndex < 0) {
            // repeat-all 모드면 마지막으로
            if (mode === 'repeat-all') {
                return this.tracks.length - 1;
            }
            // normal 모드면 처음 유지
            return 0;
        }
        
        return prevIndex;
    }

    /**
     * 페이지 데이터 가져오기 (UI용)
     */
    getPageData(page = 0, pageSize = 10) {
        const start = page * pageSize;
        const end = start + pageSize;
        
        const items = this.tracks.slice(start, end);
        const totalPages = Math.ceil(this.tracks.length / pageSize);
        
        return {
            items,
            currentPage: page,
            totalPages,
            totalItems: this.tracks.length,
            hasNext: page < totalPages - 1,
            hasPrevious: page > 0
        };
    }

    /**
     * 큐 정보
     */
    getInfo() {
        return {
            source: this.source,
            length: this.tracks.length,
            sortType: this.sortType,
            isShuffled: this.isShuffled,
            isEmpty: this.tracks.length === 0
        };
    }

    /**
     * 큐 비우기
     */
    clear() {
        this.logger.trace('clear');
        
        this.tracks = [];
        this.originalOrder = [];
        this.shuffleOrder = [];
        this.isShuffled = false;
        this.shuffleIndex = 0;
        
        this.logger.queue('cleared');
    }

    /**
     * 다음 재생될 트랙 미리보기 (UI용)
     */
    getUpcomingTracks(currentIndex, mode, count = 3) {
        const upcoming = [];
        let index = currentIndex;
        
        for (let i = 0; i < count; i++) {
            index = this.getNextIndex(index, mode);
            if (index === -1) break;
            
            const track = this.getTrack(index);
            if (track) {
                upcoming.push(track);
            }
            
            // repeat-one 모드면 같은 트랙만 반복
            if (mode === 'repeat-one') break;
        }
        
        return upcoming;
    }

    /**
     * 길이 (Array처럼 동작)
     */
    get length() {
        return this.tracks.length;
    }
}

module.exports = QueueManagerV4;