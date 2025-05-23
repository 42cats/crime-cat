import React, { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UTCToKST } from "@/lib/dateFormat";
import { useQuery } from "@tanstack/react-query";
import { guildsService } from '@/api/guild';
import { CrimesceneThemeDetailType } from "@/lib/types";
import { Users, Calendar, Clock, Medal, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ThemeGuildInfoProps {
    theme: CrimesceneThemeDetailType;
}

const ThemeGuildInfo: React.FC<ThemeGuildInfoProps> = ({ theme }) => {
    // 크라임씬 테마가 아니거나 길드 정보가 없으면 렌더링하지 않음
    if (theme.type !== "CRIMESCENE" || !theme.guild) {
        return null;
    }

    // 길드 정보 가져오기
    const {
        data: guild,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["guild", theme.guild.snowflake],
        queryFn: () => guildsService.getGuildDetail(theme.guild.snowflake),
        enabled: !!theme.guild?.snowflake,
    });

    // 로딩 상태
    if (isLoading) {
        return (
            <div className="bg-muted/40 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-bold mb-4">길드 정보</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-14 w-14 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    // 에러 상태
    if (isError) {
        return (
            <div className="bg-muted/40 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-bold mb-4">길드 정보</h2>
                <p className="text-muted-foreground">
                    길드 정보를 불러올 수 없습니다.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-muted/40 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">길드 정보</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* 길드 기본 정보 섹션 */}
                <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 rounded-full border-2 border-purple-200 dark:border-purple-900">
                        <AvatarImage
                            src={
                                guild?.guildIcon ||
                                "https://cdn.discordapp.com/embed/avatars/1.png"
                            }
                            alt={guild?.guildName || theme.guild.name}
                        />
                        <AvatarFallback className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                            {(guild?.guildName || theme.guild.name)
                                .substring(0, 2)
                                .toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-semibold text-base">
                            {guild?.guildName || theme.guild.name}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Medal className="h-3.5 w-3.5" />
                            대표: {guild?.guildOwnerName || "정보 없음"}
                        </p>
                    </div>
                </div>

                {/* 길드 통계 정보 - 그리드 형식 */}
                <div className="grid grid-cols-2 gap-3">
                    {/* 멤버 수 */}
                    <div className="bg-muted/60 p-3 rounded-md flex flex-col">
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <Users className="h-3.5 w-3.5" />
                            멤버 수
                        </span>
                        <span className="font-medium text-sm">
                            {guild?.guildMemberCount?.toLocaleString() || "-"}명
                        </span>
                    </div>

                    {/* 누적 참여자 수 */}
                    <div className="bg-muted/60 p-3 rounded-md flex flex-col">
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <UserCheck className="h-3.5 w-3.5" />
                            기록된 참여자
                        </span>
                        <span className="font-medium text-sm">
                            {guild?.totalHistoryUserCount?.toLocaleString() ||
                                "-"}
                            명
                        </span>
                    </div>

                    {/* 길드 생성일 */}
                    <div className="bg-muted/60 p-3 rounded-md flex flex-col">
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <Calendar className="h-3.5 w-3.5" />
                            생성일
                        </span>
                        <span className="font-medium text-sm">
                            {guild?.guildCreatedAt ? (
                                <UTCToKST
                                    date={guild.guildCreatedAt}
                                />
                            ) : (
                                "-"
                            )}
                        </span>
                    </div>

                    {/* 마지막 플레이 */}
                    <div className="bg-muted/60 p-3 rounded-md flex flex-col">
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <Clock className="h-3.5 w-3.5" />
                            마지막 플레이
                        </span>
                        <span className="font-medium text-sm">
                            {guild?.lastPlayTime ? (
                                <UTCToKST
                                    date={guild.lastPlayTime}
                                />
                            ) : (
                                "-"
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThemeGuildInfo;
