/**
 * UIEngine v3.0
 * 효율적인 UI 렌더링 시스템
 * 
 * 핵심 원칙:
 * - Minimal Re-rendering: 변경된 부분만 렌더링
 * - Smart Caching: 컴포넌트 레벨 캐싱
 * - State Driven: 상태 기반 렌더링
 * - Performance First: 성능 우선 설계
 */

const {
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder,
} = require('discord.js');
const { encodeToString } = require('../delimiterGeter');
const { PLAYBACK_STATES, PLAY_MODES, SOURCE_TYPES, CACHE_CONFIG } = require('./types');

class UIEngine {
    constructor(guildId, stateManager, playlistEngine) {
        this.guildId = guildId;
        this.stateManager = stateManager;
        this.playlistEngine = playlistEngine;
        
        // 컴포넌트 캐시
        this.componentCache = new Map();
        
        // 렌더링 캐시
        this.renderCache = {
            lastStateHash: null,
            lastRender: null,
            lastRenderTime: 0
        };
        
        // UI 설정
        this.config = {
            pageSize: 15,
            maxSelectOptions: 25,
            cacheTimeout: CACHE_CONFIG.UI_TTL
        };
        
        // 이모지 맵
        this.emojis = {
            playMode: {
                [PLAY_MODES.REPEAT_ONE]: '🔂',
                [PLAY_MODES.NORMAL]: '🔁',
                [PLAY_MODES.ONCE]: '1️⃣',
                [PLAY_MODES.SHUFFLE]: '🔀'
            },
            sort: {
                DATE: '📅',
                ABC: '🔠'
            },
            connection: {
                connected: '✅',
                disconnected: '☑'
            },
            volume: {
                up: '🔊',
                down: '🔉'
            },
            playback: {
                play: '⏯️',
                stop: '⏹️',
                prev: '⏮️',
                next: '⏭️'
            },
            source: {
                [SOURCE_TYPES.YOUTUBE]: '🌐',
                [SOURCE_TYPES.LOCAL]: '📁'
            }
        };
        
        console.log(`[UIEngine v3.0] Initialized for guild: ${this.guildId}`);
    }

    /**
     * 메인 컴포넌트 생성 (진입점)
     */
    async generateComponents() {
        try {
            const state = this.stateManager.getState();
            
            // 상태 해시 생성
            const stateHash = this.generateStateHash(state);
            
            // 캐시된 렌더링 확인
            if (this.isRenderCacheValid(stateHash)) {
                console.log('[UIEngine] Using cached render');
                return this.renderCache.lastRender;
            }

            console.log('[UIEngine] Generating new components');
            
            // 새 컴포넌트 생성
            const components = await this.buildComponents(state);
            
            // 렌더링 캐시 업데이트
            this.updateRenderCache(stateHash, components);
            
            return components;
            
        } catch (error) {
            console.error('[UIEngine] Component generation failed:', error);
            return this.getErrorComponents();
        }
    }

    /**
     * 실제 컴포넌트 구성
     */
    async buildComponents(state) {
        const components = [];
        
        // 1. 메인 컨트롤 버튼들
        components.push(this.createMainControlRow(state));
        
        // 2. 보조 컨트롤 버튼들  
        components.push(this.createSecondaryControlRow(state));
        
        // 3. 플레이리스트 선택 메뉴
        components.push(this.createPlaylistSelectMenu(state));
        
        // 4. 페이지네이션 (필요한 경우)
        if (state.playlist.items.length > this.config.pageSize) {
            components.push(this.createPaginationRow(state));
        }
        
        // 5. 소스 전환 버튼
        components.push(this.createSourceRow(state));

        return {
            embeds: [this.createEmbed(state)],
            components: components.filter(Boolean)
        };
    }

    /**
     * 메인 컨트롤 버튼 행
     */
    createMainControlRow(state) {
        const cacheKey = `mainControl_${state.playback.volume}_${state.playback.state}_${state.playlist.items.length}`;
        
        if (this.componentCache.has(cacheKey)) {
            return this.componentCache.get(cacheKey);
        }

        const { playback, playlist } = state;
        const hasPlaylist = playlist.items.length > 0;
        const isPlaying = playback.state === PLAYBACK_STATES.PLAYING;
        const isPaused = playback.state === PLAYBACK_STATES.PAUSED;

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "volumeUp"))
                    .setEmoji(this.emojis.volume.up)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(playback.volume >= 1),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "prev"))
                    .setEmoji(this.emojis.playback.prev)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(!hasPlaylist),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "playpause"))
                    .setEmoji(this.emojis.playback.play)
                    .setStyle(isPlaying || isPaused ? ButtonStyle.Success : ButtonStyle.Primary)
                    .setDisabled(!hasPlaylist),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "playstop"))
                    .setEmoji(this.emojis.playback.stop)
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(playback.state === PLAYBACK_STATES.IDLE),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "next"))
                    .setEmoji(this.emojis.playback.next)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(!hasPlaylist)
            );

        this.componentCache.set(cacheKey, row);
        return row;
    }

    /**
     * 보조 컨트롤 버튼 행
     */
    createSecondaryControlRow(state) {
        const cacheKey = `secondaryControl_${state.playback.volume}_${state.playlist.mode}_${state.playlist.sort}`;
        
        if (this.componentCache.has(cacheKey)) {
            return this.componentCache.get(cacheKey);
        }

        const { playback, playlist } = state;

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "volumeDown"))
                    .setEmoji(this.emojis.volume.down)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(playback.volume <= 0),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "sort"))
                    .setEmoji(this.emojis.sort[playlist.sort])
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "mode"))
                    .setEmoji(this.emojis.playMode[playlist.mode])
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "onOff"))
                    .setEmoji(this.emojis.connection.connected)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "exit"))
                    .setEmoji("❌")
                    .setStyle(ButtonStyle.Danger)
            );

        this.componentCache.set(cacheKey, row);
        return row;
    }

    /**
     * 플레이리스트 선택 메뉴
     */
    createPlaylistSelectMenu(state) {
        const { playlist, playback, ui } = state;
        const currentPage = ui.currentPage || 0;
        
        // 페이지 데이터 가져오기
        const pageData = this.playlistEngine.getPageData(currentPage);
        const pageItems = pageData.items;

        // 빈 플레이리스트 처리
        if (pageItems.length === 0) {
            const emptyMsg = playlist.source === SOURCE_TYPES.LOCAL 
                ? "로컬 음악 파일이 없습니다. 파일을 업로드해주세요."
                : "YouTube 음악이 없습니다. 주소를 추가해주세요.";
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(encodeToString(this.guildId, "selectMenu"))
                .setPlaceholder(emptyMsg)
                .addOptions([{
                    label: "플레이리스트가 비어있습니다",
                    description: "음악을 추가한 후 사용해주세요",
                    value: "empty",
                    emoji: "📭"
                }])
                .setDisabled(true);

            return new ActionRowBuilder().addComponents(selectMenu);
        }

        // 플레이스홀더 메시지 생성
        const currentTrack = playback.currentTrack;
        const menuMsg = playback.state === PLAYBACK_STATES.PLAYING && currentTrack
            ? `🎵 Now Playing: ${currentTrack.title}`
            : "재생할 곡을 선택해 주세요.";

        // 옵션 생성
        const startIndex = currentPage * this.config.pageSize;
        const options = pageItems.map((item, pageIndex) => {
            const actualIndex = startIndex + pageIndex;
            const isCurrentTrack = actualIndex === playback.currentIndex;
            
            return {
                label: `${isCurrentTrack ? '▶ ' : ''}${item.title.slice(0, 80)}`,
                description: item.duration ? `Duration: ${item.duration}` : 'Unknown duration',
                value: encodeToString(this.guildId, "playListUrl", actualIndex),
                emoji: isCurrentTrack ? '🎵' : undefined
            };
        }).slice(0, this.config.maxSelectOptions);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(encodeToString(this.guildId, "selectMenu"))
            .setPlaceholder(menuMsg)
            .addOptions(options);

        return new ActionRowBuilder().addComponents(selectMenu);
    }

    /**
     * 페이지네이션 버튼 행
     */
    createPaginationRow(state) {
        const currentPage = state.ui.currentPage || 0;
        const totalItems = state.playlist.items.length;
        const maxPage = Math.ceil(totalItems / this.config.pageSize) - 1;
        
        const cacheKey = `pagination_${currentPage}_${maxPage}`;
        
        if (this.componentCache.has(cacheKey)) {
            return this.componentCache.get(cacheKey);
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "pageNation", "pageFirst"))
                    .setLabel("<<")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "pageNation", "pagePrev"))
                    .setLabel("<")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "pageNation", "pageCurrent"))
                    .setLabel(`Page ${currentPage + 1}/${maxPage + 1}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "pageNation", "pageNext"))
                    .setLabel(">")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage >= maxPage),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "pageNation", "pageLast"))
                    .setLabel(">>")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage >= maxPage)
            );

        this.componentCache.set(cacheKey, row);
        return row;
    }

    /**
     * 소스 전환 버튼 행
     */
    createSourceRow(state) {
        const cacheKey = `source_${state.playlist.source}`;
        
        if (this.componentCache.has(cacheKey)) {
            return this.componentCache.get(cacheKey);
        }

        const { playlist } = state;
        const isLocal = playlist.source === SOURCE_TYPES.LOCAL;

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "Local"))
                    .setEmoji(this.emojis.source[playlist.source])
                    .setStyle(isLocal ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setLabel(isLocal ? "Local Files" : "YouTube")
            );

        this.componentCache.set(cacheKey, row);
        return row;
    }

    /**
     * 임베드 생성
     */
    createEmbed(state) {
        const { playback, playlist, shuffle } = state;
        const currentTrack = playback.currentTrack;
        const nextTrack = this.playlistEngine.getNextTrack();
        
        const embed = new EmbedBuilder()
            .setColor(this.getEmbedColor(playback.state))
            .setTitle(`🎵 Music Player v3.0`)
            .addFields(
                { 
                    name: "현재 곡", 
                    value: currentTrack?.title || 'N/A', 
                    inline: true 
                },
                { 
                    name: "재생 시간", 
                    value: currentTrack?.duration || 'N/A', 
                    inline: true 
                },
                { 
                    name: "다음 곡", 
                    value: this.getNextTrackText(nextTrack, playlist.mode), 
                    inline: true 
                },
                { 
                    name: "볼륨", 
                    value: `${Math.round(playback.volume * 100)}%`, 
                    inline: true 
                },
                { 
                    name: "재생 모드", 
                    value: this.getPlayModeText(playlist.mode), 
                    inline: true 
                },
                { 
                    name: "상태", 
                    value: this.getPlaybackStatusText(playback.state), 
                    inline: true 
                }
            )
            .setFooter({ 
                text: this.getFooterText(state)
            })
            .setThumbnail(currentTrack?.thumbnail || 'https://imgur.com/jCVVLrp.png')
            .setTimestamp();

        return embed;
    }

    /**
     * 다음 곡 텍스트 생성
     */
    getNextTrackText(nextTrack, mode) {
        if (nextTrack) {
            return nextTrack.title;
        }
        
        if (mode === PLAY_MODES.SHUFFLE) {
            return '🔀 셔플 대기중...';
        }
        
        return 'N/A';
    }

    /**
     * 푸터 텍스트 생성
     */
    getFooterText(state) {
        const { playlist } = state;
        const sortText = playlist.sort === 'ABC' ? '가나다' : '날짜';
        const sourceText = playlist.source === SOURCE_TYPES.LOCAL ? '로컬 파일' : 'YouTube';
        
        return `정렬: ${sortText} | 목록: ${sourceText} | ${playlist.items.length}곡`;
    }

    /**
     * 임베드 색상 결정
     */
    getEmbedColor(playbackState) {
        const colors = {
            [PLAYBACK_STATES.IDLE]: 0x95A5A6,      // 회색
            [PLAYBACK_STATES.LOADING]: 0xF39C12,   // 주황색
            [PLAYBACK_STATES.PLAYING]: 0x2ECC71,   // 초록색
            [PLAYBACK_STATES.PAUSED]: 0xE67E22,    // 진한 주황색
            [PLAYBACK_STATES.ERROR]: 0xE74C3C      // 빨간색
        };
        
        return colors[playbackState] || colors[PLAYBACK_STATES.IDLE];
    }

    /**
     * 재생 모드 텍스트
     */
    getPlayModeText(mode) {
        const texts = {
            [PLAY_MODES.REPEAT_ONE]: '🔂 한곡반복',
            [PLAY_MODES.NORMAL]: '🔁 순차재생',
            [PLAY_MODES.ONCE]: '1️⃣ 한번재생',
            [PLAY_MODES.SHUFFLE]: '🔀 셔플재생'
        };
        
        return texts[mode] || 'Unknown';
    }

    /**
     * 재생 상태 텍스트
     */
    getPlaybackStatusText(state) {
        const texts = {
            [PLAYBACK_STATES.IDLE]: '⏹️ 정지',
            [PLAYBACK_STATES.LOADING]: '⏳ 로딩 중',
            [PLAYBACK_STATES.PLAYING]: '▶️ 재생 중',
            [PLAYBACK_STATES.PAUSED]: '⏸️ 일시정지',
            [PLAYBACK_STATES.ERROR]: '❌ 오류'
        };
        
        return texts[state] || 'Unknown';
    }

    /**
     * 상태 해시 생성 (캐시 키용)
     */
    generateStateHash(state) {
        const relevantState = {
            playback: {
                state: state.playback.state,
                currentIndex: state.playback.currentIndex,
                volume: state.playback.volume
            },
            playlist: {
                mode: state.playlist.mode,
                sort: state.playlist.sort,
                source: state.playlist.source,
                itemCount: state.playlist.items.length
            },
            ui: {
                currentPage: state.ui.currentPage
            },
            shuffle: {
                isActive: state.shuffle.isActive,
                currentIndex: state.shuffle.currentIndex
            }
        };
        
        return JSON.stringify(relevantState);
    }

    /**
     * 렌더링 캐시 유효성 확인
     */
    isRenderCacheValid(stateHash) {
        if (!this.renderCache.lastStateHash || !this.renderCache.lastRender) {
            return false;
        }
        
        // 상태 해시 비교
        if (this.renderCache.lastStateHash !== stateHash) {
            return false;
        }
        
        // 시간 기반 캐시 만료 확인
        const now = Date.now();
        if (now - this.renderCache.lastRenderTime > this.config.cacheTimeout) {
            return false;
        }
        
        return true;
    }

    /**
     * 렌더링 캐시 업데이트
     */
    updateRenderCache(stateHash, components) {
        this.renderCache = {
            lastStateHash: stateHash,
            lastRender: components,
            lastRenderTime: Date.now()
        };
    }

    /**
     * 에러 상황용 컴포넌트
     */
    getErrorComponents() {
        const errorEmbed = new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('❌ 음악 플레이어 오류')
            .setDescription('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
            .setTimestamp();

        const retryButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "refresh"))
                    .setLabel("새로고침")
                    .setEmoji("🔄")
                    .setStyle(ButtonStyle.Primary)
            );

        return {
            embeds: [errorEmbed],
            components: [retryButton]
        };
    }

    /**
     * 캐시 정리
     */
    clearCache() {
        this.componentCache.clear();
        this.renderCache = {
            lastStateHash: null,
            lastRender: null,
            lastRenderTime: 0
        };
        console.log('[UIEngine] Cache cleared');
    }

    /**
     * 강제 업데이트 (캐시 무시)
     */
    async forceUpdate() {
        this.clearCache();
        return this.generateComponents();
    }

    /**
     * 캐시 통계
     */
    getCacheStats() {
        return {
            componentCacheSize: this.componentCache.size,
            hasRenderCache: !!this.renderCache.lastRender,
            lastRenderTime: this.renderCache.lastRenderTime
        };
    }

    /**
     * 리소스 정리
     */
    async destroy() {
        console.log('[UIEngine] Destroying...');
        
        // 캐시 정리
        this.clearCache();
        
        // 참조 해제
        this.stateManager = null;
        this.playlistEngine = null;
        this.componentCache = null;
        this.renderCache = null;
        
        console.log('[UIEngine] Destroyed');
    }
}

module.exports = { UIEngine };