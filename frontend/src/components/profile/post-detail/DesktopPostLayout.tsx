import React from "react";
import { Heart, MessageSquare, Share2, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCommentList } from "../post-comments";
import { UserPostDto } from "@/api/posts/postService";
import { ProfileDetailDto } from "@/api/profile/detail";
import PostInfoContent from "./PostInfoContent";
import PostImageSection from "./PostImageSection";

interface DesktopPostLayoutProps {
    post: UserPostDto;
    profile: ProfileDetailDto | null;
    activeTab: "info" | "comments";
    setActiveTab: (tab: "info" | "comments") => void;
    liked: boolean;
    isLikeLoading: boolean;
    likeCount: number; // 다이나믹 좋아요 카운트
    currentImageIndex: number;
    handlePrevImage: () => void;
    handleNextImage: () => void;
    handleLike: () => void;
    handleShare: () => void;
    handleLoginRequired: () => void;
    onClose: () => void;
    userId?: string;
}

const DesktopPostLayout: React.FC<DesktopPostLayoutProps> = ({
    post,
    profile,
    activeTab,
    setActiveTab,
    liked,
    isLikeLoading,
    likeCount,
    currentImageIndex,
    handlePrevImage,
    handleNextImage,
    handleLike,
    handleShare,
    handleLoginRequired,
    onClose,
    userId,
}) => {
    return (
        <div className="flex h-full">
            {/* 왼쪽 이미지 영역 (3/5) */}
            <div className="w-3/5 h-full bg-black flex items-center justify-center">
                <PostImageSection
                    imageUrls={post.imageUrls}
                    currentIndex={currentImageIndex}
                    handlePrevImage={handlePrevImage}
                    handleNextImage={handleNextImage}
                />
            </div>

            {/* 오른쪽 콘텐츠 영역 (2/5) */}
            <div className="w-2/5 h-full flex flex-col border-l">
                {/* 헤더 */}
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src={
                                post.authorAvatarUrl ||
                                "https://cdn.discordapp.com/embed/avatars/1.png"
                            }
                            alt={post.authorNickname}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                            <h3 className="font-medium">
                                {post.authorNickname}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* 탭 콘텐츠 */}
                <div className="flex-1 overflow-hidden">
                    <Tabs
                        defaultValue={activeTab}
                        value={activeTab}
                        onValueChange={(value) =>
                            setActiveTab(value as "info" | "comments")
                        }
                        className="flex flex-col h-full"
                    >
                        <TabsList className="w-full grid grid-cols-2">
                            <TabsTrigger value="info">정보</TabsTrigger>
                            <TabsTrigger value="comments">댓글</TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="info"
                            className="flex-1 overflow-y-auto p-4"
                        >
                            <PostInfoContent post={post} />
                        </TabsContent>

                        <TabsContent
                            value="comments"
                            className="flex-1 overflow-hidden"
                        >
                            <PostCommentList
                                postId={post.postId}
                                postAuthorId={post.authorId || ""}
                                currentUserId={userId}
                                onLoginRequired={handleLoginRequired}
                            />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* 하단 액션 버튼 영역 */}
                <div className="p-4 border-t">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleLike}
                                disabled={isLikeLoading}
                                className="flex items-center space-x-2"
                            >
                                <Heart
                                    size={24}
                                    className={
                                        liked
                                            ? "text-red-500 fill-red-500"
                                            : "text-gray-500"
                                    }
                                />
                                <span>{likeCount}</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("info")}
                                className={`text-gray-800 ${
                                    activeTab === "info"
                                        ? "text-blue-500"
                                        : "hover:text-blue-500"
                                } transition-colors`}
                            >
                                <Info size={24} />
                            </button>
                            <button
                                onClick={() => setActiveTab("comments")}
                                className={`text-gray-800 ${
                                    activeTab === "comments"
                                        ? "text-blue-500"
                                        : "hover:text-blue-500"
                                } transition-colors`}
                            >
                                <MessageSquare size={24} />
                            </button>
                            <button
                                onClick={handleShare}
                                className="text-gray-500 hover:text-green-500 transition-colors"
                            >
                                <Share2 size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesktopPostLayout;
