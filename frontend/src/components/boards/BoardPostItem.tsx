import React from "react";
import { Link } from "react-router-dom";
import { BoardPost, BoardType, PostType, DetailedPostType } from "@/lib/types/board";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
    FileImage,
    MessageSquare,
    Heart,
    ChevronRight,
    Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface BoardPostItemProps {
    post: BoardPost;
    boardType: BoardType;
}

const BoardPostItem: React.FC<BoardPostItemProps> = ({ post, boardType }) => {
    const { user, hasRole } = useAuth();

    // 비밀글 접근 가능 여부 확인 (백엔드 isOwnPost 신룰)
    const canAccessSecret = post.isSecret
        ? post.isOwnPost || hasRole(["ADMIN", "MANAGER"])
        : true;

    // DetailedPostType 뱃지 생성 함수
    const getDetailedPostTypeBadge = (postType: DetailedPostType) => {
        switch (postType) {
            case DetailedPostType.QUESTION:
                return (
                    <Badge variant="outline" className="mr-2 border-blue-500 text-blue-600 bg-blue-50">
                        질문
                    </Badge>
                );
            case DetailedPostType.PHOTO:
                return (
                    <Badge variant="outline" className="mr-2 border-green-500 text-green-600 bg-green-50">
                        사진
                    </Badge>
                );
            case DetailedPostType.SECRET:
                return (
                    <Badge variant="outline" className="mr-2 border-gray-500 text-gray-600 bg-gray-50">
                        비밀
                    </Badge>
                );
            case DetailedPostType.PROMOTION:
                return (
                    <Badge variant="outline" className="mr-2 border-purple-500 text-purple-600 bg-purple-50">
                        홍보
                    </Badge>
                );
            case DetailedPostType.RECRUIT:
                return (
                    <Badge variant="outline" className="mr-2 border-indigo-500 text-indigo-600 bg-indigo-50">
                        모집
                    </Badge>
                );
            case DetailedPostType.CRIME_SCENE:
                return (
                    <Badge variant="outline" className="mr-2 border-red-500 text-red-600 bg-red-50">
                        크라임씬
                    </Badge>
                );
            case DetailedPostType.MURDER_MYSTERY:
                return (
                    <Badge variant="outline" className="mr-2 border-orange-500 text-orange-600 bg-orange-50">
                        머더미스터리
                    </Badge>
                );
            case DetailedPostType.ESCAPE_ROOM:
                return (
                    <Badge variant="outline" className="mr-2 border-yellow-500 text-yellow-600 bg-yellow-50">
                        방탈출
                    </Badge>
                );
            case DetailedPostType.REAL_WORLD:
                return (
                    <Badge variant="outline" className="mr-2 border-teal-500 text-teal-600 bg-teal-50">
                        리얼월드
                    </Badge>
                );
            case DetailedPostType.EVENT:
                return (
                    <Badge variant="outline" className="mr-2 border-pink-500 text-pink-600 bg-pink-50">
                        이벤트
                    </Badge>
                );
            case DetailedPostType.GENERAL:
                return (
                    <Badge variant="outline" className="mr-2 border-gray-400 text-gray-600 bg-gray-50">
                        일반
                    </Badge>
                );
            default:
                return null;
        }
    };

    const getPostTypeBadge = (postType: PostType) => {
        switch (postType) {
            case PostType.NOTICE:
                return (
                    <Badge className="mr-2 bg-blue-500 hover:bg-blue-600">
                        공지
                    </Badge>
                );
            case PostType.EVENT:
                return (
                    <Badge className="mr-2 bg-orange-500 hover:bg-orange-600">
                        이벤트
                    </Badge>
                );
            default:
                return null;
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();

            // 오늘 날짜인지 확인
            const isToday =
                date.getDate() === now.getDate() &&
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear();

            if (isToday) {
                // 오늘이면 시간만 표시 (hh:mm)
                return date.toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                });
            } else {
                // 오늘이 아니면 YY.MM.DD 형식으로 표시
                return `${date.getFullYear().toString().slice(2)}.${String(
                    date.getMonth() + 1
                ).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
            }
        } catch (error) {
            return dateString;
        }
    };

    const formatNumber = (num: number | undefined | null): string => {
        if (num === undefined || num === null) {
            return "0";
        }
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + "M";
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + "K";
        }
        return num.toString();
    };

    const getBoardPath = (type: BoardType) => {
        switch (type) {
            case BoardType.QUESTION:
                return "question";
            case BoardType.CHAT:
                return "chat";
            case BoardType.CREATOR:
                return "creator";
            default:
                return type.toLowerCase();
        }
    };

    const content = (
        <div className="flex items-center">
            <div className="flex-shrink-0 w-12 text-center text-muted-foreground text-sm hidden md:block">
                {post.number || post.id}
            </div>

            <div className="flex items-center flex-grow min-w-0 pr-4">
                {/* 기존 PostType 뱃지 (공지만, 이벤트 제외) */}
                {post.postType && post.postType !== 'EVENT' && Object.values(PostType).includes(post.postType as PostType) && getPostTypeBadge(post.postType as PostType)}
                {/* DetailedPostType 뱃지 (일반, 질문, 크라임씨, 이벤트 등) */}
                {post.postType && Object.values(DetailedPostType).includes(post.postType as DetailedPostType) && getDetailedPostTypeBadge(post.postType as DetailedPostType)}

                <div className="flex items-center overflow-hidden">
                    {post.isSecret && (
                        <Lock className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                    )}

                    <h3 className="font-medium text-foreground truncate">
                        {post.isSecret && !canAccessSecret
                            ? "비밀글입니다"
                            : post.subject || post.title}
                    </h3>

                    {post.comments > 0 && (
                        <span className="text-blue-500 ml-2 font-medium">
                            [{post.comments}]
                        </span>
                    )}

                    {post.hasImage && (
                        <FileImage className="h-4 w-4 text-gray-500 ml-2 flex-shrink-0" />
                    )}

                    {post.createdAt &&
                        new Date(post.createdAt).getTime() >
                            Date.now() - 1000 * 60 * 60 * 24 && (
                            <Badge
                                variant="outline"
                                className="ml-2 border-blue-500 text-blue-500 px-1 py-0 h-5 text-[10px]"
                            >
                                NEW
                            </Badge>
                        )}
                </div>
            </div>

            <div className="flex-shrink-0 w-24 text-center text-sm text-muted-foreground hidden md:block truncate">
                {post.authorName}
            </div>

            <div className="flex-shrink-0 w-20 text-center text-xs text-muted-foreground hidden md:block">
                {formatDate(post.createdAt)}
            </div>

            <div className="flex-shrink-0 w-16 text-center text-xs text-muted-foreground hidden md:block">
                {formatNumber(post.views || post.viewCount)}
            </div>

            <div className="flex-shrink-0 w-16 text-center text-xs text-muted-foreground hidden md:block">
                {formatNumber(post.likes || post.likeCount)}
            </div>
        </div>
    );

    // 비밀글이고 접근 권한이 없으면 div로 렌더링
    if (post.isSecret && !canAccessSecret) {
        return (
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 cursor-not-allowed opacity-60">
                {content}

                {/* 모바일용 하단 정보 */}
                <div className="flex items-center justify-between mt-1 md:hidden">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{post.authorName}</span>
                        <span>{formatDate(post.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {formatNumber(post.likes || post.likeCount)}
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {post.comments}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // 일반글이거나 접근 권한이 있으면 Link로 렌더링
    return (
        <div className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <Link
                to={`/community/${getBoardPath(boardType)}/${post.id}`}
                className="block px-4 py-3 w-full"
            >
                {content}

                {/* 모바일용 하단 정보 */}
                <div className="flex items-center justify-between mt-1 md:hidden">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{post.authorName}</span>
                        <span>{formatDate(post.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {formatNumber(post.likes || post.likeCount)}
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {post.comments}
                        </span>
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default BoardPostItem;
