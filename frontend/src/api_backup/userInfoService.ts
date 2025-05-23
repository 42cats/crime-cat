import { apiClient } from "@/lib/api";
import { AdditionalUserInfo, DailyCheck } from "@/lib/types";

const baseURI = `/info`;

export const userInfocheckService = {
    userInfoCheck: async (id: string): Promise<AdditionalUserInfo> => {
        try {
            return await apiClient.get<AdditionalUserInfo>(`${baseURI}/${id}`);
        } catch (error) {
            console.error("유저인포 확인 실패:", error);
            throw error;
        }
    },
};
