import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { themeAdsService, ThemeAdvertisement } from "@/api/admin/themeAdsService";
import { toast } from "sonner";

export const useThemeAds = () => {
    const queryClient = useQueryClient();

    // 모든 광고 조회
    const useGetAllAds = () => {
        return useQuery({
            queryKey: ["admin-theme-ads"],
            queryFn: themeAdsService.getAllAdvertisements,
        });
    };

    // 활성 광고 조회
    const useGetActiveAds = () => {
        return useQuery({
            queryKey: ["active-theme-ads"],
            queryFn: themeAdsService.getActiveAdvertisements,
            refetchInterval: 1000 * 60 * 5, // 5분마다 새로고침
        });
    };

    // 광고 생성
    const useCreateAd = () => {
        return useMutation({
            mutationFn: themeAdsService.createAdvertisement,
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["admin-theme-ads"] });
                queryClient.invalidateQueries({ queryKey: ["active-theme-ads"] });
                toast.success("광고가 생성되었습니다.");
            },
            onError: (error: any) => {
                toast.error(error.message || "광고 생성에 실패했습니다.");
            },
        });
    };

    // 광고 수정
    const useUpdateAd = () => {
        return useMutation({
            mutationFn: ({ id, data }: { id: string; data: any }) =>
                themeAdsService.updateAdvertisement(id, data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["admin-theme-ads"] });
                queryClient.invalidateQueries({ queryKey: ["active-theme-ads"] });
                toast.success("광고가 수정되었습니다.");
            },
            onError: (error: any) => {
                toast.error(error.message || "광고 수정에 실패했습니다.");
            },
        });
    };

    // 광고 삭제
    const useDeleteAd = () => {
        return useMutation({
            mutationFn: themeAdsService.deleteAdvertisement,
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["admin-theme-ads"] });
                queryClient.invalidateQueries({ queryKey: ["active-theme-ads"] });
                toast.success("광고가 삭제되었습니다.");
            },
            onError: (error: any) => {
                toast.error(error.message || "광고 삭제에 실패했습니다.");
            },
        });
    };

    // 광고 순서 변경
    const useReorderAds = () => {
        return useMutation({
            mutationFn: themeAdsService.reorderAdvertisements,
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["admin-theme-ads"] });
                queryClient.invalidateQueries({ queryKey: ["active-theme-ads"] });
                toast.success("광고 순서가 변경되었습니다.");
            },
            onError: (error: any) => {
                toast.error(error.message || "순서 변경에 실패했습니다.");
            },
        });
    };

    return {
        useGetAllAds,
        useGetActiveAds,
        useCreateAd,
        useUpdateAd,
        useDeleteAd,
        useReorderAds,
    };
};
