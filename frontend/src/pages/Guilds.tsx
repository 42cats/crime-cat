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
import { Search, Server, Users, Settings } from "lucide-react";
import { authService } from "@/api/authService";
import { useAuth } from "@/hooks/useAuth";

const Guilds: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    const {
        data: guilds,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["guilds"],
        queryFn: authService.getUserGuilds,
    });

    // 검색어 기준으로 길드 필터링
    const filteredGuilds = Array.isArray(guilds)
    ? guilds.filter((guild) =>
        guild?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

    const handleSettingsClick = (guildId: string, guildName: string) => {
        navigate(`/dashboard/guilds/${guildId}/message-format`, {
            state: { guildName },
        });
    };

    // 로딩 중 스켈레톤 UI
    if (isLoading) {
        return (
            <PageTransition>
                <div className="container mx-auto px-6 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">
                            내 디스코드 서버
                        </h1>
                        <p className="text-muted-foreground">
                            디스코드 서버 연동을 관리할 수 있어요.
                        </p>
                    </div>

                    <div className="max-w-md mb-6">
                        <Skeleton className="h-10 w-full rounded-md" />
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

    // 오류 발생 시
    if (error) {
        return (
            <PageTransition>
                <div className="container mx-auto px-6 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">
                            서버 로딩 오류
                        </h1>
                        <p className="text-muted-foreground">
                            디스코드 서버 목록을 불러오는 중 문제가
                            발생했습니다. 잠시 후 다시 시도해주세요.
                        </p>
                    </div>
                </div>
            </PageTransition>
        );
    }

    // 데이터 표시
    return (
        <PageTransition>
            <div className="container mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">
                        내 디스코드 서버
                    </h1>
                    <p className="text-muted-foreground">
                        디스코드 서버 연동을 관리할 수 있어요.
                    </p>
                </div>

                {/* 검색창 */}
                <div className="max-w-md mb-6">
                    <div className="relative">
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

                {/* 서버 목록 */}
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
                                            {guild.approximate_presence_count !==
                                                null &&
                                            guild.approximate_presence_count !==
                                                undefined
                                                ? guild.approximate_presence_count
                                                : "???"}
                                            명 총{" "}
                                            {guild.approximate_member_count !==
                                                null &&
                                            guild.approximate_member_count !==
                                                undefined
                                                ? guild.approximate_member_count
                                                : "???"}
                                            명
                                        </span>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {guild.features?.map(
                                            (feature, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                                                >
                                                    {feature}
                                                </span>
                                            )
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end gap-2">
                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        onClick={() =>
                                            handleSettingsClick(
                                                guild.id,
                                                guild.name
                                            )
                                        }
                                    >
                                        <Settings className="h-4 w-4 mr-2" />
                                        버튼 매크로
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
