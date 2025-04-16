import axios from "axios";
import { Channel, GroupData, ButtonData, ContentData } from "@/lib/types";

const axiosInstance = axios.create({
    baseURL:
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1",
    timeout: 30000,
});

const mockChannels: Channel[] = [{ id: "", name: "채널없음" }];

// 채널 리스트 가져오기
export async function fetchChannels(guildId?: string): Promise<Channel[]> {
    try {
        const endpoint = guildId ? `/channels?guildId=${guildId}` : "/channels";
        const { data } = await axiosInstance.get<Channel[]>(endpoint);
        return [...mockChannels, ...data];
    } catch (error) {
        console.error("Error fetching channels:", error);
        return [...mockChannels];
    }
}

// 채널 단건 조회
export async function fetchChannelById(
    guildId: string,
    id: string
): Promise<string[]> {
    try {
        const { data } = await axiosInstance.get<{ id: string; name: string }>(
            `/channels/${id}`
        );
        return [data.name];
    } catch (error) {
        console.error("Error fetching channel by ID:", error);
        return [];
    }
}

// 그룹/버튼/콘텐츠 불러오기
export async function fetchGroupsFromServer(
    guildId: string
): Promise<GroupData[]> {
    try {
        const [groupsRes, buttonsRes, contentsRes] = await Promise.all([
            axiosInstance.get<GroupData[]>(`/groups?guildId=${guildId}`),
            axiosInstance.get<ButtonData[]>(`/buttons?guildId=${guildId}`),
            axiosInstance.get<ContentData[]>(`/contents?guildId=${guildId}`),
        ]);

        const groups = groupsRes.data;
        const buttons = buttonsRes.data;
        const contents = contentsRes.data;

        return groups
            .map((group) => {
                const groupButtons = buttons
                    .filter((button) => button.groupId === group.id)
                    .sort((a, b) => a.index - b.index);

                const buttonsWithContents = groupButtons.map((button) => {
                    const buttonContents = contents
                        .filter((content) => content.buttonId === button.id)
                        .sort((a, b) => a.index - b.index);
                    return { ...button, contents: buttonContents };
                });

                return { ...group, buttons: buttonsWithContents };
            })
            .sort((a, b) => a.index - b.index);
    } catch (error) {
        console.error("Failed to load data:", error);
        return [];
    }
}

// 저장
export async function saveData(
    guildId: string,
    groups: GroupData[]
): Promise<boolean> {
    try {
        for (const group of groups) {
            const groupWithGuild = { ...group, guildId };

            try {
                await axiosInstance.get(`/groups/${group.id}`);
                await axiosInstance.put(`/groups/${group.id}`, groupWithGuild);
            } catch {
                await axiosInstance.post(`/groups`, groupWithGuild);
            }

            for (const button of group.buttons) {
                const buttonWithGuild = { ...button, guildId };

                try {
                    await axiosInstance.get(`/buttons/${button.id}`);
                    await axiosInstance.put(
                        `/buttons/${button.id}`,
                        buttonWithGuild
                    );
                } catch {
                    await axiosInstance.post(`/buttons`, buttonWithGuild);
                }

                for (const content of button.contents) {
                    const contentWithGuild = { ...content, guildId };

                    try {
                        await axiosInstance.get(`/contents/${content.id}`);
                        await axiosInstance.put(
                            `/contents/${content.id}`,
                            contentWithGuild
                        );
                    } catch {
                        await axiosInstance.post(`/contents`, contentWithGuild);
                    }
                }
            }
        }

        return true;
    } catch (error) {
        console.error("Error saving data:", error);
        return false;
    }
}
