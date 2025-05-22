import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { userPostService, UserPostDto } from "@/api/posts/postService";
import { authService } from "@/api/authService";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import VerticalPostLayout from "@/components/profile/post-detail/VerticalPostLayout";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/useToast";

const PostDetailPage: React.FC = () => {
    const { postId } = useParams<{ postId: string }>();
    const [post, setPost] = useState<UserPostDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [likeLoading, setLikeLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isAuthor, setIsAuthor] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const navigate = useNavigate();
    const { toast } = useToast();

    // 포스트 삭제
    const handleDelete = async () => {
        if (!post) return;

        try {
            await userPostService.deletePost(post.postId);
            toast({
                title: "삭제 완료",
                description: "포스트가 성공적으로 삭제되었습니다.",
            });
            navigate("/dashboard/posts");
        } catch (error) {
            console.error("포스트 삭제 실패:", error);
            toast({
                title: "삭제 실패",
                description: "포스트를 삭제하는데 실패했습니다.",
                variant: "destructive",
            });
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    // 포스트 수정
    const handleEdit = () => {
        if (!post) return;
        navigate(`/dashboard/posts/edit/${post.postId}`);
    };

    const handleLoginRequired = () => {
        toast({
            title: "로그인 필요",
            description: "이 기능을 사용하려면 로그인이 필요합니다.",
            variant: "destructive",
        });
        navigate("/login");
    };

    // 포스트 정보 로드
    useEffect(() => {
        if (!postId) return;

        const loadPost = async () => {
            setLoading(true);
            try {
                const data = await userPostService.getUserPostDetail(postId);
                setPost(data);
                setLiked(data.liked);
                setLikeCount(data.likeCount);

                // 작성자 권한 확인
                try {
                    const currentUser = await authService.getCurrentUser();
                    setCurrentUserId(currentUser?.id || null);
                    setIsAuthor(currentUser?.id === data.authorId);
                } catch (authError) {
                    console.log("사용자 인증 정보 없음:", authError);
                    setCurrentUserId(null);
                    setIsAuthor(false);
                }
            } catch (error) {
                console.error("포스트 로드 실패:", error);
                setError("포스트를 불러오는데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };

        loadPost();
    }, [postId]);

    // 좋아요 토글
    const handleLikeToggle = async () => {
        if (!post) return;

        setLikeLoading(true);
        try {
            const result = await userPostService.togglePostLike(post.postId);
            setLiked(result);
            setLikeCount((prev) => (result ? prev + 1 : prev - 1));
            toast({
                title: result ? "좋아요" : "좋아요 취소",
                description: result
                    ? "포스트를 좋아합니다."
                    : "좋아요를 취소했습니다.",
            });
        } catch (error) {
            console.error("좋아요 토글 실패:", error);
            toast({
                title: "좋아요 실패",
                description: "작업을 처리하는데 실패했습니다.",
                variant: "destructive",
            });
        } finally {
            setLikeLoading(false);
        }
    };

    // 포스트 공유
    const handleShare = async () => {
        if (!post) return;

        try {
            const url = `${window.location.origin}/profile/${post.postId}`;
            await navigator.clipboard.writeText(url);
            toast({
                title: "링크 복사 완료",
                description: "포스트 링크가 복사되었습니다.",
            });
        } catch (error) {
            toast({
                title: "복사 실패",
                description: "브라우저 설정을 확인해주세요.",
                variant: "destructive",
            });
        }
    };

    // 로딩 상태 표시
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">포스트를 불러오는 중...</p>
            </div>
        );
    }

    // 에러 표시
    if (error || !post) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <div className="text-center max-w-md">
                    <div className="h-16 w-16 text-muted-foreground opacity-30 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">
                        포스트를 찾을 수 없습니다
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        {error ||
                            "요청한 포스트가 존재하지 않거나 접근할 수 없습니다."}
                    </p>
                    <Button onClick={() => navigate("/dashboard/posts")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        포스트 목록으로 돌아가기
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/dashboard/posts")}
                        className="mr-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        뒤로가기
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">
                        포스트 상세
                    </h1>
                </div>
            </div>

            <Separator />

            {/* VerticalPostLayout 사용 */}
            <div className="max-w-2xl mx-auto">
                <VerticalPostLayout
                    post={post}
                    profile={null}
                    liked={liked}
                    isLikeLoading={likeLoading}
                    likeCount={likeCount}
                    handleLike={handleLikeToggle}
                    handleShare={handleShare}
                    handleLoginRequired={handleLoginRequired}
                    userId={currentUserId || undefined}
                    onEdit={handleEdit}
                    onDelete={() => setDeleteDialogOpen(true)}
                    isAuthor={isAuthor}
                />
            </div>

            {/* 삭제 확인 대화상자 */}
            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>포스트 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                            이 포스트를 정말 삭제하시겠습니까? 이 작업은 되돌릴
                            수 없습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PostDetailPage;
