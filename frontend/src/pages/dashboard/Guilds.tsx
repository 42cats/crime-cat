import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Search, Server, Users, Settings, Globe, Lock } from "lucide-react";
import { authService } from '@/api/auth';
import { useMutation, useQueryClient } from "@tanstack/react-query";

const Guilds: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [guildPublicStatuses, setGuildPublicStatuses] = useState<Record<string, boolean>>({});
    const [loadingStatuses, setLoadingStatuses] = useState<Record<string, boolean>>({});
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        data: guilds,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["guilds"],
        queryFn: authService.getUserGuilds,
    });

    // 길드 공개 상태 업데이트 뮤테이션
    const togglePublicMutation = useMutation({
        mutationFn: authService.toggleGuildPublicStatus,
        onMutate: async (guildId: string) => {
            setLoadingStatuses(prev => ({ ...prev, [guildId]: true }));
        },
        onSuccess: (newStatus: boolean, guildId: string) => {
            setGuildPublicStatuses(prev => ({ ...prev, [guildId]: newStatus }));
            setLoadingStatuses(prev => ({ ...prev, [guildId]: false }));
        },
        onError: (error, guildId: string) => {
            console.error('길드 공개 상태 토글 실패:', error);
            setLoadingStatuses(prev => ({ ...prev, [guildId]: false }));
        },
    });

    const filteredGuilds = Array.isArray(guilds)
        ? guilds.filter((guild) =>
              guild?.name?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : [];

    const messageMacroSetting = (guildId: string, guildName: string) => {
        navigate(`/dashboard/guilds/message-format`, {
            state: { guildName, guildId },
        });
    };

    const gameHistoryPage = (guildId: string, guildName: string) => {
        navigate(`/dashboard/guilds/crime-scene-history`, {
            state: { guildName, guildId },
        });
    };

    // 길드 공개 상태 초기 로드
    const loadGuildPublicStatus = async (guildId: string) => {
        try {
            if (!guildPublicStatuses.hasOwnProperty(guildId)) {
                const status = await authService.getGuildPublicStatus(guildId);
                setGuildPublicStatuses(prev => ({ ...prev, [guildId]: status }));
            }
        } catch (error) {
            console.error(`Failed to load public status for guild ${guildId}:`, error);
        }
    };

    // 길드 공개 상태 토글
    const handleTogglePublicStatus = (guildId: string) => {
        if (!loadingStatuses[guildId]) {
            togglePublicMutation.mutate(guildId);
        }
    };

    // 금드 목록이 로드되면 각 길드의 공개 상태 로드
    React.useEffect(() => {
        if (guilds) {
            guilds.forEach(guild => {
                loadGuildPublicStatus(guild.id);
            });
        }
    }, [guilds]);

    if (isLoading) {
        return (
            <PageTransition>
                <div className="container mx-auto px-6 py-8">
                    <div className="flex flex-col items-center text-center">
                        <h1 className="text-3xl font-bold mb-2">
                            내 디스코드 서버
                        </h1>
                        <p className="text-muted-foreground mb-6">
                            디스코드 서버 연동을 관리할 수 있어요.
                        </p>
                        <div className="w-full max-w-md mb-6">
                            <Skeleton className="h-10 w-full rounded-md" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array(6)
                            .fill(0)
                            .map((_, i) => (
                                <Skeleton key={i} className="h-60 rounded-xl" />
                            ))}
                    </div>
                </div>
            </PageTransition>
        );
    }

    if (error) {
        return (
            <PageTransition>
                <div className="container mx-auto px-6 py-8 text-center">
                    <h1 className="text-3xl font-bold mb-2">서버 로딩 오류</h1>
                    <p className="text-muted-foreground">
                        디스코드 서버 목록을 불러오는 중 문제가 발생했습니다.
                        잠시 후 다시 시도해주세요.
                    </p>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <div className="container mx-auto px-6 py-8">
                <div className="flex flex-col items-center text-center">
                    <h1 className="text-3xl font-bold mb-2">
                        내 디스코드 서버
                    </h1>
                    <p className="text-muted-foreground mb-6">
                        디스코드 서버 연동을 관리할 수 있어요.
                    </p>
                    <div className="w-full max-w-md mb-6 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="서버 검색..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {filteredGuilds && filteredGuilds.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredGuilds.map((guild) => (
                            <Card key={guild.id} className="overflow-hidden">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        {guild.icon ? (
                                            <img
                                                src={guild.icon}
                                                alt={guild.name}
                                                className="h-10 w-10 rounded-full"
                                            />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Server className="h-5 w-5 text-primary" />
                                            </div>
                                        )}
                                        <div>
                                            <CardTitle className="text-xl">
                                                {guild.name}
                                            </CardTitle>
                                            <CardDescription>
                                                ID: {guild.id}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        <span>
                                            온라인{" "}
                                            {guild.approximate_presence_count ??
                                                "???"}
                                            명 총{" "}
                                            {guild.approximate_member_count ??
                                                "???"}
                                            명
                                        </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {/* {guild.features?.map((feature, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                                            >
                                                {feature}
                                            </span>
                                        ))} */}
                                    </div>
                                    <div className="mt-4 flex items-center justify-between p-3 bg-muted/50 rounded-md">
                                        <div className="flex items-center gap-2">
                                            {guildPublicStatuses[guild.id] ? (
                                                <Globe className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <Lock className="h-4 w-4 text-gray-500" />
                                            )}
                                            <span className="text-sm font-medium">
                                                {guildPublicStatuses[guild.id] ? "공개" : "비공개"}
                                            </span>
                                        </div>
                                        <Switch
                                            checked={guildPublicStatuses[guild.id] || false}
                                            onCheckedChange={() => handleTogglePublicStatus(guild.id)}
                                            disabled={loadingStatuses[guild.id]}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end gap-2">
                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        onClick={() =>
                                            messageMacroSetting(
                                                guild.id,
                                                guild.name
                                            )
                                        }
                                    >
                                        <Settings className="h-4 w-4 mr-2" />
                                        버튼 매크로
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        onClick={() =>
                                            gameHistoryPage(
                                                guild.id,
                                                guild.name
                                            )
                                        }
                                    >
                                        <Settings className="h-4 w-4 mr-2" />
                                        히스토리
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Server className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h2 className="text-xl font-medium mb-2">
                            서버를 찾을 수 없어요
                        </h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            {searchQuery
                                ? "입력한 검색어와 일치하는 서버가 없습니다."
                                : "아직 접근 가능한 디스코드 서버가 없습니다."}
                        </p>
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default Guilds;
