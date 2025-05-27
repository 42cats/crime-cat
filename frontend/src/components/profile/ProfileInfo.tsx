import React from "react";
import { Badge } from "@/components/ui/badge";
import { UTCToKST } from "@/lib/dateFormat";
import type { UserProfile } from "@/types/profile";

interface ProfileInfoProps {
  user: UserProfile;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ user }) => {
  return (
    <div className="space-y-4">
      {user.profile_image_path && (
        <div className="w-24 h-24 rounded-full overflow-hidden mx-auto">
          <img
            src={user.profile_image_path ?? "/content/image/default_profile_image.png"}
            alt="프로필 이미지"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ProfileField label="닉네임" value={user.nickname} />
        <ProfileField label="타이틀" value={user.title} />
        <ProfileField
          label="뱃지"
          value={<Badge>{user.badge || "없음"}</Badge>}
        />
        <ProfileField
          label="마지막 로그인"
          value={
            user.last_login_at ? (
              <UTCToKST date={user.last_login_at} />
            ) : (
              "-"
            )
          }
        />
      </div>

      <div>
        <p className="text-sm text-muted-foreground">자기소개</p>
        <p className="mt-1 text-base whitespace-pre-line">
          {user.bio || "-"}
        </p>
      </div>
    </div>
  );
};

const ProfileField: React.FC<{ label: string; value?: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div>
    <p className="text-sm text-muted-foreground">{label}</p>
    {typeof value === "string" || typeof value === "number" ? (
      <p className="mt-1 text-base">{value || "-"}</p>
    ) : (
      <div className="mt-1 text-base">{value}</div>
    )}
  </div>
);
