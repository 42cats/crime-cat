/**
 * UIManager v2.0
 * 최적화된 UI 관리 시스템
 * 
 * 설계 원칙:
 * - Minimal Re-rendering: 변경된 부분만 업데이트
 * - Component Caching: 재사용 가능한 컴포넌트 캐싱
 * - Performance First: 불필요한 API 호출 최소화
 * - Responsive Design: 다양한 상황에 대응
 */

const {
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder,
} = require('discord.js');
const { encodeToString } = require('../delimiterGeter');

class UIManager {
    constructor(guildId, eventBus) {
        this.guildId = guildId;
        this.eventBus = eventBus;
        
        // UI 상태 캐싱
        this.cachedComponents = new Map();
        this.lastRenderHash = null;
        this.lastEmbedHash = null;
        
        // 메시지 참조
        this.interactionMsg = null;
        
        // UI 설정
        this.pageSize = 15;
        this.maxSelectOptions = 25;
        
        // 이모지 맵
        this.emojis = {
            playMode: {
                'REPEAT_ONE': '🔂',
                'NORMAL': '🔁', 
                'ONCE': '1️⃣',
                'SHUFFLE': '🔀'
            },
            sort: {
                'DATE': '📅',
                'ABC': '🔠'
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
            }
        };
        
        console.log(`[UIManager v2.0] Initialized for guild: ${this.guildId}`);
    }

    /**
     * 메인 컴포넌트 생성 (캐싱 적용)
     */
    async generateComponents(state) {
        try {
            // 상태 해시 생성 (변경 감지용)
            const currentHash = this.generateStateHash(state);
            
            // 캐시된 컴포넌트가 있고 변경사항이 없으면 재사용
            if (this.lastRenderHash === currentHash && this.cachedComponents.has('main')) {
                console.log('[UIManager] Using cached components');
                return this.cachedComponents.get('main');
            }

            console.log('[UIManager] Generating new components');
            
            // 새 컴포넌트 생성
            const components = await this.buildComponents(state);
            
            // 캐시 업데이트
            this.cachedComponents.set('main', components);
            this.lastRenderHash = currentHash;
            
            return components;
            
        } catch (error) {
            console.error('[UIManager] Component generation failed:', error);
            this.eventBus.emit('ui.error', { error, context: 'generateComponents' });
            return this.getErrorComponents();
        }
    }

    /**
     * 실제 컴포넌트 구성
     */
    async buildComponents(state) {
        const components = [];
        
        // 메인 컨트롤 버튼들
        components.push(this.createMainControlRow(state));
        components.push(this.createSecondaryControlRow(state));
        
        // 플레이리스트 선택 메뉴 (항상 표시하되, 비어있을 때는 안내 메시지)
        components.push(await this.createPlaylistSelectMenu(state));
        
        // 페이지네이션 (15개 이상일 때)
        if (state.playlist.items.length > this.pageSize) {
            components.push(this.createPaginationRow(state));
        }
        
        // 프리미엄 기능 (로컬 음악)
        const premiumRow = await this.createPremiumRow(state);
        if (premiumRow) {
            components.push(premiumRow);
        }

        return {
            embeds: [this.createEmbed(state)],
            components: components.filter(Boolean)
        };
    }

    /**
     * 메인 컨트롤 버튼 행
     */
    createMainControlRow(state) {
        const cacheKey = `mainControl_${state.ui.volume}_${state.playback}`;
        
        if (this.cachedComponents.has(cacheKey)) {
            return this.cachedComponents.get(cacheKey);
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "volumeUp"))
                    .setEmoji(this.emojis.volume.up)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(state.ui.volume >= 1),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "prev"))
                    .setEmoji(this.emojis.playback.prev)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(state.playlist.items.length === 0),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "playpause"))
                    .setEmoji(this.emojis.playback.play)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(state.playlist.items.length === 0),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "playstop"))
                    .setEmoji(this.emojis.playback.stop)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(state.playback === 'IDLE'),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "next"))
                    .setEmoji(this.emojis.playback.next)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(state.playlist.items.length === 0)
            );

        this.cachedComponents.set(cacheKey, row);
        return row;
    }

    /**
     * 보조 컨트롤 버튼 행
     */
    createSecondaryControlRow(state) {
        const cacheKey = `secondaryControl_${state.ui.volume}_${state.playlist.mode}_${state.playlist.sort}`;
        
        if (this.cachedComponents.has(cacheKey)) {
            return this.cachedComponents.get(cacheKey);
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "volumeDown"))
                    .setEmoji(this.emojis.volume.down)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(state.ui.volume <= 0),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "sort"))
                    .setEmoji(this.emojis.sort[state.playlist.sort])
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "mode"))
                    .setEmoji(this.emojis.playMode[state.playlist.mode])
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "onOff"))
                    .setEmoji(this.emojis.connection.connected) // TODO: 연결 상태에 따라 변경
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "exit"))
                    .setEmoji("❌")
                    .setStyle(ButtonStyle.Danger)
            );

        this.cachedComponents.set(cacheKey, row);
        return row;
    }

    /**
     * 플레이리스트 선택 메뉴
     */
    async createPlaylistSelectMenu(state) {
        try {
            const currentPage = state.ui.currentPage || 0;
            const startIndex = currentPage * this.pageSize;
            const endIndex = Math.min(startIndex + this.pageSize, state.playlist.items.length);
            const pageItems = state.playlist.items.slice(startIndex, endIndex);

            // 빈 플레이리스트인 경우 안내 메시지 표시
            if (pageItems.length === 0) {
                const emptyMsg = state.ui.isLocal 
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

            // 현재 재생 중인 곡 표시
            const currentTrack = state.playlist.items[state.playlist.currentIndex];
            const menuMsg = state.playback === 'PLAYING' && currentTrack
                ? `🎵 Now Playing: ${currentTrack.title}`
                : "재생할 곡을 선택해 주세요.";

            const options = pageItems.map((item, pageIndex) => {
                const actualIndex = startIndex + pageIndex;
                const isCurrentTrack = actualIndex === state.playlist.currentIndex;
                
                return {
                    label: `${isCurrentTrack ? '▶ ' : ''}${item.title.slice(0, 80)}`,
                    description: item.duration ? `Duration: ${item.duration}` : undefined,
                    value: encodeToString(this.guildId, "playListUrl", actualIndex),
                    emoji: isCurrentTrack ? '🎵' : undefined
                };
            }).slice(0, this.maxSelectOptions); // Discord 제한

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(encodeToString(this.guildId, "selectMenu"))
                .setPlaceholder(menuMsg)
                .addOptions(options);

            return new ActionRowBuilder().addComponents(selectMenu);

        } catch (error) {
            console.error('[UIManager] Playlist select menu creation failed:', error);
            return null;
        }
    }

    /**
     * 페이지네이션 버튼 행
     */
    createPaginationRow(state) {
        const currentPage = state.ui.currentPage || 0;
        const maxPage = Math.ceil(state.playlist.items.length / this.pageSize) - 1;
        
        const cacheKey = `pagination_${currentPage}_${maxPage}`;
        
        if (this.cachedComponents.has(cacheKey)) {
            return this.cachedComponents.get(cacheKey);
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

        this.cachedComponents.set(cacheKey, row);
        return row;
    }

    /**
     * 프리미엄 기능 행 (로컬 음악)
     */
    async createPremiumRow(state) {
        try {
            // TODO: 권한 확인 로직 구현
            // const hasPermission = await isPermissionHas(user.id, "로컬음악");
            // if (!hasPermission) return null;

            const cacheKey = `premium_${state.ui.isLocal}`;
            
            if (this.cachedComponents.has(cacheKey)) {
                return this.cachedComponents.get(cacheKey);
            }

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "Local"))
                        .setEmoji(state.ui.isLocal ? "📁" : "🌐")
                        .setStyle(ButtonStyle.Success)
                        .setLabel(state.ui.isLocal ? "Local Files" : "YouTube")
                );

            this.cachedComponents.set(cacheKey, row);
            return row;

        } catch (error) {
            console.error('[UIManager] Premium row creation failed:', error);
            return null;
        }
    }

    /**
     * 임베드 생성 (캐싱 적용)
     */
    createEmbed(state) {
        const embedHash = this.generateEmbedHash(state);
        
        if (this.lastEmbedHash === embedHash && this.cachedComponents.has('embed')) {
            return this.cachedComponents.get('embed');
        }

        const currentTrack = state.playlist.items[state.playlist.currentIndex];
        const nextTrack = this.getNextTrack(state);
        
        const embed = new EmbedBuilder()
            .setColor(this.getEmbedColor(state.playback))
            .setTitle(`🎵 Music Player v2.0`)
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
                    value: nextTrack?.title || (state.playlist.mode === 'SHUFFLE' ? '🔀 셔플 대기중...' : 'N/A'), 
                    inline: true 
                },
                { 
                    name: "볼륨", 
                    value: `${Math.round(state.ui.volume * 100)}%`, 
                    inline: true 
                },
                { 
                    name: "재생 모드", 
                    value: this.getPlayModeText(state.playlist.mode), 
                    inline: true 
                },
                { 
                    name: "상태", 
                    value: this.getPlaybackStatusText(state.playback), 
                    inline: true 
                }
            )
            .setFooter({ 
                text: `정렬: ${state.playlist.sort === 'ABC' ? '가나다' : '날짜'} | 목록: ${state.ui.isLocal ? '로컬 파일' : 'YouTube'} | ${state.playlist.items.length}곡` 
            })
            .setThumbnail(currentTrack?.thumbnail || 'https://imgur.com/jCVVLrp.png')
            .setTimestamp();

        this.cachedComponents.set('embed', embed);
        this.lastEmbedHash = embedHash;
        
        return embed;
    }

    /**
     * 다음 곡 계산
     */
    getNextTrack(state) {
        const { items, currentIndex, mode } = state.playlist;
        
        if (items.length === 0) return null;
        
        switch (mode) {
            case 'REPEAT_ONE':
                return items[currentIndex];
            case 'ONCE':
                return currentIndex < items.length - 1 ? items[currentIndex + 1] : null;
            case 'NORMAL':
                const nextIndex = (currentIndex + 1) % items.length;
                return items[nextIndex];
            case 'SHUFFLE':
                // 셔플 모드에서는 미리 계산된 다음 트랙 표시
                const shuffleNext = state.internal?.shuffleNextTrack;
                if (shuffleNext !== null && shuffleNext >= 0 && shuffleNext < items.length) {
                    return items[shuffleNext];
                }
                // 미리 계산된 것이 없으면 임시로 다른 곡 표시 (실제 재생과는 다를 수 있음)
                const tempNext = (currentIndex + 1) % items.length;
                return items[tempNext];
            default:
                return null;
        }
    }

    /**
     * 임베드 색상 결정
     */
    getEmbedColor(playbackState) {
        const colors = {
            'IDLE': 0x95A5A6,      // 회색
            'LOADING': 0xF39C12,   // 주황색
            'PLAYING': 0x2ECC71,   // 초록색
            'PAUSED': 0xE67E22,    // 진한 주황색
            'STOPPING': 0xE74C3C   // 빨간색
        };
        
        return colors[playbackState] || colors['IDLE'];
    }

    /**
     * 재생 모드 텍스트
     */
    getPlayModeText(mode) {
        const texts = {
            'REPEAT_ONE': '🔂 한곡반복',
            'NORMAL': '🔁 순차재생',
            'ONCE': '1️⃣ 한번재생',
            'SHUFFLE': '🔀 셔플재생'
        };
        
        return texts[mode] || 'Unknown';
    }

    /**
     * 재생 상태 텍스트
     */
    getPlaybackStatusText(state) {
        const texts = {
            'IDLE': '⏹️ 정지',
            'LOADING': '⏳ 로딩 중',
            'PLAYING': '▶️ 재생 중',
            'PAUSED': '⏸️ 일시정지',
            'STOPPING': '⏹️ 정지 중'
        };
        
        return texts[state] || 'Unknown';
    }

    /**
     * 상태 해시 생성 (변경 감지용)
     */
    generateStateHash(state) {
        const relevantState = {
            playback: state.playback,
            currentIndex: state.playlist.currentIndex,
            mode: state.playlist.mode,
            sort: state.playlist.sort,
            volume: state.ui.volume,
            isLocal: state.ui.isLocal,
            currentPage: state.ui.currentPage,
            playlistLength: state.playlist.items.length
        };
        
        return JSON.stringify(relevantState);
    }

    /**
     * 임베드 해시 생성
     */
    generateEmbedHash(state) {
        const currentTrack = state.playlist.items[state.playlist.currentIndex];
        const nextTrack = this.getNextTrack(state);
        
        const relevantData = {
            currentTitle: currentTrack?.title,
            currentDuration: currentTrack?.duration,
            currentThumbnail: currentTrack?.thumbnail,
            nextTitle: nextTrack?.title,
            playback: state.playback,
            volume: state.ui.volume,
            mode: state.playlist.mode,
            sort: state.playlist.sort,
            isLocal: state.ui.isLocal,
            playlistLength: state.playlist.items.length
        };
        
        return JSON.stringify(relevantData);
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
        this.cachedComponents.clear();
        this.lastRenderHash = null;
        this.lastEmbedHash = null;
        console.log('[UIManager] Cache cleared');
    }

    /**
     * 강제 업데이트 (캐시 무시)
     */
    async forceUpdate(state) {
        this.clearCache();
        return this.generateComponents(state);
    }

    /**
     * 메시지 업데이트
     */
    async updateMessage(state) {
        if (!this.interactionMsg) {
            console.warn('[UIManager] No interaction message to update');
            return false;
        }

        try {
            const components = await this.generateComponents(state);
            await this.interactionMsg.edit(components);
            return true;
        } catch (error) {
            console.error('[UIManager] Message update failed:', error);
            this.eventBus.emit('ui.error', { error, context: 'updateMessage' });
            return false;
        }
    }

    /**
     * 리소스 정리
     */
    async destroy() {
        console.log('[UIManager] Destroying...');
        
        // 캐시 정리
        this.clearCache();
        
        // 메시지 삭제 (가능한 경우)
        if (this.interactionMsg) {
            try {
                if (this.interactionMsg.deletable && !this.interactionMsg.system) {
                    await this.interactionMsg.delete();
                }
            } catch (error) {
                console.error('[UIManager] Failed to delete message:', error);
            }
            this.interactionMsg = null;
        }
        
        // 참조 해제
        this.eventBus = null;
        
        console.log('[UIManager] Destroyed');
    }
}

module.exports = { UIManager };