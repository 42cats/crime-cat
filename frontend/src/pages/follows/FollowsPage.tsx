import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { followApi, FollowDto, UserInfo } from "@/lib/api/followApi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { UserPlus, UserMinus, User, Search, Users, X } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";

const FollowsPage: React.FC = () => {
    const { user } = useAuth();
    const userId = user?.id || "";
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // 현재 선택된 탭(팔로워/팔로잉)
    const [activeTab, setActiveTab] = useState<string>("followers");

    // 팔로워/팔로잉 페이지네이션 상태
    const [followersPage, setFollowersPage] = useState(0);
    const [followingsPage, setFollowingsPage] = useState(0);
    const pageSize = 10;

    // 사용자 검색 상태
    const [searchQuery, setSearchQuery] = useState("");
    const [searchPage, setSearchPage] = useState(0);
    const [searchType, setSearchType] = useState("auto");
    const [showSearch, setShowSearch] = useState(false);

    // 팔로워/팔로잉 카운트 조회
    const { data: followCounts } = useQuery({
        queryKey: ["followCounts", userId],
        queryFn: () => followApi.getMyFollowCounts(),
        enabled: !!userId,
    });

    // 팔로워 목록 조회
    const {
        data: followers,
        isLoading: isLoadingFollowers,
        isFetching: isFetchingFollowers,
    } = useQuery({
        queryKey: ["followers", userId, followersPage, pageSize],
        queryFn: () => followApi.getFollowers(userId, followersPage, pageSize),
        enabled: !!userId,
    });

    // 팔로잉 목록 조회
    const {
        data: followings,
        isLoading: isLoadingFollowings,
        isFetching: isFetchingFollowings,
    } = useQuery({
        queryKey: ["followings", userId, followingsPage, pageSize],
        queryFn: () =>
            followApi.getFollowings(userId, followingsPage, pageSize),
        enabled: !!userId,
    });

    // 사용자 검색
    const {
        data: searchResults,
        isLoading: isLoadingSearch,
        isFetching: isFetchingSearch,
        refetch: refetchSearch,
    } = useQuery({
        queryKey: ["findUsers", searchQuery, searchType, searchPage, pageSize],
        queryFn: () =>
            followApi.findUsers(searchQuery, searchType, searchPage, pageSize),
        enabled: !!searchQuery && showSearch,
    });

    // 팔로우 여부 확인 및 결과에 추가
    useEffect(() => {
        if (!searchResults?.users || !user?.id) return;

        const checkFollowStatus = async () => {
            const updatedUsers = await Promise.all(
                searchResults.users.map(async (userInfo) => {
                    if (userInfo.id === user.id)
                        return { ...userInfo, isFollowing: false };

                    try {
                        const { isFollowing } = await followApi.isFollowing(
                            userInfo.id
                        );
                        return { ...userInfo, isFollowing };
                    } catch (error) {
                        console.error("Failed to check follow status:", error);
                        return { ...userInfo, isFollowing: false };
                    }
                })
            );

            queryClient.setQueryData(
                ["findUsers", searchQuery, searchType, searchPage, pageSize],
                { ...searchResults, users: updatedUsers }
            );
        };

        checkFollowStatus();
    }, [
        searchResults,
        user?.id,
        queryClient,
        searchQuery,
        searchType,
        searchPage,
        pageSize,
    ]);

    // 팔로우 Mutation
    const followMutation = useMutation({
        mutationFn: (followingId: string) => followApi.follow(followingId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["followCounts"] });
            queryClient.invalidateQueries({ queryKey: ["followings"] });
            queryClient.invalidateQueries({ queryKey: ["findUsers"] });
            toast({
                title: "팔로우 성공",
                description: "사용자를 팔로우했습니다.",
            });
        },
        onError: () => {
            toast({
                title: "팔로우 실패",
                description: "사용자 팔로우에 실패했습니다. 다시 시도해주세요.",
                variant: "destructive",
            });
        },
    });

    // 언팔로우 Mutation
    const unfollowMutation = useMutation({
        mutationFn: (followingId: string) => followApi.unfollow(followingId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["followCounts"] });
            queryClient.invalidateQueries({ queryKey: ["followings"] });
            queryClient.invalidateQueries({ queryKey: ["findUsers"] });
            toast({
                title: "언팔로우 성공",
                description: "사용자 팔로우를 취소했습니다.",
            });
        },
        onError: () => {
            toast({
                title: "언팔로우 실패",
                description:
                    "사용자 팔로우 취소에 실패했습니다. 다시 시도해주세요.",
                variant: "destructive",
            });
        },
    });

    // 검색 처리
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setSearchPage(0);
            refetchSearch();
        }
    };

    // 검색어 입력 핸들러
    const handleSearchInputChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setSearchQuery(e.target.value);
        if (e.target.value === "") {
            setShowSearch(false);
        }
    };

    // 사용자 카드 컴포넌트 (팔로워/팔로잉 목록용)
    const UserCard = ({
        follow,
        isFollowing,
    }: {
        follow: FollowDto;
        isFollowing: boolean;
    }) => {
        const userToDisplay = isFollowing
            ? {
                  id: follow.followingId,
                  nickname: follow.followingNickname,
                  profileImage: follow.followingProfileImagePath,
              }
            : {
                  id: follow.followerId,
                  nickname: follow.followerNickname,
                  profileImage: follow.followerProfileImagePath,
              };

        // 내 프로필인지 확인
        const isMyProfile = userToDisplay.id === user?.id;

        // 팔로잉 여부 확인 (팔로워 탭에서만 필요)
        const [isFollowingUser, setIsFollowingUser] = useState<boolean | null>(
            null
        );

        useEffect(() => {
            if (!isFollowing && !isMyProfile) {
                const checkIsFollowing = async () => {
                    try {
                        const response = await followApi.isFollowing(
                            userToDisplay.id
                        );
                        setIsFollowingUser(response.isFollowing);
                    } catch (error) {
                        console.error("Failed to check if following:", error);
                        setIsFollowingUser(false);
                    }
                };

                checkIsFollowing();
            }
        }, [userToDisplay.id, isFollowing, isMyProfile]);

        return (
            <Card className="mb-3">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12">
                                <AvatarImage
                                    src={userToDisplay.profileImage}
                                    alt={userToDisplay.nickname}
                                />
                                <AvatarFallback>
                                    {userToDisplay.nickname
                                        .substring(0, 2)
                                        .toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium">
                                    {userToDisplay.nickname}
                                </div>
                                {isMyProfile && (
                                    <Badge variant="outline">내 프로필</Badge>
                                )}
                            </div>
                        </div>

                        {!isMyProfile && (
                            <div>
                                {isFollowing ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            unfollowMutation.mutate(
                                                userToDisplay.id
                                            )
                                        }
                                        className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                                        disabled={unfollowMutation.isPending}
                                    >
                                        <UserMinus className="mr-1 h-4 w-4" />
                                        팔로우 취소
                                    </Button>
                                ) : !isFollowing &&
                                  isFollowingUser === false ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            followMutation.mutate(
                                                userToDisplay.id
                                            )
                                        }
                                        className="text-blue-500 border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                                        disabled={followMutation.isPending}
                                    >
                                        <UserPlus className="mr-1 h-4 w-4" />
                                        팔로우
                                    </Button>
                                ) : !isFollowing && isFollowingUser === true ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            unfollowMutation.mutate(
                                                userToDisplay.id
                                            )
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
                                        disabled
                                    >
                                        <Skeleton className="h-4 w-16" />
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    // 검색 결과 사용자 카드 컴포넌트
    const SearchResultUserCard = ({ user: searchUser }: { user: UserInfo }) => {
        const isMyProfile = searchUser.id === user?.id;

        return (
            <Card className="mb-3">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12">
                                <AvatarImage
                                    src={searchUser.profileImagePath}
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
                                            unfollowMutation.mutate(
                                                searchUser.id
                                            )
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

    // 로딩 스켈레톤
    const UserCardSkeleton = () => (
        <Card className="mb-3">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div>
                            <Skeleton className="h-5 w-24" />
                        </div>
                    </div>
                    <Skeleton className="h-9 w-24" />
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">팔로우 관리</h1>
                    <p className="text-muted-foreground">
                        팔로워와 팔로잉을 관리하세요
                    </p>
                </div>
                <Card className="md:w-auto">
                    <CardContent className="p-4 flex space-x-6">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                                팔로워
                            </p>
                            <p className="text-2xl font-bold">
                                {followCounts?.followerCount || 0}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                                팔로잉
                            </p>
                            <p className="text-2xl font-bold">
                                {followCounts?.followingCount || 0}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 사용자 검색 폼 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">사용자 검색</CardTitle>
                    <CardDescription>
                        닉네임으로 사용자를 검색하여 팔로우할 수 있습니다
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSearch}
                        className="flex flex-col sm:flex-row gap-2"
                    >
                        <div className="flex-1">
                            <Input
                                type="search"
                                placeholder="닉네임 검색..."
                                value={searchQuery}
                                onChange={handleSearchInputChange}
                            />
                        </div>
                        <Select
                            value={searchType}
                            onValueChange={(value) => setSearchType(value)}
                        >
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="검색 유형" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="auto">
                                        자동 감지
                                    </SelectItem>
                                    <SelectItem value="nickname">
                                        닉네임
                                    </SelectItem>
                                    <SelectItem value="discord">
                                        고유 아이디
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <Button type="submit" disabled={!searchQuery.trim()}>
                            <Search className="mr-2 h-4 w-4" />
                            검색
                        </Button>
                    </form>
                </CardContent>

                {/* 검색 결과 표시 */}
                {showSearch && searchQuery && (
                    <CardFooter className="flex flex-col">
                        <div className="flex items-center justify-between w-full mb-3">
                            <h3 className="text-lg font-medium">검색 결과</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowSearch(false);
                                    setSearchQuery("");
                                }}
                            >
                                <X className="h-4 w-4 mr-1" />
                                닫기
                            </Button>
                        </div>

                        {isLoadingSearch || isFetchingSearch ? (
                            <div className="w-full">
                                {[...Array(3)].map((_, index) => (
                                    <UserCardSkeleton key={index} />
                                ))}
                            </div>
                        ) : searchResults?.users?.length ? (
                            <AnimatePresence>
                                <motion.div
                                    className="w-full"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {searchResults.users.map((userInfo) => (
                                        <SearchResultUserCard
                                            key={userInfo.id}
                                            user={userInfo}
                                        />
                                    ))}

                                    {/* 검색 결과 페이지네이션 */}
                                    {searchResults.totalPages > 1 && (
                                        <Pagination
                                            totalPages={
                                                searchResults.totalPages
                                            }
                                            currentPage={searchPage + 1}
                                            onPageChange={(page) =>
                                                setSearchPage(page - 1)
                                            }
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        ) : (
                            <p className="text-center py-4 text-muted-foreground">
                                검색 결과가 없습니다
                            </p>
                        )}
                    </CardFooter>
                )}
            </Card>

            {/* 팔로워/팔로잉 탭 */}
            <Tabs
                defaultValue="followers"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <div className="flex items-center justify-between mb-3">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger
                            value="followers"
                            className="flex items-center"
                        >
                            <User className="mr-2 h-4 w-4" />
                            팔로워 ({followCounts?.followerCount || 0})
                        </TabsTrigger>
                        <TabsTrigger
                            value="followings"
                            className="flex items-center"
                        >
                            <Users className="mr-2 h-4 w-4" />
                            팔로잉 ({followCounts?.followingCount || 0})
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* 팔로워 탭 콘텐츠 */}
                <TabsContent value="followers">
                    <Card className="border-t-0 rounded-tl-none">
                        <CardContent className="p-4">
                            {isLoadingFollowers || isFetchingFollowers ? (
                                <div>
                                    {[...Array(5)].map((_, index) => (
                                        <UserCardSkeleton key={index} />
                                    ))}
                                </div>
                            ) : followers?.content?.length ? (
                                <div>
                                    {followers.content.map((follow) => (
                                        <UserCard
                                            key={`follower-${follow.id}`}
                                            follow={follow}
                                            isFollowing={false}
                                        />
                                    ))}

                                    {/* 팔로워 페이지네이션 */}
                                    {followers.totalPages > 1 && (
                                        <Pagination
                                            totalPages={followers.totalPages}
                                            currentPage={followersPage + 1}
                                            onPageChange={(page) =>
                                                setFollowersPage(page - 1)
                                            }
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <User className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-lg font-medium mb-1">
                                        아직 팔로워가 없습니다
                                    </p>
                                    <p className="text-muted-foreground">
                                        다른 사용자들이 당신을 팔로우하면 여기에
                                        표시됩니다
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 팔로잉 탭 콘텐츠 */}
                <TabsContent value="followings">
                    <Card className="border-t-0 rounded-tl-none">
                        <CardContent className="p-4">
                            {isLoadingFollowings || isFetchingFollowings ? (
                                <div>
                                    {[...Array(5)].map((_, index) => (
                                        <UserCardSkeleton key={index} />
                                    ))}
                                </div>
                            ) : followings?.content?.length ? (
                                <div>
                                    {followings.content.map((follow) => (
                                        <UserCard
                                            key={`following-${follow.id}`}
                                            follow={follow}
                                            isFollowing={true}
                                        />
                                    ))}

                                    {/* 팔로잉 페이지네이션 */}
                                    {followings.totalPages > 1 && (
                                        <Pagination
                                            totalPages={followings.totalPages}
                                            currentPage={followingsPage + 1}
                                            onPageChange={(page) =>
                                                setFollowingsPage(page - 1)
                                            }
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-lg font-medium mb-1">
                                        아직 팔로잉하는 사용자가 없습니다
                                    </p>
                                    <p className="text-muted-foreground">
                                        다른 사용자를 팔로우하면 여기에
                                        표시됩니다
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default FollowsPage;
