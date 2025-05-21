import React from "react";
import { Heart, MessageSquare, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCommentList } from "../post-comments";
import { UserPostDto } from "@/api/userPost/userPostService";
import { ProfileDetailDto } from "@/api/profile/detail";
import PostInfoContent from "./PostInfoContent";

interface MobilePostLayoutProps {
    post: UserPostDto;
    profile: ProfileDetailDto | null;
    activeTab: "info" | "comments";
    setActiveTab: (tab: "info" | "comments") => void;
    liked: boolean;
    isLikeLoading: boolean;
    currentImageIndex: number;
    handlePrevImage: () => void;
    handleNextImage: () => void;
    handleLike: () => void;
    handleShare: () => void;
    handleLoginRequired: () => void;
    userId?: string;
}

const MobilePostLayout: React.FC<MobilePostLayoutProps> = ({
    post,
    profile,
    activeTab,
    setActiveTab,
    liked,
    isLikeLoading,
    currentImageIndex,
    handlePrevImage,
    handleNextImage,
    handleLike,
    handleShare,
    handleLoginRequired,
    userId,
}) => {
    return (
        <div className="flex flex-col min-h-0">
            {/* 프로필 정보 */}
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img
                        src={
                            post.authorAvatarUrl || "/assets/default-avatar.png"
                        }
                        alt={post.authorNickname}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                        <h3 className="font-medium">{post.authorNickname}</h3>
                    </div>
                </div>
            </div>

            {/* 이미지 슬라이더 (이미지가 있는 경우만) */}
            {post.imageUrls && post.imageUrls.length > 0 && (
                <div className="relative">
                    <div className="aspect-square bg-black">
                        <img
                            src={post.imageUrls[currentImageIndex]}
                            alt={`포스트 이미지 ${currentImageIndex + 1}`}
                            className="w-full h-full object-contain"
                        />
                    </div>

                    {/* 이미지가 2개 이상인 경우 네비게이션 버튼 표시 */}
                    {post.imageUrls.length > 1 && (
                        <>
                            <button
                                onClick={handlePrevImage}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full"
                            >
                                &lt;
                            </button>
                            <button
                                onClick={handleNextImage}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full"
                            >
                                &gt;
                            </button>

                            {/* 이미지 인디케이터 */}
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                                {post.imageUrls.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full ${
                                            index === currentImageIndex
                                                ? "bg-white"
                                                : "bg-white/50"
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* 액션 버튼 */}
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleLike}
                        disabled={isLikeLoading}
                        className="flex items-center space-x-1"
                    >
                        <Heart
                            size={24}
                            className={
                                liked
                                    ? "text-red-500 fill-red-500"
                                    : "text-gray-500"
                            }
                        />
                        <span>{post.likeCount}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("comments")}
                        className={`text-gray-500 ${
                            activeTab === "comments" ? "text-blue-500" : ""
                        }`}
                    >
                        <MessageSquare size={24} />
                    </button>
                    <button onClick={handleShare} className="text-gray-500">
                        <Share2 size={24} />
                    </button>
                </div>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="flex-1 overflow-y-auto">
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
        </div>
    );
};

export default MobilePostLayout;
