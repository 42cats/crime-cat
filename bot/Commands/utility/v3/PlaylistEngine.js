/**
 * PlaylistEngine v3.0
 * 스마트 플레이리스트 및 캐싱 시스템
 * 
 * 핵심 원칙:
 * - Smart Caching: 지능적 캐싱으로 성능 최적화
 * - Data Consistency: 항상 일관된 데이터 제공
 * - Lazy Loading: 필요할 때만 데이터 로드
 * - Error Resilience: 에러 상황에서도 안정적 동작
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { getGuildMusic } = require('../../api/guild/music');
const { SOURCE_TYPES, SORT_MODES, CACHE_CONFIG, ACTION_TYPES } = require('./types');

class PlaylistEngine {
    constructor(guildId, stateManager) {
        this.guildId = guildId;
        this.stateManager = stateManager;
        
        // 캐시 시스템
        this.cache = new Map();
        
        // 설정
        this.config = {
            localMusicPath: path.join(__dirname, '../../../MusicData', guildId),
            supportedFormats: ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.opus'],
            pageSize: 15
        };
        
        // 통계
        this.stats = {
            cacheHits: 0,
            cacheMisses: 0,
            loadCount: 0,
            errorCount: 0
        };
        
        console.log(`[PlaylistEngine v3.0] Initialized for guild: ${this.guildId}`);
    }

    /**
     * 플레이리스트 로드 (메인 진입점)
     */
    async loadPlaylist(source = null, sort = null) {
        try {
            const state = this.stateManager.getState();
            const targetSource = source || state.playlist.source;
            const targetSort = sort || state.playlist.sort;
            
            console.log(`[PlaylistEngine] Loading playlist: ${targetSource}, sort: ${targetSort}`);
            
            // 캐시된 데이터 확인
            const cachedData = this.getCachedData(targetSource, targetSort);
            if (cachedData) {
                this.stats.cacheHits++;
                console.log(`[PlaylistEngine] Using cached data: ${cachedData.length} items`);
                this.updatePlaylistState(cachedData, targetSource);
                return cachedData;
            }

            this.stats.cacheMisses++;
            this.stats.loadCount++;
            
            // 새 데이터 로드
            const rawData = await this.loadRawData(targetSource);
            const sortedData = this.applySorting(rawData, targetSort);
            
            // 캐시 저장
            this.setCachedData(targetSource, targetSort, sortedData);
            
            // 상태 업데이트
            this.updatePlaylistState(sortedData, targetSource);
            
            console.log(`[PlaylistEngine] Loaded ${sortedData.length} items from ${targetSource}`);
            return sortedData;
            
        } catch (error) {
            console.error('[PlaylistEngine] Load failed:', error);
            this.stats.errorCount++;
            
            // 에러 시 빈 플레이리스트 반환
            this.updatePlaylistState([], source);
            return [];
        }
    }

    /**
     * 원시 데이터 로드
     */
    async loadRawData(source) {
        switch (source) {
            case SOURCE_TYPES.YOUTUBE:
                return await this.loadYouTubeData();
            case SOURCE_TYPES.LOCAL:
                return await this.loadLocalData();
            default:
                throw new Error(`Unknown source type: ${source}`);
        }
    }

    /**
     * YouTube 데이터 로드
     */
    async loadYouTubeData() {
        try {
            const urls = await getGuildMusic(this.guildId);
            
            return urls.map((url, index) => ({
                id: `yt_${url.id || index}`,
                title: url.title || 'Unknown Title',
                url: url.youtubeUrl,
                thumbnail: url.thumbnail || 'https://imgur.com/jCVVLrp.png',
                duration: url.duration || 'Unknown',
                createdAt: url.createdAt || new Date(),
                source: SOURCE_TYPES.YOUTUBE,
                originalIndex: index,
                metadata: {
                    uploader: url.uploader,
                    viewCount: url.viewCount,
                    description: url.description
                }
            }));
            
        } catch (error) {
            console.error('[PlaylistEngine] YouTube data load failed:', error);
            throw new Error('Failed to load YouTube playlist from database');
        }
    }

    /**
     * 로컬 데이터 로드
     */
    async loadLocalData() {
        try {
            // 디렉토리 존재 확인
            if (!fsSync.existsSync(this.config.localMusicPath)) {
                console.log(`[PlaylistEngine] Local music directory not found: ${this.config.localMusicPath}`);
                return [];
            }

            // 파일 목록 읽기
            const files = await fs.readdir(this.config.localMusicPath);
            
            // 오디오 파일 필터링
            const audioFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return this.config.supportedFormats.includes(ext);
            });

            // 파일 정보 수집 (병렬 처리)
            const fileInfoPromises = audioFiles.map(async (file, index) => {
                try {
                    const fullPath = path.join(this.config.localMusicPath, file);
                    const stats = await fs.stat(fullPath);
                    
                    return {
                        id: `local_${index}_${Date.now()}`,
                        title: path.basename(file, path.extname(file)),
                        url: fullPath,
                        thumbnail: null,
                        duration: null, // TODO: 메타데이터에서 추출 가능
                        createdAt: stats.birthtime,
                        source: SOURCE_TYPES.LOCAL,
                        originalIndex: index,
                        metadata: {
                            fileSize: stats.size,
                            lastModified: stats.mtime,
                            extension: path.extname(file)
                        }
                    };
                } catch (error) {
                    console.warn(`[PlaylistEngine] Failed to get stats for ${file}:`, error);
                    return null;
                }
            });

            const results = await Promise.all(fileInfoPromises);
            return results.filter(Boolean); // null 제거
            
        } catch (error) {
            console.error('[PlaylistEngine] Local data load failed:', error);
            throw new Error('Failed to load local music files');
        }
    }

    /**
     * 데이터 정렬 적용
     */
    applySorting(data, sortMode) {
        if (!Array.isArray(data) || data.length === 0) {
            return data;
        }

        const sortedData = [...data];
        
        switch (sortMode) {
            case SORT_MODES.ABC:
                return sortedData.sort((a, b) => 
                    a.title.localeCompare(b.title, 'ko', { sensitivity: 'base' })
                );
                
            case SORT_MODES.DATE:
                return sortedData.sort((a, b) => {
                    const dateA = new Date(a.createdAt);
                    const dateB = new Date(b.createdAt);
                    return dateA - dateB;
                });
                
            default:
                return sortedData;
        }
    }

    /**
     * 캐시 키 생성
     */
    generateCacheKey(source, sort) {
        return `${source}_${sort}_${this.guildId}`;
    }

    /**
     * 캐시된 데이터 가져오기
     */
    getCachedData(source, sort) {
        const cacheKey = this.generateCacheKey(source, sort);
        const cached = this.cache.get(cacheKey);
        
        if (!cached) {
            return null;
        }

        // TTL 확인
        const now = Date.now();
        const ttl = source === SOURCE_TYPES.YOUTUBE ? CACHE_CONFIG.YOUTUBE_TTL : CACHE_CONFIG.LOCAL_TTL;
        
        if (now - cached.timestamp > ttl) {
            this.cache.delete(cacheKey);
            console.log(`[PlaylistEngine] Cache expired for ${cacheKey}`);
            return null;
        }

        return cached.data;
    }

    /**
     * 캐시 데이터 저장
     */
    setCachedData(source, sort, data) {
        const cacheKey = this.generateCacheKey(source, sort);
        
        this.cache.set(cacheKey, {
            data: data,
            timestamp: Date.now(),
            source: source,
            sort: sort
        });

        // 캐시 크기 제한
        if (this.cache.size > CACHE_CONFIG.MAX_CACHE_SIZE) {
            this.cleanupOldCache();
        }

        console.log(`[PlaylistEngine] Data cached: ${cacheKey} (${data.length} items)`);
    }

    /**
     * 오래된 캐시 정리
     */
    cleanupOldCache() {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // 가장 오래된 것부터 절반 제거
        const toRemove = Math.floor(entries.length / 2);
        for (let i = 0; i < toRemove; i++) {
            this.cache.delete(entries[i][0]);
        }
        
        console.log(`[PlaylistEngine] Cleaned up ${toRemove} old cache entries`);
    }

    /**
     * 플레이리스트 상태 업데이트
     */
    updatePlaylistState(items, source) {
        this.stateManager.dispatch({
            type: ACTION_TYPES.LOAD_PLAYLIST,
            payload: {
                items: items,
                source: source
            }
        });
    }

    /**
     * 특정 인덱스의 아이템 반환
     */
    getItem(index) {
        const state = this.stateManager.getState();
        const items = state.playlist.items;
        
        if (!Array.isArray(items) || index < 0 || index >= items.length) {
            return null;
        }
        
        return items[index];
    }

    /**
     * 페이지별 데이터 반환
     */
    getPageData(page = 0) {
        const state = this.stateManager.getState();
        const items = state.playlist.items;
        const pageSize = this.config.pageSize;
        
        const startIndex = page * pageSize;
        const endIndex = Math.min(startIndex + pageSize, items.length);
        
        return {
            items: items.slice(startIndex, endIndex),
            page: page,
            totalPages: Math.ceil(items.length / pageSize),
            totalItems: items.length,
            hasNextPage: endIndex < items.length,
            hasPrevPage: page > 0
        };
    }

    /**
     * 검색 기능
     */
    search(query) {
        if (!query || typeof query !== 'string') {
            return [];
        }

        const state = this.stateManager.getState();
        const items = state.playlist.items;
        const normalizedQuery = query.toLowerCase().trim();
        
        return items.filter(item => 
            item.title.toLowerCase().includes(normalizedQuery) ||
            (item.url && item.url.toLowerCase().includes(normalizedQuery)) ||
            (item.metadata?.uploader && item.metadata.uploader.toLowerCase().includes(normalizedQuery))
        );
    }

    /**
     * 다음 트랙 예측 (UI용)
     */
    getNextTrack() {
        const state = this.stateManager.getState();
        const { playlist, shuffle, playback } = state;
        
        if (!playlist.items || playlist.items.length === 0) {
            return null;
        }

        const currentIndex = playback.currentIndex;
        
        switch (playlist.mode) {
            case 'REPEAT_ONE':
                return playlist.items[currentIndex];
                
            case 'ONCE':
                return currentIndex < playlist.items.length - 1 
                    ? playlist.items[currentIndex + 1] 
                    : null;
                    
            case 'NORMAL':
                const nextIndex = (currentIndex + 1) % playlist.items.length;
                return playlist.items[nextIndex];
                
            case 'SHUFFLE':
                if (shuffle.isActive && shuffle.queue.length > 0) {
                    const nextShuffleIndex = (shuffle.currentIndex + 1) % shuffle.queue.length;
                    const nextTrackIndex = shuffle.queue[nextShuffleIndex];
                    return playlist.items[nextTrackIndex] || null;
                }
                return null;
                
            default:
                return null;
        }
    }

    /**
     * 캐시 무효화
     */
    invalidateCache(source = null, sort = null) {
        if (source && sort) {
            // 특정 캐시만 무효화
            const cacheKey = this.generateCacheKey(source, sort);
            this.cache.delete(cacheKey);
            console.log(`[PlaylistEngine] Cache invalidated: ${cacheKey}`);
        } else if (source) {
            // 특정 소스의 모든 캐시 무효화
            const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(source));
            keysToDelete.forEach(key => this.cache.delete(key));
            console.log(`[PlaylistEngine] Cache invalidated for source: ${source}`);
        } else {
            // 모든 캐시 무효화
            this.cache.clear();
            console.log('[PlaylistEngine] All cache invalidated');
        }
    }

    /**
     * 소스 변경
     */
    async changeSource(newSource) {
        console.log(`[PlaylistEngine] Changing source to: ${newSource}`);
        
        // 상태 업데이트 (빈 플레이리스트로 초기화)
        this.stateManager.dispatch({
            type: ACTION_TYPES.CHANGE_SOURCE,
            payload: newSource
        });
        
        // 새 데이터 로드
        return await this.loadPlaylist(newSource);
    }

    /**
     * 정렬 변경
     */
    async changeSort(newSort) {
        console.log(`[PlaylistEngine] Changing sort to: ${newSort}`);
        
        const state = this.stateManager.getState();
        
        // 상태 업데이트
        this.stateManager.dispatch({
            type: ACTION_TYPES.CHANGE_SORT,
            payload: newSort
        });
        
        // 새 정렬로 데이터 로드
        return await this.loadPlaylist(state.playlist.source, newSort);
    }

    /**
     * 통계 정보 반환
     */
    getStats() {
        return {
            ...this.stats,
            cacheInfo: {
                size: this.cache.size,
                maxSize: CACHE_CONFIG.MAX_CACHE_SIZE,
                hitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0
            },
            config: this.config
        };
    }

    /**
     * 헬스 체크
     */
    healthCheck() {
        const hitRate = this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0;
        
        return {
            status: this.stats.errorCount < 5 && hitRate > 0.7 ? 'healthy' : 'warning',
            cacheSize: this.cache.size,
            hitRate: Math.round(hitRate * 100),
            errorCount: this.stats.errorCount,
            loadCount: this.stats.loadCount
        };
    }

    /**
     * 리소스 정리
     */
    async destroy() {
        console.log('[PlaylistEngine] Destroying...');
        
        // 캐시 정리
        this.cache.clear();
        
        // 참조 해제
        this.stateManager = null;
        this.cache = null;
        this.config = null;
        this.stats = null;
        
        console.log('[PlaylistEngine] Destroyed');
    }
}

module.exports = { PlaylistEngine };