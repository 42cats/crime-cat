import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Loader2,
    Users,
    Plus,
    X,
    Search,
    Trophy,
    Target,
    TrendingUp,
    MapPin,
    Clock,
    DollarSign,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { gameComparisonService } from "@/api/game";
import { searchUserService } from "@/api/social/search/searchUserService";
import {
    GameComparisonRequest,
    GameComparisonResponse,
    ComparisonSortOption,
    UnplayedTheme,
    UserPlayStats,
} from "@/types/gameComparison";
import { GameType } from "@/types/integratedGameHistory";
import { toast } from "sonner";

const GameComparisonPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedUsers, setSelectedUsers] = useState<
        Array<{ id: string; nickname: string; avatar?: string }>
    >([]);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [activeTab, setActiveTab] = useState<"crimescene" | "escaperoom">(
        "crimescene"
    );
    const [comparisonFilter, setComparisonFilter] = useState<
        Partial<GameComparisonRequest>
    >({
        gameType: GameType.CRIMESCENE,
        sortBy: ComparisonSortOption.RECOMMENDATION,
        page: 0,
        size: 20,
    });

    // 사용자 검색
    const { data: searchResults, isLoading: isSearching } = useQuery({
        queryKey: ["user-search", searchKeyword],
        queryFn: () => {
            const params = new URLSearchParams({
                keyword: searchKeyword,
                page: "0",
                size: "10",
            });
            return searchUserService.getSearchUser(params.toString());
        },
        enabled: searchKeyword.length > 0,
    });

    // 게임 비교 조회
    const {
        data: comparisonData,
        isLoading: isComparing,
        refetch,
    } = useQuery<GameComparisonResponse>({
        queryKey: [
            "game-comparison",
            selectedUsers.map((u) => u.id),
            activeTab,
            comparisonFilter,
        ],
        queryFn: () =>
            gameComparisonService.compareGameHistories({
                userIds: [user!.id, ...selectedUsers.map((u) => u.id)],
                gameType:
                    activeTab === "crimescene"
                        ? GameType.CRIMESCENE
                        : GameType.ESCAPE_ROOM,
                ...comparisonFilter,
            } as GameComparisonRequest),
        enabled: selectedUsers.length > 0 && !!user,
    });

    const handleAddUser = (userToAdd: {
        id: string;
        nickname: string;
        avatar?: string;
    }) => {
        if (selectedUsers.find((u) => u.id === userToAdd.id)) {
            toast.error("이미 추가된 사용자입니다.");
            return;
        }
        if (selectedUsers.length >= 10) {
            toast.error("최대 10명까지 비교할 수 있습니다.");
            return;
        }
        setSelectedUsers([...selectedUsers, userToAdd]);
        setIsSearchModalOpen(false);
        setSearchKeyword("");
    };

    const handleRemoveUser = (userId: string) => {
        setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value as "crimescene" | "escaperoom");
        setComparisonFilter((prev) => ({
            ...prev,
            gameType:
                value === "crimescene"
                    ? GameType.CRIMESCENE
                    : GameType.ESCAPE_ROOM,
            page: 0,
        }));
    };

    const handleThemeClick = (theme: UnplayedTheme) => {
        if (theme.gameType === GameType.CRIMESCENE) {
            navigate(`/themes/crimescene/${theme.id}`);
        } else {
            navigate(`/themes/escape-room/${theme.id}`);
        }
    };

    const handlePageChange = (newPage: number) => {
        setComparisonFilter((prev) => ({ ...prev, page: newPage }));
        window.scrollTo(0, 0);
    };

    return (
        <div className="container mx-auto py-6 px-4 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">게임 비교</h1>
                <p className="text-muted-foreground">
                    친구들과 함께 플레이하지 않은 테마를 찾아보세요
                </p>
            </div>

            {/* 사용자 선택 섹션 */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">
                        비교할 사용자 선택
                    </CardTitle>
                    <CardDescription>
                        최대 10명까지 선택할 수 있습니다
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3 items-center">
                        {/* 현재 사용자 */}
                        <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg">
                            <Avatar className="w-8 h-8">
                                <AvatarImage
                                    src={
                                        user?.profileImage ||
                                        "/content/image/default_profile_image.png"
                                    }
                                />
                                <AvatarFallback>
                                    {user?.nickname?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                                {user?.nickname}
                            </span>
                            <Badge variant="secondary">나</Badge>
                        </div>

                        {/* 선택된 사용자들 */}
                        {selectedUsers.map((selectedUser) => (
                            <div
                                key={selectedUser.id}
                                className="flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-lg"
                            >
                                <Avatar className="w-8 h-8">
                                    <AvatarImage
                                        src={
                                            selectedUser.avatar ||
                                            "/content/image/default_profile_image.png"
                                        }
                                    />
                                    <AvatarFallback>
                                        {selectedUser.nickname?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <span>{selectedUser.nickname}</span>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-6 h-6"
                                    onClick={() =>
                                        handleRemoveUser(selectedUser.id)
                                    }
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}

                        {/* 사용자 추가 버튼 */}
                        {selectedUsers.length < 10 && (
                            <Button
                                variant="outline"
                                onClick={() => setIsSearchModalOpen(true)}
                                className="gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                사용자 추가
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 비교 결과 */}
            {selectedUsers.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">
                            비교할 사용자를 선택해주세요
                        </p>
                    </CardContent>
                </Card>
            ) : isComparing ? (
                <Card>
                    <CardContent className="py-20">
                        <div className="flex flex-col items-center justify-center">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground">
                                게임 기록을 비교하는 중...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : comparisonData ? (
                <div className="space-y-6">
                    {/* 사용자별 통계 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {Object.entries(comparisonData.userStatistics).map(
                            ([userId, stats]) => (
                                <Card key={userId}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Avatar className="w-8 h-8">
                                                <AvatarFallback>
                                                    {stats.nickname?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">
                                                    {stats.nickname}
                                                </p>
                                                {userId === user?.id && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        나
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    플레이
                                                </span>
                                                <span className="font-medium">
                                                    {stats.totalPlayCount}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    고유 테마
                                                </span>
                                                <span className="font-medium">
                                                    {stats.uniqueThemeCount}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-muted-foreground">
                                                        완료율
                                                    </span>
                                                    <span className="font-medium">
                                                        {stats.completionRate.toFixed(
                                                            1
                                                        )}
                                                        %
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={stats.completionRate}
                                                    className="h-2"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        )}
                    </div>

                    {/* 게임 타입 탭 */}
                    <Tabs value={activeTab} onValueChange={handleTabChange}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="crimescene">
                                크라임씬
                            </TabsTrigger>
                            <TabsTrigger value="escaperoom">방탈출</TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="crimescene"
                            className="space-y-4 mt-4"
                        >
                            <ComparisonResults
                                themes={comparisonData.unplayedThemes.filter(
                                    (t) => t.gameType === GameType.CRIMESCENE
                                )}
                                totalThemeCount={comparisonData.totalThemeCount}
                                commonUnplayedCount={
                                    comparisonData.commonUnplayedCount
                                }
                                onThemeClick={handleThemeClick}
                                pageInfo={comparisonData.pageInfo}
                                onPageChange={handlePageChange}
                            />
                        </TabsContent>

                        <TabsContent
                            value="escaperoom"
                            className="space-y-4 mt-4"
                        >
                            <ComparisonResults
                                themes={comparisonData.unplayedThemes.filter(
                                    (t) => t.gameType === GameType.ESCAPE_ROOM
                                )}
                                totalThemeCount={comparisonData.totalThemeCount}
                                commonUnplayedCount={
                                    comparisonData.commonUnplayedCount
                                }
                                onThemeClick={handleThemeClick}
                                pageInfo={comparisonData.pageInfo}
                                onPageChange={handlePageChange}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            ) : null}

            {/* 사용자 검색 모달 */}
            <Dialog
                open={isSearchModalOpen}
                onOpenChange={setIsSearchModalOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>사용자 검색</DialogTitle>
                        <DialogDescription>
                            비교할 사용자를 검색하여 추가하세요
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>닉네임 검색</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="닉네임을 입력하세요"
                                    value={searchKeyword}
                                    onChange={(e) =>
                                        setSearchKeyword(e.target.value)
                                    }
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {isSearching ? (
                            <div className="py-8 text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                            </div>
                        ) : searchResults &&
                          searchResults.content.length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {searchResults.content.map((searchUser) => (
                                    <div
                                        key={searchUser.id}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 cursor-pointer"
                                        onClick={() =>
                                            handleAddUser({
                                                id: searchUser.id,
                                                nickname: searchUser.nickname,
                                                avatar: searchUser.profileImage,
                                            })
                                        }
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage
                                                    src={
                                                        searchUser.profileImage ||
                                                        "/content/image/default_profile_image.png"
                                                    }
                                                />
                                                <AvatarFallback>
                                                    {searchUser.nickname?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span>{searchUser.nickname}</span>
                                        </div>
                                        <Button size="sm" variant="ghost">
                                            선택
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : searchKeyword.length > 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                검색 결과가 없습니다
                            </p>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// 비교 결과 컴포넌트
const ComparisonResults: React.FC<{
    themes: UnplayedTheme[];
    totalThemeCount: number;
    commonUnplayedCount: number;
    onThemeClick: (theme: UnplayedTheme) => void;
    pageInfo: any;
    onPageChange: (page: number) => void;
}> = ({
    themes,
    totalThemeCount,
    commonUnplayedCount,
    onThemeClick,
    pageInfo,
    onPageChange,
}) => {
    return (
        <>
            {/* 요약 통계 */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">
                            전체 테마
                        </p>
                        <p className="text-2xl font-bold">{totalThemeCount}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">
                            공통 미플레이
                        </p>
                        <p className="text-2xl font-bold text-orange-600">
                            {themes.length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">
                            추천 테마
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                            {
                                themes.filter((t) => t.recommendations > 50)
                                    .length
                            }
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 테마 목록 */}
            {themes.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                        <p className="text-lg font-medium mb-2">
                            모든 테마를 플레이했습니다!
                        </p>
                        <p className="text-muted-foreground">
                            선택한 사용자들이 공통으로 플레이하지 않은 테마가
                            없습니다.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {themes.map((theme) => (
                        <Card
                            key={theme.id}
                            className="cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => onThemeClick(theme)}
                        >
                            <CardContent className="p-4">
                                <div className="flex gap-4">
                                    <img
                                        src={
                                            theme.thumbnail ||
                                            "/content/image/default_crime_scene_image.png"
                                        }
                                        alt={theme.title}
                                        className="w-24 h-24 object-cover rounded-lg"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    {theme.title}
                                                </h3>
                                                {theme.guildName && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {theme.guildName}
                                                    </p>
                                                )}
                                                {theme.locations &&
                                                    theme.locations[0] && (
                                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {
                                                                theme
                                                                    .locations[0]
                                                                    .storeName
                                                            }
                                                        </p>
                                                    )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Badge variant="secondary">
                                                    난이도 {theme.difficulty}
                                                </Badge>
                                                {theme.recommendations > 50 && (
                                                    <Badge variant="default">
                                                        추천
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        {theme.summary && (
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                                {theme.summary}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                {theme.playersMin}-
                                                {theme.playersMax}명
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {theme.playTimeMin}-
                                                {theme.playTimeMax}분
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <DollarSign className="w-4 h-4" />
                                                {theme.price.toLocaleString()}원
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <TrendingUp className="w-4 h-4" />
                                                {theme.totalPlayCount}회 플레이
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* 페이지네이션 */}
            {pageInfo.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <Button
                        variant="outline"
                        onClick={() => onPageChange(pageInfo.currentPage - 1)}
                        disabled={!pageInfo.hasPrevious}
                    >
                        이전
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm">
                            {pageInfo.currentPage + 1} / {pageInfo.totalPages}
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => onPageChange(pageInfo.currentPage + 1)}
                        disabled={!pageInfo.hasNext}
                    >
                        다음
                    </Button>
                </div>
            )}
        </>
    );
};

export default GameComparisonPage;
