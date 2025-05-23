import { apiClient } from "@/lib/api";
import { SearchUsers } from "@/lib/types";

const baseURI = `/web_user/find`;

export const searchUserService = {
  getSearchUser: async (parameter: string): Promise<SearchUsers> => {
    try {
      return await apiClient.get<SearchUsers>(`${baseURI}/users?${parameter}`);
    } catch (error) {
      console.error("유저 검색 실패:", error);
      throw error;
    }
  },
};
