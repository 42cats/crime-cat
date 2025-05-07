import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
    nickname: string;
    selectedBadge: string | null;
    isDark: boolean;
}

/**
 * 프로필 페이지 상단의 그라디언트 배경과 사용자 이름, 칭호를 표시하는 컴포넌트
 */
const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    nickname,
    selectedBadge,
    isDark,
}) => {
    return (
        <div
            className={cn(
                "h-32 w-full bg-gradient-to-r relative",
                isDark
                    ? "from-indigo-950 to-purple-900"
                    : "from-indigo-200 to-purple-300"
            )}
        >
            {/* 중앙 정렬을 위해 absolute 위치 조정 및 flex 중앙 정렬 적용 */}
            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center pb-4">
                <h2
                    className={cn(
                        "text-xl sm:text-2xl font-bold text-center",
                        isDark ? "text-white" : "text-gray-800"
                    )}
                >
                    {nickname || "프로필 설정"}
                </h2>

                {selectedBadge && (
                    <Badge
                        variant="secondary"
                        className={cn(
                            "text-sm py-1 px-3 font-medium mt-1",
                            isDark
                                ? "bg-indigo-900/70 text-white"
                                : "bg-white/70 text-indigo-800"
                        )}
                    >
                        {selectedBadge}
                    </Badge>
                )}
            </div>
        </div>
    );
};

export default ProfileHeader;
