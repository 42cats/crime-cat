import React from "react";
import { BoardType, PostNavigationResponse } from "@/lib/types/board";
import { NavigationCard } from "./NavigationCard";
import { CenterActionButton } from "./CenterActionButton";
import { List, ChevronLeft, ChevronRight } from "lucide-react";

interface PostNavigationBarProps {
    navigation: PostNavigationResponse;
    boardType: BoardType;
    currentPost: { id: string; subject: string };
    isLoading?: boolean;
    onPreviousPost: () => void;
    onNextPost: () => void;
    onPostList: () => void;
}

/**
 * 네이버/카카오 스타일 게시글 네비게이션 바
 * - 카드형 이전/다음글 미리보기 (데스크톱)
 * - 미니멀 버튼 디자인 (모바일)
 * - 중앙 목록 버튼 강조
 */
export const PostNavigationBar: React.FC<PostNavigationBarProps> = ({
    navigation,
    boardType,
    currentPost,
    isLoading = false,
    onPreviousPost,
    onNextPost,
    onPostList,
}) => {
    return (
        <div className="w-full">
            {/* 데스크톱 레이아웃 (≥1024px) - 카드형 */}
            <div className="hidden lg:flex items-center justify-between gap-4">
                {/* 이전글 카드 */}
                <div className="flex-1 max-w-[40%]">
                    <NavigationCard
                        type="previous"
                        post={navigation?.previousPost}
                        onClick={onPreviousPost}
                        disabled={!navigation?.previousPost || isLoading}
                    />
                </div>

                {/* 중앙 목록 버튼 */}
                <div className="flex-shrink-0">
                    <CenterActionButton
                        icon={<List className="w-5 h-5" />}
                        label="목록"
                        onClick={onPostList}
                        variant="primary"
                    />
                </div>

                {/* 다음글 카드 */}
                <div className="flex-1 max-w-[40%]">
                    <NavigationCard
                        type="next"
                        post={navigation?.nextPost}
                        onClick={onNextPost}
                        disabled={!navigation?.nextPost || isLoading}
                    />
                </div>
            </div>

            {/* 태블릿 레이아웃 (768px-1023px) - 하이브리드 */}
            <div className="hidden md:flex lg:hidden items-center justify-center gap-3">
                <button
                    onClick={onPreviousPost}
                    disabled={!navigation?.previousPost || isLoading}
                    className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[120px] max-w-[200px] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
                    title={navigation?.previousPost?.subject}
                    aria-label={
                        navigation?.previousPost
                            ? `${navigation.previousPost.subject}`
                            : "이전글 없음"
                    }
                >
                    <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate">
                        {navigation?.previousPost?.subject || "이전글 없음"}
                    </span>
                </button>

                <CenterActionButton
                    icon={<List className="w-5 h-5" />}
                    label="목록"
                    onClick={onPostList}
                    variant="primary"
                />

                <button
                    onClick={onNextPost}
                    disabled={!navigation?.nextPost || isLoading}
                    className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[120px] max-w-[200px] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
                    title={navigation?.nextPost?.subject}
                    aria-label={
                        navigation?.nextPost
                            ? `${navigation.nextPost.subject}`
                            : "다음글 없음"
                    }
                >
                    <span className="text-sm truncate">
                        {navigation?.nextPost?.subject || "다음글 없음"}
                    </span>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                </button>
            </div>

            {/* 모바일 레이아웃 (≤767px) - 네이버 스타일 */}
            <div className="flex md:hidden flex-col gap-3">
                {/* 상단 버튼 그룹 */}
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={onPreviousPost}
                        disabled={!navigation?.previousPost || isLoading}
                        className="flex items-center justify-center w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 active:scale-95"
                        title={
                            navigation?.previousPost
                                ? `${navigation.previousPost.subject}`
                                : "이전글 없음"
                        }
                        aria-label={
                            navigation?.previousPost
                                ? `${navigation.previousPost.subject}`
                                : "이전글 없음"
                        }
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <CenterActionButton
                        icon={<List className="w-5 h-5" />}
                        label="목록"
                        onClick={onPostList}
                        variant="primary"
                    />

                    <button
                        onClick={onNextPost}
                        disabled={!navigation?.nextPost || isLoading}
                        className="flex items-center justify-center w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 active:scale-95"
                        title={
                            navigation?.nextPost
                                ? `${navigation.nextPost.subject}`
                                : "다음글 없음"
                        }
                        aria-label={
                            navigation?.nextPost
                                ? `${navigation.nextPost.subject}`
                                : "다음글 없음"
                        }
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
