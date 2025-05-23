import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageTransition from "@/components/PageTransition";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { themesService } from '@/api/content';
import { gameHistoryService } from '@/api/game';
import { teamsService } from '@/api/guild';
import { UserPostDto } from '@/api/posts';
import { Skeleton } from "@/components/ui/skeleton";
import {
    ThemeHeader,
    ThemeActions,
    ThemeInfoGrid,
    ThemeTeamInfo,
    ThemeGuildInfo,
    ThemeContent,
    ThemeComments,
    ThemeModals,
} from "@/components/themes/detail";

const ThemeDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const { user, hasRole } = useAuth();
    const queryClient = useQueryClient();
    const commentsRef = useRef<HTMLDivElement>(null);

    // 모달 상태 관리
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    // 기존 showGuildModal 제거 (페이지에 직접 표시)
    const [showRequestModal, setShowRequestModal] = useState(false);

    // 팀 정보 관련 상태
    const [teamData, setTeamData] = useState<any>(null);
    const [isLoadingTeam, setIsLoadingTeam] = useState(false);
    const [teamError, setTeamError] = useState<boolean>(false);

    // 기록 요청 관련 상태
    const [hasPlayedGame, setHasPlayedGame] = useState(false);
    const [requestMessage, setRequestMessage] = useState("");
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
    const [isCheckingRequest, setIsCheckingRequest] = useState(false);

    // 프로필 모달 관련 상태
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedPost, setSelectedPost] = useState<UserPostDto | null>(null);
    const [showProfileDetailModal, setShowProfileDetailModal] = useState(false);
    const [profileDetailUserId, setProfileDetailUserId] = useState<string>("");

    // 데이터 조회
    const {
        data: theme,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["theme", id],
        queryFn: () =>
            id
                ? themesService.getThemeById(id)
                : Promise.reject("No ID provided"),
        enabled: !!id,
    });

    const { data: liked = false } = useQuery({
        queryKey: ["theme-like", id],
        queryFn: () =>
            id ? themesService.getLikeStatus(id) : Promise.resolve(false),
        enabled: !!id && !!user?.id,
    });

    // 프로필 관련 함수
    const openProfileDetailModal = (userId: string) => {
        setProfileDetailUserId(userId);
        setShowProfileDetailModal(true);
    };

    // 초기 데이터 로드 및 설정
    useEffect(() => {
        const checkGamePlayed = async () => {
            if (user?.id && id) {
                try {
                    const played = await gameHistoryService.checkPlayTheme(id);
                    setHasPlayedGame(played);
                } catch (err) {
                    console.error("게임 플레이 여부 확인 중 오류 발생:", err);
                    setHasPlayedGame(false);
                }
            }
        };

        // 테마에 팀 정보가 있는 경우 팀 정보 가져오기
        const fetchTeamData = async () => {
            if (theme?.team?.id) {
                setIsLoadingTeam(true);
                try {
                    const teamData = await teamsService.getTeamWithAvatars(
                        theme.team.id
                    );
                    setTeamData(teamData);
                    setTeamError(false);
                } catch (error) {
                    console.error("팀 정보를 불러오는 중 오류 발생:", error);
                    setTeamError(true);
                } finally {
                    setIsLoadingTeam(false);
                }
            }
        };

        checkGamePlayed();
        fetchTeamData();

        // URL 파라미터 처리
        const params = new URLSearchParams(location.search);

        // 댓글 표시 파라미터 처리
        if (params.get("showComments") === "true" && commentsRef.current) {
            setTimeout(() => {
                commentsRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 500);
        }

        // 좋아요 액션 파라미터 처리
        if (
            params.get("action") === "like" &&
            user?.id &&
            !liked &&
            theme?.recommendationEnabled
        ) {
            setTimeout(() => {
                likeMutation.mutate();
                navigate(`/themes/${theme.type.toLowerCase()}/${id}`, {
                    replace: true,
                });
            }, 800);
        }
    }, [user?.id, id, location.search, liked, theme]);

    // 좋아요 뮤테이션
    const likeMutation = useMutation({
        mutationFn: () => (id ? themesService.setLike(id) : Promise.reject()),
        onMutate: async () => {
            const prevTheme = queryClient.getQueryData<any>(["theme", id]);
            const prevLike = queryClient.getQueryData<boolean>([
                "theme-like",
                id,
            ]);

            queryClient.setQueryData(["theme", id], (old: any) =>
                old
                    ? {
                          ...old,
                          recommendations: (old.recommendations ?? 0) + 1,
                      }
                    : old
            );
            queryClient.setQueryData(["theme-like", id], true);

            return { prevTheme, prevLike };
        },
        onError: (_err, _vars, context: any) => {
            if (context?.prevTheme)
                queryClient.setQueryData(["theme", id], context.prevTheme);
            if (context?.prevLike !== undefined)
                queryClient.setQueryData(["theme-like", id], context.prevLike);
        },
    });

    // 좋아요 취소 뮤테이션
    const unlikeMutation = useMutation({
        mutationFn: () =>
            id ? themesService.cancelLike(id) : Promise.reject(),
        onMutate: async () => {
            const prevTheme = queryClient.getQueryData<any>(["theme", id]);
            const prevLike = queryClient.getQueryData<boolean>([
                "theme-like",
                id,
            ]);

            queryClient.setQueryData(["theme", id], (old: any) =>
                old
                    ? {
                          ...old,
                          recommendations: Math.max(
                              0,
                              (old.recommendations ?? 1) - 1
                          ),
                      }
                    : old
            );
            queryClient.setQueryData(["theme-like", id], false);

            return { prevTheme, prevLike };
        },
        onError: (_err, _vars, context: any) => {
            if (context?.prevTheme)
                queryClient.setQueryData(["theme", id], context.prevTheme);
            if (context?.prevLike !== undefined)
                queryClient.setQueryData(["theme-like", id], context.prevLike);
        },
    });

    // 기록 요청 처리
    const handleRequestGame = async () => {
        if (!requestMessage.trim()) {
            toast({
                title: "메시지를 입력해주세요",
                description: "기록 요청 메시지를 작성해주세요.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmittingRequest(true);
        try {
            const result = await gameHistoryService.requestGameRecord({
                gameThemeId: id!,
                message: requestMessage,
            });

            if (result.message === "요청이 발송되었습니다.") {
                toast({
                    title: "요청 전송 완료",
                    description: "기록 요청이 성공적으로 전송되었습니다.",
                });
            } else {
                toast({
                    title: "알림",
                    description: result.message,
                    variant: "default",
                });
            }

            setShowRequestModal(false);
            setRequestMessage("");
        } catch (error) {
            toast({
                title: "요청 전송 실패",
                description: "문제가 발생했습니다. 다시 시도해주세요.",
                variant: "destructive",
            });
        } finally {
            setIsSubmittingRequest(false);
        }
    };

    // 유틸리티 함수
    const formatPlayTime = (min: number, max: number): string => {
        const toHourText = (m: number) => {
            const h = Math.floor(m / 60);
            const mm = m % 60;
            return `${h > 0 ? `${h}시간` : ""}${
                mm > 0 ? ` ${mm}분` : ""
            }`.trim();
        };
        return min === max
            ? toHourText(min)
            : `${toHourText(min)} ~ ${toHourText(max)}`;
    };

    // 공유 기능
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

    // 좋아요 토글
    const handleToggleLike = () => {
        if (!id) return;
        if (!user?.id) {
            setShowLoginDialog(true);
            return;
        }
        liked ? unlikeMutation.mutate() : likeMutation.mutate();
    };

    // 테마 삭제
    const handleDelete = async () => {
        if (!theme) return;
        try {
            await themesService.deleteTheme(theme.id);
            queryClient.invalidateQueries({ queryKey: ["themes"] });
            toast({
                title: "삭제 완료",
                description: "테마가 삭제되었습니다.",
            });
            navigate(`/themes/${theme.type.toLowerCase()}`);
        } catch {
            toast({
                title: "삭제 실패",
                description: "문제가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    // 로딩 중
    if (isLoading) {
        return (
            <PageTransition>
                <div className="container mx-auto px-6 py-20">
                    <SkeletonPage />
                </div>
            </PageTransition>
        );
    }

    // 에러 발생
    if (error || !theme) {
        return (
            <PageTransition>
                <div className="container mx-auto px-6 py-20 text-center">
                    <h1 className="text-3xl font-bold mb-4">
                        테마를 찾을 수 없습니다
                    </h1>
                    <p className="text-muted-foreground">
                        요청하신 테마가 존재하지 않거나 오류가 발생했습니다.
                    </p>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <div className="container mx-auto px-6 py-20">
                <div className="max-w-4xl mx-auto">
                    {/* 헤더 */}
                    <ThemeHeader
                        theme={theme}
                        navigate={navigate}
                        onProfileClick={openProfileDetailModal}
                    />

                    {/* 액션 버튼 */}
                    <ThemeActions
                        theme={theme}
                        liked={liked}
                        user={user}
                        navigate={navigate}
                        hasRole={hasRole}
                        onToggleLike={handleToggleLike}
                        onShare={handleShare}
                        onRequestRecord={() => setShowRequestModal(true)}
                        hasPlayedGame={hasPlayedGame}
                        onDelete={() => setIsDeleteDialogOpen(true)}
                    />

                    {/* 테마 정보 그리드 */}
                    <ThemeInfoGrid
                        theme={theme}
                        formatPlayTime={formatPlayTime}
                    />

                    {/* 팀 정보 */}
                    <ThemeTeamInfo
                        theme={theme}
                        teamData={teamData}
                        isLoadingTeam={isLoadingTeam}
                        teamError={teamError}
                        onProfileClick={openProfileDetailModal}
                        onGuildClick={() => {}} // 기능 제거
                    />

                    {/* 길드 정보 */}
                    <ThemeGuildInfo theme={theme} />

                    {/* 테마 내용 */}
                    <ThemeContent theme={theme} />

                    {/* 댓글 */}
                    {theme.commentEnabled && id && (
                        <ThemeComments
                            theme={theme}
                            gameThemeId={id}
                            currentUserId={user?.id}
                            hasPlayedGame={hasPlayedGame}
                            commentsRef={commentsRef}
                        />
                    )}

                    {/* 모달 */}
                    <ThemeModals
                        theme={theme}
                        navigate={navigate}
                        isDeleteDialogOpen={isDeleteDialogOpen}
                        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                        showLoginDialog={showLoginDialog}
                        setShowLoginDialog={setShowLoginDialog}
                        showContactModal={showContactModal}
                        setShowContactModal={setShowContactModal}
                        showRequestModal={showRequestModal}
                        setShowRequestModal={setShowRequestModal}
                        requestMessage={requestMessage}
                        setRequestMessage={setRequestMessage}
                        isSubmittingRequest={isSubmittingRequest}
                        handleRequestGame={handleRequestGame}
                        handleDelete={handleDelete}
                        showProfileModal={showProfileModal}
                        setShowProfileModal={setShowProfileModal}
                        selectedUserId={selectedUserId}
                        selectedPost={selectedPost}
                        showProfileDetailModal={showProfileDetailModal}
                        setShowProfileDetailModal={setShowProfileDetailModal}
                        profileDetailUserId={profileDetailUserId}
                    />
                </div>
            </div>
        </PageTransition>
    );
};

const SkeletonPage: React.FC = () => (
    <div className="mb-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
            <Skeleton className="w-full aspect-video rounded-xl" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-6 w-full" />
            <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        </div>
    </div>
);

export default ThemeDetail;
