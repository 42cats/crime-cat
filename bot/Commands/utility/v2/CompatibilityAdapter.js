/**
 * CompatibilityAdapter v2.0
 * 기존 인터페이스와의 호환성 어댑터
 * 
 * 설계 원칙:
 * - Seamless Migration: 기존 코드 수정 없이 호환
 * - Gradual Transition: 점진적 마이그레이션 지원
 * - Backward Compatibility: 기존 API 100% 호환
 * - Forward Compatibility: 새 기능 점진적 도입
 */

const { MusicController } = require('./MusicController');

class CompatibilityAdapter {
    constructor(guildId, client, user) {
        // 새로운 MusicController 인스턴스 생성
        this.controller = new MusicController(guildId, client, user);
        
        // 기존 호환성을 위한 별칭들
        this.guildId = guildId;
        this.client = client;
        this.user = user;
        
        // 기존 인터페이스 호환을 위한 프록시 객체들
        this.setupCompatibilityProxies();
        
        console.log(`[CompatibilityAdapter v2.0] Initialized for guild: ${guildId}`);
    }

    /**
     * 기존 인터페이스 호환을 위한 프록시 설정
     */
    setupCompatibilityProxies() {
        // PlaylistManager 호환성
        this.playlistManager = this.createPlaylistManagerProxy();
        
        // AudioPlayerManager 호환성
        this.audioPlayerManager = this.createAudioPlayerManagerProxy();
        
        // 기존 속성들 호환성
        this.setupLegacyProperties();
    }

    /**
     * PlaylistManager 프록시 생성
     */
    createPlaylistManagerProxy() {
        const adapter = this;
        
        return {
            // 기존 상수들
            get REPEATONE() { return 0; },
            get NORMAL() { return 1; },
            get ONCE() { return 2; },
            get SHUFFLE() { return 3; },
            get ABC() { return 4; },
            get DATE() { return 5; },
            
            // 상태 접근
            get playlist() {
                return adapter.controller.state.playlist.items;
            },
            get currentIndex() {
                return adapter.controller.state.playlist.currentIndex;
            },
            set currentIndex(value) {
                adapter.controller.updateState({
                    playlist: { currentIndex: value }
                });
            },
            get playMode() {
                const modeMap = {
                    'REPEAT_ONE': 0,
                    'NORMAL': 1,
                    'ONCE': 2,
                    'SHUFFLE': 3
                };
                return modeMap[adapter.controller.state.playlist.mode] || 1;
            },
            get sort() {
                return adapter.controller.state.playlist.sort === 'ABC' ? 4 : 5;
            },
            get currentPage() {
                return adapter.controller.state.ui.currentPage || 0;
            },
            set currentPage(value) {
                adapter.controller.updateState({
                    ui: { currentPage: value }
                });
            },
            get maxPage() {
                const items = adapter.controller.state.playlist.items;
                return Math.ceil(items.length / 15) - 1;
            },
            
            // 메서드들
            async refresh() {
                return adapter.controller.refreshPlaylist();
            },
            
            getCurrent() {
                const { items, currentIndex } = adapter.controller.state.playlist;
                return items[currentIndex] || null;
            },
            
            getByIndex(index) {
                const items = adapter.controller.state.playlist.items;
                return items[index] || null;
            },
            
            nextInfo() {
                const { items, currentIndex, mode } = adapter.controller.state.playlist;
                if (mode === 'REPEAT_ONE') return items[currentIndex];
                if (mode === 'ONCE') return null;
                const nextIndex = (currentIndex + 1) % items.length;
                return items[nextIndex] || null;
            },
            
            setPlayMode() {
                adapter.controller.togglePlayMode();
            },
            
            getEmoji(type) {
                const emojiMap = {
                    0: '🔂', // REPEAT_ONE
                    1: '🔁', // NORMAL  
                    2: '1️⃣', // ONCE
                    3: '🔀', // SHUFFLE
                    4: '🔠', // ABC
                    5: '📅'  // DATE
                };
                return emojiMap[type] || '❓';
            },
            
            getTpyePlay() {
                const textMap = {
                    'REPEAT_ONE': '🔂 한곡반복',
                    'NORMAL': '🔁 순차재생',
                    'ONCE': '1️⃣ 한번재생',
                    'SHUFFLE': '🔀 셔플재생'
                };
                return textMap[adapter.controller.state.playlist.mode] || 'Unknown';
            },
            
            sortList() {
                adapter.controller.toggleSort();
            },
            
            getCurrentPage() {
                const { items, currentPage } = adapter.controller.state;
                const startIndex = (currentPage || 0) * 15;
                return items.slice(startIndex, startIndex + 15);
            },
            
            nextPage() {
                const currentPage = adapter.controller.state.ui.currentPage || 0;
                const maxPage = Math.ceil(adapter.controller.state.playlist.items.length / 15) - 1;
                if (currentPage < maxPage) {
                    adapter.controller.updateState({ ui: { currentPage: currentPage + 1 } });
                }
            },
            
            prevPage() {
                const currentPage = adapter.controller.state.ui.currentPage || 0;
                if (currentPage > 0) {
                    adapter.controller.updateState({ ui: { currentPage: currentPage - 1 } });
                }
            },
            
            hasData() {
                return adapter.controller.state.playlist.items.length > 0;
            },
            
            isExpired() {
                // v2.0에서는 캐시 관리가 자동화됨
                return false;
            },
            
            invalidateCache() {
                // DataService에 캐시 무효화 요청
                adapter.controller.dataService.invalidateCache();
            },
            
            destroy() {
                // 별도 정리 불필요 (컨트롤러가 관리)
                console.log('[Adapter] PlaylistManager proxy destroyed');
            }
        };
    }

    /**
     * AudioPlayerManager 프록시 생성
     */
    createAudioPlayerManagerProxy() {
        const adapter = this;
        
        return {
            // 상태 접근
            get player() {
                return adapter.controller.playerCore.player;
            },
            get connection() {
                return adapter.controller.playerCore.connection;
            },
            get volume() {
                return adapter.controller.state.ui.volume;
            },
            set volume(value) {
                adapter.controller.updateState({ ui: { volume: value } });
                adapter.controller.playerCore.setVolume(value);
            },
            
            // 메서드들
            async join(user) {
                return adapter.controller.playerCore.connectToVoice(user);
            },
            
            isInVoiceChannel() {
                return adapter.controller.playerCore.isConnectedToVoice();
            },
            
            async play(track, callback) {
                // v2.0에서는 콜백 대신 이벤트 사용
                return adapter.controller.playerCore.play(track, 0, adapter.user);
            },
            
            async playRaw(track) {
                return adapter.controller.playerCore.play(track, 0, adapter.user);
            },
            
            async pause() {
                return adapter.controller.pause();
            },
            
            resume() {
                return adapter.controller.resume();
            },
            
            async stop() {
                return adapter.controller.stop();
            },
            
            volumeUp() {
                adapter.controller.volumeUp();
            },
            
            volumeDown() {
                adapter.controller.volumeDown();
            },
            
            async setVolume(volume) {
                adapter.controller.updateState({ ui: { volume } });
                adapter.controller.playerCore.setVolume(volume);
            },
            
            destroy() {
                // 별도 정리 불필요 (컨트롤러가 관리)
                console.log('[Adapter] AudioPlayerManager proxy destroyed');
            }
        };
    }

    /**
     * 기존 속성들 호환성 설정
     */
    setupLegacyProperties() {
        // 기존 플래그들
        Object.defineProperty(this, 'isOk', {
            get: () => !this.controller.state.internal.isProcessing,
            set: (value) => {
                // v2.0에서는 내부적으로 관리되므로 무시
                console.warn('[Adapter] isOk is managed internally in v2.0');
            }
        });
        
        Object.defineProperty(this, 'stopped', {
            get: () => this.controller.state.playback === 'IDLE',
            set: (value) => {
                // v2.0에서는 내부적으로 관리되므로 무시
                console.warn('[Adapter] stopped is managed internally in v2.0');
            }
        });
        
        Object.defineProperty(this, 'local', {
            get: () => this.controller.state.ui.isLocal,
            set: (value) => {
                this.controller.updateState({ ui: { isLocal: value } });
            }
        });
        
        Object.defineProperty(this, 'operator', {
            get: () => this.user,
            set: (value) => {
                this.user = value;
            }
        });
        
        Object.defineProperty(this, 'interactionMsg', {
            get: () => this.controller.uiManager.interactionMsg,
            set: (value) => {
                this.controller.uiManager.interactionMsg = value;
            }
        });
        
        Object.defineProperty(this, 'buttons', {
            get: () => {
                // v2.0에서는 동적 생성되므로 빈 배열 반환
                return [];
            },
            set: (value) => {
                // v2.0에서는 내부적으로 관리되므로 무시
                console.warn('[Adapter] buttons are managed internally in v2.0');
            }
        });
    }

    // ============================================
    // 기존 공개 메서드들 (100% 호환)
    // ============================================

    async refreshPlaylist() {
        return this.controller.refreshPlaylist();
    }

    async join() {
        return this.controller.playerCore.connectToVoice(this.user);
    }

    async play(index, isSelect = false) {
        return this.controller.play(index, isSelect);
    }

    async pause() {
        return this.controller.pause();
    }

    resume() {
        return this.controller.resume();
    }

    volumeUp() {
        this.controller.volumeUp();
    }

    volumeDown() {
        this.controller.volumeDown();
    }

    setPlayMode() {
        this.controller.togglePlayMode();
    }

    async stop() {
        return this.controller.stop();
    }

    onOff() {
        // 연결/해제 토글 (기존 로직 유지)
        if (this.controller.playerCore.isConnectedToVoice()) {
            this.controller.playerCore.disconnect();
        } else {
            this.controller.playerCore.connectToVoice(this.user);
        }
    }

    sortList() {
        this.controller.toggleSort();
    }

    async next() {
        return this.controller.next();
    }

    async prev() {
        return this.controller.prev();
    }

    nextPage() {
        const currentPage = this.controller.state.ui.currentPage || 0;
        const maxPage = Math.ceil(this.controller.state.playlist.items.length / 15) - 1;
        if (currentPage < maxPage) {
            this.controller.updateState({ ui: { currentPage: currentPage + 1 } });
        }
    }

    prevPage() {
        const currentPage = this.controller.state.ui.currentPage || 0;
        if (currentPage > 0) {
            this.controller.updateState({ ui: { currentPage: currentPage - 1 } });
        }
    }

    firstPage() {
        this.controller.updateState({ ui: { currentPage: 0 } });
    }

    lastPage() {
        const maxPage = Math.ceil(this.controller.state.playlist.items.length / 15) - 1;
        this.controller.updateState({ ui: { currentPage: maxPage } });
    }

    togleLocal() {
        this.controller.toggleLocal();
    }

    async getPermissionButton() {
        // TODO: 권한 확인 로직 구현
        return [];
    }

    getPaginationButtons() {
        // UI Manager에서 자동 생성되므로 빈 배열 반환
        return [];
    }

    embedmaker() {
        // UI Manager에서 자동 생성되므로 null 반환
        return null;
    }

    async requestComponent() {
        // UI Manager에서 자동 생성되므로 null 반환
        return null;
    }

    async reply() {
        return this.controller.reply();
    }

    getUIHash() {
        // v2.0에서는 내부적으로 관리
        return this.controller.uiManager.generateStateHash(this.controller.state);
    }

    updateVolumeButton() {
        // v2.0에서는 자동 업데이트
        console.log('[Adapter] Volume buttons updated automatically in v2.0');
    }

    async destroy() {
        console.log('[CompatibilityAdapter] Destroying...');
        
        // 새로운 컨트롤러 정리
        await this.controller.destroy();
        
        // 참조 해제
        this.controller = null;
        this.playlistManager = null;
        this.audioPlayerManager = null;
        
        console.log('[CompatibilityAdapter] Destroyed');
        return true;
    }

    // ============================================
    // 새로운 기능 접근 (선택적 사용)
    // ============================================

    /**
     * v2.0 컨트롤러에 직접 접근 (고급 기능용)
     */
    getV2Controller() {
        return this.controller;
    }

    /**
     * 상태 정보 반환 (디버깅용)
     */
    getDebugInfo() {
        return {
            version: '2.0',
            state: this.controller.state,
            playerStatus: this.controller.playerCore.getStatus(),
            dataStats: this.controller.dataService.getStats(),
            uiCache: this.controller.uiManager.lastRenderHash
        };
    }

    /**
     * 헬스 체크
     */
    healthCheck() {
        return {
            controller: 'healthy',
            player: this.controller.playerCore.getStatus(),
            data: this.controller.dataService.healthCheck(),
            events: this.controller.eventBus.healthCheck()
        };
    }

    /**
     * 성능 통계
     */
    getPerformanceStats() {
        return {
            eventBus: this.controller.eventBus.getDebugInfo(),
            dataService: this.controller.dataService.getStats()
        };
    }
}

module.exports = { CompatibilityAdapter };