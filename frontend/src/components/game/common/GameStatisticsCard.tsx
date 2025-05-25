import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Trophy,
    Target,
    Percent,
    TrendingUp,
    Gamepad2,
    Users,
    Map,
    Home,
} from "lucide-react";
import { GameStatistics, GameType } from "@/types/integratedGameHistory";
import { cn } from "@/lib/utils";

interface GameStatisticsCardProps {
    statistics: GameStatistics;
    className?: string;
}

export const GameStatisticsCard: React.FC<GameStatisticsCardProps> = ({
    statistics,
    className,
}) => {
    const crimeSceneStats = statistics.crimeScene;
    const escapeRoomStats = statistics.escapeRoom;

    const StatItem: React.FC<{
        icon: React.ReactNode;
        label: string;
        value: number | string;
        subValue?: string;
        color?: string;
    }> = ({ icon, label, value, subValue, color = "text-gray-600" }) => (
        <div className="flex items-center space-x-3">
            <div className={cn("p-2 rounded-lg bg-gray-50", color)}>{icon}</div>
            <div>
                <p className="text-sm text-gray-600">{label}</p>
                <p className="text-xl font-semibold">
                    {value}
                    {subValue && (
                        <span className="text-sm text-gray-500 ml-1">
                            {subValue}
                        </span>
                    )}
                </p>
            </div>
        </div>
    );

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    게임 플레이 통계
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* 전체 통계 */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                        전체 통계
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <StatItem
                            icon={
                                <Gamepad2 className="w-5 h-5 text-purple-600" />
                            }
                            label="총 플레이 횟수"
                            value={statistics.totalPlayCount}
                            color="text-purple-600"
                        />
                        <StatItem
                            icon={<Target className="w-5 h-5 text-blue-600" />}
                            label="고유 테마 수"
                            value={statistics.totalUniqueThemes}
                            color="text-blue-600"
                        />
                    </div>
                </div>

                {/* 크라임씬 통계 */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Home className="w-4 h-4" />
                            크라임씬
                        </h3>
                        <span className="text-xs text-gray-500">
                            {crimeSceneStats.winCount}/{crimeSceneStats.total}{" "}
                            승리
                        </span>
                    </div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <StatItem
                                icon={
                                    <Users className="w-4 h-4 text-indigo-600" />
                                }
                                label="플레이 횟수"
                                value={crimeSceneStats.playCount}
                            />
                            <StatItem
                                icon={
                                    <Trophy className="w-4 h-4 text-green-600" />
                                }
                                label="승률"
                                value={`${crimeSceneStats.winRate.toFixed(1)}%`}
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">승률</span>
                                <span className="text-gray-700 font-medium">
                                    {crimeSceneStats.winRate.toFixed(1)}%
                                </span>
                            </div>
                            <Progress
                                value={crimeSceneStats.winRate}
                                className="h-2"
                                indicatorClassName="bg-gradient-to-r from-indigo-500 to-purple-500"
                            />
                        </div>
                    </div>
                </div>

                {/* 방탈출 통계 */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Map className="w-4 h-4" />
                            방탈출
                        </h3>
                        <span className="text-xs text-gray-500">
                            {escapeRoomStats.winCount}/{escapeRoomStats.total}{" "}
                            성공
                        </span>
                    </div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4">
                            <StatItem
                                icon={
                                    <Gamepad2 className="w-4 h-4 text-blue-600" />
                                }
                                label="플레이 테마 횟수"
                                value={escapeRoomStats.unique}
                            />
                            <StatItem
                                icon={
                                    <Gamepad2 className="w-4 h-4 text-blue-600" />
                                }
                                label="총 플레이 횟수"
                                value={escapeRoomStats.playCount}
                                subValue={`(${escapeRoomStats.total}개 테마)`}
                            />
                            <StatItem
                                icon={
                                    <Trophy className="w-4 h-4 text-green-600" />
                                }
                                label="성공률"
                                value={`${escapeRoomStats.winRate.toFixed(1)}%`}
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">성공률</span>
                                <span className="text-gray-700 font-medium">
                                    {escapeRoomStats.winRate.toFixed(1)}%
                                </span>
                            </div>
                            <Progress
                                value={escapeRoomStats.winRate}
                                className="h-2"
                                indicatorClassName="bg-gradient-to-r from-blue-500 to-cyan-500"
                            />
                        </div>
                        {/* 중복 플레이 표시 */}
                        {escapeRoomStats.total > escapeRoomStats.unique && (
                            <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                                평균{" "}
                                {(
                                    escapeRoomStats.playCount /
                                    escapeRoomStats.unique
                                ).toFixed(1)}
                                회 재플레이
                            </div>
                        )}
                    </div>
                </div>

                {/* 비교 차트 */}
                <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                        게임별 비교
                    </h3>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                                크라임씬
                            </span>
                            <div className="flex-1 mx-3">
                                <Progress
                                    value={
                                        (crimeSceneStats.playCount /
                                            crimeSceneStats.total) *
                                        100
                                    }
                                    className="h-2"
                                    indicatorClassName="bg-indigo-500"
                                />
                            </div>
                            <span className="text-sm font-medium">{`${crimeSceneStats.playCount} / ${crimeSceneStats.total}`}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                                방탈출
                            </span>
                            <div className="flex-1 mx-3">
                                <Progress
                                    value={
                                        (escapeRoomStats.unique /
                                            escapeRoomStats.total) *
                                        100
                                    }
                                    className="h-2"
                                    indicatorClassName="bg-blue-500"
                                />
                            </div>
                            <span className="text-sm font-medium">{`${escapeRoomStats.unique} / ${escapeRoomStats.total}`}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
