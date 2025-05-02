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

    const multiSelectMessageEditor = (guildId: string, guildName: string) => {
        navigate(`/dashboard/guilds/message-editor`, {
            state: { guildName, guildId },
        });
    };

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
                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        onClick={() =>
                                            multiSelectMessageEditor(
                                                guild.id,
                                                guild.name
                                            )
                                        }
                                    >
                                        <Settings className="h-4 w-4 mr-2" />
                                        메시지 에디터
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
