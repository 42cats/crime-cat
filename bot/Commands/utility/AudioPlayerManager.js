// AudioPlayerManager.js
const { spawn } = require("child_process");
const {
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  StreamType,
} = require("@discordjs/voice");

const fs = require("fs");
const { isPermissionHas } = require("../api/user/permission");

class AudioPlayerManager {
  constructor(parent) {
    this.parent = parent;
    this.guildId = this.parent.guildId;

    this.connection = null;
    this.player = createAudioPlayer();

    // yt-dlp 프로세스 참조
    this.process = null;
    // 기본 볼륨
    this.volume = 0.5;
    // 인터랙션 메시지
    this.interactionMsg = null;

    // 볼륨 조절 핸들러 및 페이드 인터벌
    this._volumeControl = null;
    this._fadeInInterval = null;
    this._fadeOutInterval = null;

    this.player.on("error", (err) => {
      console.error("AudioPlayer error event:", err);
    });
    this.player.on("stateChange", (oldState, newState) => {
      console.log(
        `AudioPlayer stateChange: ${oldState.status} -> ${newState.status}`
      );
    });
  }

  async join(operator) {
    if (
      !this.connection ||
      this.connection.state.status === VoiceConnectionStatus.Disconnected
    ) {
      const voiceChannel = operator.voice.channel;
      if (!voiceChannel) throw new Error("음성채널에 접속해 있지 않음!");

      this.connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      });

      this.connection.on("stateChange", (oldStatus, newStatus) => {
        console.log(
          `VoiceConnection: ${oldStatus.status} -> ${newStatus.status}`
        );
        if (
          oldStatus.status === VoiceConnectionStatus.Ready &&
          newStatus.status === VoiceConnectionStatus.Connecting
        ) {
          this.connection.configureNetworking();
        }
      });
      this.connection.on("error", console.error);
      this.connection.on(VoiceConnectionStatus.Ready, () => {
        console.log("VoiceConnection: Ready for sending audio!");
      });
      this.connection.on(VoiceConnectionStatus.Disconnected, () => {
        console.log("VoiceConnection: Disconnected!");
      });
    }
  }

  isInVoiceChannel() {
    return !!getVoiceConnection(this.guildId);
  }

  async play(track, onStateChange) {
    if (!track) throw new Error("No track information provided!");

    if (this.process && !this.process.killed) {
      this.process.kill("SIGKILL");
      this.process = null;
    }

    this.player.removeAllListeners("stateChange");
    this.player.track = track;

    let resource;
    if (fs.existsSync(track.url)) {
      resource = createAudioResource(track.url, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true,
      });
    } else {
      this.process = spawn("yt-dlp", [
        "-f",
        "bestaudio",
        "-o",
        "-",
        "--audio-format",
        "opus",
        "--audio-quality",
        "5",
        track.url,
      ]);

      this.process.on("error", (error) => {
        console.error("yt-dlp process spawn error:", error);
      });
      this.process.stderr.on("data", (data) => {
        const msg = data.toString();
        console.error(`yt-dlp stderr: ${msg}`);
        if (msg.includes("Requested format is not available")) {
          this.parent.interactionMsg.channel.send(
            `Format error: The requested format is not supported.\nRegular users can only play YouTube videos with a bitrate of 128 or lower.\n${track.title}\nThis video does not have a suitable bitrate.\nYour permission level is ${this.parent.operatorGrade}.`
          );
        }
      });

      resource = createAudioResource(this.process.stdout, { inlineVolume: true });
    }

    // 볼륨 컨트롤러 저장 및 초기 볼륨 설정
    this._volumeControl = resource.volume;
    this._volumeControl.setVolume(this.volume);

    this.player.play(resource);
    if (this.connection) this.connection.subscribe(this.player);

    this._startFadeIn(this.volume, 3000, 0.05);

    this.player.on("stateChange", async (oldState, newState) => {
      if (
        newState.status === AudioPlayerStatus.Idle ||
        newState.status === AudioPlayerStatus.Playing
      ) {
        if (newState.status === AudioPlayerStatus.Idle) {
          this.player.removeAllListeners("stateChange");
        }
        if (onStateChange) await onStateChange(newState.status);
      }
    });
  }

  _startFadeIn(targetVolume = 0.5, duration = 3000, step = 0.05) {
    if (!this._volumeControl) return;
    let current = 0;
    this._volumeControl.setVolume(current);

    if (this._fadeInInterval) clearInterval(this._fadeInInterval);
    const intervalTime = (duration * step) / targetVolume;
    this._fadeInInterval = setInterval(() => {
      current = Math.min(current + step, targetVolume);
      this._volumeControl.setVolume(current);
      if (current >= targetVolume) clearInterval(this._fadeInInterval);
    }, intervalTime);
  }

  async pause() {
    if (this.player.state.status === AudioPlayerStatus.Playing) {
      await this._startFadeOut(1500, 0.05);
      this.player.pause();
    }
  }

  resume() {
    if (this.player.state.status === AudioPlayerStatus.Paused) {
      this.player.unpause();
    }
  }

  async stop() {
    const status = this.player.state.status;
    if (
      status === AudioPlayerStatus.Playing ||
      status === AudioPlayerStatus.Paused
    ) {
      await this._startFadeOut(1500, 0.05);
      this.player.stop();
      if (this._fadeInInterval) clearInterval(this._fadeInInterval);
    }
  }

  _startFadeOut(duration = 2000, step = 0.05) {
    return new Promise((resolve) => {
      if (!this._volumeControl) return resolve();
      let current = this.volume;
      if (this._fadeOutInterval) clearInterval(this._fadeOutInterval);
      const intervalTime = (duration * step) / current;
      this._fadeOutInterval = setInterval(() => {
        current = Math.max(current - step, 0);
        this._volumeControl.setVolume(current);
        if (current <= 0) {
          clearInterval(this._fadeOutInterval);
          // 페이드아웃 완료 시 원래 볼륨 복원
          this._volumeControl.setVolume(this.volume);
          resolve();
        }
      }, intervalTime);
    });
  }


  async setVolume(volume) {
    this.volume = Math.min(Math.max(volume, 0), 100);
    if (this._volumeControl) this._volumeControl.setVolume(this.volume);
    const components = await this.parent.reply();
    await this.parent.interactionMsg.edit(components);
  }

  volumeUp() {
    const newVol = Math.min(1, Math.round((this.volume + 0.1) * 10) / 10);
    this.setVolume(newVol);
  }

  volumeDown() {
    const newVol = Math.max(0, Math.round((this.volume - 0.1) * 10) / 10);
    this.setVolume(newVol);
  }

  destroy() {
    if (this._fadeInInterval) clearInterval(this._fadeInInterval);
    if (this._fadeOutInterval) clearInterval(this._fadeOutInterval);

    try {
      if (this.player) {
        this.player.stop();
        console.log("AudioPlayer stop 완료.");
        this.player.removeAllListeners();
      }
      if (this.connection) {
        this.connection.destroy();
        console.log("VoiceConnection 해제 완료.");
        this.connection = null;
      }
      console.log("AudioPlayerManager 리소스 정리 완료.");
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }
}

module.exports = { AudioPlayerManager };
