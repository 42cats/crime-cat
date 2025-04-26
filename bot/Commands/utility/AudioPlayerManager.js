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
const path = require("path");
const { isPermissionHas } = require("../api/user/permission");

class AudioPlayerManager {
  constructor(parent) {
    this.parent = parent;
    this.guildId = this.parent.guildId;

    this.connection = null;
    this.player = createAudioPlayer();

    // yt-dlp 프로세스 저장
    this.process = null;
    // 기본 볼륨
    this.volume = 0.5;

    // 인터랙션 메시지 (Discord 메시지 업데이트용)
    this.interactionMsg = null;

    // 플레이어 상태 이벤트 리스너 등록
    this.player.on("error", (err) => {
      console.error("AudioPlayer error event:", err);
    });
    this.player.on("stateChange", (oldState, newState) => {
      console.log(
        `AudioPlayer stateChange: ${oldState.status} -> ${newState.status}`
      );
    });
  }

  // 음성 채널 연결
  async join(operator) {
    console.log("조인1");
    console.log(
      this.connection?.state.status === VoiceConnectionStatus.Disconnected
    );
    if (
      !this.connection ||
      this.connection?.state.status === VoiceConnectionStatus.Disconnected
    ) {
      console.log("조인2");
      const voiceChannel = operator.voice.channel;
      if (!voiceChannel) throw new Error("음성채널에 접속해 있지 않음!");

      this.connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      });

      this.connection.on("stateChange", (oldState, newState) => {
        console.log(
          `VoiceConnection: ${oldState.status} -> ${newState.status}`
        );
        if (
          oldState.status === VoiceConnectionStatus.Ready &&
          newState.status === VoiceConnectionStatus.Connecting
        ) {
          this.connection.configureNetworking();
        }
      });
      this.connection.on("error", (e) => console.log(e));
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

  /**
   * 실제 재생 함수
   * @param {*} track - 재생할 곡 정보
   * @param {*} onStateChange - 재생 상태 변경 시 콜백 함수
   */
  async play(track, onStateChange) {
    if (!track) {
      throw Error("No track information provided!");
    }

    // Terminate previous process if exists
    if (this.process && !this.process.killed) {
      this.process.kill("SIGKILL");
      this.process = null;
    }

    this.player.removeAllListeners("stateChange");
    this.player.track = track;

    let resource = null;

    // Check if the track URL is a local file path
    if (fs.existsSync(track.url)) {
      // Create audio resource from local file
      resource = createAudioResource(track.url, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true,
      });
      resource.volume.setVolume(this.volume);
    } else {
      // Assume the track URL is a YouTube URL and use yt-dlp
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
        const errorMessage = data.toString();
        console.error(`yt-dlp stderr: ${errorMessage}`);
        if (errorMessage.includes("Requested format is not available")) {
          this.parent.interactionMsg.channel.send(
            `Format error: The requested format is not supported.\nRegular users can only play YouTube videos with a bitrate of 128 or lower.\n${track.title}\nThis video does not have a suitable bitrate.\nYour permission level is ${this.parent.operatorGrade}.`
          );
        }
      });

      try {
        resource = createAudioResource(this.process.stdout, {
          inlineVolume: true,
        });
        if (!resource) {
          throw new Error("Failed to create audio resource.");
        }
        resource.volume.setVolume(this.volume);
      } catch (error) {
        console.error("Audio resource creation failed:", error);
        return;
      }
    }

    this.player.on("stateChange", async (oldState, newState) => {
      if (
        newState.status === AudioPlayerStatus.Idle ||
        newState.status === AudioPlayerStatus.Playing
      ) {
        if (newState.status === AudioPlayerStatus.Idle)
          this.player.removeAllListeners();
        if (onStateChange) {
          await onStateChange(newState.status);
        }
      }
    });

    this.player.play(resource);

    if (this.connection) {
      this.connection.subscribe(this.player);
    }
    this.fadeIn(this.volume, 2000, 0.05); // 2초 동안 0.05씩 증가
  }
  async pause() {
    if (this.player?.state?.status === AudioPlayerStatus.Playing) {
      console.log("Pausing the track");
      await this.fadeOut(1500, 0.05); // 1.5초 동안 점점 줄이기
      this.player.pause();
    }
  }

  resume() {
    if (this.player?.state?.status === AudioPlayerStatus.Paused) {
      console.log("Resuming the track");
      this.player.unpause();
    }
  }

  async stop() {
    if (
      this.player?.state?.status === AudioPlayerStatus.Playing ||
      this.player?.state?.status === AudioPlayerStatus.Paused
    ) {
      console.log("Stopping the track");
      await this.fadeOut(1500, 0.05);
      this.player.stop();
    }
  }

  async setVolume(volume) {
    if (volume < 0) {
      volume = 0;
    } else if (volume > 100) {
      volume = 100;
    }
    this.volume = volume;
    if (this.player?.state?.resource?.volume) {
      this.player.state.resource.volume.setVolume(volume);
    }
    const components = await this.parent?.reply();
    await this.parent?.interactionMsg.edit(components);
  }
  volumeUp() {
    if (this.volume < 1) {
      // 현재 볼륨에 0.1을 더한 값이 1을 넘지 않도록 하고, 소수점 한 자리까지 반올림
      const newVolume = Math.min(1, Math.round((this.volume + 0.1) * 10) / 10);
      this.setVolume(newVolume);
    }
  }

  volumeDown() {
    if (this.volume > 0) {
      // 현재 볼륨에서 0.1을 뺀 값이 0 미만이 되지 않도록 하고, 소수점 한 자리까지 반올림
      const newVolume = Math.max(0, Math.round((this.volume - 0.1) * 10) / 10);
      this.setVolume(newVolume);
    }
  }

  // 점점 볼륨을 키우는 페이드인
  fadeIn(targetVolume = 0.5, duration = 2000, step = 0.05) {
    let currentVolume = 0;
    this.player.state.resource.volume.setVolume(currentVolume);
    const intervalTime = duration * step / targetVolume;
    const interval = setInterval(() => {
      currentVolume = Math.min(currentVolume + step, targetVolume);
      this.player.state.resource.volume.setVolume(currentVolume);
      if (currentVolume >= targetVolume) {
        clearInterval(interval);
      }
    }, intervalTime);
  }

  // 점점 볼륨을 줄이는 페이드아웃
  fadeOut(duration = 2000, step = 0.05) {
    return new Promise((resolve) => {
      let currentVolume = this.volume;
      const intervalTime = duration * step / currentVolume;
      const interval = setInterval(() => {
        currentVolume = Math.max(currentVolume - step, 0);
        if (this.player?.state?.resource?.volume) {
          this.player.state.resource.volume.setVolume(currentVolume);
        }
        if (currentVolume <= 0) {
          clearInterval(interval);
          resolve(); // 볼륨 0 되면 완료
        }
      }, intervalTime);
    });
  }


  destroy() {
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
      console.error("Error during resource cleanup:", error);
    }
  }
}

module.exports = {
  AudioPlayerManager,
};
