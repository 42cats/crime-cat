import React from "react";
import { Link } from "react-router-dom";
import { UserPostGalleryDto } from '@/api/posts';
import LazyImage from "./LazyImage";
import PostPrivacyBadge from "./PostPrivacyBadge";
import PostAuthorInfo from "./PostAuthorInfo";
import PostContentPreview from "./PostContentPreview";
import { Heart, MessageCircle, Share2 } from "lucide-react";

interface PostGridItemProps {
    post: UserPostGalleryDto;
    mode?: "modal" | "page";
    userId?: string;
    onAuthorClick?: (authorId: string) => void;
    onPostClick?: (postId: string) => void;
    onShare?: (postId: string, e: React.MouseEvent) => void;
}

const PostGridItem: React.FC<PostGridItemProps> = ({
    post,
    mode = "page",
    userId,
    onAuthorClick,
    onPostClick,
    onShare,
}) => {
    const handlePostClick = (e?: React.MouseEvent) => {
        if (mode === "modal" && onPostClick) {
            e?.preventDefault();
            onPostClick(post.postId);
        }
    };

    const handleShare = (e: React.MouseEvent) => {
        if (onShare) {
            onShare(post.postId, e);
        }
    };

    const PostWrapper = mode === "page" ? Link : "div";
    const wrapperProps =
        mode === "page"
            ? { to: `/sns/post/${post.postId}` }
            : {
                  onClick: handlePostClick,
                  style: { cursor: "pointer" },
              };

    return (
        <PostWrapper {...wrapperProps}>
            <div className="relative bg-gray-100 overflow-hidden group cursor-pointer rounded-md shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                {post.thumbnailUrl ? (
                    // 이미지가 있는 경우 - 썸네일 + 텍스트 오버레이
                    <div className="aspect-square overflow-hidden relative">
                        <LazyImage
                            src={post.thumbnailUrl}
                            alt={`${post.authorNickname}의 게시물`}
                            aspectRatio="square"
                            className="w-full h-full object-cover"
                        />

                        {/* 그라데이션 오버레이 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                        {/* 프라이버시 배지 */}
                        <div className="absolute top-2 left-2 z-10">
                            <PostPrivacyBadge
                                isPrivate={post.private}
                                isFollowersOnly={post.followersOnly}
                                size="sm"
                            />
                        </div>

                        {/* 텍스트 오버레이 */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                            <PostContentPreview
                                content={post.content}
                                hashtags={post.hashTags}
                                maxTextLength={90}
                                maxHashtags={2}
                                maxLines={3}
                                variant="dark"
                                size="sm"
                                compactHashtags={true}
                                className="mb-2"
                            />

                            {/* 하단 정보 */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Heart
                                        size={14}
                                        className={
                                            post.liked
                                                ? "text-red-400 fill-red-400"
                                                : "text-gray-300"
                                        }
                                    />
                                    <span className="text-xs text-gray-300">
                                        {post.likeCount}
                                    </span>
                                </div>
                                <button
                                    onClick={handleShare}
                                    className="text-gray-300 hover:text-white transition-colors p-1 -m-1"
                                >
                                    <Share2 size={14} />
                                </button>
                            </div>

                            {/* 작성자 정보 (SNS 모드에서만) */}
                            {!userId && (
                                <div className="mt-2">
                                    <PostAuthorInfo
                                        authorNickname={post.authorNickname}
                                        authorId={post.authorId}
                                        createdAt={post.createdAt}
                                        locationName={post.locationName}
                                        onAuthorClick={onAuthorClick}
                                        showAvatar={false}
                                        size="sm"
                                        className="text-white [&_.text-muted-foreground]:text-gray-300"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // 이미지가 없는 경우 - 텍스트 전용
                    <div className="aspect-square p-3 flex flex-col justify-between relative bg-gradient-to-br from-white to-gray-50">
                        {/* 프라이버시 배지 */}
                        <div className="absolute top-2 left-2 z-10">
                            <PostPrivacyBadge
                                isPrivate={post.private}
                                isFollowersOnly={post.followersOnly}
                                size="sm"
                            />
                        </div>

                        {/* 텍스트 내용 */}
                        <div className="mt-6 flex-1 flex flex-col justify-center">
                            <PostContentPreview
                                content={post.content}
                                hashtags={post.hashTags}
                                maxTextLength={130}
                                maxHashtags={3}
                                maxLines={4}
                                variant="light"
                                size="sm"
                                compactHashtags={false}
                            />
                        </div>

                        {/* 하단 정보 */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
                            <div className="flex items-center space-x-2">
                                <Heart
                                    size={14}
                                    className={
                                        post.liked
                                            ? "text-red-500 fill-red-500"
                                            : "text-gray-400"
                                    }
                                />
                                <span className="text-xs text-gray-600">
                                    {post.likeCount}
                                </span>
                            </div>
                            <button
                                onClick={handleShare}
                                className="text-gray-400 hover:text-blue-500 transition-colors p-1 -m-1"
                            >
                                <Share2 size={14} />
                            </button>
                        </div>

                        {/* 작성자 정보 (SNS 모드에서만) */}
                        {!userId && (
                            <div className="mt-2">
                                <PostAuthorInfo
                                    authorNickname={post.authorNickname}
                                    authorId={post.authorId}
                                    createdAt={post.createdAt}
                                    locationName={post.locationName}
                                    onAuthorClick={onAuthorClick}
                                    showAvatar={false}
                                    size="sm"
                                    className="text-gray-600"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* 호버 오버레이 (SNS 모드에서만) */}
                {!userId && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white z-20">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center">
                                <Heart className="w-4 h-4 mr-1" />
                                <span className="text-sm">
                                    {post.likeCount}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <MessageCircle className="w-4 h-4 mr-1" />
                                <span className="text-sm">0</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PostWrapper>
    );
};

export default PostGridItem;
