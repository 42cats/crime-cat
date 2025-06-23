interface LocalMusicFile {
    id: string;
    title: string;
    filename: string;
    filePath: string;
    size: number;
    duration: string;
    extension: string;
}

interface YouTubeTrack {
    id: string;
    title: string;
    youtubeUrl: string;
    thumbnail: string;
    duration: string;
    createdAt: string;
}

class MusicApi {
    private async request<T>(url: string): Promise<T[]> {
        try {
            console.log(`Music API 요청: ${url}`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log(`Music API 응답:`, data);
            
            // 응답이 배열인 경우 직접 반환, 객체인 경우 data 속성 확인
            if (Array.isArray(data)) {
                return data;
            } else if (data.data && Array.isArray(data.data)) {
                return data.data;
            } else {
                console.warn('예상치 못한 API 응답 형식:', data);
                return [];
            }
        } catch (error) {
            console.error('Music API 요청 실패:', error);
            return [];
        }
    }

    async getLocalFiles(guildId: string, userId: string): Promise<LocalMusicFile[]> {
        const url = `/api/web/v1/music/${guildId}/local-files?userId=${userId}`;
        return this.request<LocalMusicFile>(url);
    }
    
    async getYouTubeTracks(guildId: string): Promise<YouTubeTrack[]> {
        const url = `/api/web/v1/music/${guildId}/youtube-tracks`;
        return this.request<YouTubeTrack>(url);
    }
}

export const musicApi = new MusicApi();
export type { LocalMusicFile, YouTubeTrack };