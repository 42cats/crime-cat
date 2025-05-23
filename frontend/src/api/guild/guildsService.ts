import { apiClient } from "@/lib/api";
import { GuildDetail } from "@/lib/types";

const baseURI = `/public/guilds`;

export const guildsService = {
  getGuildDetail: async (snowflake: string): Promise<GuildDetail> => {
    try {
      return await apiClient.get<GuildDetail>(`${baseURI}/${snowflake}/info`);
    } catch (error) {
      console.error("유저인포 확인 실패:", error);
      throw error;
    }
  },
};
