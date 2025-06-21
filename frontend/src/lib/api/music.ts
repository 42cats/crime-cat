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
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return data.data || [];
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