import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, UserMinus } from "lucide-react";
import { UserInfo } from "@/lib/api/followApi";
import { UseMutationResult } from "@tanstack/react-query";

interface SearchResultCardProps {
    user: UserInfo;
    currentUserId: string;
    followMutation: UseMutationResult<any, Error, string>;
    unfollowMutation: UseMutationResult<any, Error, string>;
}

/**
 * 검색 결과에 표시되는 사용자 카드 컴포넌트
 */
export const SearchResultCard: React.FC<SearchResultCardProps> = ({
    user: searchUser,
    currentUserId,
    followMutation,
    unfollowMutation,
}) => {
    const isMyProfile = searchUser.id === currentUserId;

    return (
        <Card className="mb-3">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                            <AvatarImage
                                src={
                                    searchUser.profileImagePath ||
                                    "/content/image/default_profile_image.png"
                                }
                                alt={searchUser.nickname}
                            />
                            <AvatarFallback>
                                {searchUser.nickname
                                    .substring(0, 2)
                                    .toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium">
                                {searchUser.nickname}
                            </div>
                            {isMyProfile && (
                                <Badge variant="outline">내 프로필</Badge>
                            )}
                        </div>
                    </div>

                    {!isMyProfile && (
                        <div>
                            {searchUser.isFollowing ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        unfollowMutation.mutate(searchUser.id)
                                    }
                                    className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                                    disabled={unfollowMutation.isPending}
                                >
                                    <UserMinus className="mr-1 h-4 w-4" />
                                    팔로우 취소
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        followMutation.mutate(searchUser.id)
                                    }
                                    className="text-blue-500 border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                                    disabled={followMutation.isPending}
                                >
                                    <UserPlus className="mr-1 h-4 w-4" />
                                    팔로우
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default SearchResultCard;
