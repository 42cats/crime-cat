import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { X, Copy } from "lucide-react";
import { getProfileDetail, ProfileDetailDto } from "@/api/profile/detail";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { toast } from "sonner";
import ProfileHeader from "./ProfileHeader";
import ProfileBio from "./ProfileBio";
import ProfileThemeGrid from "./ProfileThemeGrid";

interface ProfileDetailModalProps {
    userId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
    userId,
    open,
    onOpenChange,
}) => {
    const [profile, setProfile] = useState<ProfileDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setLoading(true);

        // 프로필 정보 로드
        getProfileDetail(userId)
            .then((data) => {
                console.log("프로필 데이터:", data);
                setProfile(data);
            })
            .catch((err) => {
                console.error("프로필 로드 실패:", err);
                setError("프로필 로드 실패");
            })
            .finally(() => setLoading(false));
    }, [open, userId]);

    const copyProfileLink = () => {
        const profileUrl = `${window.location.origin}/profile/${userId}`;
        navigator.clipboard
            .writeText(profileUrl)
            .then(() => {
                toast.success("프로필 링크가 복사되었습니다");
            })
            .catch(() => {
                toast.error("링크 복사에 실패했습니다");
            });
    };

    // 프로필 로딩 중 스켈레톤
    if (loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-white">
                <VisuallyHidden>
                    <DialogTitle>사용자 프로필</DialogTitle>
                    <DialogDescription>
                        사용자의 프로필 정보와 제작한 테마를 보여줍니다.
                    </DialogDescription>
                </VisuallyHidden>

                {/* 닫기 버튼 - 상단 우측 */}
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-gray-200 transition-colors"
                        aria-label="닫기"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* 프로필 정보와 프로필 링크 복사 버튼 */}
                <div className="flex flex-col">
                    {profile && (
                        <>
                            {/* 프로필 헤더 섹션 */}
                            <div className="relative">
                                <ProfileHeader profile={profile} />
                            </div>

                            {/* 프로필 내용 섹션 */}
                            <div className="p-4">
                                {/* 자기소개 */}
                                <ProfileBio bio={profile.bio} />

                                {/* 제작 테마 섹션 */}
                                <div className="mt-6">
                                    <h2 className="text-lg font-semibold mb-3 text-gray-700 flex items-center border-b pb-2">
                                        <span className="border-b-2 border-blue-500 pb-1">
                                            제작 테마
                                        </span>
                                    </h2>

                                    <div className="mt-3">
                                        <ProfileThemeGrid
                                            userId={profile.userId}
                                        />
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
