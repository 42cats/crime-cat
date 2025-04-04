// GuildURLManager.js
const {
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder,
} = require('discord.js');
const {
    PlaylistManager,
    REPEATONE,
    NOMAL,
    ONCE,
    SHUFFLE,
    ABC,
    DATE
} = require('./PlaylistManager');
const {
    AudioPlayerStatus,
    VoiceConnectionStatus,
} = require('@discordjs/voice');

const { AudioPlayerManager } = require('./AudioPlayerManager');
const Debounce = require('./Debounce');
const { encodeToString } = require('./delimiterGeter');
const { isPermissionHas } = require('../api/user/permission');

class GuildURLManager {
    constructor(guildId, client,user) {
        if (!guildId) {
            throw new Error('guildId가 필요합니다.');
        }

        // youTubeEmoji
        this.youtubeEmoji = client.emojis.cache.get('1336990634573172747') || "🌐";
        this.guildId = guildId;
        // 디바운서 구현
        this.isOk = true;

        //Stop flag
        this.stopped = false;

        //Local flag
        this.local = false;

        // PlaylistManager와 AudioPlayerManager 인스턴스 생성
        this.playlistManager = new PlaylistManager(this);
        this.audioPlayerManager = new AudioPlayerManager(this);
        this.interactionMsg = null;
        // 명령 수행자
        this.operater = user;
        // UI 버튼 관리 (기존 버튼들은 buttonName 접두사를 사용)
        this.buttons = [];
        this.embed = null;
        this.buttonName = "_musicPlayerButton:";

        // 기본 버튼 세팅 (두 개의 ActionRow)
        this.buttons = [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "volumeUp"))
                        .setEmoji("🔊")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "prev"))
                        .setEmoji('⏮️')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "playpause"))
                        .setEmoji('⏯️')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "playstop"))
                        .setEmoji('⏹️')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "next"))
                        .setEmoji('⏭️')
                        .setStyle(ButtonStyle.Primary)
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "volumeDown"))
                        .setEmoji("🔉")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "sort"))
                        .setEmoji(this.playlistManager.getEmoji(this.playlistManager.sort))
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "mode"))
                        .setEmoji(this.playlistManager.getEmoji(this.playlistManager.playMode))
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "onOff"))
                        .setEmoji("✅")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "exit"))
                        .setEmoji("❌")
                        .setStyle(ButtonStyle.Danger)
                )
        ];
        this.playlistManager.refresh();
    }

    // 볼륨 버튼 활성/비활성 업데이트
    updateVolumeButton() {
        this.buttons[1].components.forEach(v => {
            if (v.data.custom_id === encodeToString(this.guildId, "musicPlayerButton", "volumeUp")) {
                v.setDisabled(this.audioPlayerManager.volume >= 1);
            }
            if (v.data.custom_id === encodeToString(this.guildId, "musicPlayerButton", "volumeDown")) {
                v.setDisabled(this.audioPlayerManager.volume <= 0);
            }
        });
    }

    // DB에서 플레이리스트 새로고침
    async refreshPlaylist() {
        await this.playlistManager.refresh();
    }

    // 음성 채널 접속
    async join() {
        if (!this.audioPlayerManager.isInVoiceChannel()) {
            await this.audioPlayerManager.join(this.operater);
        }
    }

    // 실제 재생 로직
    async play(index, isSelect = false) {
        try {
            if (!this.audioPlayerManager.isInVoiceChannel()) {
                await this.audioPlayerManager.join(this.operater);
            }
            if (this.playlistManager.playlist.length === 0) {
                throw new Error("재생목록이 없습니다!");
            }
            const track = this.playlistManager.getByIndex(index);
            if (isSelect) this.playlistManager.currentIndex = index;
            // 재생
            await this.audioPlayerManager.play(track, async (newState) => {
                if (newState === AudioPlayerStatus.Playing || newState === AudioPlayerStatus.Idle) {
                    if (this.interactionMsg) {
                        const componentData = await this.reply();
                        await this.interactionMsg.edit(componentData);
                    }
                }
                if (this.stopped) {
                    this.stopped = false;
                    return;
                }
                if (this.playlistManager.playMode !== ONCE && newState === AudioPlayerStatus.Idle) {
                    await this.playlistManager.next(this.play.bind(this));
                }
            });
            if (this.interactionMsg) {
                const componentData = await this.reply();
                this.interactionMsg.edit(componentData);
            }
        } catch (e) {
            throw e;
        }
    }

    pause() {
        this.audioPlayerManager.pause();
    }

    resume() {
        this.audioPlayerManager.resume();
    }

    volumeUp() {
        this.audioPlayerManager.volumeUp();
        this.updateVolumeButton();
    }

    volumeDown() {
        this.audioPlayerManager.volumeDown();
        this.updateVolumeButton();
    }

    // 재생 모드 변경
    setPlayMode() {
        this.playlistManager.setPlayMode();
        const targetCustomId = encodeToString(this.guildId, "musicPlayerButton", "mode");
        this.buttons[0].components.map(v => {
            if (v.data.custom_id === targetCustomId) {
                v.setEmoji(this.playlistManager.getEmoji(this.playlistManager.playMode));
            }
        });
    }

    stop() {
        if (this.audioPlayerManager.player.state.status === AudioPlayerStatus.Playing ||
            this.audioPlayerManager.player.state.status === AudioPlayerStatus.Buffering ||
            this.audioPlayerManager.player.state.status === AudioPlayerStatus.Paused) {
            this.stopped = true;
            this.audioPlayerManager.stop();
        }
    }

    onOff() {
        if (this.audioPlayerManager.connection) {
            if (this.audioPlayerManager.connection.state.status !== VoiceConnectionStatus.Disconnected) {
                this.audioPlayerManager.connection.disconnect();
                this.audioPlayerManager.connection = null;
            }
        } else if (!this.audioPlayerManager.connection) {
            if (this.operater) this.audioPlayerManager.join(this.operater);
        }
        const target = encodeToString(this.guildId, "musicPlayerButton", "onOff");
        this.buttons[1].components.map(v => {
            if (v.data.custom_id === target) {
                v.setEmoji(this.audioPlayerManager.connection ? "✅" : "☑");
            }
        });
    }

    // 정렬
    sortList() {
        this.playlistManager.sortList();
        const targetCustomId = encodeToString(this.guildId, "musicPlayerButton", "sort");
        this.buttons[1].components.map(v => {
            if (v.data.custom_id === targetCustomId) {
                v.setEmoji(this.playlistManager.getEmoji(this.playlistManager.sort));
            }
        });
    }

    // 이전/다음 곡 이동
    async next() {
        await this.playlistManager.next(this.play.bind(this));
        if (this.interactionMsg) {
            this.interactionMsg.edit(await this.reply());
        }
    }

    async prev() {
        await this.playlistManager.prev(this.play.bind(this));
        if (this.interactionMsg) {
            this.interactionMsg.edit(await this.reply());
        }
    }

    // 페이지 이동 (내부 로직은 PlaylistManager에서 처리)
    nextPage() {
        this.playlistManager.nextPage();
    }

    prevPage() {
        this.playlistManager.prevPage();
    }

    // ★ 외부 페이지네이션 버튼 관련 메서드 ★  
    // 첫 페이지로 이동
    firstPage() {
        this.playlistManager.currentPage = 0;
    }
    togleLocal() {
        this.local = !this.local;
    }
    // 마지막 페이지로 이동
    lastPage() {
        this.playlistManager.currentPage = this.playlistManager.maxPage;
    }
    async getPermissionButton() {
        console.log("operaters = ", this.operater?.user?.id);
        const check = await isPermissionHas(this.operater?.user?.id, "LOCAL_MUSIC");
        if (!check) return [];
        const primeumRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "musicPlayerButton", "Local"))
                    .setEmoji(this.local ? this.youtubeEmoji : "📁")
                    .setStyle(ButtonStyle.Success)
            )
        return [primeumRow];

    }
    // 외부 페이지네이션 버튼 생성 (<<, <, 페이지 번호, >, >>)  
    // 커스텀 아이디는 단순 형식으로 작성되어, delimiterGeter로 파싱되지 않습니다.
    getPaginationButtons() {
        if (this.playlistManager.playlist.length < 16) {
            return [];
        }
        const currentPage = this.playlistManager.currentPage;
        const maxPage = this.playlistManager.maxPage;
        const paginationRow = new ActionRowBuilder()
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
                    .setDisabled(currentPage === maxPage),
                new ButtonBuilder()
                    .setCustomId(encodeToString(this.guildId, "pageNation", "pageLast"))
                    .setLabel(">>")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === maxPage)
            );
        return [paginationRow];
    }

    // 임베드 생성
    embedmaker() {
        const currentData = this.playlistManager.getCurrent();
        let nextSongTitle = 'N/A';
        const nextData = this.playlistManager.nextInfo();
        if (nextData) {
            nextSongTitle = nextData.title;
        }
        this.embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`🎵 : ${currentData?.title || 'N/A'}`)
            .addFields(
                { name: "title :", value: `${currentData?.title || "N/A"}`, inline: true },
                { name: "재생 시간 :", value: `${currentData?.duration || "N/A"}`, inline: true },
                { name: "다음곡 :", value: `${nextSongTitle}`, inline: true },
                { name: "볼륨 :", value: `${this.audioPlayerManager.volume * 100}%`, inline: true },
                { name: "재생모드 :", value: `${this.playlistManager.getTpyePlay()}`, inline: true },
                { name: "버전 :", value: `v0.01`, inline: true }
            )
            .setFooter({ text: `정렬 : ${this.playlistManager.sort === ABC ? "가나다" : "날짜"}                                        목록 : ${this.local ? "파일" : " 유튜브"}` })
            .setThumbnail(currentData?.thumbnail || 'https://imgur.com/jCVVLrp.png');
        return this.embed;
    }

    // Select Menu 등 UI 컴포넌트 구성  
    // → 페이지 관련 옵션은 제거하고, 현재 페이지의 곡 목록만 표시
    async requestComponent() {
        const currentPageItems = this.playlistManager.getCurrentPage();
        const originalList = this.playlistManager.playlist;
        const menuMsg = (this.audioPlayerManager.player.state.status === AudioPlayerStatus.Playing)
            ? `🎵 Now Playing: ${this.playlistManager.getCurrent()?.title}`
            : "재생할곡을 선택해 주세요.";
        const valuestr = this.guildId + "_playListUrl:";
        let options = [];
        if (currentPageItems.length > 0) {
            options = currentPageItems.map((item) => {
                const originalIndex = originalList.findIndex(o => o.url === item.url); // 또는 id 기준
                return {
                    label: `${item.title.slice(0, 15)} ${item.duration}`,
                    value: encodeToString(this.guildId, "playListUrl", originalIndex), // 🔥 원본 인덱스
                };
            });
        } else {
            options.push({
                label: "현재 페이지에 표시할 곡이 없습니다.",
                value: encodeToString(this.guildId, "playListUrl", "none"),
            });
        }
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(encodeToString(this.guildId, "selectMenu"))
            .setPlaceholder(menuMsg)
            .addOptions(options);

        return new ActionRowBuilder().addComponents(selectMenu);
    }

    // 최종 메시지 구성
    async reply() {
        const componentData = await this.requestComponent();
        let extraComponents = [];
        if (this.playlistManager.playlist.length > 15) {
            extraComponents = this.getPaginationButtons();
        }
        const primeumRow = await this.getPermissionButton();
        return {
            embeds: [this.embedmaker()],
            components: [...this.buttons, componentData, ...extraComponents, ...primeumRow]
        };
    }

    // 모든 리소스 정리
    destroy() {
        this.audioPlayerManager.destroy();
        this.playlistManager.destroy();
        this.buttons = [];
        if (this.interactionMsg) {
            this.interactionMsg.delete();
            return true;
        }
        return false;
    }
}

module.exports = { GuildURLManager };
