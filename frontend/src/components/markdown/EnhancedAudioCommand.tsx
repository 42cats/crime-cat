import React, { useState, useEffect } from "react";
import { Link, Upload } from "lucide-react"; // Using Link and Upload icons
import AudioUploadModal from "./AudioUploadModal";
import { extractAudioInfo } from "./AudioCommand";
import { apiClient } from "@/lib/api";

/**
 * 오디오 업로드 API 호출
 */
const uploadAudioFile = async (file: File, title: string, accessPolicy: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('audioTitle', title);
  formData.append('accessPolicy', accessPolicy);

  return await apiClient.post('/board/audio/temp-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * URL로 오디오를 삽입하는 명령어
 */
export const createUrlAudioCommand = () => {
  return {
    name: "audio-url",
    keyCommand: "audio-url",
    buttonProps: { "aria-label": "Insert audio from URL", title: "URL로 오디오 삽입" },
    icon: <Link size={16} />,
    execute: (state: any, api: any) => {
      const url = prompt("오디오 URL을 입력하세요 (MP3, WAV, OGG, SoundCloud):");
      if (url) {
        const audioInfo = extractAudioInfo(url.trim());
        if (audioInfo) {
          if (audioInfo.platform === "direct") {
            const audio = `<audio 
controls 
preload="metadata"
style="width: 100%; max-width: 500px;"
src="${audioInfo.embedUrl}">
</audio>`;
            api.replaceSelection(audio);
          } else if (audioInfo.platform === "soundcloud") {
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
};

/**
 * 파일을 직접 업로드하여 오디오를 삽입하는 명령어
 */
export const createDirectUploadAudioCommand = (userRole: 'USER' | 'MANAGER' | 'ADMIN' = 'USER') => {
  return {
    name: "audio-upload",
    keyCommand: "audio-upload",
    buttonProps: { "aria-label": "Upload audio file", title: "오디오 파일 업로드" },
    icon: <Upload size={16} />,
    execute: (state: any, api: any) => {
      const uploadEvent = new CustomEvent('openAudioUpload', {
        detail: { api, userRole }
      });
      window.dispatchEvent(uploadEvent);
    },
  };
};


/**
 * 오디오 업로드 모달을 관리하는 컴포넌트
 */
export const AudioUploadManager: React.FC<{ userRole: 'USER' | 'MANAGER' | 'ADMIN' }> = ({ userRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentApi, setCurrentApi] = useState<any>(null);

  useEffect(() => {
    const handleUploadEvent = (event: CustomEvent) => {
      setCurrentApi(event.detail.api);
      setIsModalOpen(true);
    };

    window.addEventListener('openAudioUpload', handleUploadEvent as EventListener);

    return () => {
      window.removeEventListener('openAudioUpload', handleUploadEvent as EventListener);
    };
  }, []);

  const handleUpload = async (file: File, title: string, accessPolicy: 'PUBLIC' | 'PRIVATE') => {
    try {
      const response = await uploadAudioFile(file, title, accessPolicy);
      
      const audioElement = `<audio 
controls 
preload="metadata"
style="width: 100%; max-width: 500px;"
data-temp-id="${response.tempId}"
data-title="${response.audioTitle || title}"
src="/api/v1/board/audio/stream/${response.tempId}">
${response.audioTitle || title}
</audio>`;
      
      if (currentApi) {
        currentApi.replaceSelection(audioElement);
      }

      // Notify the parent component about the new tempId
      const event = new CustomEvent('audioUploaded', { detail: { tempId: response.tempId } });
      window.dispatchEvent(event);
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  return (
    <AudioUploadModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onUpload={handleUpload}
      userRole={userRole}
    />
  );
};
