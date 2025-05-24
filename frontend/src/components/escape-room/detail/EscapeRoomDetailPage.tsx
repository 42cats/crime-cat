import React, { useState, useEffect } from "react";
import {
    Star,
    MessageCircle,
    Trophy,
    Lock,
    Globe,
    Calendar,
    ExternalLink,
    ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EscapeRoomThemeDetailType } from "@/lib/types";
import ThemeHeader from "./ThemeHeader";
import ThemeInfo from "./ThemeInfo";
import CommentTabs from "./CommentTabs";
import GameHistorySection from "./GameHistorySection";
import { escapeRoomHistoryService } from "@/api/game/escapeRoomHistoryService";
import { themesService } from "@/api/content";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EscapeRoomDetailPageProps {
    theme: EscapeRoomThemeDetailType;
    onAddGameHistory?: () => void;
    onEditGameHistory?: (historyId: string) => void;
}

const EscapeRoomDetailPage: React.FC<EscapeRoomDetailPageProps> = ({
    theme,
    onAddGameHistory,
    onEditGameHistory,
}) => {
    const [activeTab, setActiveTab] = useState<"info" | "comments" | "history">(
        "info"
    );
    const [hasGameHistory, setHasGameHistory] = useState(false);
    const [checkingHistory, setCheckingHistory] = useState(true);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [likeCount, setLikeCount] = useState(theme.recommendations || 0);
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // 작성자 확인
    const isAuthor = user?.id === theme.author?.id;
    const canEdit =
        isAuthor || user?.role === "ADMIN" || user?.role === "MANAGER";

    useEffect(() => {
        checkUserGameHistory();
    }, [theme.id]);

    const checkUserGameHistory = async () => {
        try {
            setCheckingHistory(true);
            const hasPlayed = await escapeRoomHistoryService.hasPlayedTheme(
                theme.id
            );
            setHasGameHistory(hasPlayed);
        } catch (error) {
            console.error("게임 기록 확인 실패:", error);
        } finally {
            setCheckingHistory(false);
        }
    };

    // 좋아요 상태 조회
    const { data: liked = false } = useQuery({
        queryKey: ["theme-like", theme.id],
        queryFn: () => themesService.getLikeStatus(theme.id),
        enabled: !!theme.id && !!user?.id,
    });

    // 좋아요 mutation
    const likeMutation = useMutation({
        mutationFn: () => themesService.setLike(theme.id),
        onMutate: async () => {
            await queryClient.cancelQueries({
                queryKey: ["theme-like", theme.id],
            });
            const previousLiked = queryClient.getQueryData([
                "theme-like",
                theme.id,
            ]);
            queryClient.setQueryData(["theme-like", theme.id], true);

            // 좋아요 수 즉시 업데이트 (로컬 상태만)
            setLikeCount((prev) => prev + 1);

            return { previousLiked, previousCount: likeCount };
        },
        onError: (err: any, variables, context: any) => {
            console.error("좋아요 실패:", err);

            if (context?.previousLiked !== undefined) {
                queryClient.setQueryData(
                    ["theme-like", theme.id],
                    context.previousLiked
                );
            }
            if (context?.previousCount !== undefined) {
                setLikeCount(context.previousCount);
            }

            // 더 구체적인 에러 메시지
            const errorMessage =
                err?.response?.data?.message ||
                err?.message ||
                "문제가 발생했습니다. 다시 시도해주세요.";

            toast({
                title: "좋아요 실패",
                description: errorMessage,
                variant: "destructive",
            });
        },
        onSuccess: () => {
            // 성공 시 좋아요 상태만 다시 불러오기
            queryClient.invalidateQueries({
                queryKey: ["theme-like", theme.id],
            });
        },
    });

    // 좋아요 취소 mutation
    const unlikeMutation = useMutation({
        mutationFn: () => themesService.cancelLike(theme.id),
        onMutate: async () => {
            await queryClient.cancelQueries({
                queryKey: ["theme-like", theme.id],
            });
            const previousLiked = queryClient.getQueryData([
                "theme-like",
                theme.id,
            ]);
            queryClient.setQueryData(["theme-like", theme.id], false);

            // 좋아요 수 즉시 업데이트 (로컬 상태만)
            setLikeCount((prev) => Math.max(0, prev - 1));

            return { previousLiked, previousCount: likeCount };
        },
        onError: (err: any, variables, context: any) => {
            console.error("좋아요 취소 실패:", err);

            if (context?.previousLiked !== undefined) {
                queryClient.setQueryData(
                    ["theme-like", theme.id],
                    context.previousLiked
                );
            }
            if (context?.previousCount !== undefined) {
                setLikeCount(context.previousCount);
            }

            // 더 구체적인 에러 메시지
            const errorMessage =
                err?.response?.data?.message ||
                err?.message ||
                "문제가 발생했습니다. 다시 시도해주세요.";

            toast({
                title: "좋아요 취소 실패",
                description: errorMessage,
                variant: "destructive",
            });
        },
        onSuccess: () => {
            // 성공 시 좋아요 상태만 다시 불러오기
            queryClient.invalidateQueries({
                queryKey: ["theme-like", theme.id],
            });
        },
    });

    // 좋아요 토글
    const handleToggleLike = () => {
        if (!user?.id) {
            setShowLoginDialog(true);
            return;
        }

        // 추천 기능이 비활성화된 경우
        if (!theme.recommendationEnabled) {
            toast({
                title: "추천 불가",
                description: "이 테마는 추천 기능이 비활성화되어 있습니다.",
                variant: "destructive",
            });
            return;
        }

        if (liked) {
            unlikeMutation.mutate();
        } else {
            likeMutation.mutate();
        }
    };

    // 공유하기
    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast({
                title: "링크 복사 완료",
                description: "현재 페이지 링크가 복사되었습니다.",
            });
        } catch {
            toast({
                title: "복사 실패",
                description: "브라우저 설정을 확인해주세요.",
                variant: "destructive",
            });
        }
    };

    // 테마 삭제
    const deleteMutation = useMutation({
        mutationFn: () => themesService.deleteTheme(theme.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["themes"] });
            toast({
                title: "삭제 완료",
                description: "테마가 삭제되었습니다.",
            });
            navigate("/themes/escape-room");
        },
        onError: () => {
            toast({
                title: "삭제 실패",
                description: "문제가 발생했습니다. 다시 시도해주세요.",
                variant: "destructive",
            });
        },
    });

    const handleDelete = () => {
        setShowDeleteDialog(true);
    };

    const handleEdit = () => {
        navigate(`/themes/edit/${theme.id}`, { 
            state: { 
                theme: {
                    ...theme,
                    type: theme.type // 원본 타입 유지
                }
            } 
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* 뒤로가기 버튼 */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/themes/escape-room")}
                className="flex items-center gap-2 mb-4"
            >
                <ArrowLeft className="w-4 h-4" />
                테마 목록으로 돌아가기
            </Button>

            {/* 테마 헤더 */}
            <ThemeHeader
                theme={theme}
                hasGameHistory={hasGameHistory}
                onAddGameHistory={onAddGameHistory}
                liked={liked}
                onToggleLike={handleToggleLike}
                onShare={handleShare}
                isLiking={likeMutation.isPending || unlikeMutation.isPending}
                canEdit={canEdit}
                onEdit={handleEdit}
                onDelete={handleDelete}
                likeCount={likeCount}
            />

            {/* 메인 콘텐츠 - 세로 레이아웃으로 변경 */}
            <div className="space-y-6">
                {/* 메인 콘텐츠 탭 */}
                <div className="space-y-6">
                    <Tabs
                        value={activeTab}
                        onValueChange={(value) => setActiveTab(value as any)}
                    >
                        <TabsList className="w-full">
                            <TabsTrigger
                                value="info"
                                className="flex items-center gap-2"
                            >
                                <Star className="w-4 h-4" />
                                테마 정보
                            </TabsTrigger>
                            <TabsTrigger
                                value="comments"
                                className="flex items-center gap-2"
                                disabled={!theme.commentEnabled}
                            >
                                <MessageCircle className="w-4 h-4" />
                                댓글
                                {!theme.commentEnabled && (
                                    <Lock className="w-3 h-3" />
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="history"
                                className="flex items-center gap-2"
                                disabled={!theme.allowGameHistory}
                            >
                                <Trophy className="w-4 h-4" />
                                플레이 기록
                                {!theme.allowGameHistory && (
                                    <Lock className="w-3 h-3" />
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="space-y-4">
                            <ThemeInfo theme={theme} />
                        </TabsContent>

                        <TabsContent value="comments">
                            <CommentTabs
                                themeId={theme.id}
                                hasGameHistory={hasGameHistory}
                                allowComments={theme.commentEnabled}
                            />
                        </TabsContent>

                        <TabsContent value="history">
                            <GameHistorySection
                                themeId={theme.id}
                                hasGameHistory={hasGameHistory}
                                allowGameHistory={theme.allowGameHistory}
                                onAddGameHistory={onAddGameHistory}
                                onEditGameHistory={onEditGameHistory}
                            />
                        </TabsContent>
                    </Tabs>

                    {/* URL 바로가기 정보 */}
                    {(theme.homepageUrl || theme.reservationUrl) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <ExternalLink className="w-5 h-5" />
                                    바로가기
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {theme.homepageUrl && (
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() =>
                                            window.open(
                                                theme.homepageUrl,
                                                "_blank",
                                                "noopener,noreferrer"
                                            )
                                        }
                                    >
                                        <Globe className="w-4 h-4 mr-2" />
                                        홈페이지 방문
                                        <ExternalLink className="w-3 h-3 ml-auto" />
                                    </Button>
                                )}
                                {theme.reservationUrl && (
                                    <Button
                                        className="w-full justify-start bg-green-600 hover:bg-green-700"
                                        onClick={() =>
                                            window.open(
                                                theme.reservationUrl,
                                                "_blank",
                                                "noopener,noreferrer"
                                            )
                                        }
                                    >
                                        <Calendar className="w-4 h-4 mr-2" />
                                        예약하기
                                        <ExternalLink className="w-3 h-3 ml-auto" />
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* 플레이 기록 버튼 - 고정 위치에서 제거하고 플로팅 버튼으로 */}
                    {theme.allowGameHistory && onAddGameHistory && (
                        <div className="fixed bottom-6 right-6 z-50 md:hidden">
                            <Button
                                onClick={onAddGameHistory}
                                className="rounded-full shadow-lg"
                                size="lg"
                            >
                                <Trophy className="w-5 h-5" />
                            </Button>
                        </div>
                    )}

                    {/* 데스크톱에서는 상단에 버튼 표시 */}
                    {theme.allowGameHistory && onAddGameHistory && (
                        <div className="hidden md:flex justify-end">
                            <Button onClick={onAddGameHistory} size="lg">
                                <Trophy className="w-4 h-4 mr-2" />
                                플레이 기록 추가
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* 로그인 안내 다이얼로그 */}
            <AlertDialog
                open={showLoginDialog}
                onOpenChange={setShowLoginDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>로그인이 필요합니다</AlertDialogTitle>
                        <AlertDialogDescription>
                            좋아요 기능을 사용하려면 로그인이 필요합니다. 로그인
                            페이지로 이동하시겠습니까?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={() => navigate("/login")}>
                            로그인하기
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 삭제 확인 다이얼로그 */}
            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>테마 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                            정말로 이 테마를 삭제하시겠습니까? 삭제된 테마는
                            복구할 수 없습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate()}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default EscapeRoomDetailPage;
