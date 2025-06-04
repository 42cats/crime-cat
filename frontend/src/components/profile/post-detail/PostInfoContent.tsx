import React from "react";
import { useNavigate } from "react-router-dom";
import { UserPostDto } from '@/api/posts';
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import TagBadge from "@/components/sns/common/TagBadge";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface PostInfoContentProps {
    post: UserPostDto;
    showStats?: boolean;
}

const PostInfoContent: React.FC<PostInfoContentProps> = ({
    post,
    showStats = true,
}) => {
    const navigate = useNavigate();

    // 날짜 포맷
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return formatDistanceToNow(date, { addSuffix: true, locale: ko });
        } catch (error) {
            return "날짜 정보 없음";
        }
    };


    return (
        <div className="space-y-2">
            {/* 포스트 내용 */}
            <div>
                {post.content && (
                    <div className="mb-1">
                        <MarkdownRenderer 
                            content={post.content}
                            className="prose prose-sm max-w-none dark:prose-invert"
                        />
                    </div>
                )}
                <p className="text-xs text-gray-500">
                    {post.createdAt && formatDate(post.createdAt)}
                </p>
                
                {/* 태그 배지 */}
                {post.hashtags && post.hashtags.length > 0 && (
                    <div className="mt-3">
                        <TagBadge tags={post.hashtags} variant="outline" />
                    </div>
                )}
            </div>

            {/* 포스트 통계 정보 */}
            {showStats && (
                <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                        <div>좋아요 {post.likeCount}개</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostInfoContent;
