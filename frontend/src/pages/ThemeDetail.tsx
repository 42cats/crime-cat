import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Heart, ChevronLeft, Share2, Edit, Trash } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { themesService } from "@/api/themesService";
import { Skeleton } from "@/components/ui/skeleton";
import ThemePasswordDialog from "@/components/ThemePasswordDialog";
import { useToast } from "@/components/ui/use-toast";
import ReactMarkdown from "react-markdown";
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

const ThemeDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, hasRole } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [liked, setLiked] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [passwordAction, setPasswordAction] = useState<"edit" | "delete">(
        "edit"
    );

    // 테마 데이터 가져오기
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
    const formatPlayTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) return `${hours}시간 ${mins}분`;
        if (hours > 0) return `${hours}시간`;
        return `${mins}분`;
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast({
                title: "링크 복사 완료",
                description: "현재 페이지 링크가 클립보드에 복사되었습니다.",
            });
        } catch (error) {
            toast({
                title: "복사 실패",
                description:
                    "링크 복사에 실패했습니다. 브라우저를 확인해주세요.",
                variant: "destructive",
            });
        }
    };

    // 테마 삭제 뮤테이션
    const deleteMutation = useMutation({
        mutationFn: async (password: string) => {
            if (!id) throw new Error("No ID provided");
            return themesService.deleteTheme(id, password);
        },
        onSuccess: () => {
            toast({
                title: "Theme deleted",
                description: "해당 테마가 성공적으로 삭제되었습니다.",
            });
            navigate("/themes");
        },
        onError: (error) => {
            toast({
                title: "오류",
                description:
                    error instanceof Error
                        ? error.message
                        : "테마 삭제 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        },
    });

    // 사용자 권한 확인
    const canAdminEdit = hasRole(["ADMIN", "MANAGER"]);

    const handleEdit = () => {
        if (!theme) return;

        // 관리자면 비밀번호 불필요
        if (canAdminEdit) {
            navigate(`/dashboard/themes/${theme.id}/edit`);
            return;
        }

        // 일반 사용자면 비밀번호 필요
        setPasswordAction("edit");
        setIsPasswordDialogOpen(true);
    };

    const handleDelete = () => {
        if (!theme) return;

        // 관리자면 바로 확인 모달
        if (canAdminEdit) {
            setIsDeleteDialogOpen(true);
            return;
        }

        // 일반 사용자면 비밀번호 먼저
        setPasswordAction("delete");
        setIsPasswordDialogOpen(true);
    };

    const toggleLike = () => {
        setLiked((prev) => !prev);
        // 실제 앱이라면 DB에 추천 count 반영
    };

    // 비밀번호 입력 성공 시 동작
    const handlePasswordSuccess = () => {
        if (!theme) return;

        if (passwordAction === "edit") {
            navigate(`/dashboard/themes/${theme.id}/edit`);
        } else if (passwordAction === "delete") {
            setIsDeleteDialogOpen(true);
        }
    };

    // 삭제 확정
    const confirmDelete = () => {
        if (!theme || !id) return;

        // 관리자라면 바로 삭제
        if (canAdminEdit) {
            deleteMutation.mutate("");
        } else {
            // 일반 사용자는 이미 입력한 비밀번호로 삭제
            deleteMutation.mutate(theme.password || "");
        }
    };

    if (isLoading) {
        return (
            <PageTransition>
                <div className="container mx-auto px-6 py-20">
                    <div className="mb-8">
                        <Link
                            to="/themes"
                            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            테마 목록으로 돌아가기
                        </Link>
                    </div>
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
            </PageTransition>
        );
    }

    if (error || !theme) {
        return (
            <PageTransition>
                <div className="container mx-auto px-6 py-20">
                    <div className="mb-8">
                        <Link
                            to="/themes"
                            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            테마 목록으로 돌아가기
                        </Link>
                    </div>
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-3xl font-bold mb-4">
                            테마를 찾을 수 없습니다
                        </h1>
                        <p className="text-muted-foreground">
                            요청하신 테마가 존재하지 않거나 불러오는 도중 오류가
                            발생했습니다.
                        </p>
                        <Button
                            className="mt-8"
                            onClick={() => navigate("/themes")}
                        >
                            전체 테마 보기
                        </Button>
                    </div>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <div className="container mx-auto px-6 py-20">
                <div className="max-w-4xl mx-auto">
                    {/* 상단으로 돌아가기 버튼 */}
                    <div className="mb-8">
                        <Link
                            to="/themes"
                            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            테마 목록으로 돌아가기
                        </Link>
                    </div>

                    {/* 상세 컨테이너 */}
                    <div className="flex flex-col gap-8">
                        {/* 썸네일 */}
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                            <img
                                src={encodeURI(theme.thumbnail)}
                                alt={theme.title}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* 상단 영역: 제목, 추천, 공유, 수정/삭제 버튼 */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h1 className="text-3xl md:text-4xl font-bold">
                                {theme.title}
                            </h1>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`group ${
                                        liked ? "text-red-500" : ""
                                    }`}
                                    onClick={toggleLike}
                                >
                                    <Heart
                                        className={`h-4 w-4 mr-2 ${
                                            liked
                                                ? "fill-red-500"
                                                : "group-hover:fill-red-500/10"
                                        }`}
                                    />
                                    추천{" "}
                                    {theme.recommendations + (liked ? 1 : 0)}
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="group"
                                    onClick={handleShare}
                                >
                                    <Share2 className="h-4 w-4 mr-2" />
                                    공유
                                </Button>
                                {theme.contact && (
                                    <a
                                        href={theme.contact}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex"
                                    >
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="group"
                                        >
                                            연락하기
                                        </Button>
                                    </a>
                                )}

                                {user && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="group"
                                            onClick={handleEdit}
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            수정
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="group text-destructive hover:bg-destructive/10"
                                            onClick={handleDelete}
                                        >
                                            <Trash className="h-4 w-4 mr-2" />
                                            삭제
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 간단 소개 */}
                        <p className="text-lg text-muted-foreground">
                            {theme.description}
                        </p>

                        {/* 상세 정보 - makers, players, characters, price, tags */}
                        <div className="space-y-2 text-sm md:text-base">
                            <div>
                                <strong>제작자:</strong>{" "}
                                {theme.makers.join(", ")}
                            </div>
                            <div>
                                <strong>플레이어 수:</strong> {theme.players}인
                            </div>
                            <div>
                                <strong>등장 캐릭터:</strong>{" "}
                                {theme.characters.join(", ")}
                            </div>
                            <div>
                                <strong>예상 소요 시간:</strong>{" "}
                                {formatPlayTime(theme.time)}
                            </div>
                            <div>
                                <strong>가격:</strong>{" "}
                                {theme.price.toLocaleString()}원
                            </div>
                            <div>
                                <strong>태그:</strong> {theme.tags.join(", ")}
                            </div>
                        </div>

                        {/* 본문(마크다운 지원) */}
                        <div className="prose prose-lg max-w-none dark:prose-invert">
                            <ReactMarkdown>{theme.content}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>

            {/* 비밀번호 입력 다이얼로그 */}
            <ThemePasswordDialog
                isOpen={isPasswordDialogOpen}
                setIsOpen={setIsPasswordDialogOpen}
                title={passwordAction === "edit" ? "테마 수정" : "테마 삭제"}
                description={
                    passwordAction === "edit"
                        ? "이 테마를 수정하려면 비밀번호를 입력하세요."
                        : "이 테마를 삭제하려면 비밀번호를 입력하세요."
                }
                correctPassword={theme.password || ""}
                onSuccess={handlePasswordSuccess}
            />

            {/* 삭제 확인 다이얼로그 */}
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
                            이 작업은 되돌릴 수 없습니다. 테마가 영구적으로
                            삭제되며 복구할 수 없습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmDelete}
                        >
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageTransition>
    );
};

export default ThemeDetail;
