import React, { useState, useEffect } from "react";
import { ProfileDetailDto } from '@/api/profile';
import {
    PackageIcon,
    GamepadIcon,
    UserIcon,
    UsersIcon,
    Instagram,
    Twitter,
    MessageCircle,
    Link as LinkIcon,
    Copy,
    UserPlus,
    UserMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { followUser, unfollowUser, isFollowing } from "@/api/social/follow/index";

interface ProfileHeaderProps {
    profile: ProfileDetailDto;
    creationCount?: number; // 제작 테마 수 (별도 prop)
    followerCount?: number;
    followingCount?: number;
    onFollowChange?: () => void; // 팔로우 상태 변경 시 호출될 콜백
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    profile,
    creationCount,
    followerCount,
    followingCount,
    onFollowChange,
}) => {
    const { user, isAuthenticated } = useAuth();
    const [isFollowingUser, setIsFollowingUser] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 현재 사용자가 프로필 사용자를 팔로우하고 있는지 확인
    useEffect(() => {
        if (!isAuthenticated || user?.id === profile.userId) return;

        const checkFollowing = async () => {
            try {
                const following = await isFollowing(profile.userId);
                setIsFollowingUser(following);
            } catch (error) {
                console.error("팔로우 상태 확인 실패:", error);
            }
        };

        checkFollowing();
    }, [isAuthenticated, user, profile.userId]);

    // 팔로우/언팔로우 처리
    const handleFollowToggle = async () => {
        if (!isAuthenticated) {
            toast.error("로그인이 필요합니다");
            return;
        }

        setIsLoading(true);

        try {
            if (isFollowingUser) {
                await unfollowUser(profile.userId);
                setIsFollowingUser(false);
                toast.success(
                    `${profile.userNickname}님 팔로우를 취소했습니다`
                );
                // 상위 컴포넌트에 팔로우 상태 변경 알림
                if (onFollowChange) onFollowChange();
            } else {
                await followUser(profile.userId);
                setIsFollowingUser(true);
                toast.success(`${profile.userNickname}님을 팔로우했습니다`);
                // 상위 컴포넌트에 팔로우 상태 변경 알림
                if (onFollowChange) onFollowChange();
            }
        } catch (error) {
            console.error("팔로우 상태 변경 실패:", error);
            toast.error("팔로우 상태 변경에 실패했습니다");
        } finally {
            setIsLoading(false);
        }
    };
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
        <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                {/* 프로필 이미지 */}
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-blue-100 p-1 bg-white shadow-sm overflow-hidden">
                    {profile?.avatarImage ? (
                        <img
                            src={profile.avatarImage}
                            alt={`${profile.userNickname}의 프로필`}
                            className="w-full h-full object-cover rounded-full"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-full">
                            <span className="text-2xl md:text-3xl font-bold text-gray-400">
                                {profile?.userNickname?.[0]?.toUpperCase() ||
                                    "?"}
                            </span>
                        </div>
                    )}
                </div>

                {/* 사용자 정보 */}
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">
                        {profile.userNickname || "사용자"}
                    </h1>

                    <div className="inline-block px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-500 font-medium mb-2 md:mb-4">
                        @user{profile.userId.slice(0, 6)}
                    </div>

                    {/* 사용자 통계 */}
                    <div className="flex justify-center md:justify-start gap-3 md:gap-6 mt-1 md:mt-2">
                        <div className="flex items-center gap-1">
                            <PackageIcon
                                size={12}
                                className="text-blue-500 hidden md:inline"
                            />
                            <span className="text-xs md:text-sm font-medium">
                                제작{" "}
                                <span className="font-bold">
                                    {creationCount ??
                                        profile.creationCount ??
                                        0}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <GamepadIcon
                                size={12}
                                className="text-green-500 hidden md:inline"
                            />
                            <span className="text-xs md:text-sm font-medium">
                                크라임씬{" "}
                                <span className="font-bold">
                                    {profile.crimeSceneCount || 0}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <GamepadIcon
                                size={12}
                                className="text-blue-500 hidden md:inline"
                            />
                            <span className="text-xs md:text-sm font-medium">
                                방탈출{" "}
                                <span className="font-bold">
                                    {profile.escapeRoomCount || 0}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <UsersIcon
                                size={12}
                                className="text-purple-500 hidden md:inline"
                            />
                            <span className="text-xs md:text-sm font-medium">
                                팔로워{" "}
                                <span className="font-bold">
                                    {followerCount !== undefined
                                        ? followerCount.toLocaleString()
                                        : profile.followerCount?.toLocaleString() ||
                                          0}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <UserIcon
                                size={12}
                                className="text-indigo-500 hidden md:inline"
                            />
                            <span className="text-xs md:text-sm font-medium">
                                팔로잉{" "}
                                <span className="font-bold">
                                    {followingCount !== undefined
                                        ? followingCount.toLocaleString()
                                        : profile.followingCount?.toLocaleString() ||
                                          0}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* 오른쪽 액션 버튼들 */}
                <div className="flex flex-col gap-2 mt-2 md:mt-0">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs md:text-sm"
                        onClick={copyProfileLink}
                    >
                        <Copy size={14} className="mr-1 md:mr-2" />
                        <span className="hidden sm:inline">
                            프로필 링크 복사
                        </span>
                        <span className="sm:hidden">링크 복사</span>
                    </Button>

                    {isAuthenticated && user?.id !== profile.userId && (
                        <Button
                            variant={
                                isFollowingUser ? "destructive" : "default"
                            }
                            size="sm"
                            className="text-xs md:text-sm"
                            onClick={handleFollowToggle}
                            disabled={isLoading}
                        >
                            {isFollowingUser ? (
                                <>
                                    <UserMinus
                                        size={14}
                                        className="mr-1 md:mr-2"
                                    />
                                    <span className="hidden sm:inline">
                                        언팔로우
                                    </span>
                                    <span className="sm:hidden">언팔로우</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus
                                        size={14}
                                        className="mr-1 md:mr-2"
                                    />
                                    <span className="hidden sm:inline">
                                        팔로우
                                    </span>
                                    <span className="sm:hidden">팔로우</span>
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* 소셜 미디어 링크 - 항상 표시 */}
            <div className="mt-2 md:mt-4 flex justify-center md:justify-start space-x-2 md:space-x-3">
                <button
                    onClick={() =>
                        openSocialLink(profile?.socialLinks?.instagram)
                    }
                    className={`p-1.5 md:p-2 rounded-full ${
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
                    <Twitter size={14} />
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
                    <MessageCircle size={14} />
                </button>
            </div>
        </div>
    );
};

export default ProfileHeader;
