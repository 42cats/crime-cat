const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle } = require('discord.js');
const DebugLogger = require('./DebugLogger');
const { encodeToString } = require('../delimiterGeter');

/**
 * UI Manager v4
 * 심플하고 즉각적인 UI 생성
 */
class UIManagerV4 {
    constructor(guildId, player) {
        this.guildId = guildId;
        this.player = player;
        this.logger = new DebugLogger('UIManagerV4', guildId);
        
        // 이모지 설정
        this.emojis = {
            control: {
                prev: '⏮️',
                playpause: {
                    play: '▶️',
                    pause: '⏸️'
                },
                stop: '⏹️',
                next: '⏭️'
            },
            volume: {
                down: '🔉',
                up: '🔊',
                mute: '🔇'
            },
            mode: {
                'normal': '➡️',
                'repeat-one': '🔂',
                'repeat-all': '🔁',
                'shuffle': '🔀'
            },
            sort: {
                'date': '📅',
                'abc': '🔤'
            },
            source: {
                'youtube': '🌐',
                'local': '💾'
            },
            status: {
                playing: '🎵',
                paused: '⏸️',
                stopped: '⏹️',
                loading: '⏳',
                idle: '💤'
            },
            misc: {
                autoplay: '🔄',
                exit: '❌',
                error: '⚠️',
                success: '✅'
            }
        };
        
        this.logger.info('✅ UI Manager v4 initialized');
    }

    /**
     * UI 렌더링
     */
    render(state) {
        this.logger.trace('render');
        const timer = this.logger.startTimer('render UI');
        
        try {
            const embed = this.createEmbed(state);
            const components = this.createComponents(state);
            
            const result = {
                embeds: [embed],
                components: components
            };
            
            timer.end(true);
            return result;
            
        } catch (error) {
            this.logger.error('UI render failed', error);
            timer.end(false);
            
            // 에러 UI 반환
            return this.createErrorUI(error.message);
        }
    }

    /**
     * 임베드 생성
     */
    createEmbed(state) {
        const { currentTrack, queue, isPlaying, isPaused, volume, mode } = state;
        const nextTrack = this.getNextTrack(state);
        
        const embed = new EmbedBuilder()
            .setColor(this.getEmbedColor(state))
            .setTitle(`🎵 Music Player v4.0`)
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
                    value: this.getNextTrackText(nextTrack, mode), 
                    inline: true 
                },
                { 
                    name: "볼륨", 
                    value: `${Math.round(volume * 100)}%`, 
                    inline: true 
                },
                { 
                    name: "재생 모드", 
                    value: this.getModeText(mode), 
                    inline: true 
                },
                { 
                    name: "상태", 
                    value: this.getPlaybackStatusText(state), 
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
     * 컴포넌트 생성 (v3 풍부한 UI 복원)
     */
    createComponents(state) {
        const components = [];
        
        // 1. 메인 컨트롤 버튼 (재생, 이전, 다음, 정지, 볼륨업)
        components.push(this.createMainControlButtons(state));
        
        // 2. 보조 컨트롤 버튼 (볼륨다운, 정렬, 모드, 자동재생, 종료)
        components.push(this.createSecondaryControlButtons(state));
        
        // 3. 플레이리스트 선택 메뉴
        components.push(this.createPlaylistSelect(state));
        
        // 4. 페이지네이션 버튼 (필요한 경우)
        if (state.queue.length > 15) {
            components.push(this.createPaginationButtons(state));
        }
        
        // 5. 소스 전환 버튼
        components.push(this.createSourceButtons(state));
        
        return components.filter(Boolean);
    }

    /**
     * 메인 컨트롤 버튼 생성 (v3 스타일)
     */
    createMainControlButtons(state) {
        const { isPlaying, isPaused, volume, queue } = state;
        const hasPlaylist = queue.length > 0;
        
        const row = new ActionRowBuilder()
            .addComponents(
                // 볼륨 업
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, 'musicPlayerButton', 'volumeUp'))
                    .setEmoji(this.emojis.volume.up)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(volume >= 1),
                
                // 이전
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, 'musicPlayerButton', 'prev'))
                    .setEmoji(this.emojis.control.prev)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(!hasPlaylist),
                
                // 재생/일시정지
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, 'musicPlayerButton', 'playpause'))
                    .setEmoji(isPaused || !isPlaying 
                        ? this.emojis.control.playpause.play 
                        : this.emojis.control.playpause.pause)
                    .setStyle(isPlaying || isPaused ? ButtonStyle.Success : ButtonStyle.Primary)
                    .setDisabled(!hasPlaylist),
                
                // 정지
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, 'musicPlayerButton', 'playstop'))
                    .setEmoji(this.emojis.control.stop)
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(!isPlaying && !isPaused),
                
                // 다음
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, 'musicPlayerButton', 'next'))
                    .setEmoji(this.emojis.control.next)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(!hasPlaylist)
            );
        
        return row;
    }

    /**
     * 보조 컨트롤 버튼 생성 (v3 스타일)
     */
    createSecondaryControlButtons(state) {
        const { volume, mode, queue } = state;
        
        const row = new ActionRowBuilder()
            .addComponents(
                // 볼륨 다운
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, 'musicPlayerButton', 'volumeDown'))
                    .setEmoji(this.emojis.volume.down)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(volume <= 0),
                
                // 정렬
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, 'musicPlayerButton', 'sort'))
                    .setEmoji(this.emojis.sort[queue.sortType])
                    .setStyle(ButtonStyle.Primary),
                
                // 모드
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, 'musicPlayerButton', 'mode'))
                    .setEmoji(this.emojis.mode[mode])
                    .setStyle(ButtonStyle.Primary),
                
                // 자동재생/연결상태
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, 'musicPlayerButton', 'onOff'))
                    .setEmoji('✅')
                    .setStyle(ButtonStyle.Primary),
                
                // 종료
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, 'musicPlayerButton', 'exit'))
                    .setEmoji('❌')
                    .setStyle(ButtonStyle.Danger)
            );
        
        return row;
    }

    /**
     * 플레이리스트 선택 메뉴 (v3 스타일 복원)
     */
    createPlaylistSelect(state) {
        const { queue, currentIndex, isPlaying, currentTrack } = state;
        const currentPage = state.ui?.currentPage || 0;
        
        // 페이지 데이터 가져오기
        const pageSize = 15; // v3 대로 복원
        const pageData = this.player.queue.getPageData(currentPage, pageSize);
        const pageItems = pageData.items;
        
        // 빈 플레이리스트 처리
        if (pageItems.length === 0) {
            const emptyMsg = queue.source === 'local' 
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
        
        // 플레이스홀더 메시지 생성 (v3 스타일)
        const menuMsg = isPlaying && currentTrack
            ? `🎵 Now Playing: ${currentTrack.title}`
            : "재생할 곡을 선택해 주세요.";
        
        // 옵션 생성
        const startIndex = currentPage * pageSize;
        const options = pageItems.map((track, pageIndex) => {
            const actualIndex = startIndex + pageIndex;
            const isCurrent = actualIndex === currentIndex;
            
            return {
                label: `${isCurrent ? '▶ ' : ''}${track.title.slice(0, 80)}`,
                description: track.duration ? `Duration: ${track.duration}` : 'Unknown duration',
                value: encodeToString(this.guildId, "playListUrl", actualIndex),
                emoji: isCurrent ? '🎵' : undefined
            };
        }).slice(0, 25); // Discord 제한
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(encodeToString(this.guildId, "selectMenu"))
            .setPlaceholder(menuMsg)
            .addOptions(options);
        
        return new ActionRowBuilder().addComponents(selectMenu);
    }

    /**
     * 상태 이모지
     */
    getStatusEmoji(state) {
        if (state.isPlaying && !state.isPaused) {
            return this.emojis.status.playing;
        } else if (state.isPaused) {
            return this.emojis.status.paused;
        } else {
            return this.emojis.status.idle;
        }
    }

    /**
     * 모드 텍스트
     */
    getModeText(mode) {
        const modeTexts = {
            'normal': '순차 재생',
            'repeat-one': '한 곡 반복',
            'repeat-all': '전체 반복',
            'shuffle': '셔플 재생'
        };
        
        return modeTexts[mode] || mode;
    }

    /**
     * 임베드 색상 (v3 스타일)
     */
    getEmbedColor(state) {
        if (state.isPlaying && !state.isPaused) {
            return 0x2ECC71; // 초록색
        } else if (state.isPaused) {
            return 0xE67E22; // 진한 주황색
        } else if (state.loading) {
            return 0xF39C12; // 주황색
        } else {
            return 0x95A5A6; // 회색
        }
    }

    /**
     * 에러 UI
     */
    createErrorUI(message) {
        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('⚠️ 오류 발생')
            .setDescription(message || '알 수 없는 오류가 발생했습니다.')
            .setTimestamp();
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, 'musicPlayerButton', 'exit'))
                    .setLabel('종료')
                    .setEmoji('❌')
                    .setStyle(ButtonStyle.Danger)
            );
        
        return {
            embeds: [embed],
            components: [row]
        };
    }

    /**
     * 간단한 응답 생성 (빠른 응답용)
     */
    quickReply(message, type = 'info') {
        const colors = {
            info: 0x0099ff,
            success: 0x00ff00,
            warning: 0xffff00,
            error: 0xff0000
        };
        
        const embed = new EmbedBuilder()
            .setColor(colors[type] || colors.info)
            .setDescription(message);
        
        return { embeds: [embed] };
    }
    
    /**
     * 페이지네이션 버튼 생성 (v3 스타일 복원)
     */
    createPaginationButtons(state) {
        const currentPage = state.ui?.currentPage || 0;
        const totalItems = state.queue.length;
        const pageSize = 15;
        const maxPage = Math.ceil(totalItems / pageSize) - 1;
        
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
        
        return row;
    }
    
    /**
     * 소스 전환 버튼 생성 (v3 스타일 복원)
     */
    createSourceButtons(state) {
        const { queue } = state;
        const isLocal = queue.source === 'local';
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "Local"))
                    .setEmoji(this.emojis.source[queue.source])
                    .setStyle(isLocal ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setLabel(isLocal ? "Local Files" : "YouTube")
            );
        
        return row;
    }
    
    /**
     * 다음 트랙 가져오기
     */
    getNextTrack(state) {
        const nextIndex = this.player.queue.getNextIndex(state.currentIndex, state.mode);
        if (nextIndex >= 0) {
            return this.player.queue.getTrack(nextIndex);
        }
        return null;
    }
    
    /**
     * 다음 곡 텍스트 생성 (v3 스타일)
     */
    getNextTrackText(nextTrack, mode) {
        if (nextTrack) {
            return nextTrack.title;
        }
        
        if (mode === 'shuffle') {
            return '🔀 셔플 대기중...';
        }
        
        return 'N/A';
    }
    
    /**
     * 재생 상태 텍스트 (v3 스타일)
     */
    getPlaybackStatusText(state) {
        if (state.isPlaying && !state.isPaused) {
            return '🎵 재생 중';
        } else if (state.isPaused) {
            return '⏸️ 일시정지';
        } else {
            return '💤 대기 중';
        }
    }
    
    /**
     * 푸터 텍스트 생성 (v3 스타일)
     */
    getFooterText(state) {
        const { queue } = state;
        const sortText = queue.sortType === 'abc' ? '가나다' : '날짜';
        const sourceText = queue.source === 'local' ? '로컬 파일' : 'YouTube';
        
        return `정렬: ${sortText} | 목록: ${sourceText} | ${queue.length}곡`;
    }
}

module.exports = UIManagerV4;