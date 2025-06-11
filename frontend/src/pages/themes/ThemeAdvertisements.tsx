import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Sparkles,
    Clock,
    Eye,
    MousePointer,
    Calendar,
    Coins,
    AlertCircle,
    Plus,
    X,
    TrendingUp,
    Loader2,
    RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
    ThemeAdvertisementRequest,
    QueueStatus,
    CreateAdvertisementRequest,
    useThemeAdvertisements,
} from "@/api/themeAdvertisementService";
import AdvertisementRequestModal from "@/components/themes/AdvertisementRequestModal";
import AdvertisementCancelModal from "@/components/themes/AdvertisementCancelModal";
import { toast } from "@/hooks/useToast";

const ThemeAdvertisements: React.FC = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<ThemeAdvertisementRequest[]>([]);
    const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("active");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [selectedAdvertisement, setSelectedAdvertisement] =
        useState<ThemeAdvertisementRequest | null>(null);

    const {
        getMyRequests,
        getQueueStatus,
        requestAdvertisement,
        cancelActiveAdvertisement,
        cancelQueuedAdvertisement,
    } = useThemeAdvertisements();

    const loadData = async () => {
        try {
            setLoading(true);
            const [requestsData, queueData] = await Promise.all([
                getMyRequests(),
                getQueueStatus(),
            ]);
            setRequests(requestsData);
            setQueueStatus(queueData);
        } catch (error) {
            console.error("데이터 로딩 실패:", error);
            toast({
                title: "데이터 로딩 실패",
                description: "광고 데이터를 불러오는데 실패했습니다.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const refreshData = async () => {
        try {
            setRefreshing(true);
            const [requestsData, queueData] = await Promise.all([
                getMyRequests(),
                getQueueStatus(),
            ]);
            setRequests(requestsData);
            setQueueStatus(queueData);

            toast({
                title: "새로고침 완료",
                description: "최신 데이터를 불러왔습니다.",
                variant: "default",
            });
        } catch (error) {
            console.error("새로고침 실패:", error);
            toast({
                title: "새로고침 실패",
                description: "데이터를 새로고침하는데 실패했습니다.",
                variant: "destructive",
            });
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getStatusBadge = (status: ThemeAdvertisementRequest["status"]) => {
        const statusConfig = {
            PENDING_QUEUE: { label: "대기 중", variant: "secondary" as const },
            ACTIVE: { label: "활성", variant: "default" as const },
            CANCELLED: { label: "취소됨", variant: "destructive" as const },
            EXPIRED: { label: "만료됨", variant: "outline" as const },
            REFUNDED: { label: "환불됨", variant: "secondary" as const },
        };

        const config = statusConfig[status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getThemeTypeBadge = (
        type: ThemeAdvertisementRequest["themeType"]
    ) => {
        const typeConfig = {
            CRIMESCENE: { label: "크라임씬", color: "bg-red-100 text-red-800" },
            ESCAPE_ROOM: {
                label: "방탈출",
                color: "bg-blue-100 text-blue-800",
            },
            MURDER_MYSTERY: {
                label: "머더미스터리",
                color: "bg-purple-100 text-purple-800",
            },
            REALWORLD: {
                label: "리얼월드",
                color: "bg-green-100 text-green-800",
            },
        };

        const config = typeConfig[type];
        return (
            <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
            >
                {config.label}
            </span>
        );
    };

    const calculateProgress = (remainingDays: number, totalDays: number) => {
        const elapsed = totalDays - remainingDays;
        return (elapsed / totalDays) * 100;
    };

    const handleAdvertisementRequest = async (
        data: CreateAdvertisementRequest
    ) => {
        try {
            const response = await requestAdvertisement(data);
            if (response.success) {
                toast({
                    title: "광고 신청 완료",
                    description: response.message,
                    variant: "default",
                });
                await loadData(); // 데이터 새로고침
            } else {
                toast({
                    title: "광고 신청 실패",
                    description: response.message,
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("광고 신청 실패:", error);
            toast({
                title: "광고 신청 실패",
                description: "광고 신청 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    const handleCancelClick = (request: ThemeAdvertisementRequest) => {
        setSelectedAdvertisement(request);
        setCancelModalOpen(true);
    };

    const handleCancelConfirm = async () => {
        if (!selectedAdvertisement) return;

        try {
            const response =
                selectedAdvertisement.status === "ACTIVE"
                    ? await cancelActiveAdvertisement(selectedAdvertisement.id)
                    : await cancelQueuedAdvertisement(selectedAdvertisement.id);

            if (response.success) {
                toast({
                    title: "광고 취소 완료",
                    description: response.message,
                    variant: "default",
                });
                await loadData(); // 데이터 새로고침
            } else {
                toast({
                    title: "광고 취소 실패",
                    description: response.message,
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("광고 취소 실패:", error);
            toast({
                title: "광고 취소 실패",
                description: "광고 취소 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    const activeAds = requests.filter((req) => req.status === "ACTIVE");
    const queuedAds = requests.filter((req) => req.status === "PENDING_QUEUE");
    const completedAds = requests.filter(
        (req) =>
            req.status === "EXPIRED" ||
            req.status === "CANCELLED" ||
            req.status === "REFUNDED"
    );

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">내 테마 광고</h1>
                </div>
                <div className="grid gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
                                <div className="h-3 bg-muted rounded w-3/4"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Sparkles className="w-8 h-8" />내 테마 광고
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        내가 등록한 테마의 광고를 관리하고 통계를 확인하세요
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshData}
                        disabled={refreshing}
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${
                                refreshing ? "animate-spin" : ""
                            }`}
                        />
                        새로고침
                    </Button>
                    <Button
                        className="flex items-center gap-2"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <Plus className="w-4 h-4" />새 광고 신청
                    </Button>
                </div>
            </div>

            {/* 큐 상태 개요 */}
            {queueStatus && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            광고 큐 현황
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>활성 슬롯</span>
                                    <span>
                                        {queueStatus.activeCount}/
                                        {queueStatus.maxActiveSlots}
                                    </span>
                                </div>
                                <Progress
                                    value={
                                        (queueStatus.activeCount /
                                            queueStatus.maxActiveSlots) *
                                        100
                                    }
                                    className="h-2"
                                />
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {queueStatus.queuedCount}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    대기 중인 광고
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-semibold">
                                    {queueStatus.estimatedWaitTime}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    예상 대기시간
                                </div>
                            </div>
                        </div>

                        {queueStatus.activeCount >=
                            queueStatus.maxActiveSlots && (
                            <Alert className="mt-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>광고 슬롯 만료</AlertTitle>
                                <AlertDescription>
                                    현재 모든 광고 슬롯이 사용 중입니다. 새로운
                                    광고는 대기열에 추가됩니다.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* 광고 목록 */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger
                        value="active"
                        className="flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        활성 광고 ({activeAds.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="queue"
                        className="flex items-center gap-2"
                    >
                        <Clock className="w-4 h-4" />
                        대기 중 ({queuedAds.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="completed"
                        className="flex items-center gap-2"
                    >
                        <Calendar className="w-4 h-4" />
                        완료됨 ({completedAds.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                    {activeAds.length === 0 ? (
                        <Card className="border-dashed border-2">
                            <CardContent className="p-12 text-center">
                                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                                    내 테마를 홍보해보세요!
                                </h3>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                                    테마 광고로 더 많은 플레이어들에게
                                    노출시키고
                                    <br />
                                    게임 참여율을 높여보세요!
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                        <Coins className="w-4 h-4" />
                                        <span>100P/일부터 시작</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                        <TrendingUp className="w-4 h-4" />
                                        <span>즉시 노출 가능</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        activeAds.map((ad) => (
                            <Card key={ad.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-semibold">
                                                    {ad.themeName}
                                                </h3>
                                                {getThemeTypeBadge(
                                                    ad.themeType
                                                )}
                                                {getStatusBadge(ad.status)}
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleCancelClick(ad)
                                            }
                                        >
                                            <X className="w-4 h-4 mr-1" />
                                            취소
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span>진행 상황</span>
                                                <span>
                                                    {ad.remainingDays}일 남음
                                                </span>
                                            </div>
                                            <Progress
                                                value={calculateProgress(
                                                    ad.remainingDays!,
                                                    ad.requestedDays
                                                )}
                                                className="h-2"
                                            />
                                            <div className="text-xs text-muted-foreground">
                                                {ad.requestedDays -
                                                    ad.remainingDays!}
                                                일 / {ad.requestedDays}일 진행
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Eye className="w-4 h-4 text-blue-500" />
                                                <span className="text-sm">
                                                    노출수
                                                </span>
                                                <span className="font-semibold">
                                                    {ad.exposureCount.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MousePointer className="w-4 h-4 text-green-500" />
                                                <span className="text-sm">
                                                    클릭수
                                                </span>
                                                <span className="font-semibold">
                                                    {ad.clickCount.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Coins className="w-4 h-4 text-yellow-500" />
                                                <span className="text-sm">
                                                    총 비용
                                                </span>
                                                <span className="font-semibold">
                                                    {ad.totalCost.toLocaleString()}
                                                    P
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                만료일:{" "}
                                                {new Date(
                                                    ad.expiresAt!
                                                ).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="queue" className="space-y-4">
                    {queuedAds.length === 0 ? (
                        <Card className="border-dashed border-2">
                            <CardContent className="p-12 text-center">
                                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                    <Clock className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                                    대기열이 비어있어요!
                                </h3>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                                    지금 신청하면 즉시 광고가 시작됩니다.
                                    <br />
                                    기회를 놓치지 마세요!
                                </p>
                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-full mx-auto w-fit">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="font-medium">
                                        최적의 광고 타이밍
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        queuedAds.map((ad) => (
                            <Card key={ad.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-semibold">
                                                    {ad.themeName}
                                                </h3>
                                                {getThemeTypeBadge(
                                                    ad.themeType
                                                )}
                                                {getStatusBadge(ad.status)}
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleCancelClick(ad)
                                            }
                                        >
                                            <X className="w-4 h-4 mr-1" />
                                            취소
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600">
                                                    #{ad.queuePosition}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    대기 순번
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-sm">
                                                신청 기간: {ad.requestedDays}일
                                            </div>
                                            <div className="text-sm">
                                                신청일:{" "}
                                                {new Date(
                                                    ad.requestedAt
                                                ).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Coins className="w-4 h-4 text-yellow-500" />
                                                <span className="text-sm">
                                                    결제 완료
                                                </span>
                                                <span className="font-semibold">
                                                    {ad.totalCost.toLocaleString()}
                                                    P
                                                </span>
                                            </div>
                                            <div className="text-xs text-green-600">
                                                취소 시 전액 환불
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                    {completedAds.length === 0 ? (
                        <Card className="border-dashed border-2">
                            <CardContent className="p-12 text-center">
                                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                                    <Calendar className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-gray-700">
                                    아직 광고 내역이 없어요
                                </h3>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                                    첫 번째 테마 광고를 시작해보세요!
                                    <br />
                                    완료된 광고의 상세 통계를 여기서 확인할 수
                                    있습니다.
                                </p>
                                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-full mx-auto w-fit">
                                    <Eye className="w-4 h-4" />
                                    <span className="font-medium">
                                        노출수, 클릭수 통계 제공
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        completedAds.map((ad) => (
                            <Card key={ad.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-semibold">
                                                    {ad.themeName}
                                                </h3>
                                                {getThemeTypeBadge(
                                                    ad.themeType
                                                )}
                                                {getStatusBadge(ad.status)}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <div className="text-sm">
                                                기간: {ad.requestedDays}일
                                            </div>
                                            <div className="text-sm">
                                                완료일:{" "}
                                                {ad.expiresAt
                                                    ? new Date(
                                                          ad.expiresAt
                                                      ).toLocaleDateString()
                                                    : "-"}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Eye className="w-4 h-4 text-blue-500" />
                                                <span className="text-sm">
                                                    총 노출수
                                                </span>
                                                <span className="font-semibold">
                                                    {ad.exposureCount.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MousePointer className="w-4 h-4 text-green-500" />
                                                <span className="text-sm">
                                                    총 클릭수
                                                </span>
                                                <span className="font-semibold">
                                                    {ad.clickCount.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Coins className="w-4 h-4 text-yellow-500" />
                                                <span className="text-sm">
                                                    사용 금액
                                                </span>
                                                <span className="font-semibold">
                                                    {ad.totalCost.toLocaleString()}
                                                    P
                                                </span>
                                            </div>
                                            {ad.refundAmount && (
                                                <div className="text-xs text-green-600">
                                                    환불:{" "}
                                                    {ad.refundAmount.toLocaleString()}
                                                    P
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>

            {/* 광고 신청 모달 */}
            <AdvertisementRequestModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSubmit={handleAdvertisementRequest}
                queueStatus={queueStatus || undefined}
                userPoints={user?.point}
                loading={loading}
            />

            {/* 광고 취소 확인 모달 */}
            <AdvertisementCancelModal
                open={cancelModalOpen}
                onOpenChange={setCancelModalOpen}
                onConfirm={handleCancelConfirm}
                advertisement={selectedAdvertisement}
                loading={loading}
            />
        </div>
    );
};

export default ThemeAdvertisements;
