import { Channel, GroupData, ButtonData, ContentData } from '@/lib/types';
import { apiClient } from '@/lib/api';

const mockChannels: Channel[] = [
  { id: '', name: '채널없음' }
];

// 채널 리스트 가져오기 (옵션: 길드 기준 분리도 가능)
export async function fetchChannels(guildId?: string): Promise<Channel[]> {
  try {
    const endpoint = guildId ? `/channels?guildId=${guildId}` : `/channels`;
    return [...mockChannels, ...await apiClient.get<Channel[]>(endpoint)];
  } catch (error) {
    console.error('Error fetching channels:', error);
    return [...mockChannels];
  }
}

// 채널 단건 조회
export async function fetchChannelById(guildId: string , id: string): Promise<string[]> {
  try {
    const channel = await apiClient.get<{ id: string, name: string }>(`/channels/${id}`);
    return [channel.name];
  } catch (error) {
    console.error('Error fetching channel by ID:', error);
    return [];
  }
}

// 그룹/버튼/콘텐츠 불러오기 (길드별)
export async function fetchGroupsFromServer(guildId: string): Promise<GroupData[]> {
  try {
    const [groups, buttons, contents] = await Promise.all([
      apiClient.get<GroupData[]>(`/groups?guildId=${guildId}`),
      apiClient.get<ButtonData[]>(`/buttons?guildId=${guildId}`),
      apiClient.get<ContentData[]>(`/contents?guildId=${guildId}`)
    ]);

    const groupsWithData = groups.map(group => {
      const groupButtons = buttons
        .filter(button => button.groupId === group.id)
        .sort((a, b) => a.index - b.index);

      const buttonsWithContents = groupButtons.map(button => {
        const buttonContents = contents
          .filter(content => content.buttonId === button.id)
          .sort((a, b) => a.index - b.index);

        return { ...button, contents: buttonContents };
      });

      return { ...group, buttons: buttonsWithContents };
    }).sort((a, b) => a.index - b.index);

    return groupsWithData;
  } catch (error) {
    console.error("Failed to load data:", error);
    return [];
  }
}

// 저장 (길드별)
export async function saveData(guildId: string, groups: GroupData[]): Promise<boolean> {
  try {
    for (const group of groups) {
      const groupWithGuild = { ...group, guildId };

      // 그룹 저장
      try {
        await apiClient.get(`/groups/${group.id}`);
        await apiClient.put(`/groups/${group.id}`, groupWithGuild);
      } catch {
        await apiClient.post(`/groups`, groupWithGuild);
      }

      for (const button of group.buttons) {
        const buttonWithGuild = { ...button, guildId };

        try {
          await apiClient.get(`/buttons/${button.id}`);
          await apiClient.put(`/buttons/${button.id}`, buttonWithGuild);
        } catch {
          await apiClient.post(`/buttons`, buttonWithGuild);
        }

        for (const content of button.contents) {
          const contentWithGuild = { ...content, guildId };

          try {
            await apiClient.get(`/contents/${content.id}`);
            await apiClient.put(`/contents/${content.id}`, contentWithGuild);
          } catch {
            await apiClient.post(`/contents`, contentWithGuild);
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
}
