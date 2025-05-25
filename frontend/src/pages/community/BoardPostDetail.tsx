import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BoardType } from "@/lib/types/board";
import { boardPostService } from "@/api/posts/boardPostService";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    MessageSquare,
    ThumbsUp,
    Eye,
    Share2,
    Trash2,
    Edit,
    AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { BoardCommentList } from "@/components/boards/BoardCommentList";
import ProfileDetailModal from "@/components/profile/ProfileDetailModal";

interface BoardPostDetailProps {
    boardType: BoardType;
}

const BoardPostDetail: React.FC<BoardPostDetailProps> = ({ boardType }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user, isAuthenticated } = useAuth();
    const [isSharing, setIsSharing] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>("");

    // 게시글 조회 쿼리
    const {
        data: post,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["boardPost", id],
        queryFn: () => boardPostService.getBoardPostById(id!),
        enabled: !!id,
    });

    // 좋아요 상태 쿼리
    const { data: likeStatus, isLoading: isLikeLoading } = useQuery({
        queryKey: ["postLike", id],
        queryFn: () => boardPostService.getLikeStatus(id!),
        enabled: !!id && isAuthenticated,
    });

    // 좋아요 토글 뮤테이션
    const likeMutation = useMutation({
        mutationFn: () => boardPostService.toggleLike(id!),
        onSuccess: () => {
            // 좋아요 상태와 게시글 데이터 모두 리프레시
            queryClient.invalidateQueries({ queryKey: ["postLike", id] });
            queryClient.invalidateQueries({ queryKey: ["boardPost", id] });
            toast({
                title: likeStatus?.status ? "좋아요 취소" : "좋아요",
                description: likeStatus?.status
                    ? "이 게시글의 좋아요를 취소했습니다."
                    : "이 게시글에 좋아요를 했습니다.",
            });
        },
        onError: (error) => {
            console.error("좋아요 오류:", error);
            toast({
                title: "오류",
                description: "좋아요 처리 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        },
    });

    // 게시글 삭제 뮤테이션
    const deleteMutation = useMutation({
        mutationFn: () => boardPostService.deleteBoardPost(id!),
        onSuccess: () => {
            toast({
                title: "삭제 완료",
                description: "게시글이 성공적으로 삭제되었습니다.",
            });
            navigate(`/community/${boardType.toLowerCase()}`);
        },
        onError: (error) => {
            console.error("삭제 오류:", error);
            toast({
                title: "삭제 오류",
                description: "게시글 삭제 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        },
    });

    const handleBack = () => {
        navigate(`/community/${boardType.toLowerCase()}`);
    };

    const handleLike = () => {
        if (!isAuthenticated) {
            toast({
                title: "로그인 필요",
                description: "좋아요 기능을 사용하려면 로그인이 필요합니다.",
                variant: "destructive",
            });
            return;
        }
        likeMutation.mutate();
    };

    const handleShare = () => {
        setIsSharing(true);

        // 현재 URL을 클립보드에 복사
        try {
            navigator.clipboard.writeText(window.location.href);
            toast({
                title: "링크 복사 완료",
                description: "현재 게시글 주소가 클립보드에 복사되었습니다.",
            });
        } catch (error) {
            console.error("공유 오류:", error);
            toast({
                title: "복사 오류",
                description: "주소를 복사하는 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setIsSharing(false);
        }
    };

    const handleDelete = () => {
        if (window.confirm("정말 이 게시글을 삭제하시겠습니까?")) {
            deleteMutation.mutate();
        }
    };

    const handleEdit = () => {
        navigate(`/community/${boardType.toLowerCase()}/edit/${id}`);
    };

    const handleProfileClick = (userId: number) => {
        setSelectedUserId(userId.toString());
        setProfileModalOpen(true);
    };

    // 현재 사용자가 게시글 작성자인지 확인
    const isAuthor = post && user && post.authorId === user.id;

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">
                        게시글을 불러오는 중...
                    </p>
                </div>
            </div>
        );
    }

    if (isError || !post) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="py-20 text-center">
                    <p className="text-destructive">
                        게시글을 찾을 수 없습니다.
                    </p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={handleBack}
                    >
                        목록으로 돌아가기
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <Button variant="ghost" onClick={handleBack} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                목록으로
            </Button>

            <Card>
                <CardHeader className="border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            {post.postType === "NOTICE" && (
                                <Badge className="mb-2 bg-blue-500">공지</Badge>
                            )}
                            {post.postType === "EVENT" && (
                                <Badge className="mb-2 bg-orange-500">
                                    이벤트
                                </Badge>
                            )}
                            <CardTitle className="text-xl font-bold">
                                {post.title}
                            </CardTitle>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Avatar 
                                className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleProfileClick(post.authorId)}
                            >
                                <AvatarImage
                                    src={post.authorProfileImagePath}
                                    alt={post.authorName}
                                />
                                <AvatarFallback>
                                    {post.authorName.substring(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                            <span 
                                className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                onClick={() => handleProfileClick(post.authorId)}
                            >
                                {post.authorName}
                            </span>
                            <span>•</span>
                            <span>
                                {new Date(post.createdAt).toLocaleString()}
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{post.viewCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <ThumbsUp className="h-4 w-4" />
                                <span>{post.likeCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span>{post.commentCount}</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="py-6">
                    {/* 게시글 내용 */}
                    <div
                        className="prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </CardContent>

                <CardFooter className="flex justify-between border-t py-4">
                    <div>
                        {isAuthor && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleEdit}
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    수정
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDelete}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    삭제
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant={likeStatus?.status ? "default" : "outline"}
                            size="sm"
                            onClick={handleLike}
                            disabled={likeMutation.isPending}
                        >
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            {likeMutation.isPending
                                ? "처리중..."
                                : likeStatus?.status
                                ? "좋아요 취소"
                                : "좋아요"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleShare}
                            disabled={isSharing}
                        >
                            <Share2 className="mr-2 h-4 w-4" />
                            {isSharing ? "복사중..." : "공유"}
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {/* 댓글 영역 */}
            <Card className="mt-6">
                <CardContent className="p-6">
                    {isAuthenticated ? (
                        <BoardCommentList 
                            postId={parseInt(id!)}
                            onProfileClick={handleProfileClick}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                            <AlertCircle className="h-10 w-10 text-muted-foreground" />
                            <p className="text-muted-foreground">
                                댓글을 작성하려면 로그인이 필요합니다.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate("/login")}
                            >
                                로그인하기
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 프로필 상세 모달 */}
            <ProfileDetailModal
                userId={selectedUserId}
                open={profileModalOpen}
                onOpenChange={setProfileModalOpen}
                onSwitchProfile={(newUserId) => {
                    setSelectedUserId(newUserId);
                }}
            />
        </div>
    );
};

export default BoardPostDetail;
