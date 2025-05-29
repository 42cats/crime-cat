/**
 * DataService v2.0
 * 플레이리스트 및 설정 관리 시스템
 * 
 * 설계 원칙:
 * - Data Consistency: 데이터 일관성 보장
 * - Smart Caching: 지능적 캐싱 전략
 * - Async First: 비동기 우선 설계
 * - Error Resilience: 에러 상황 대응력
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { getGuildMusic } = require('../../api/guild/music');

class DataService {
    constructor(guildId, eventBus) {
        this.guildId = guildId;
        this.eventBus = eventBus;
        
        // 캐시 시스템
        this.cache = {
            youtube: {
                data: [],
                lastUpdate: 0,
                ttl: 1800000 // 30분 (YouTube는 수동 추가/삭제만 있음)
            },
            local: {
                data: [],
                lastUpdate: 0,
                ttl: 300000 // 5분 (로컬 파일은 업로드/삭제가 있을 수 있음)
            }
        };
        
        // 설정
        this.settings = {
            sortMode: 'DATE', // DATE, ABC
            pageSize: 15,
            maxCacheSize: 1000,
            localMusicPath: path.join(__dirname, '../../../MusicData', guildId)
        };
        
        // 지원하는 오디오 포맷
        this.supportedFormats = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.opus'];
        
        // 통계
        this.stats = {
            cacheHits: 0,
            cacheMisses: 0,
            refreshCount: 0,
            errorCount: 0
        };
        
        console.log(`[DataService v2.0] Initialized for guild: ${this.guildId}`);
    }

    /**
     * 데이터 새로고침 (캐싱 적용)
     */
    async refresh(isLocal = false) {
        try {
            const cacheKey = isLocal ? 'local' : 'youtube';
            const cache = this.cache[cacheKey];
            
            // 캐시 유효성 확인
            if (this.isCacheValid(cache)) {
                console.log(`[DataService] Using cached ${cacheKey} data`);
                this.stats.cacheHits++;
                return cache.data;
            }

            console.log(`[DataService] Refreshing ${cacheKey} data`);
            this.stats.cacheMisses++;
            this.stats.refreshCount++;
            
            // 새 데이터 로드
            const data = isLocal 
                ? await this.loadLocalMusic()
                : await this.loadYouTubeMusic();
            
            // 정렬 적용
            const sortedData = this.applySorting(data, this.settings.sortMode);
            
            // 캐시 업데이트
            cache.data = sortedData;
            cache.lastUpdate = Date.now();
            
            // 이벤트 발생
            this.eventBus.emit('playlist.updated', {
                items: sortedData,
                source: cacheKey,
                count: sortedData.length
            });
            
            console.log(`[DataService] Loaded ${sortedData.length} ${cacheKey} items`);
            return sortedData;
            
        } catch (error) {
            console.error('[DataService] Refresh failed:', error);
            this.stats.errorCount++;
            this.eventBus.emit('error', { 
                operation: 'refresh', 
                error, 
                context: { isLocal, guildId: this.guildId }
            });
            
            // 에러 시 캐시된 데이터라도 반환
            const fallbackData = this.cache[isLocal ? 'local' : 'youtube'].data;
            return fallbackData || [];
        }
    }

    /**
     * YouTube 음악 로드
     */
    async loadYouTubeMusic() {
        try {
            const urls = await getGuildMusic(this.guildId);
            
            return urls.map((url, index) => ({
                id: `yt_${index}`,
                title: url.title || 'Unknown Title',
                url: url.youtubeUrl,
                thumbnail: url.thumbnail || 'https://imgur.com/jCVVLrp.png',
                duration: url.duration || 'Unknown',
                createdAt: url.createdAt || new Date(),
                source: 'youtube',
                originalIndex: index
            }));
            
        } catch (error) {
            console.error('[DataService] YouTube music load failed:', error);
            throw new Error('Failed to load YouTube playlist from database');
        }
    }

    /**
     * 로컬 음악 로드
     */
    async loadLocalMusic() {
        try {
            // 디렉토리 존재 확인
            if (!fsSync.existsSync(this.settings.localMusicPath)) {
                console.log(`[DataService] Local music directory not found: ${this.settings.localMusicPath}`);
                return [];
            }

            // 파일 목록 읽기
            const files = await fs.readdir(this.settings.localMusicPath);
            
            // 오디오 파일 필터링
            const audioFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return this.supportedFormats.includes(ext);
            });

            // 파일 정보 수집 (병렬 처리)
            const fileInfoPromises = audioFiles.map(async (file, index) => {
                try {
                    const fullPath = path.join(this.settings.localMusicPath, file);
                    const stats = await fs.stat(fullPath);
                    
                    return {
                        id: `local_${index}`,
                        title: path.basename(file, path.extname(file)),
                        url: fullPath,
                        thumbnail: null,
                        duration: null, // TODO: 음악 파일 메타데이터에서 추출 가능
                        createdAt: stats.birthtime,
                        source: 'local',
                        fileSize: stats.size,
                        originalIndex: index
                    };
                } catch (error) {
                    console.warn(`[DataService] Failed to get stats for ${file}:`, error);
                    return null;
                }
            });

            const results = await Promise.all(fileInfoPromises);
            return results.filter(Boolean); // null 제거
            
        } catch (error) {
            console.error('[DataService] Local music load failed:', error);
            throw new Error('Failed to load local music files');
        }
    }

    /**
     * 정렬 적용
     */
    applySorting(data, sortMode) {
        if (!Array.isArray(data) || data.length === 0) {
            return data;
        }

        const sortedData = [...data];
        
        switch (sortMode) {
            case 'ABC':
                return sortedData.sort((a, b) => 
                    a.title.localeCompare(b.title, 'ko', { sensitivity: 'base' })
                );
                
            case 'DATE':
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
     * 캐시 유효성 확인
     */
    isCacheValid(cache) {
        if (!cache.data || cache.data.length === 0) {
            return false;
        }
        
        const now = Date.now();
        return (now - cache.lastUpdate) < cache.ttl;
    }

    /**
     * 특정 인덱스의 아이템 반환
     */
    getItem(index, isLocal = false) {
        const cacheKey = isLocal ? 'local' : 'youtube';
        const data = this.cache[cacheKey].data;
        
        if (!Array.isArray(data) || index < 0 || index >= data.length) {
            return null;
        }
        
        return data[index];
    }

    /**
     * 현재 데이터 반환
     */
    getCurrentData(isLocal = false) {
        const cacheKey = isLocal ? 'local' : 'youtube';
        return this.cache[cacheKey].data || [];
    }

    /**
     * 페이지별 데이터 반환
     */
    getPageData(page, isLocal = false) {
        const data = this.getCurrentData(isLocal);
        const startIndex = page * this.settings.pageSize;
        const endIndex = Math.min(startIndex + this.settings.pageSize, data.length);
        
        return {
            items: data.slice(startIndex, endIndex),
            page,
            totalPages: Math.ceil(data.length / this.settings.pageSize),
            totalItems: data.length,
            hasNextPage: endIndex < data.length,
            hasPrevPage: page > 0
        };
    }

    /**
     * 검색 기능
     */
    search(query, isLocal = false) {
        if (!query || typeof query !== 'string') {
            return [];
        }

        const data = this.getCurrentData(isLocal);
        const normalizedQuery = query.toLowerCase().trim();
        
        return data.filter(item => 
            item.title.toLowerCase().includes(normalizedQuery) ||
            (item.url && item.url.toLowerCase().includes(normalizedQuery))
        );
    }

    /**
     * 아이템 추가 (YouTube URL)
     */
    async addItem(itemData) {
        try {
            // TODO: 실제 데이터베이스에 추가하는 로직 구현
            console.log('[DataService] Adding item:', itemData.title);
            
            // 캐시 무효화
            this.invalidateCache('youtube');
            
            // 이벤트 발생
            this.eventBus.emit('playlist.itemAdded', itemData);
            
            return true;
        } catch (error) {
            console.error('[DataService] Add item failed:', error);
            this.eventBus.emit('error', { operation: 'addItem', error, context: itemData });
            return false;
        }
    }

    /**
     * 아이템 제거
     */
    async removeItem(itemId, isLocal = false) {
        try {
            console.log(`[DataService] Removing item: ${itemId}`);
            
            if (isLocal) {
                // 로컬 파일 삭제
                const item = this.findItemById(itemId, true);
                if (item && item.url && fsSync.existsSync(item.url)) {
                    await fs.unlink(item.url);
                    console.log(`[DataService] Local file deleted: ${item.url}`);
                }
            } else {
                // TODO: 데이터베이스에서 제거하는 로직 구현
            }
            
            // 캐시 무효화
            this.invalidateCache(isLocal ? 'local' : 'youtube');
            
            // 이벤트 발생
            this.eventBus.emit('playlist.itemRemoved', { itemId, isLocal });
            
            return true;
        } catch (error) {
            console.error('[DataService] Remove item failed:', error);
            this.eventBus.emit('error', { operation: 'removeItem', error, context: { itemId, isLocal } });
            return false;
        }
    }

    /**
     * ID로 아이템 찾기
     */
    findItemById(itemId, isLocal = false) {
        const data = this.getCurrentData(isLocal);
        return data.find(item => item.id === itemId);
    }

    /**
     * 정렬 모드 설정
     */
    setSortMode(sortMode) {
        if (['DATE', 'ABC'].includes(sortMode)) {
            this.settings.sortMode = sortMode;
            
            // 캐시된 데이터 재정렬
            for (const [key, cache] of Object.entries(this.cache)) {
                if (cache.data && cache.data.length > 0) {
                    cache.data = this.applySorting(cache.data, sortMode);
                }
            }
            
            console.log(`[DataService] Sort mode changed to: ${sortMode}`);
            return true;
        }
        return false;
    }

    /**
     * 캐시 무효화
     */
    invalidateCache(cacheKey = null) {
        if (cacheKey && this.cache[cacheKey]) {
            this.cache[cacheKey].lastUpdate = 0;
            this.cache[cacheKey].data = [];
            console.log(`[DataService] Cache invalidated: ${cacheKey}`);
        } else {
            // 모든 캐시 무효화
            Object.keys(this.cache).forEach(key => {
                this.cache[key].lastUpdate = 0;
                this.cache[key].data = [];
            });
            console.log('[DataService] All caches invalidated');
        }
    }

    /**
     * 캐시 사전 로드
     */
    async preloadCache() {
        try {
            console.log('[DataService] Preloading cache...');
            
            // YouTube와 로컬 데이터 병렬 로드
            const [youtubeData, localData] = await Promise.allSettled([
                this.refresh(false),
                this.refresh(true)
            ]);
            
            const results = {
                youtube: youtubeData.status === 'fulfilled' ? youtubeData.value.length : 0,
                local: localData.status === 'fulfilled' ? localData.value.length : 0
            };
            
            console.log('[DataService] Cache preloaded:', results);
            return results;
            
        } catch (error) {
            console.error('[DataService] Cache preload failed:', error);
            return { youtube: 0, local: 0 };
        }
    }

    /**
     * 통계 정보 반환
     */
    getStats() {
        return {
            ...this.stats,
            cacheStatus: {
                youtube: {
                    size: this.cache.youtube.data.length,
                    lastUpdate: new Date(this.cache.youtube.lastUpdate).toISOString(),
                    isValid: this.isCacheValid(this.cache.youtube)
                },
                local: {
                    size: this.cache.local.data.length,
                    lastUpdate: new Date(this.cache.local.lastUpdate).toISOString(),
                    isValid: this.isCacheValid(this.cache.local)
                }
            },
            settings: { ...this.settings }
        };
    }

    /**
     * 헬스 체크
     */
    healthCheck() {
        const totalCacheSize = Object.values(this.cache).reduce((sum, cache) => sum + cache.data.length, 0);
        const cacheHitRate = this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0;
        
        return {
            status: this.stats.errorCount < 5 && totalCacheSize < this.settings.maxCacheSize ? 'healthy' : 'warning',
            totalCacheSize,
            cacheHitRate: Math.round(cacheHitRate * 100),
            errorCount: this.stats.errorCount,
            refreshCount: this.stats.refreshCount
        };
    }

    /**
     * 데이터 내보내기 (백업용)
     */
    exportData() {
        return {
            timestamp: new Date().toISOString(),
            guildId: this.guildId,
            cache: {
                youtube: this.cache.youtube.data,
                local: this.cache.local.data
            },
            settings: this.settings,
            stats: this.stats
        };
    }

    /**
     * 리소스 정리
     */
    async destroy() {
        console.log('[DataService] Destroying...');
        
        // 캐시 정리
        this.invalidateCache();
        
        // 참조 해제
        this.eventBus = null;
        this.cache = null;
        this.settings = null;
        this.stats = null;
        
        console.log('[DataService] Destroyed');
    }
}

module.exports = { DataService };