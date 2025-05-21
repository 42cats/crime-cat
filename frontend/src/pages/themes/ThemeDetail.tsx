import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import {
    Heart,
    ChevronLeft,
    Share2,
    Edit,
    Trash,
    FileText,
    Send,
    Clock,
    Users,
    Tag,
    CreditCard,
} from "lucide-react";
import { themesService } from "@/api/themesService";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { commentService } from "@/api/commentService";
import { gameHistoryService } from "@/api/gameHistoryService";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { UTCToKST } from "@/lib/dateFormat";
import ContactUserModal from "@/components/themes/modals/ContactUserModal";
// import TeamInfoModal from "@/components/themes/modals/TeamInfoModal";
import GuildInfoModal from "@/components/themes/modals/GuildInfoModal";
import { CommentList } from "@/components/comments";
import PostDetailModal from "@/components/profile/PostDetailModal";
import ProfileDetailModal from "@/components/profile/ProfileDetailModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { teamsService } from "@/api/teamsService";
import { Team, TeamMember } from "@/lib/types";
import { UserPostDto } from "@/api/userPost/userPostService";

const ThemeDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const { user, hasRole } = useAuth();
    const queryClient = useQueryClient();
    const commentsRef = useRef<HTMLDivElement>(null);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    // 팀 정보 관련 상태
    const [teamData, setTeamData] = useState<Team | null>(null);
    const [isLoadingTeam, setIsLoadingTeam] = useState(false);
    const [teamError, setTeamError] = useState<boolean>(false);
    const [showGuildModal, setShowGuildModal] = useState(false);
    const [hasPlayedGame, setHasPlayedGame] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestMessage, setRequestMessage] = useState("");
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
    const [isCheckingRequest, setIsCheckingRequest] = useState(false);

    // PostDetailModal 관련 상태
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedPost, setSelectedPost] = useState<UserPostDto | null>(null);

    // ProfileDetailModal 관련 상태
    const [showProfileDetailModal, setShowProfileDetailModal] = useState(false);
    const [profileDetailUserId, setProfileDetailUserId] = useState<string>("");

    // 프로필 모달 열기 함수
    const openProfileModal = (userId: string) => {
        setSelectedUserId(userId);
        // 더미 포스트 데이터 생성 (실제로는 API 호출로 데이터를 가져와야 함)
        const dummyPost: UserPostDto = {
            authorId: userId,
            postId: "dummy-post-id",
            content: "",
            authorNickname: "",
            authorAvatarUrl: "",
            imageUrls: [],
            likeCount: 0,
            liked: false,
            createdAt: new Date().toISOString(),
        };
        setSelectedPost(dummyPost);
        setShowProfileModal(true);
    };

    // 프로필 상세 모달 열기 함수
    const openProfileDetailModal = (userId: string) => {
        setProfileDetailUserId(userId);
        setShowProfileDetailModal(true);
    };

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

        checkGamePlayed();

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

        fetchTeamData();

        // URL 파라미터 처리
        const params = new URLSearchParams(location.search);

        // 댓글 표시 파라미터 처리
        if (params.get("showComments") === "true" && commentsRef.current) {
            setTimeout(() => {
                commentsRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 500); // 컴포넌트가 완전히 렌더링된 후 스크롤하기 위해 약간의 지연 추가
        }

        // 좋아요 액션 파라미터 처리
        if (
            params.get("action") === "like" &&
            user?.id &&
            !liked &&
            theme?.recommendationEnabled
        ) {
            // 사용자가 로그인했고, 아직 좋아요 하지 않았고, 좋아요 기능이 활성화된 경우
            setTimeout(() => {
                likeMutation.mutate();
                // 파라미터 제거하여 URL 깔끔하게 유지
                navigate(`/themes/${theme.type.toLowerCase()}/${id}`, {
                    replace: true,
                });
            }, 800); // 데이터 로딩이 완료된 후 실행하기 위한 지연
        }
    }, [user?.id, id, location.search, liked, theme]);

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

            // 백엔드 메시지에 따라 UI 처리
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

    const handleToggleLike = () => {
        if (!id) return;
        if (!user?.id) {
            setShowLoginDialog(true);
            return;
        }
        liked ? unlikeMutation.mutate() : likeMutation.mutate();
    };

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

    if (isLoading) {
        return (
            <PageTransition>
                <div className="container mx-auto px-6 py-20">
                    <SkeletonPage />
                </div>
            </PageTransition>
        );
    }

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
                    {/* 상단 내비게이션 */}
                    <div className="flex justify-between items-center mb-6">
                        <button
                            onClick={() =>
                                navigate(`/themes/${theme.type.toLowerCase()}`)
                            }
                            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> 테마
                            목록으로 돌아가기
                        </button>

                        {/* 액션 버튼 그룹 */}
                        <div className="flex gap-2">
                            {theme.recommendationEnabled && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`group ${
                                        liked ? "text-red-500" : ""
                                    }`}
                                    onClick={handleToggleLike}
                                >
                                    <Heart
                                        className={`h-4 w-4 mr-1 ${
                                            liked
                                                ? "fill-red-500"
                                                : "group-hover:fill-red-500/10"
                                        }`}
                                    />
                                    {theme.recommendations}
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleShare}
                            >
                                <Share2 className="h-4 w-4" />
                            </Button>
                            {(user?.id === theme.author.id ||
                                hasRole(["ADMIN", "MANAGER"])) && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            navigate(
                                                `/themes/${theme.type.toLowerCase()}/edit/${
                                                    theme.id
                                                }`
                                            )
                                        }
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10"
                                        onClick={() =>
                                            setIsDeleteDialogOpen(true)
                                        }
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 헤더 섹션: 이미지 */}
                    <div className="mb-8">
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-6">
                            <img
                                src={`${
                                    theme?.thumbnail ||
                                    "/content/image/default_image2.png"
                                }`}
                                alt={theme.title}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="mb-6">
                            <Badge variant="secondary">{theme.type}</Badge>

                            {/* 제목 */}
                            <h1 className="text-4xl font-bold text-center w-full truncate my-3">
                                {theme.title}
                            </h1>

                            {/* 작성자 + 시간 (제목 아래, 우측 정렬) */}
                            <div className="flex justify-end text-sm text-muted-foreground text-right">
                                <div>
                                    <button
                                        className="hover:text-primary transition-colors font-medium flex items-center gap-2 justify-end mb-1"
                                        onClick={() =>
                                            openProfileDetailModal(
                                                theme.author.id
                                            )
                                        }
                                    >
                                        <Avatar className="h-5 w-5 border border-border">
                                            <AvatarImage
                                                src={
                                                    theme.author.avatarUrl ||
                                                    "https://cdn.discordapp.com/embed/avatars/1.png"
                                                }
                                                alt={theme.author.nickname}
                                            />
                                            <AvatarFallback className="bg-muted text-xs text-primary font-bold">
                                                {theme.author.nickname
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {theme.author.nickname}
                                    </button>
                                    <span>
                                        <UTCToKST date={theme.createdAt} />
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 태그, 시간, 인원, 가격 정보 - 더 가시적으로 표시 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {/* 인원 정보 */}
                            <div className="flex items-center p-4 bg-muted/40 rounded-lg">
                                <Users className="h-5 w-5 mr-3 text-primary" />
                                <div>
                                    <div className="text-sm text-muted-foreground">
                                        인원
                                    </div>
                                    <div className="font-medium">
                                        {theme.playersMin === theme.playersMax
                                            ? `${theme.playersMin}인`
                                            : `${theme.playersMin}~${theme.playersMax}인`}
                                    </div>
                                </div>
                            </div>

                            {/* 플레이 시간 */}
                            <div className="flex items-center p-4 bg-muted/40 rounded-lg">
                                <Clock className="h-5 w-5 mr-3 text-primary" />
                                <div>
                                    <div className="text-sm text-muted-foreground">
                                        플레이 시간
                                    </div>
                                    <div className="font-medium">
                                        {formatPlayTime(
                                            theme.playTimeMin,
                                            theme.playTimeMax
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 가격 */}
                            <div className="flex items-center p-4 bg-muted/40 rounded-lg">
                                <CreditCard className="h-5 w-5 mr-3 text-primary" />
                                <div>
                                    <div className="text-sm text-muted-foreground">
                                        가격
                                    </div>
                                    <div className="font-medium">
                                        {typeof theme.price === "number"
                                            ? `${theme.price.toLocaleString()}원`
                                            : "정보 없음"}
                                    </div>
                                </div>
                            </div>

                            {/* 태그 */}
                            <div className="flex items-center p-4 bg-muted/40 rounded-lg">
                                <Tag className="h-5 w-5 mr-3 text-primary" />
                                <div>
                                    <div className="text-sm text-muted-foreground">
                                        태그
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {theme.tags && theme.tags.length > 0 ? (
                                            theme.tags.map((tag, idx) => (
                                                <Badge
                                                    key={idx}
                                                    variant="secondary"
                                                    className="bg-primary/10 text-primary text-xs"
                                                >
                                                    #{tag}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-muted-foreground text-sm">
                                                태그 없음
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 크라임씬 전용 정보 */}
                        {theme.type === "CRIMESCENE" &&
                            (theme.team ||
                                theme.guild ||
                                theme.extra?.characters?.length > 0) && (
                                <div className="bg-muted/40 rounded-lg p-6 mb-6">
                                    <h2 className="text-lg font-bold mb-4">
                                        크라임씬 정보
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* 팀 및 길드 정보 */}
                                        <div className="space-y-4">
                                            {theme.team && (
                                                <div>
                                                    {/* 팀원 수에 따라 제목 변경 */}
                                                    {isLoadingTeam ? (
                                                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                                            팀 정보
                                                        </h3>
                                                    ) : teamError ? (
                                                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                                            팀 정보
                                                        </h3>
                                                    ) : teamData?.members &&
                                                      teamData.members
                                                          .length === 1 ? (
                                                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                                            제작자 정보
                                                        </h3>
                                                    ) : teamData?.members &&
                                                      teamData.members.length >
                                                          1 ? (
                                                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                                            합작팀 정보
                                                        </h3>
                                                    ) : theme.team.members &&
                                                      theme.team.members
                                                          .length === 1 ? (
                                                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                                            제작자 정보
                                                        </h3>
                                                    ) : theme.team.members &&
                                                      theme.team.members
                                                          .length > 1 ? (
                                                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                                            합작팀 정보
                                                        </h3>
                                                    ) : (
                                                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                                            팀 정보
                                                        </h3>
                                                    )}

                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                                                            {theme.team.name}
                                                        </span>
                                                    </div>

                                                    {/* 팀원 정보 표시 - 한 명일 경우와 여러 명일 경우 다르게 표시 */}
                                                    {isLoadingTeam ? (
                                                        <div className="mt-3">
                                                            <span className="text-sm text-muted-foreground">
                                                                팀원 로딩 중...
                                                            </span>
                                                        </div>
                                                    ) : teamError ? (
                                                        <div className="mt-3">
                                                            <span className="text-sm text-muted-foreground">
                                                                팀원 정보를
                                                                불러올 수
                                                                없습니다.
                                                            </span>
                                                        </div>
                                                    ) : teamData?.members &&
                                                      teamData.members
                                                          .length === 1 ? (
                                                        <div className="mt-3">
                                                            {/* 단일 제작자 표시 방식 */}
                                                            <div className="flex items-center gap-4">
                                                                <button
                                                                    className="relative"
                                                                    onClick={() =>
                                                                        teamData
                                                                            .members[0]
                                                                            .userId
                                                                            ? openProfileDetailModal(
                                                                                  teamData
                                                                                      .members[0]
                                                                                      .userId
                                                                              )
                                                                            : null
                                                                    }
                                                                    disabled={
                                                                        !teamData
                                                                            .members[0]
                                                                            .userId
                                                                    }
                                                                >
                                                                    <Avatar className="h-16 w-16 border border-border hover:border-primary transition-colors">
                                                                        <AvatarImage
                                                                            src={
                                                                                teamData
                                                                                    .members[0]
                                                                                    .avatarUrl ||
                                                                                ""
                                                                            }
                                                                            alt={
                                                                                teamData
                                                                                    .members[0]
                                                                                    .name ||
                                                                                ""
                                                                            }
                                                                        />
                                                                        <AvatarFallback className="bg-muted text-primary font-medium text-lg">
                                                                            {teamData
                                                                                .members[0]
                                                                                .name
                                                                                ? teamData.members[0].name
                                                                                      .charAt(
                                                                                          0
                                                                                      )
                                                                                      .toUpperCase()
                                                                                : "?"}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    {teamData
                                                                        .members[0]
                                                                        .leader && (
                                                                        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-yellow-500 text-white rounded-full text-xs">
                                                                            ★
                                                                        </span>
                                                                    )}
                                                                </button>
                                                                <div className="flex flex-col">
                                                                    <button
                                                                        className="text-sm font-medium hover:text-primary transition-colors"
                                                                        onClick={() =>
                                                                            teamData
                                                                                .members[0]
                                                                                .userId
                                                                                ? openProfileDetailModal(
                                                                                      teamData
                                                                                          .members[0]
                                                                                          .userId
                                                                                  )
                                                                                : null
                                                                        }
                                                                        disabled={
                                                                            !teamData
                                                                                .members[0]
                                                                                .userId
                                                                        }
                                                                    >
                                                                        {
                                                                            teamData
                                                                                .members[0]
                                                                                .name
                                                                        }
                                                                    </button>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        테마
                                                                        제작자
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : teamData?.members &&
                                                      teamData.members.length >
                                                          1 ? (
                                                        <div className="mt-3">
                                                            <span className="text-sm text-muted-foreground">
                                                                팀원:
                                                            </span>
                                                            <div className="flex flex-wrap gap-4 mt-3">
                                                                {teamData.members.map(
                                                                    (
                                                                        member
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                member.id
                                                                            }
                                                                            className="flex flex-col items-center"
                                                                        >
                                                                            <button
                                                                                className="relative"
                                                                                onClick={() =>
                                                                                    member.userId
                                                                                        ? openProfileDetailModal(
                                                                                              member.userId
                                                                                          )
                                                                                        : null
                                                                                }
                                                                                disabled={
                                                                                    !member.userId
                                                                                }
                                                                            >
                                                                                <Avatar className="h-12 w-12 border border-border hover:border-primary transition-colors">
                                                                                    <AvatarImage
                                                                                        src={
                                                                                            member.avatarUrl ||
                                                                                            ""
                                                                                        }
                                                                                        alt={
                                                                                            member.name ||
                                                                                            ""
                                                                                        }
                                                                                    />
                                                                                    <AvatarFallback className="bg-muted text-primary font-medium">
                                                                                        {member.name
                                                                                            ? member.name
                                                                                                  .charAt(
                                                                                                      0
                                                                                                  )
                                                                                                  .toUpperCase()
                                                                                            : "?"}
                                                                                    </AvatarFallback>
                                                                                </Avatar>
                                                                                {member.leader && (
                                                                                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-yellow-500 text-white rounded-full text-xs">
                                                                                        ★
                                                                                    </span>
                                                                                )}
                                                                            </button>
                                                                            <button
                                                                                className="mt-1 text-xs font-medium hover:text-primary transition-colors"
                                                                                onClick={() =>
                                                                                    member.userId
                                                                                        ? openProfileDetailModal(
                                                                                              member.userId
                                                                                          )
                                                                                        : null
                                                                                }
                                                                                disabled={
                                                                                    !member.userId
                                                                                }
                                                                            >
                                                                                {
                                                                                    member.name
                                                                                }
                                                                            </button>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : theme.team.members &&
                                                      theme.team.members
                                                          .length === 1 ? (
                                                        <div className="mt-3">
                                                            {/* 단일 제작자 표시 방식 (기본 팀 정보만 있는 경우) */}
                                                            <span className="text-sm text-muted-foreground">
                                                                제작자:
                                                            </span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <button
                                                                    className="inline-flex items-center gap-1 text-sm px-2 py-1 border border-border rounded-md hover:bg-muted transition-colors"
                                                                    onClick={() =>
                                                                        theme
                                                                            .team
                                                                            .members[0]
                                                                            .userId
                                                                            ? openProfileDetailModal(
                                                                                  theme
                                                                                      .team
                                                                                      .members[0]
                                                                                      .userId
                                                                              )
                                                                            : null
                                                                    }
                                                                    disabled={
                                                                        !theme
                                                                            .team
                                                                            .members[0]
                                                                            .userId
                                                                    }
                                                                >
                                                                    {theme.team
                                                                        .members[0]
                                                                        .leader && (
                                                                        <span className="text-yellow-500 text-xs">
                                                                            ★
                                                                        </span>
                                                                    )}
                                                                    {
                                                                        theme
                                                                            .team
                                                                            .members[0]
                                                                            .name
                                                                    }
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : theme.team.members &&
                                                      theme.team.members
                                                          .length > 1 ? (
                                                        <div className="mt-3">
                                                            <span className="text-sm text-muted-foreground">
                                                                팀원:
                                                            </span>
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                {theme.team.members.map(
                                                                    (
                                                                        member
                                                                    ) => (
                                                                        <button
                                                                            key={
                                                                                member.id
                                                                            }
                                                                            className="inline-flex items-center gap-1 text-sm px-2 py-1 border border-border rounded-md hover:bg-muted transition-colors"
                                                                            onClick={() =>
                                                                                member.userId
                                                                                    ? openProfileDetailModal(
                                                                                          member.userId
                                                                                      )
                                                                                    : null
                                                                            }
                                                                            disabled={
                                                                                !member.userId
                                                                            }
                                                                        >
                                                                            {member.leader && (
                                                                                <span className="text-yellow-500 text-xs">
                                                                                    ★
                                                                                </span>
                                                                            )}
                                                                            {
                                                                                member.name
                                                                            }
                                                                        </button>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}

                                            {theme.guild && (
                                                <div className="mt-4">
                                                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                                        길드 정보
                                                    </h3>
                                                    <button
                                                        className="bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-400 px-3 py-1 rounded-full text-sm font-medium transition-colors"
                                                        onClick={() =>
                                                            setShowGuildModal(
                                                                true
                                                            )
                                                        }
                                                    >
                                                        {theme.guild.name}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* 등장 캐릭터 */}
                                        {theme.extra?.characters?.length >
                                            0 && (
                                            <div>
                                                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                                    등장 캐릭터
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {theme.extra.characters.map(
                                                        (char, idx) => (
                                                            <Badge
                                                                key={idx}
                                                                variant="secondary"
                                                                className="bg-muted/70"
                                                            >
                                                                {char}
                                                            </Badge>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        {/* 기록 요청 버튼 - 사용 가능할 때만 표시 */}
                        {user?.id && !hasPlayedGame && (
                            <div className="mb-6">
                                <Button
                                    variant="default"
                                    size="lg"
                                    onClick={() => setShowRequestModal(true)}
                                    disabled={isCheckingRequest}
                                    className="w-full py-6 bg-primary/90 hover:bg-primary"
                                >
                                    {isCheckingRequest ? (
                                        <>확인 중...</>
                                    ) : (
                                        <>
                                            <FileText className="h-5 w-5 mr-2" />
                                            이 테마 플레이 기록 요청하기
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* 설명 섹션 - 간략화 */}
                    {theme.summary && (
                        <div className="bg-card rounded-lg border p-6 mb-8">
                            <span className="text-xl font-bold mb-4">개요</span>
                            <p className="text-lg text-foreground break-words whitespace-pre-line leading-relaxed">
                                {theme.summary}
                            </p>
                        </div>
                    )}

                    {/* 내용 섹션 */}
                    <div className="bg-card rounded-lg border p-6 mb-8">
                        <h2 className="text-xl font-bold mb-4">상세 내용</h2>
                        <div className="prose max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90">
                            <MarkdownRenderer content={theme.content} />
                        </div>
                    </div>

                    {/* 댓글 섹션 */}
                    {theme.commentEnabled && id && (
                        <div
                            className="bg-card rounded-lg border p-6"
                            ref={commentsRef}
                        >
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                댓글
                                <Badge variant="outline" className="ml-2">
                                    {theme.comments?.length || 0}
                                </Badge>
                            </h2>
                            <CommentList
                                gameThemeId={id}
                                currentUserId={user?.id}
                                hasPlayedGame={hasPlayedGame}
                            />
                        </div>
                    )}
                </div>

                <AlertDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                정말 삭제하시겠습니까?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                이 작업은 되돌릴 수 없습니다.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={handleDelete}
                            >
                                삭제
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog
                    open={showLoginDialog}
                    onOpenChange={setShowLoginDialog}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                로그인이 필요합니다
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                추천 기능은 로그인한 사용자만 사용할 수
                                있습니다.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>닫기</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    setShowLoginDialog(false);
                                    navigate("/login");
                                }}
                            >
                                로그인 하러 가기
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Dialog
                    open={showRequestModal}
                    onOpenChange={(open) => {
                        setShowRequestModal(open);
                        if (!open) setRequestMessage("");
                    }}
                >
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>기록 요청</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="request-message">
                                    요청 메시지
                                </Label>
                                <Textarea
                                    id="request-message"
                                    placeholder="기록 요청 내용을 작성해주세요..."
                                    value={requestMessage}
                                    onChange={(e) =>
                                        setRequestMessage(e.target.value)
                                    }
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowRequestModal(false)}
                            >
                                취소
                            </Button>
                            <Button
                                onClick={handleRequestGame}
                                disabled={
                                    isSubmittingRequest ||
                                    !requestMessage.trim()
                                }
                            >
                                {isSubmittingRequest ? (
                                    <>전송 중...</>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        요청 전송
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <ContactUserModal
                open={showContactModal}
                userId={theme.author.id}
                onOpenChange={setShowContactModal}
            />
            {/* TeamInfoModal은 더 이상 사용하지 않음 */}
            {theme.type === "CRIMESCENE" && theme.guild && (
                <GuildInfoModal
                    open={showGuildModal}
                    guildSnowflake={theme.guild.snowflake}
                    onOpenChange={setShowGuildModal}
                />
            )}

            {/* 프로필 상세 모달 */}
            {selectedPost && (
                <PostDetailModal
                    post={selectedPost}
                    isOpen={showProfileModal}
                    onClose={() => setShowProfileModal(false)}
                    userId={selectedUserId}
                />
            )}

            {/* 프로필 디테일 모달 */}
            {profileDetailUserId && (
                <ProfileDetailModal
                    userId={profileDetailUserId}
                    open={showProfileDetailModal}
                    onOpenChange={setShowProfileDetailModal}
                />
            )}
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
