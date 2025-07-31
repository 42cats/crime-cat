import { Channel, GroupData, ButtonData, ContentData } from "@/lib/types";
import { apiClient } from "@/lib/api";

const mockChannels: Channel[] = [{ id: "none", name: "현재채널" }];

// 채널 리스트 가져오기
export async function fetchChannels(guildId?: string): Promise<Channel[]> {
    try {
        console.log('🔍 채널 목록 요청:', { guildId, endpoint: `/auth/guilds/channels/${guildId}` });
        const endpoint = `/auth/guilds/channels/${guildId}`;
        const data = await apiClient.get<Channel[]>(endpoint);
        console.log('✅ 채널 목록 응답:', { count: data.length, channels: data });
        return [...mockChannels, ...data];
    } catch (error) {
        console.error("❌ 채널 목록 로드 실패:", { guildId, error, endpoint: `/auth/guilds/channels/${guildId}` });
        console.warn("📋 목 채널 사용:", mockChannels);
        return [...mockChannels];
    }
}

// 채널 단건 조회
export async function fetchChannelById(
    guildId: string,
    id: string
): Promise<string[]> {
    try {
        const data = await apiClient.get<{ id: string; name: string }>(
            `/channels/${id}`
        );
        return [data.name];
    } catch (error) {
        console.error("Error fetching channel by ID:", error);
        return [];
    }
}

/**
 * 특정 guild의 메시지 매크로 그룹 리스트를 가져옵니다.
 * GET /api/v1/messageMacros/{guildSnowflake}
 */
export async function fetchGroupsFromServer(
    guildId: string
): Promise<GroupData[]> {
    try {
        // apiClient.get<T> 은 바로 res.data 를 반환하도록 구현되어 있음
        const groups = await apiClient.get<GroupData[]>(
            `/messageMacros/${guildId}`
        );
        return groups;
    } catch (error) {
        console.error("Failed to fetch groups:", error);
        return [];
    }
}

/**
 * 특정 guild의 메시지 매크로 그룹 리스트를 동기화(저장)합니다.
 * POST /api/v1/messageMacros/{guildSnowflake}
 */
export async function saveData(
    guildId: string,
    groups: GroupData[]
): Promise<boolean> {
    try {
        // POST 요청은 Void 반환이므로 <void>
        await apiClient.post<void>(`/messageMacros/${guildId}`, groups);
        return true;
    } catch (error) {
        console.error("Error saving groups:", error);
        return false;
    }
}
