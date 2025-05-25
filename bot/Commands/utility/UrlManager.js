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
    constructor(guildId, client, user) {
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
        this.operator = user;
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
            await this.audioPlayerManager.join(this.operator);
        }
    }

    // 실제 재생 로직
    async play(index, isSelect = false) {
        try {
            if (!this.audioPlayerManager.isInVoiceChannel()) {
                await this.audioPlayerManager.join(this.operator);
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
                if (newState === AudioPlayerStatus.Idle) {
                    // 재생 모드에 따른 처리
                    if (this.playlistManager.playMode === REPEATONE) {
                        // 한곡 반복: 현재 인덱스 그대로 재생
                        await this.play(this.playlistManager.currentIndex);
                    } else if (this.playlistManager.playMode !== ONCE) {
                        // 순차 재생 또는 셔플: 다음 곡으로
                        await this.playlistManager.next(this.play.bind(this));
                    }
                    // ONCE 모드는 아무것도 하지 않음 (정지)
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

    async pause() {
        await this.audioPlayerManager.pause();
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

    async stop() {
        if (this.audioPlayerManager.player.state.status === AudioPlayerStatus.Playing ||
            this.audioPlayerManager.player.state.status === AudioPlayerStatus.Buffering ||
            this.audioPlayerManager.player.state.status === AudioPlayerStatus.Paused) {
            this.stopped = true;
            await this.audioPlayerManager.stop();
        }
    }

    onOff() {
        if (this.audioPlayerManager.connection) {
            if (this.audioPlayerManager.connection.state.status !== VoiceConnectionStatus.Disconnected) {
                this.audioPlayerManager.connection.disconnect();
                this.audioPlayerManager.connection = null;
            }
        } else if (!this.audioPlayerManager.connection) {
            if (this.operator) this.audioPlayerManager.join(this.operator);
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
        console.log("operators = ", this.operator?.user?.id);
        const check = await isPermissionHas(this.operator?.user?.id, "로컬음악");
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

    // 임베드 생성 (조건부 렌더링 최적화)
    embedmaker() {
        const currentData = this.playlistManager.getCurrent();
        const embedHash = `${currentData?.title}-${this.audioPlayerManager.volume}-${this.playlistManager.playMode}-${this.playlistManager.sort}`;

        // 변경사항이 없으면 기존 embed 반환
        if (this._lastEmbedHash === embedHash && this.embed) {
            return this.embed;
        }

        this._lastEmbedHash = embedHash;

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
        // 병렬 처리로 성능 개선
        const [componentData, extraComponents, primeumRow] = await Promise.all([
            this.requestComponent(),
            this.playlistManager.playlist.length > 15
                ? Promise.resolve(this.getPaginationButtons())
                : Promise.resolve([]),
            this.getPermissionButton()
        ]);

        return {
            embeds: [this.embedmaker()],
            components: [...this.buttons, componentData, ...extraComponents, ...primeumRow]
        };
    }

    // 모든 리소스 정리
    destroy() {
        // 관리자 정리
        this.audioPlayerManager.destroy();
        this.playlistManager.destroy();

        // UI 요소 정리
        this.buttons = [];
        this.embed = null;
        this._lastEmbedHash = null;

        // 메시지 삭제
        if (this.interactionMsg) {
            // 시스템 메시지 확인 추가
            if (this.interactionMsg.deletable && !this.interactionMsg.system) {
                this.interactionMsg.delete().catch(err => console.error('메시지 삭제 오류:', err));
            } else {
                console.log("시스템 메시지이거나 삭제할 수 없는 메시지입니다.");
            }
            this.interactionMsg = null;
        }

        // 참조 해제
        this.operator = null;
        this.youtubeEmoji = null;

        console.log('GuildURLManager 리소스 정리 완료.');
        return true;
    }
}

module.exports = { GuildURLManager };
