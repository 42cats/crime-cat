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
      <div className="absolute bottom-4 left-4 sm:left-32 flex items-center gap-2">
        {selectedBadge && (
          <Badge
            variant="secondary"
            className={cn(
              "text-sm py-1 px-3 font-medium",
              isDark
                ? "bg-indigo-900/70 text-white"
                : "bg-white/70 text-indigo-800"
            )}
          >
            {selectedBadge}
          </Badge>
        )}
        <h2
          className={cn(
            "text-xl sm:text-2xl font-bold",
            isDark ? "text-white" : "text-gray-800"
          )}
        >
          {nickname || "프로필 설정"}
        </h2>
      </div>
    </div>
  );
};

export default ProfileHeader;
