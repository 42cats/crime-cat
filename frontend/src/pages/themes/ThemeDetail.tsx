import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Heart, ChevronLeft, Share2, Edit, Trash } from "lucide-react";
import { themesService } from "@/api/themesService";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
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
  const location = useLocation();
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const { data: theme, isLoading, error } = useQuery({
    queryKey: ["theme", id],
    queryFn: () => (id ? themesService.getThemeById(id) : Promise.reject("No ID provided")),
    enabled: !!id,
  });

  const { data: liked = false } = useQuery({
    queryKey: ["theme-like", id],
    queryFn: () => (id ? themesService.getLikeStatus(id) : false),
    enabled: !!id,
  });

  const likeMutation = useMutation({
    mutationFn: () => id && themesService.setLike(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["theme-like", id] }),
  });

  const unlikeMutation = useMutation({
    mutationFn: () => id && themesService.cancelLike(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["theme-like", id] }),
  });

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

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
      toast({ title: "링크 복사 완료", description: "현재 페이지 링크가 복사되었습니다." });
    } catch {
      toast({ title: "복사 실패", description: "브라우저 설정을 확인해주세요.", variant: "destructive" });
    }
  };

  const handleToggleLike = () => {
    if (!id) return;
    liked ? unlikeMutation.mutate() : likeMutation.mutate();
  };

  const handleDelete = async () => {
    if (!theme) return;
    try {
      await themesService.deleteTheme(theme.id);
      toast({ title: "삭제 완료", description: "테마가 삭제되었습니다." });
      navigate(`/themes/${theme.type.toLowerCase()}`);
    } catch {
      toast({ title: "삭제 실패", description: "문제가 발생했습니다.", variant: "destructive" });
    }
  };

  const handleBackToList = () => {
    navigate(`/themes/${theme?.type.toLowerCase()}`);
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
          <h1 className="text-3xl font-bold mb-4">테마를 찾을 수 없습니다</h1>
          <p className="text-muted-foreground">요청하신 테마가 존재하지 않거나 오류가 발생했습니다.</p>
        </div>
      </PageTransition>
    );
  }

  const playerText = theme.playersMin === theme.playersMax
    ? `${theme.playersMin}인`
    : `${theme.playersMin}~${theme.playersMax}인`;

  return (
    <PageTransition>
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <button
              onClick={handleBackToList}
              className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> 테마 목록으로 돌아가기
            </button>
          </div>

          <div className="flex flex-col gap-8">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden">
              <img
                src={`${backendUrl}${encodeURI(theme.thumbnail)}`}
                alt={theme.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
              <h1 className="text-3xl md:text-4xl font-bold">{theme.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" className={`group ${liked ? "text-red-500" : ""}`} onClick={handleToggleLike}>
                  <Heart className={`h-4 w-4 mr-2 ${liked ? "fill-red-500" : "group-hover:fill-red-500/10"}`} />
                  추천 {theme.recommendations + (liked ? 1 : 0)}
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" /> 공유
                </Button>
                {(user?.id === theme.authorId || hasRole(["ADMIN", "MANAGER"])) && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/themes/edit/${theme.id}`, { state: { theme } })}>
                      <Edit className="h-4 w-4 mr-2" /> 수정
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setIsDeleteDialogOpen(true)}>
                      <Trash className="h-4 w-4 mr-2" /> 삭제
                    </Button>
                  </>
                )}
              </div>
            </div>

            <p className="text-lg text-muted-foreground">{theme.summary}</p>

            <div className="space-y-2 text-sm md:text-base">
              <div><strong>인원:</strong> {playerText}</div>
              <div><strong>플레이 시간:</strong> {formatPlayTime(theme.playtime)}</div>
              <div><strong>가격:</strong> {theme.price.toLocaleString()}원</div>
              <div><strong>태그:</strong> {theme.tags.join(", ")}</div>
              {theme.type === "CRIMESCENE" && (
                <>
                  <div><strong>길드 ID:</strong> {theme.guildSnowflake}</div>
                  <div><strong>캐릭터 수:</strong> {(theme.extra?.characters?.length || 0).toLocaleString()}</div>
                </>
              )}
            </div>

            <div className="prose prose-lg max-w-none dark:prose-invert">
              <ReactMarkdown>{theme.content}</ReactMarkdown>
            </div>
          </div>
        </div>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
};

const SkeletonPage = () => (
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
