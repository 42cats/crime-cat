import React, { useState, useEffect } from "react";
import { Link, Upload } from "lucide-react"; // Using Link and Upload icons
import AudioUploadModal from "./AudioUploadModal";
import { apiClient } from "@/lib/api";

/**
 * URL에서 오디오 정보를 추출하는 함수 (EnhancedAudioCommand 전용)
 */
const extractAudioInfo = (url: string) => {
    // SoundCloud URL 패턴
    const soundcloudMatch = url.match(
        /^https?:\/\/(?:www\.)?soundcloud\.com\/([^\/]+)\/([^\/\?]+)/
    );
    if (soundcloudMatch) {
        return {
            platform: "soundcloud",
            id: url,
            embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(
                url
            )}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`,
        };
    }

    // 직접 오디오 파일 URL 패턴 (MP3, WAV, OGG, M4A, AAC)
    const audioMatch = url.match(
        /^(https?:\/\/[^\/]+\/.*\.(mp3|wav|ogg|m4a|aac))(\?.*)?$/i
    );
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
 * 오디오 업로드 API 호출
 */
const uploadAudioFile = async (file: File, accessPolicy: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("accessPolicy", accessPolicy);

    return await apiClient.post("/board/audio/temp-upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
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
        buttonProps: {
            "aria-label": "Insert audio from URL",
            title: "URL로 오디오 삽입",
        },
        icon: <Link size={16} />,
        execute: (state: any, api: any) => {
            const url = prompt(
                "오디오 URL을 입력하세요 (MP3, WAV, OGG, SoundCloud):"
            );
            if (url) {
                const audioInfo = extractAudioInfo(url.trim());
                if (audioInfo) {
                    if (audioInfo.platform === "direct") {
                        // 외부 직접 URL은 마크다운 문법으로 생성
                        const audioMarkdown = `[audio:${
                            url.split("/").pop() || "External Audio"
                        }](${audioInfo.embedUrl})`;
                        api.replaceSelection(audioMarkdown);
                    } else if (audioInfo.platform === "soundcloud") {
                        // SoundCloud는 iframe으로 유지 (embed 방식)
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
                    alert(
                        "올바른 오디오 URL을 입력해주세요.\n지원 형식: MP3, WAV, OGG, M4A, AAC, SoundCloud"
                    );
                }
            }
        },
    };
};

/**
 * 파일을 직접 업로드하여 오디오를 삽입하는 명령어
 */
export const createDirectUploadAudioCommand = (
    userRole: "USER" | "MANAGER" | "ADMIN" = "USER"
) => {
    return {
        name: "audio-upload",
        keyCommand: "audio-upload",
        buttonProps: {
            "aria-label": "Upload audio file",
            title: "오디오 파일 업로드",
        },
        icon: <Upload size={16} />,
        execute: (state: any, api: any) => {
            const uploadEvent = new CustomEvent("openAudioUpload", {
                detail: { api, userRole },
            });
            window.dispatchEvent(uploadEvent);
        },
    };
};

/**
 * 오디오 업로드 모달을 관리하는 컴포넌트
 */
export const AudioUploadManager: React.FC<{
    userRole: "USER" | "MANAGER" | "ADMIN";
}> = ({ userRole }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentApi, setCurrentApi] = useState<any>(null);

    useEffect(() => {
        const handleUploadEvent = (event: CustomEvent) => {
            setCurrentApi(event.detail.api);
            setIsModalOpen(true);
        };

        window.addEventListener(
            "openAudioUpload",
            handleUploadEvent as EventListener
        );

        return () => {
            window.removeEventListener(
                "openAudioUpload",
                handleUploadEvent as EventListener
            );
        };
    }, []);

    const handleUpload = async (
        file: File,
        accessPolicy: "PUBLIC" | "PRIVATE"
    ) => {
        try {
            const response = await uploadAudioFile(file, accessPolicy);

            // 새로운 마크다운 오디오 문법 사용
            const audioMarkdown = `[audio:${
                response.audioTitle || file.name
            }](/board/audio/stream/${response.tempId})`;

            if (currentApi) {
                currentApi.replaceSelection(audioMarkdown);
            }

            // Notify the parent component about the new tempId
            const event = new CustomEvent("audioUploaded", {
                detail: { tempId: response.tempId },
            });
            window.dispatchEvent(event);

            setIsModalOpen(false);
        } catch (error) {
            console.error("오디오 업로드 실패:", error);
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
