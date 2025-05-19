import React from "react";
import { ProfileDetailDto } from "@/api/profile/detail";
import {
    PackageIcon,
    GamepadIcon,
    CoinsIcon,
    Instagram,
    Twitter,
    MessageCircle,
    Link as LinkIcon,
    Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProfileHeaderProps {
    profile: ProfileDetailDto;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => {
    const copyProfileLink = () => {
        const profileUrl = `${window.location.origin}/profile/${profile.userId}`;
        navigator.clipboard
            .writeText(profileUrl)
            .then(() => {
                toast.success("프로필 링크가 복사되었습니다");
            })
            .catch(() => {
                toast.error("링크 복사에 실패했습니다");
            });
    };

    // 소셜 링크 열기 함수
    const openSocialLink = (url?: string) => {
        if (url) {
            window.open(url, "_blank", "noopener,noreferrer");
        }
    };

    return (
        <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
                {/* 프로필 이미지 */}
                <div className="w-36 h-36 rounded-full border-2 border-blue-100 p-1 bg-white shadow-sm overflow-hidden">
                    {profile?.avatarImage ? (
                        <img
                            src={profile.avatarImage}
                            alt={`${profile.userNickname}의 프로필`}
                            className="w-full h-full object-cover rounded-full"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-full">
                            <span className="text-3xl font-bold text-gray-400">
                                {profile?.userNickname?.[0]?.toUpperCase() ||
                                    "?"}
                            </span>
                        </div>
                    )}
                </div>

                {/* 사용자 정보 */}
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">
                        {profile.userNickname || "사용자"}
                    </h1>

                    <div className="inline-block px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-500 font-medium mb-4">
                        @user{profile.userId.slice(0, 6)}
                    </div>

                    {/* 사용자 통계 */}
                    <div className="flex justify-center md:justify-start gap-6 mt-2">
                        <div className="flex items-center gap-1">
                            <PackageIcon size={14} className="text-blue-500" />
                            <span className="text-sm font-medium">
                                제작{" "}
                                <span className="font-bold">
                                    {profile.creationCount || 0}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <GamepadIcon size={14} className="text-green-500" />
                            <span className="text-sm font-medium">
                                플레이{" "}
                                <span className="font-bold">
                                    {profile.playCount || 0}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <CoinsIcon size={14} className="text-yellow-500" />
                            <span className="text-sm font-medium">
                                포인트{" "}
                                <span className="font-bold">
                                    {profile.point?.toLocaleString() || 0}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* 오른쪽 액션 버튼들 */}
                <div className="flex flex-col gap-2 mt-4 md:mt-0">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-sm"
                        onClick={copyProfileLink}
                    >
                        <Copy size={14} className="mr-2" />
                        프로필 링크 복사
                    </Button>
                </div>
            </div>

            {/* 소셜 미디어 링크 - 항상 표시 */}
            <div className="mt-4 flex justify-center md:justify-start space-x-3">
                <button
                    onClick={() =>
                        openSocialLink(profile?.socialLinks?.instagram)
                    }
                    className={`p-2 rounded-full ${
                        profile?.socialLinks?.instagram
                            ? "bg-gradient-to-br from-purple-600 to-pink-500 text-white"
                            : "bg-gray-200 text-gray-400"
                    } hover:opacity-90 transition-all`}
                    aria-label="인스타그램 프로필 열기"
                    disabled={!profile?.socialLinks?.instagram}
                >
                    <Instagram size={16} />
                </button>

                <button
                    onClick={() => openSocialLink(profile?.socialLinks?.x)}
                    className={`p-2 rounded-full ${
                        profile?.socialLinks?.x
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-400"
                    } hover:opacity-90 transition-all`}
                    aria-label="X(트위터) 프로필 열기"
                    disabled={!profile?.socialLinks?.x}
                >
                    <Twitter size={16} />
                </button>

                <button
                    onClick={() => openSocialLink(profile?.socialLinks?.kakao)}
                    className={`p-2 rounded-full ${
                        profile?.socialLinks?.kakao
                            ? "bg-yellow-400 text-white"
                            : "bg-gray-200 text-gray-400"
                    } hover:opacity-90 transition-all`}
                    aria-label="카카오톡 오픈프로필 열기"
                    disabled={!profile?.socialLinks?.kakao}
                >
                    <MessageCircle size={16} />
                </button>
            </div>
        </div>
    );
};

export default ProfileHeader;
