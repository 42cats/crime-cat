import React from "react";
import { Video } from "lucide-react";

/**
 * URL에서 동영상 ID와 플랫폼 정보를 추출하는 함수
 */
export const extractVideoId = (url: string) => {
  // YouTube URL 패턴
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  if (youtubeMatch) {
    return {
      platform: "youtube",
      id: youtubeMatch[1],
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
    };
  }

  // Vimeo URL 패턴
  const vimeoMatch = url.match(/(?:vimeo\.com\/)([0-9]+)/);
  if (vimeoMatch) {
    return {
      platform: "vimeo",
      id: vimeoMatch[1],
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }

  // Direct MP4 URL 패턴 (미스터리플레이스, 로컬호스트 등)
  const mp4Match = url.match(/^(https?:\/\/[^\/]+\/.*\.mp4)$/);
  if (mp4Match) {
    return {
      platform: "direct",
      id: mp4Match[1],
      embedUrl: mp4Match[1],
    };
  }

  return null;
};

/**
 * Markdown 에디터용 동영상 삽입 명령어
 */
export const videoCommand = {
  name: "video",
  keyCommand: "video",
  buttonProps: { "aria-label": "Insert video", title: "동영상 삽입" },
  icon: <Video size={16} />,
  execute: (state: any, api: any) => {
    const url = prompt("YouTube 또는 Vimeo URL을 입력하세요:");
    if (url) {
      const videoInfo = extractVideoId(url.trim());
      if (videoInfo) {
        // 다이렉트 MP4 파일인 경우 video 태그 사용
        if (videoInfo.platform === "direct") {
          const video = `<video 
width="560" 
height="315" 
src="${videoInfo.embedUrl}" 
controls 
preload="metadata">
</video>`;
          api.replaceSelection(video);
        } else {
          // YouTube, Vimeo 등은 iframe 사용
          const iframe = `<iframe 
width="560" 
height="315" 
src="${videoInfo.embedUrl}" 
frameborder="0" 
allowfullscreen
sandbox="allow-scripts allow-same-origin allow-presentation">
</iframe>`;
          api.replaceSelection(iframe);
        }
      } else {
        alert("올바른 YouTube 또는 Vimeo URL을 입력해주세요.");
      }
    }
  },
};