import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { themeAdsService, ThemeAdvertisement } from "@/api/admin/themeAdsService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Calendar, Clock } from "lucide-react";
import { format, isPast, isFuture, isWithinInterval } from "date-fns";
import { ko } from "date-fns/locale";
import ThemeAdsTable from "@/components/admin/theme-ads/ThemeAdsTable";
import ThemeAdModal from "@/components/admin/theme-ads/ThemeAdModal";

type AdStatus = "all" | "active" | "scheduled" | "expired";

const ThemeAdsPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAd, setSelectedAd] = useState<ThemeAdvertisement | null>(null);
    const [statusFilter, setStatusFilter] = useState<AdStatus>("all");
    const queryClient = useQueryClient();

    // 광고 목록 조회
    const { data: advertisements = [], isLoading } = useQuery({
        queryKey: ["admin-theme-ads"],
        queryFn: themeAdsService.getAllAdvertisements,
    });

    // 광고 삭제 mutation
    const deleteMutation = useMutation({
        mutationFn: themeAdsService.deleteAdvertisement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-theme-ads"] });
            toast.success("광고가 삭제되었습니다.");
        },
        onError: () => {
            toast.error("광고 삭제에 실패했습니다.");
        },
    });

    // 광고 상태 계산 함수
    const getAdStatus = (ad: ThemeAdvertisement): AdStatus => {
        const now = new Date();
        const startDate = new Date(ad.startDate);
        const endDate = new Date(ad.endDate);

        if (!ad.isActive) return "expired";
        if (isPast(endDate)) return "expired";
        if (isFuture(startDate)) return "scheduled";
        if (isWithinInterval(now, { start: startDate, end: endDate })) return "active";
        return "expired";
    };

    // 필터링된 광고 목록
    const filteredAds = advertisements.filter(ad => {
        if (statusFilter === "all") return true;
        return getAdStatus(ad) === statusFilter;
    });

    // 상태별 개수 계산
    const statusCounts = {
        all: advertisements.length,
        active: advertisements.filter(ad => getAdStatus(ad) === "active").length,
        scheduled: advertisements.filter(ad => getAdStatus(ad) === "scheduled").length,
        expired: advertisements.filter(ad => getAdStatus(ad) === "expired").length,
    };

    const handleAdd = () => {
        setSelectedAd(null);
        setIsModalOpen(true);
    };

    const handleEdit = (ad: ThemeAdvertisement) => {
        setSelectedAd(ad);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("정말 이 광고를 삭제하시겠습니까?")) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedAd(null);
    };

    const handleModalSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ["admin-theme-ads"] });
        handleModalClose();
    };

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">테마 광고 관리</h1>
                <p className="text-muted-foreground">
                    메인 페이지에 표시될 테마 광고를 관리합니다.
                </p>
            </div>

            {/* 상태별 통계 카드 */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            전체 광고
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statusCounts.all}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            활성 광고
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {statusCounts.active}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            예정 광고
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {statusCounts.scheduled}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            종료된 광고
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-600">
                            {statusCounts.expired}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 광고 목록 */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>광고 목록</CardTitle>
                    <Button onClick={handleAdd} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        광고 추가
                    </Button>
                </CardHeader>
                <CardContent>
                    <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as AdStatus)}>
                        <TabsList>
                            <TabsTrigger value="all">
                                전체 ({statusCounts.all})
                            </TabsTrigger>
                            <TabsTrigger value="active">
                                활성 ({statusCounts.active})
                            </TabsTrigger>
                            <TabsTrigger value="scheduled">
                                예정 ({statusCounts.scheduled})
                            </TabsTrigger>
                            <TabsTrigger value="expired">
                                종료 ({statusCounts.expired})
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value={statusFilter} className="mt-4">
                            <ThemeAdsTable
                                advertisements={filteredAds}
                                isLoading={isLoading}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                getAdStatus={getAdStatus}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* 광고 추가/수정 모달 */}
            <ThemeAdModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                advertisement={selectedAd}
            />
        </div>
    );
};

export default ThemeAdsPage;
