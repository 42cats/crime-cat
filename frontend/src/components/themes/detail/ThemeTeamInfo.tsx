import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Team, ThemeDetailType } from "@/lib/types";

interface ThemeTeamInfoProps {
    theme: ThemeDetailType;
    teamData: Team | null;
    isLoadingTeam: boolean;
    teamError: boolean;
    onProfileClick: (userId: string) => void;
    onGuildClick: () => void;
}

const ThemeTeamInfo: React.FC<ThemeTeamInfoProps> = ({
    theme,
    teamData,
    isLoadingTeam,
    teamError,
    onProfileClick,
    onGuildClick,
}) => {
    // 크라임씬 테마가 아니거나 팀 정보가 없으면 렌더링하지 않음
    if (theme.type !== "CRIMESCENE" || !theme.team) {
        return null;
    }

    return (
        <div className="bg-muted/40 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">팀 정보</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 팀 정보 */}
                <div className="space-y-4">
                    {theme.team && (
                        <div>
                            {/* 팀원 수에 따라 제목 변경 */}
                            {isLoadingTeam ? (
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                    팀 정보
                                </h3>
                            ) : teamError ? (
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                    팀 정보
                                </h3>
                            ) : teamData?.members &&
                              teamData.members.length === 1 ? (
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                    제작자 정보
                                </h3>
                            ) : teamData?.members &&
                              teamData.members.length > 1 ? (
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                    합작팀 정보
                                </h3>
                            ) : theme.team.members &&
                              theme.team.members.length === 1 ? (
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                    제작자 정보
                                </h3>
                            ) : theme.team.members &&
                              theme.team.members.length > 1 ? (
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                    합작팀 정보
                                </h3>
                            ) : (
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                    팀 정보
                                </h3>
                            )}

                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                                    {theme.team.name}
                                </span>
                            </div>

                            {/* 팀원 정보 표시 - 한 명일 경우와 여러 명일 경우 다르게 표시 */}
                            {isLoadingTeam ? (
                                <div className="mt-3">
                                    <span className="text-sm text-muted-foreground">
                                        팀원 로딩 중...
                                    </span>
                                </div>
                            ) : teamError ? (
                                <div className="mt-3">
                                    <span className="text-sm text-muted-foreground">
                                        팀원 정보를 불러올 수 없습니다.
                                    </span>
                                </div>
                            ) : teamData?.members &&
                              teamData.members.length === 1 ? (
                                <div className="mt-3">
                                    {/* 단일 제작자 표시 방식 */}
                                    <div className="flex items-center gap-4">
                                        <button
                                            className="relative"
                                            onClick={() =>
                                                teamData.members[0].userId
                                                    ? onProfileClick(
                                                          teamData.members[0]
                                                              .userId
                                                      )
                                                    : null
                                            }
                                            disabled={
                                                !teamData.members[0].userId
                                            }
                                        >
                                            <Avatar className="h-16 w-16 border border-border hover:border-primary transition-colors">
                                                <AvatarImage
                                                    src={
                                                        teamData.members[0]
                                                            .avatarUrl || "/content/image/default_profile_image.png"
                                                    }
                                                    alt={
                                                        teamData.members[0]
                                                            .name || "avartar"
                                                    }
                                                />
                                                <AvatarFallback className="bg-muted text-primary font-medium text-lg">
                                                    {teamData.members[0].name
                                                        ? teamData.members[0].name
                                                              .charAt(0)
                                                              .toUpperCase()
                                                        : "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            {teamData.members[0].leader && (
                                                <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-yellow-500 text-white rounded-full text-xs">
                                                    ★
                                                </span>
                                            )}
                                        </button>
                                        <div className="flex flex-col">
                                            <button
                                                className="text-sm font-medium hover:text-primary transition-colors"
                                                onClick={() =>
                                                    teamData.members[0].userId
                                                        ? onProfileClick(
                                                              teamData
                                                                  .members[0]
                                                                  .userId
                                                          )
                                                        : null
                                                }
                                                disabled={
                                                    !teamData.members[0].userId
                                                }
                                            >
                                                {teamData.members[0].name}
                                            </button>
                                            <span className="text-xs text-muted-foreground">
                                                테마 제작자
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : teamData?.members &&
                              teamData.members.length > 1 ? (
                                <div className="mt-3">
                                    <span className="text-sm text-muted-foreground">
                                        팀원:
                                    </span>
                                    <div className="flex flex-wrap gap-4 mt-3">
                                        {teamData.members.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex flex-col items-center"
                                            >
                                                <button
                                                    className="relative"
                                                    onClick={() =>
                                                        member.userId
                                                            ? onProfileClick(
                                                                  member.userId
                                                              )
                                                            : null
                                                    }
                                                    disabled={!member.userId}
                                                >
                                                    <Avatar className="h-12 w-12 border border-border hover:border-primary transition-colors">
                                                        <AvatarImage
                                                            src={
                                                                member.avatarUrl ||
                                                                "/content/image/default_profile_image.png"
                                                            }
                                                            alt={
                                                                member.name ||
                                                                ""
                                                            }
                                                        />
                                                        <AvatarFallback className="bg-muted text-primary font-medium">
                                                            {member.name
                                                                ? member.name
                                                                      .charAt(0)
                                                                      .toUpperCase()
                                                                : "?"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {member.leader && (
                                                        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-yellow-500 text-white rounded-full text-xs">
                                                            ★
                                                        </span>
                                                    )}
                                                </button>
                                                <button
                                                    className="mt-1 text-xs font-medium hover:text-primary transition-colors"
                                                    onClick={() =>
                                                        member.userId
                                                            ? onProfileClick(
                                                                  member.userId
                                                              )
                                                            : null
                                                    }
                                                    disabled={!member.userId}
                                                >
                                                    {member.name}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : theme.team.members &&
                              theme.team.members.length === 1 ? (
                                <div className="mt-3">
                                    {/* 단일 제작자 표시 방식 (기본 팀 정보만 있는 경우) */}
                                    <span className="text-sm text-muted-foreground">
                                        제작자:
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <button
                                            className="inline-flex items-center gap-1 text-sm px-2 py-1 border border-border rounded-md hover:bg-muted transition-colors"
                                            onClick={() =>
                                                theme.team.members[0].userId
                                                    ? onProfileClick(
                                                          theme.team.members[0]
                                                              .userId
                                                      )
                                                    : null
                                            }
                                            disabled={
                                                !theme.team.members[0].userId
                                            }
                                        >
                                            {theme.team.members[0].leader && (
                                                <span className="text-yellow-500 text-xs">
                                                    ★
                                                </span>
                                            )}
                                            {theme.team.members[0].name}
                                        </button>
                                    </div>
                                </div>
                            ) : theme.team.members &&
                              theme.team.members.length > 1 ? (
                                <div className="mt-3">
                                    <span className="text-sm text-muted-foreground">
                                        팀원:
                                    </span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {theme.team.members.map((member) => (
                                            <button
                                                key={member.id}
                                                className="inline-flex items-center gap-1 text-sm px-2 py-1 border border-border rounded-md hover:bg-muted transition-colors"
                                                onClick={() =>
                                                    member.userId
                                                        ? onProfileClick(
                                                              member.userId
                                                          )
                                                        : null
                                                }
                                                disabled={!member.userId}
                                            >
                                                {member.leader && (
                                                    <span className="text-yellow-500 text-xs">
                                                        ★
                                                    </span>
                                                )}
                                                {member.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ThemeTeamInfo;
