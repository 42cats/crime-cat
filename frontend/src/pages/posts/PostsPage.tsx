import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userPostService, UserPostGalleryDto } from "@/api/posts/postService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    PlusCircle,
    Heart,
    Image,
    RefreshCw,
    Trash2,
    Edit,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/useToast";
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

const PostsPage: React.FC = () => {
    const [posts, setPosts] = useState<UserPostGalleryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);

    const { toast } = useToast();
    const navigate = useNavigate();
    const pageSize = 12;

    // 포스트 로드 함수
    const loadPosts = async (page = 0) => {
        setLoading(true);
        try {
            const result = await userPostService.getMyPosts(page, pageSize);
            setPosts(result.content);
            setTotalPages(result.totalPages);
            setTotalItems(result.totalElements);
            setCurrentPage(page);
        } catch (error) {
            console.error("포스트 로드 실패:", error);
            toast({
                title: "포스트 로드 실패",
                description: "포스트 목록을 불러오는데 실패했습니다.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPosts();
    }, []);

    // 포스트 삭제 함수
    const handleDelete = async (postId: string) => {
        try {
            await userPostService.deletePost(postId);
            toast({
                title: "삭제 완료",
                description: "포스트가 성공적으로 삭제되었습니다.",
            });
            loadPosts(currentPage); // 현재 페이지 다시 로드
        } catch (error) {
            console.error("포스트 삭제 실패:", error);
            toast({
                title: "삭제 실패",
                description: "포스트를 삭제하는데 실패했습니다.",
                variant: "destructive",
            });
        } finally {
            setDeleteDialogOpen(false);
            setPostToDelete(null);
        }
    };

    // 삭제 확인 다이얼로그 열기
    const openDeleteDialog = (e: React.MouseEvent, postId: string) => {
        e.stopPropagation();
        e.preventDefault();
        setPostToDelete(postId);
        setDeleteDialogOpen(true);
    };

    // 페이지 이동 처리
    const handlePageChange = (page: number) => {
        if (page !== currentPage) {
            loadPosts(page);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        포스트 관리
                    </h1>
                    <p className="text-muted-foreground">
                        자신의 포스트를 관리하고 새로운 포스트를 작성하세요.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadPosts(currentPage)}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        새로고침
                    </Button>
                    <Button onClick={() => navigate("/dashboard/posts/new")}>
                        <PlusCircle className="h-4 w-4 mr-2" />새 포스트
                    </Button>
                </div>
            </div>

            <Separator />

            <Tabs defaultValue="list" className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="grid">그리드</TabsTrigger>
                        <TabsTrigger value="list">리스트</TabsTrigger>
                    </TabsList>
                    <div className="text-sm text-muted-foreground">
                        총 {totalItems}개의 포스트
                    </div>
                </div>

                {/* 그리드 뷰 */}
                <TabsContent value="grid" className="w-full">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Array(8)
                                .fill(0)
                                .map((_, index) => (
                                    <Card
                                        key={index}
                                        className="overflow-hidden"
                                    >
                                        <div className="aspect-square bg-muted animate-pulse" />
                                        <CardContent className="p-4">
                                            <div className="h-4 w-2/3 bg-muted animate-pulse rounded mb-2" />
                                            <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                                        </CardContent>
                                    </Card>
                                ))}
                        </div>
                    ) : posts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {posts.map((post) => (
                                <Link
                                    to={`/dashboard/posts/${post.postId}`}
                                    key={post.postId}
                                    className="block group"
                                >
                                    <Card className="overflow-hidden h-full flex flex-col transition-shadow hover:shadow-md">
                                        <div className="aspect-square relative overflow-hidden">
                                            {post.thumbnailUrl ? (
                                                <img
                                                    src={post.thumbnailUrl}
                                                    alt="포스트 이미지"
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                                    <Image className="h-16 w-16 text-muted-foreground opacity-30" />
                                                </div>
                                            )}
                                            <div className="absolute top-2 right-2 flex space-x-1">
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        navigate(
                                                            `/dashboard/posts/edit/${post.postId}`
                                                        );
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) =>
                                                        openDeleteDialog(
                                                            e,
                                                            post.postId
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardContent className="p-4 flex-1 flex flex-col justify-between">
                                            <div className="line-clamp-2 font-medium mb-2">
                                                {post.content
                                                    ? post.content.substring(
                                                          0,
                                                          100
                                                      ) +
                                                      (post.content.length > 100
                                                          ? "..."
                                                          : "")
                                                    : post.thumbnailUrl
                                                    ? "이미지 포스트"
                                                    : "내용 없음"}
                                            </div>
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Heart
                                                    className={`h-4 w-4 mr-1 ${
                                                        post.liked
                                                            ? "text-red-500 fill-red-500"
                                                            : ""
                                                    }`}
                                                />
                                                <span>{post.likeCount}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/10">
                            <Image className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
                            <h3 className="font-medium mb-1">
                                아직 포스트가 없습니다
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                첫 번째 포스트를 작성해보세요!
                            </p>
                            <Button
                                onClick={() => navigate("/dashboard/posts/new")}
                            >
                                <PlusCircle className="h-4 w-4 mr-2" />새 포스트
                                작성
                            </Button>
                        </div>
                    )}
                </TabsContent>

                {/* 리스트 뷰 */}
                <TabsContent value="list" className="w-full">
                    {loading ? (
                        <div className="space-y-3">
                            {Array(5)
                                .fill(0)
                                .map((_, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center p-4 border rounded-lg"
                                    >
                                        <div className="h-16 w-16 bg-muted animate-pulse rounded mr-4" />
                                        <div className="flex-1">
                                            <div className="h-4 w-1/3 bg-muted animate-pulse rounded mb-2" />
                                            <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : posts.length > 0 ? (
                        <div className="space-y-3">
                            {posts.map((post) => (
                                <Link
                                    to={`/dashboard/posts/${post.postId}`}
                                    key={post.postId}
                                    className="block group"
                                >
                                    <div className="flex items-center p-4 border rounded-lg hover:bg-muted/10 transition-colors relative">
                                        <div className="h-16 w-16 flex-shrink-0 rounded overflow-hidden mr-4">
                                            {post.thumbnailUrl ? (
                                                <img
                                                    src={post.thumbnailUrl}
                                                    alt="포스트 이미지"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                                    <Image className="h-8 w-8 text-muted-foreground opacity-30" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium line-clamp-2">
                                                {post.content
                                                    ? post.content.substring(
                                                          0,
                                                          150
                                                      ) +
                                                      (post.content.length > 150
                                                          ? "..."
                                                          : "")
                                                    : post.thumbnailUrl
                                                    ? "이미지 포스트"
                                                    : "내용 없음"}
                                            </div>
                                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                                                <Heart
                                                    className={`h-4 w-4 mr-1 ${
                                                        post.liked
                                                            ? "text-red-500 fill-red-500"
                                                            : ""
                                                    }`}
                                                />
                                                <span>
                                                    {post.likeCount}개의 좋아요
                                                </span>
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    navigate(
                                                        `/dashboard/posts/edit/${post.postId}`
                                                    );
                                                }}
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                수정
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={(e) =>
                                                    openDeleteDialog(
                                                        e,
                                                        post.postId
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                삭제
                                            </Button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/10">
                            <Image className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
                            <h3 className="font-medium mb-1">
                                아직 포스트가 없습니다
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                첫 번째 포스트를 작성해보세요!
                            </p>
                            <Button
                                onClick={() => navigate("/dashboard/posts/new")}
                            >
                                <PlusCircle className="h-4 w-4 mr-2" />새 포스트
                                작성
                            </Button>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* 페이지네이션 */}
            {!loading && totalPages > 1 && (
                <div className="flex justify-center mt-8">
                    <nav className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 0}
                        >
                            이전
                        </Button>

                        {Array.from({ length: totalPages }, (_, i) => (
                            <Button
                                key={i}
                                variant={
                                    i === currentPage ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => handlePageChange(i)}
                            >
                                {i + 1}
                            </Button>
                        ))}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages - 1}
                        >
                            다음
                        </Button>
                    </nav>
                </div>
            )}

            {/* 삭제 확인 다이얼로그 */}
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
                            onClick={() =>
                                postToDelete && handleDelete(postToDelete)
                            }
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

export default PostsPage;
