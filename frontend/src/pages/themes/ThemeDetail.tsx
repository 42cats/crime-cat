import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Heart, ChevronLeft, Share2, Edit, Trash } from "lucide-react";
import { themesService } from "@/api/themesService";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { commentService } from "@/api/commentService";
import MarkdownRenderer from "@/components/MarkdownRenderer";
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
import TeamInfoModal from "@/components/themes/modals/TeamInfoModal";
import GuildInfoModal from "@/components/themes/modals/GuildInfoModal";
import { CommentList } from "@/components/comments";

const ThemeDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, hasRole } = useAuth();
    const queryClient = useQueryClient();

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [showGuildModal, setShowGuildModal] = useState(false);
    const [hasPlayedGame, setHasPlayedGame] = useState(false);

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
        queryFn: () => id ? themesService.getLikeStatus(id) : Promise.resolve(false),
        enabled: !!id && !!user?.id,
    });

    useEffect(() => {
        const checkGamePlayed = async () => {
            if (user?.id && id) {
                try {
                    const played = await commentService.checkGamePlayed(id);
                    setHasPlayedGame(played);
                } catch (err) {
                    console.error("게임 플레이 여부 확인 중 오류 발생:", err);
                    setHasPlayedGame(false);
                }
            }
        };

        checkGamePlayed();
    }, [user?.id, id]);

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
                <div className="max-w-4xl mx-auto space-y-8">
                    <button
                        onClick={() =>
                            navigate(`/themes/${theme.type.toLowerCase()}`)
                        }
                        className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" /> 테마 목록으로
                        돌아가기
                    </button>

                    <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                        <img
                            src={`${theme.thumbnail}`}
                            alt={theme.title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-3xl font-bold break-words">
                                {theme.title}
                            </h1>
                        </div>
                        <div className="flex flex-col gap-2 items-end text-right w-full sm:w-auto">
                            <div className="flex justify-end gap-2 flex-wrap">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`group ${
                                        liked ? "text-red-500" : ""
                                    }`}
                                    onClick={handleToggleLike}
                                >
                                    <Heart
                                        className={`h-4 w-4 mr-2 ${
                                            liked
                                                ? "fill-red-500"
                                                : "group-hover:fill-red-500/10"
                                        }`}
                                    />
                                    추천 {theme.recommendations}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleShare}
                                >
                                    <Share2 className="h-4 w-4 mr-2" /> 공유
                                </Button>
                                {(user?.id === theme.author.id ||
                                    hasRole(["ADMIN", "MANAGER"])) && (
                                    <>
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
                                            <Edit className="h-4 w-4 mr-2" />{" "}
                                            수정
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10"
                                            onClick={() =>
                                                setIsDeleteDialogOpen(true)
                                            }
                                        >
                                            <Trash className="h-4 w-4 mr-2" />{" "}
                                            삭제
                                        </Button>
                                    </>
                                )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <div>
                                    <strong>작성자</strong>{" "}
                                    <button
                                        className="hover:text-primary transition-colors"
                                        onClick={() =>
                                            setShowContactModal(true)
                                        }
                                    >
                                        {theme.author.nickname}
                                    </button>
                                </div>
                                <div>
                                    <strong>생성일</strong>{" "}
                                    <UTCToKST date={theme.createdAt} />
                                </div>
                                <div>
                                    <strong>수정일</strong>{" "}
                                    <UTCToKST date={theme.updatedAt} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {theme.summary && (
                        <section>
                            <h2 className="text-sm font-semibold text-muted-foreground mb-1">
                                설명
                            </h2>
                            <p className="text-base text-foreground break-words whitespace-pre-line">
                                {theme.summary}
                            </p>
                        </section>
                    )}

                    <section className="mt-6">
                        <h2 className="text-sm font-semibold text-muted-foreground mb-1">
                            카테고리
                        </h2>
                        <Badge variant="secondary">{theme.type}</Badge>
                    </section>

                    <section className="mt-6">
                        <h2 className="text-sm font-semibold text-muted-foreground mb-1">
                            인원
                        </h2>
                        <p className="text-base text-foreground">
                            {theme.playersMin === theme.playersMax
                                ? `${theme.playersMin}인`
                                : `${theme.playersMin}~${theme.playersMax}인`}
                        </p>
                    </section>

                    <section className="mt-6">
                        <h2 className="text-sm font-semibold text-muted-foreground mb-1">
                            플레이 시간
                        </h2>
                        <p className="text-base text-foreground">
                            {formatPlayTime(
                                theme.playTimeMin,
                                theme.playTimeMax
                            )}
                        </p>
                    </section>

                    <section className="mt-6">
                        <h2 className="text-sm font-semibold text-muted-foreground mb-1">
                            가격
                        </h2>
                        <p className="text-base text-foreground">
                            {typeof theme.price === "number"
                                ? `${theme.price.toLocaleString()}원`
                                : "정보 없음"}
                        </p>
                    </section>

                    {theme.tags?.length > 0 && (
                        <section className="mt-6">
                            <h2 className="text-sm font-semibold text-muted-foreground mb-1">
                                태그
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {theme.tags.map((tag, idx) => (
                                    <Badge key={idx} variant="outline">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        </section>
                    )}

                    {theme.type === "CRIMESCENE" &&
                        (theme.extra?.characters?.length ||
                            theme.team ||
                            theme.guild) && (
                            <>
                                {(theme.team || theme.guild) && (
                                    <section className="mt-6">
                                        {theme.team && (
                                            <div>
                                                <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                                                    팀 이름
                                                </h3>
                                                <button
                                                    className="hover:text-primary transition-colors"
                                                    onClick={() =>
                                                        setShowTeamModal(true)
                                                    }
                                                >
                                                    {theme.team.name}
                                                </button>
                                            </div>
                                        )}
                                        {theme.guild && (
                                            <div className="mt-2">
                                                <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                                                    길드 이름
                                                </h3>
                                                <button
                                                    className="hover:text-primary transition-colors"
                                                    onClick={() =>
                                                        setShowGuildModal(true)
                                                    }
                                                >
                                                    {theme.guild.name}
                                                </button>
                                            </div>
                                        )}
                                    </section>
                                )}

                                {theme.extra?.characters?.length > 0 && (
                                    <section className="mt-6">
                                        <h2 className="text-sm font-semibold text-muted-foreground mb-1">
                                            등장 캐릭터
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            {theme.extra.characters.map(
                                                (char, idx) => (
                                                    <Badge
                                                        key={idx}
                                                        variant="secondary"
                                                    >
                                                        {char}
                                                    </Badge>
                                                )
                                            )}
                                        </div>
                                    </section>
                                )}
                            </>
                        )}

                    <section className="mt-6">
                        <h2 className="text-sm font-semibold text-muted-foreground mb-2">
                            내용
                        </h2>
                        <div className="prose max-w-none dark:prose-invert mt-2">
                            <MarkdownRenderer content={theme.content} />
                        </div>
                    </section>

                    {/* 댓글 섹션 추가 */}
                    {id && (
                        <CommentList
                            gameThemeId={id}
                            currentUserId={user?.id}
                            hasPlayedGame={hasPlayedGame}
                        />
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
            </div>
            <ContactUserModal
                open={showContactModal}
                userId={theme.author.id}
                onOpenChange={setShowContactModal}
            />
            {theme.type === "CRIMESCENE" && theme.team && (
                <TeamInfoModal
                    open={showTeamModal}
                    teamId={theme.team.id}
                    onOpenChange={setShowTeamModal}
                />
            )}
            {theme.type === "CRIMESCENE" && theme.guild && (
                <GuildInfoModal
                    open={showGuildModal}
                    guildSnowflake={theme.guild.snowflake}
                    onOpenChange={setShowGuildModal}
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
