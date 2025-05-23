import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PostDetail from "@/components/common/post-detail/PostDetail";
import { UserPostDto } from "@/api/posts";

interface PostDetailPageProps {
    post?: UserPostDto;
    postId?: string;
    userId?: string;
    onLikeStatusChange?: (
        postId: string,
        liked: boolean,
        likeCount: number
    ) => void;
}

const PostDetailPage: React.FC<PostDetailPageProps> = ({
    post,
    postId,
    userId,
    onLikeStatusChange,
}) => {
    const navigate = useNavigate();
    
    const handleClose = () => {
        navigate(-1);
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl mb-16 md:mb-0">
            {/* 헤더와 이전 버튼 */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold ml-2">
                        게시물 상세
                    </h1>
                </div>
            </div>

            {/* 포스트 상세 내용 */}
            <PostDetail
                post={post}
                postId={postId}
                userId={userId}
                onLikeStatusChange={onLikeStatusChange}
                onClose={handleClose}
            />
        </div>
    );
};

export default PostDetailPage;
