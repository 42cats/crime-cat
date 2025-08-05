import React from "react";
import { Volume2 } from "lucide-react";

/**
 * URL에서 오디오 정보를 추출하는 함수
 */
export const extractAudioInfo = (url: string) => {
  // SoundCloud URL 패턴
  const soundcloudMatch = url.match(
    /^https?:\/\/(?:www\.)?soundcloud\.com\/([^\/]+)\/([^\/\?]+)/
  );
  if (soundcloudMatch) {
    return {
      platform: "soundcloud",
      id: url,
      embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`,
    };
  }

  // 직접 오디오 파일 URL 패턴 (MP3, WAV, OGG, M4A, AAC)
  const audioMatch = url.match(/^(https?:\/\/[^\/]+\/.*\.(mp3|wav|ogg|m4a|aac))(\?.*)?$/i);
  if (audioMatch) {
    return {
      platform: "direct",
      id: audioMatch[1],
      embedUrl: audioMatch[1],
      format: audioMatch[2].toLowerCase(),
    };
  }

  return null;
};

/**
 * Markdown 에디터용 오디오 삽입 명령어
 */
export const audioCommand = {
  name: "audio",
  keyCommand: "audio",
  buttonProps: { "aria-label": "Insert audio", title: "오디오 삽입" },
  icon: <Volume2 size={16} />,
  execute: (state: any, api: any) => {
    const url = prompt("오디오 URL을 입력하세요 (MP3, WAV, OGG, SoundCloud):");
    if (url) {
      const audioInfo = extractAudioInfo(url.trim());
      if (audioInfo) {
        if (audioInfo.platform === "direct") {
          // 직접 오디오 파일인 경우 audio 태그 사용
          const audio = `<audio 
controls 
preload="metadata"
style="width: 100%; max-width: 500px;"
src="${audioInfo.embedUrl}">
</audio>`;
          api.replaceSelection(audio);
        } else if (audioInfo.platform === "soundcloud") {
          // SoundCloud embed iframe 사용
          const iframe = `<iframe 
width="100%" 
height="166" 
scrolling="no" 
frameborder="no" 
allow="autoplay"
src="${audioInfo.embedUrl}">
</iframe>`;
          api.replaceSelection(iframe);
        }
      } else {
        alert("올바른 오디오 URL을 입력해주세요.\n지원 형식: MP3, WAV, OGG, M4A, AAC, SoundCloud");
      }
    }
  },
};