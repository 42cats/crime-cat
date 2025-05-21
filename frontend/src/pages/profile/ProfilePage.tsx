import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProfileDetail, ProfileDetailDto } from "@/api/profile/detail";
import {
    getFollowerCount,
    getFollowingCount,
    isFollowing,
    followUser,
    unfollowUser,
} from "@/api/follow";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileBio from "@/components/profile/ProfileBio";
import ProfileThemeGrid from "@/components/profile/ProfileThemeGrid";
import ProfilePostGrid from "@/components/profile/ProfilePostGrid";
import ProfileFollowerList from "@/components/profile/ProfileFollowerList";
import ProfileFollowingList from "@/components/profile/ProfileFollowingList";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { UserX, AlertCircle } from "lucide-react";

const ProfilePage: React.FC = () => {
    const { userId: paramId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [profileId, setProfileId] = useState<string>(paramId || "");
    const [profile, setProfile] = useState<ProfileDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{
        type: string;
        message: string;
    } | null>(null);
    const [activeTab, setActiveTab] = useState<
        "themes" | "posts" | "followers" | "following"
    >("themes");
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [isFollowingUser, setIsFollowingUser] = useState(false);
    const [isLoadingFollow, setIsLoadingFollow] = useState(false);
    const [refreshFollowers, setRefreshFollowers] = useState(false);
    const [refreshFollowings, setRefreshFollowings] = useState(false);
    const { user, isAuthenticated } = useAuth();

    // 프로필 로드
    const loadProfile = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getProfileDetail(id);
            setProfile(data);
        } catch (err: any) {
            if (err.response?.status === 404) {
                setError({
                    type: "not_found",
                    message: "사용자를 찾을 수 없습니다.",
                });
            } else if (err.request) {
                setError({
                    type: "network_error",
                    message: "네트워크 오류입니다.",
                });
            } else {
                setError({
                    type: "unknown_error",
                    message: "알 수 없는 오류입니다.",
                });
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // 팔로우 카운트 로드 (profile state를 deps에서 제거)
    const loadFollowCounts = useCallback(
        async (id: string) => {
            try {
                const [fCount, fgCount] = await Promise.all([
                    getFollowerCount(id),
                    getFollowingCount(id),
                ]);
                setFollowerCount(fCount);
                setFollowingCount(fgCount);
            } catch {
                // 실패 시 기존 프로필 값 사용
                setFollowerCount(profile?.followerCount || 0);
                setFollowingCount(profile?.followingCount || 0);
            }
        },
        [
            /* no deps */
        ]
    );

    // 팔로우 상태 확인
    const checkFollowingStatus = useCallback(
        async (id: string) => {
            if (isAuthenticated && user && user.id !== id) {
                const status = await isFollowing(id);
                setIsFollowingUser(status);
            } else {
                setIsFollowingUser(false);
            }
        },
        [isAuthenticated, user]
    );

    // 초기 및 프로필 아이디 변경 시 로드
    useEffect(() => {
        if (!profileId) return;
        loadProfile(profileId);
        loadFollowCounts(profileId);
        checkFollowingStatus(profileId);
        setActiveTab("themes");
    }, [profileId, loadProfile, loadFollowCounts, checkFollowingStatus]);

    // 팔로우 토글
    const handleFollowToggle = async () => {
        if (!isAuthenticated) {
            toast.error("로그인이 필요합니다");
            return;
        }
        setIsLoadingFollow(true);
        try {
            if (isFollowingUser) {
                await unfollowUser(profileId);
                setIsFollowingUser(false);
                setFollowerCount((c) => Math.max(0, c - 1));
                toast.success("언팔로우 했습니다");
            } else {
                await followUser(profileId);
                setIsFollowingUser(true);
                setFollowerCount((c) => c + 1);
                toast.success("팔로우 했습니다");
            }
            if (activeTab === "followers") setRefreshFollowers((p) => !p);
            if (activeTab === "following") setRefreshFollowings((p) => !p);
        } catch {
            toast.error("요청 처리 중 오류");
        } finally {
            setIsLoadingFollow(false);
        }
    };

    // 프로필 클릭 전환
    const handleProfileClick = (newId: string) => {
        navigate(`/profile/${newId}`);
        setProfileId(newId);
        window.history.pushState({}, "", `/profile/${newId}`);
    };

    if (loading) return <div className="p-8 text-center">로딩 중...</div>;
    if (error) {
        return (
            <div className="container mx-auto p-8 text-center">
                {error.type === "not_found" ? (
                    <UserX size={48} className="mx-auto mb-4 text-gray-400" />
                ) : (
                    <AlertCircle
                        size={48}
                        className="mx-auto mb-4 text-gray-400"
                    />
                )}
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow overflow-hidden flex flex-col">
                <ProfileHeader
                    profile={profile!}
                    followerCount={followerCount}
                    followingCount={followingCount}
                    onFollowChange={() => loadFollowCounts(profileId)}
                />
                <div className="p-4 overflow-y-auto flex-1">
                    <ProfileBio bio={profile!.bio} />
                    <div className="mt-4 flex items-center space-x-2">
                        <Button
                            onClick={handleFollowToggle}
                            loading={isLoadingFollow}
                        >
                            {isFollowingUser ? "언팔로우" : "팔로우"}
                        </Button>
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(
                                    window.location.href
                                );
                                toast.success("링크 복사됨");
                            }}
                        >
                            링크 복사
                        </Button>
                    </div>
                    <div className="mt-6 flex space-x-4 border-b">
                        {(
                            [
                                "themes",
                                "posts",
                                "followers",
                                "following",
                            ] as const
                        ).map((tab) => (
                            <button
                                key={tab}
                                className={`pb-2 ${
                                    activeTab === tab
                                        ? "border-b-2 border-blue-500 text-blue-600"
                                        : "text-gray-500"
                                }`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab === "themes"
                                    ? "제작 테마"
                                    : tab === "posts"
                                    ? "포스트"
                                    : tab === "followers"
                                    ? `팔로워 (${followerCount})`
                                    : `팔로잉 (${followingCount})`}
                            </button>
                        ))}
                    </div>
                    <div className="mt-4">
                        {activeTab === "themes" && (
                            <ProfileThemeGrid userId={profileId} />
                        )}
                        {activeTab === "posts" && (
                            <ProfilePostGrid userId={profileId} />
                        )}
                        {activeTab === "followers" && (
                            <ProfileFollowerList
                                userId={profileId}
                                onProfileClick={handleProfileClick}
                                refresh={refreshFollowers}
                            />
                        )}
                        {activeTab === "following" && (
                            <ProfileFollowingList
                                userId={profileId}
                                onProfileClick={handleProfileClick}
                                refresh={refreshFollowings}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
