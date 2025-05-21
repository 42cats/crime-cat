import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/lib/types";
import { Button } from "../ui/button";

interface UserListItemProps {
  userId: string;
  nickname: string;
  profileImage?: string | null;
  onProfileClick: (userId: string) => void;
}

const UserListItem: React.FC<UserListItemProps> = ({
  userId,
  nickname,
  profileImage,
  onProfileClick,
}) => {
  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        {/* 프로필 이미지 */}
        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
          {profileImage ? (
            <img
              src={profileImage}
              alt={`${nickname}의 프로필`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-lg font-bold text-gray-500">
                {nickname[0]?.toUpperCase() || "?"}
              </span>
            </div>
          )}
        </div>

        {/* 사용자 정보 */}
        <div className="flex-1">
          <p className="font-medium text-gray-800">{nickname}</p>
          <p className="text-xs text-gray-500">@user{userId.slice(0, 6)}</p>
        </div>
      </div>

      {/* 프로필 보기 버튼 */}
      <Button
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={() => onProfileClick(userId)}
      >
        프로필 보기
      </Button>
    </div>
  );
};

export default UserListItem;
