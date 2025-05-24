import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { X, Copy, UserX, AlertCircle, UserPlus, UserMinus } from "lucide-react";
import { getProfileDetail, ProfileDetailDto } from "@/api/profile";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { toast } from "sonner";
import ProfileHeader from "./ProfileHeader";
import ProfileBio from "./ProfileBio";
import ProfileThemeGrid from "./ProfileThemeGrid";
import ProfilePostGrid from "./ProfilePostGrid";
import ProfileFollowerList from "./ProfileFollowerList";
import ProfileFollowingList from "./ProfileFollowingList";
import ProfileCrimeSceneGrid from "./ProfileCrimeSceneGrid";
import ProfileEscapeRoomGrid from "./ProfileEscapeRoomGrid";
import { useAuth } from "@/hooks/useAuth";
import {
    followUser,
    unfollowUser,
    isFollowing,
    getFollowerCount,
    getFollowingCount,
} from "@/api/social/follow/index";
import { userGameHistoryService } from "@/api/game/userGameHistoryService";

interface ProfileDetailModalProps {
    userId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSwitchProfile?: (newUserId: string) => void; // 프로필 전환 핸들러 추가
    followerCount?: number;
    followingCount?: number;
    onFollowChange?: () => void;
}

type TabType = "themes" | "posts" | "crimescene" | "escaperoom" | "followers" | "following";

const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
    userId,
    open,
    onOpenChange,
    onSwitchProfile,
    followerCount: propFollowerCount,
    followingCount: propFollowingCount,
    onFollowChange,
}) => {
    const { user, isAuthenticated } = useAuth();
    const [profile, setProfile] = useState<ProfileDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{
        type: string;
        message: string;
    } | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>("themes");
    const [themesCount, setThemesCount] = useState<number>(0);
    const [isFollowingUser, setIsFollowingUser] = useState(false);
    const [isLoadingFollow, setIsLoadingFollow] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [refreshFollowers, setRefreshFollowers] = useState(false);
    const [refreshFollowings, setRefreshFollowings] = useState(false);
    const [profileModalId, setProfileModalId] = useState<string>(userId);
    const [crimeSceneCount, setCrimeSceneCount] = useState<number>(0);
    const [escapeRoomCount, setEscapeRoomCount] = useState<number>(0);

    // 프로필 ID가 변경되면 모달 ID 업데이트
    useEffect(() => {
        console.log("ProfileDetailModal - userId 변경:", userId);
        setProfileModalId(userId);
    }, [userId]);

    // 모달 open 상태 변경 감지
    useEffect(() => {
        console.log("ProfileDetailModal - open 상태 변경:", open);
    }, [open]);

    // 프로필이 로드되면 팔로워/팔로잉 수 가져오기
    useEffect(() => {
        if (!profileModalId || !open) return;

        // 팔로워 수 가져오기
        const fetchFollowerCount = async () => {
            try {
                const count = await getFollowerCount(profileModalId);
                setFollowerCount(count);
            } catch (error) {
                console.error("팔로워 수 가져오기 실패:", error);
                // props에서 값이 전달된 경우 사용, 아니면 API로 조회한 값 사용
                if (propFollowerCount !== undefined) {
                    setFollowerCount(propFollowerCount);
                } else if (profile) {
                    setFollowerCount(profile.followerCount || 0);
                }
            }
        };

        // 팔로잉 수 가져오기
        const fetchFollowingCount = async () => {
            try {
                const count = await getFollowingCount(profileModalId);
                setFollowingCount(count);
            } catch (error) {
                console.error("팔로잉 수 가져오기 실패:", error);
                // props에서 값이 전달된 경우 사용, 아니면 API로 조회한 값 사용
                if (propFollowingCount !== undefined) {
                    setFollowingCount(propFollowingCount);
                } else if (profile) {
                    setFollowingCount(profile.followingCount || 0);
                }
            }
        };

        fetchFollowerCount();
        fetchFollowingCount();
    }, [profileModalId, open, profile, propFollowerCount, propFollowingCount]);

    // 게임 기록 개수 로드
    useEffect(() => {
        if (!profileModalId || !open) return;

        const fetchGameHistoryCounts = async () => {
            try {
                const [crimeSceneCountResult, escapeRoomCountResult] = await Promise.all([
                    userGameHistoryService.getCrimeSceneHistoryCount(profileModalId),
                    userGameHistoryService.getEscapeRoomHistoryCount(profileModalId)
                ]);
                
                setCrimeSceneCount(crimeSceneCountResult);
                setEscapeRoomCount(escapeRoomCountResult);
            } catch (error) {
                console.error("게임 기록 개수 조회 실패:", error);
                setCrimeSceneCount(0);
                setEscapeRoomCount(0);
            }
        };

        fetchGameHistoryCounts();
    }, [profileModalId, open]);

    // 다른 사용자의 프로필을 클릭했을 때 해당 사용자의 프로필로 전환
    const handleProfileClick = (newUserId: string) => {
        // 현재 모달 데이터 초기화 및 로딩 상태로 변경
        setLoading(true);

        if (onSwitchProfile) {
            // 상위 컴포넌트에서 제공한 전환 함수 사용
            onSwitchProfile(newUserId);
        } else {
            console.log("프로필 전환:", newUserId);
            // 현재 모달을 닫지 않고 데이터만 바꿈
            setProfile(null); // 기존 프로필 데이터 제거

            // URL 업데이트 (필요시)
            window.history.pushState({}, "", `/profile/${newUserId}`);

            // 새 사용자 ID로 상태 업데이트
            setProfileModalId(newUserId);

            // 다시 프로필 정보 로드
            getProfileDetail(newUserId)
                .then((data) => {
                    setProfile(data);
                    // 팔로우 카운트 로드
                    getFollowerCount(newUserId)
                        .then(setFollowerCount)
                        .catch(console.error);
                    getFollowingCount(newUserId)
                        .then(setFollowingCount)
                        .catch(console.error);
                    // 현재 사용자가 새 프로필 사용자를 팔로우하는지 확인
                    if (isAuthenticated && user?.id !== newUserId) {
                        isFollowing(newUserId)
                            .then(setIsFollowingUser)
                            .catch(console.error);
                    } else {
                        setIsFollowingUser(false);
                    }
                })
                .catch((err) => {
                    console.error("프로필 로드 실패:", err);
                    setError({
                        type: "load_error",
                        message: "프로필을 불러오는 중 오류가 발생했습니다.",
                    });
                })
                .finally(() => {
                    setLoading(false);
                });

            // 탭 초기화
            setActiveTab("themes");
            console.log("프로필 전환 완료");
        }
    };

    // 현재 사용자가 프로필 사용자를 팔로우하고 있는지 확인
    useEffect(() => {
        if (!isAuthenticated || !open || !user || user.id === profileModalId)
            return;

        const checkFollowing = async () => {
            try {
                const following = await isFollowing(profileModalId);
                setIsFollowingUser(following);
            } catch (error) {
                console.error("팔로우 상태 확인 실패:", error);
            }
        };

        checkFollowing();
    }, [isAuthenticated, user, profileModalId, open]);

    // 팔로우/언팔로우 처리
    const handleFollowToggle = async () => {
        if (!isAuthenticated) {
            toast.error("로그인이 필요합니다");
            return;
        }

        setIsLoadingFollow(true);

        try {
            if (isFollowingUser) {
                await unfollowUser(profileModalId);
                setIsFollowingUser(false);
                toast.success(
                    `${
                        profile?.userNickname || "사용자"
                    }님 팔로우를 취소했습니다`
                );

                // 팔로워 수 가져오기
                try {
                    const count = await getFollowerCount(profileModalId);
                    setFollowerCount(count);
                } catch (error) {
                    console.error("팔로워 수 가져오기 실패:", error);
                    // 현재 값에서 1 감소 (폴백)
                    setFollowerCount((prev) => Math.max(0, prev - 1));

                    // 상위 컴포넌트에 팔로우 변경 알림
                    if (onFollowChange) onFollowChange();
                }

                // 현재 탭이 팔로워나 팔로잉이면 데이터 리프레시
                if (activeTab === "followers") {
                    setRefreshFollowers((prev) => !prev);
                } else if (activeTab === "following") {
                    setRefreshFollowings((prev) => !prev);
                }
            } else {
                await followUser(profileModalId);
                setIsFollowingUser(true);
                toast.success(
                    `${profile?.userNickname || "사용자"}님을 팔로우했습니다`
                );

                // 팔로워 수 가져오기
                try {
                    const count = await getFollowerCount(profileModalId);
                    setFollowerCount(count);
                } catch (error) {
                    console.error("팔로워 수 가져오기 실패:", error);
                    // 현재 값에서 1 증가 (폴백)
                    setFollowerCount((prev) => prev + 1);

                    // 상위 컴포넌트에 팔로우 변경 알림
                    if (onFollowChange) onFollowChange();
                }

                // 현재 탭이 팔로워나 팔로잉이면 데이터 리프레시
                if (activeTab === "followers") {
                    setRefreshFollowers((prev) => !prev);
                } else if (activeTab === "following") {
                    setRefreshFollowings((prev) => !prev);
                }
            }
        } catch (error) {
            console.error("팔로우 상태 변경 실패:", error);
            toast.error("팔로우 상태 변경에 실패했습니다");
        } finally {
            setIsLoadingFollow(false);
        }
    };

    // 프로필 링크 복사 함수
    const copyProfileLink = () => {
        const profileUrl = `${window.location.origin}/profile/${profileModalId}`;
        navigator.clipboard
            .writeText(profileUrl)
            .then(() => {
                toast.success("프로필 링크가 복사되었습니다");
            })
            .catch(() => {
                toast.error("링크 복사에 실패했습니다");
            });
    };

    useEffect(() => {
        if (!open) return;

        console.log(
            "ProfileDetailModal - 프로필 정보 로드 시작:",
            profileModalId
        );
        setLoading(true);

        // 프로필 정보 로드 - 프로필모달ID 사용(사용자 전환 지원)
        if (profileModalId) {
            getProfileDetail(profileModalId)
                .then((data) => {
                    console.log("프로필 데이터 로드 성공:", data);
                    setProfile(data);
                    setError(null);
                })
                .catch((err) => {
                    console.error("프로필 로드 실패:", err);
                    // 오류 유형 처리
                    if (err.response) {
                        // 서버 응답이 왔지만 오류 상태코드인 경우
                        if (err.response.status === 404) {
                            setError({
                                type: "not_found",
                                message: "해당 사용자를 찾을 수 없습니다.",
                            });
                        } else {
                            setError({
                                type: "server_error",
                                message:
                                    "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
                            });
                        }
                    } else if (err.request) {
                        // 요청은 보냈지만 응답을 받지 못한 경우
                        setError({
                            type: "network_error",
                            message:
                                "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.",
                        });
                    } else {
                        // 기타 오류
                        setError({
                            type: "unknown_error",
                            message: "알 수 없는 오류가 발생했습니다.",
                        });
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [open, profileModalId]); // userId 대신 profileModalId 사용

    // 프로필 로딩 중 스켈레톤
    if (loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl w-full p-0 overflow-hidden max-h-[85vh]">
                    <DialogTitle className="sr-only">사용자 프로필</DialogTitle>
                    <DialogDescription className="sr-only">
                        사용자의 프로필 정보와 제작한 테마를 보여줍니다.
                    </DialogDescription>
                    <div className="p-8 space-y-4 animate-pulse">
                        <div className="flex gap-6">
                            <div className="w-24 h-24 rounded-full bg-gray-200"></div>
                            <div className="flex-1 space-y-4">
                                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="h-10 bg-gray-200 rounded"></div>
                                    <div className="h-10 bg-gray-200 rounded"></div>
                                    <div className="h-10 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                        <div className="h-20 bg-gray-200 rounded"></div>
                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5, 6].map((item) => (
                                <div
                                    key={item}
                                    className="aspect-square bg-gray-200 rounded"
                                ></div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // 오류 상태
    if (error) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-white max-h-[85vh]">
                    <DialogTitle className="sr-only">사용자 프로필</DialogTitle>
                    <DialogDescription className="sr-only">
                        사용자의 프로필 정보와 제작한 테마를 보여줍니다.
                    </DialogDescription>

                    <div className="p-8 flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] text-center">
                        {error.type === "not_found" ? (
                            <UserX size={64} className="text-gray-400 mb-4" />
                        ) : (
                            <AlertCircle
                                size={64}
                                className="text-gray-400 mb-4"
                            />
                        )}
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {error.type === "not_found"
                                ? "사용자를 찾을 수 없음"
                                : "오류가 발생했습니다"}
                        </h3>
                        <p className="text-gray-600 mb-6">{error.message}</p>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="min-w-[120px]"
                        >
                            닫기
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-white transition-all duration-300 ease-in-out max-h-[85vh] flex flex-col">
                <VisuallyHidden>
                    <DialogTitle>사용자 프로필</DialogTitle>
                    <DialogDescription>
                        사용자의 프로필 정보와 제작한 테마를 보여줍니다.
                    </DialogDescription>
                </VisuallyHidden>

                {/* 프로필 정보와 프로필 링크 복사 버튼 */}
                <div className="flex flex-col flex-1 overflow-hidden">
                    {profile && (
                        <>
                            {/* 프로필 헤더 섹션 */}
                            <div className="relative">
                                <ProfileHeader
                                    profile={{
                                        ...profile,
                                        crimeSceneCount,
                                        escapeRoomCount
                                    }}
                                    creationCount={themesCount}
                                    followerCount={followerCount}
                                    followingCount={followingCount}
                                    onFollowChange={() => {
                                        // 내부적으로 팔로우 카운트 다시 가져오기
                                        getFollowerCount(profileModalId)
                                            .then(setFollowerCount)
                                            .catch(console.error);
                                        // 상위 컴포넌트에도 변경 알림
                                        if (onFollowChange) onFollowChange();
                                    }}
                                />
                            </div>

                            {/* 프로필 내용 섹션 - 크기 고정 */}
                            <div className="p-4 overflow-y-auto flex-1">
                                {/* 자기소개 */}
                                <ProfileBio bio={profile.bio} />

                                {/* 탭 컨테이너 */}
                                <div className="mt-4 md:mt-6">
                                    {/* 탭 헤더 */}
                                    <div className="flex border-b border-gray-200 mb-2 md:mb-4 overflow-x-auto">
                                        <button
                                            className={`pb-1 md:pb-2 px-3 md:px-4 text-center text-sm md:text-base whitespace-nowrap ${
                                                activeTab === "themes"
                                                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                                                    : "text-gray-500"
                                            }`}
                                            onClick={() =>
                                                setActiveTab("themes")
                                            }
                                        >
                                            제작 테마
                                        </button>
                                        <button
                                            className={`pb-1 md:pb-2 px-3 md:px-4 text-center text-sm md:text-base whitespace-nowrap ${
                                                activeTab === "posts"
                                                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                                                    : "text-gray-500"
                                            }`}
                                            onClick={() =>
                                                setActiveTab("posts")
                                            }
                                        >
                                            포스트
                                        </button>
                                        <button
                                            className={`pb-1 md:pb-2 px-3 md:px-4 text-center text-sm md:text-base whitespace-nowrap ${
                                                activeTab === "crimescene"
                                                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                                                    : "text-gray-500"
                                            }`}
                                            onClick={() =>
                                                setActiveTab("crimescene")
                                            }
                                        >
                                            크라임씬
                                        </button>
                                        <button
                                            className={`pb-1 md:pb-2 px-3 md:px-4 text-center text-sm md:text-base whitespace-nowrap ${
                                                activeTab === "escaperoom"
                                                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                                                    : "text-gray-500"
                                            }`}
                                            onClick={() =>
                                                setActiveTab("escaperoom")
                                            }
                                        >
                                            방탈출
                                        </button>
                                        <button
                                            className={`pb-1 md:pb-2 px-3 md:px-4 text-center text-sm md:text-base whitespace-nowrap ${
                                                activeTab === "followers"
                                                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                                                    : "text-gray-500"
                                            }`}
                                            onClick={() =>
                                                setActiveTab("followers")
                                            }
                                        >
                                            팔로워 ({followerCount})
                                        </button>
                                        <button
                                            className={`pb-1 md:pb-2 px-3 md:px-4 text-center text-sm md:text-base whitespace-nowrap ${
                                                activeTab === "following"
                                                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                                                    : "text-gray-500"
                                            }`}
                                            onClick={() =>
                                                setActiveTab("following")
                                            }
                                        >
                                            팔로잉 ({followingCount})
                                        </button>
                                    </div>

                                    {/* 탭 컨텐츠 - 고정 크기 컨테이너 적용 */}
                                    <div className="mt-3 min-h-[200px] md:min-h-[300px] transition-all duration-300 ease-in-out overflow-y-auto">
                                        {activeTab === "themes" ? (
                                            <ProfileThemeGrid
                                                userId={profile.userId}
                                                onThemesLoaded={setThemesCount}
                                            />
                                        ) : activeTab === "posts" ? (
                                            <ProfilePostGrid
                                                userId={profile.userId}
                                            />
                                        ) : activeTab === "crimescene" ? (
                                            <ProfileCrimeSceneGrid
                                                userId={profile.userId}
                                            />
                                        ) : activeTab === "escaperoom" ? (
                                            <ProfileEscapeRoomGrid
                                                userId={profile.userId}
                                            />
                                        ) : activeTab === "followers" ? (
                                            <ProfileFollowerList
                                                userId={profile.userId}
                                                onProfileClick={
                                                    handleProfileClick
                                                }
                                                refresh={refreshFollowers}
                                            />
                                        ) : (
                                            <ProfileFollowingList
                                                userId={profile.userId}
                                                onProfileClick={
                                                    handleProfileClick
                                                }
                                                refresh={refreshFollowings}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileDetailModal;
