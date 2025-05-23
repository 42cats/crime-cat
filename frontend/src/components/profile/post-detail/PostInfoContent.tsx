import React from "react";
import { useNavigate } from "react-router-dom";
import { UserPostDto } from '@/api/posts';
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import TagBadge from "@/components/sns/common/TagBadge";

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

    // 내용에서 해시태그 찾아 강조 표시
    const renderContent = (content: string) => {
        if (!content) return null;

        const parts = [];
        let lastIndex = 0;
        const hashTagRegex = /#[\w\p{L}]+/gu;
        let match;

        while ((match = hashTagRegex.exec(content)) !== null) {
            const matchStart = match.index;
            const matchEnd = matchStart + match[0].length;

            // 해시태그 이전 텍스트
            if (matchStart > lastIndex) {
                parts.push({
                    type: "text",
                    content: content.substring(lastIndex, matchStart),
                });
            }

            // 해시태그
            parts.push({
                type: "hashtag",
                content: match[0],
                tag: match[0].substring(1), // # 제외
            });

            lastIndex = matchEnd;
        }

        // 마지막 텍스트
        if (lastIndex < content.length) {
            parts.push({
                type: "text",
                content: content.substring(lastIndex),
            });
        }

        return (
            <div className="whitespace-pre-line">
                {parts.map((part, index) => {
                    if (part.type === "hashtag") {
                        return (
                            <button
                                key={index}
                                onClick={() =>
                                    navigate(
                                        `/sns/explore?search=${encodeURIComponent(
                                            part.content
                                        )}`
                                    )
                                }
                                className="text-blue-500 hover:underline"
                            >
                                {part.content}{" "}
                            </button>
                        );
                    }
                    return <span key={index}>{part.content}</span>;
                })}
            </div>
        );
    };

    return (
        <div className="space-y-2">
            {/* 포스트 내용 */}
            <div>
                <div className="mb-1">{renderContent(post.content)}</div>
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
