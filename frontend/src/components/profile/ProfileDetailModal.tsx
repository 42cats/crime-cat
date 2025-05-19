import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
    Instagram,
    Twitter,
    MessageCircle,
    X,
    Link as LinkIcon,
    Bookmark,
    Heart,
    MessageSquare,
    Share2,
    GamepadIcon,
    CoinsIcon,
    PackageIcon,
} from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";
import { getUserThemes, CrimesceneThemeSummeryDto } from "@/api/profile/themes";
import { getProfileDetail, ProfileDetailDto } from "@/api/profile/detail";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

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
    const [userThemes, setUserThemes] = useState<CrimesceneThemeSummeryDto[]>([]);
    const [selectedTheme, setSelectedTheme] = useState<CrimesceneThemeSummeryDto | null>(null);

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
        
        // 사용자 제작 테마 로드
        getUserThemes(userId)
            .then((data) => {
                console.log("테마 데이터:", data);
                setUserThemes(data.themeList || []);
            })
            .catch((err) => {
                console.error("테마 목록 로드 실패:", err);
            });
    }, [open, userId]);

    // 소셜 링크 열기 함수
    const openSocialLink = (url?: string) => {
        if (url) {
            window.open(url, "_blank", "noopener,noreferrer");
        }
    };

    // 공유하기 함수
    const handleShare = async (themeId: string) => {
        try {
            const themeUrl = `${window.location.origin}/themes/detail/${themeId}`;
            await navigator.clipboard.writeText(themeUrl);
            alert("링크가 복사되었습니다.");
        } catch (error) {
            console.error("공유 실패:", error);
        }
    };

    // 프로필 로딩 중 스켈레톤
    if (loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
                    <DialogTitle className="sr-only">사용자 프로필</DialogTitle>
                    <DialogDescription className="sr-only">사용자의 프로필 정보와 제작한 테마를 보여줍니다.</DialogDescription>
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
                    <DialogDescription>사용자의 프로필 정보와 제작한 테마를 보여줍니다.</DialogDescription>
                </VisuallyHidden>
                <DialogHeader className="flex justify-end p-2 absolute top-0 right-0 z-10">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="text-gray-500 hover:text-gray-800"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </DialogHeader>

                {/* 테마 상세 모달 */}
                {selectedTheme && (
                    <Dialog open={!!selectedTheme} onOpenChange={(open) => !open && setSelectedTheme(null)}>
                        <DialogContent className="max-w-5xl w-full bg-white rounded-lg overflow-hidden p-0">
                            <DialogTitle className="sr-only">테마 상세 정보</DialogTitle>
                            
                            <div className="relative flex flex-col md:flex-row max-h-[90vh]">
                                {/* 이미지 */}
                                <div className="md:w-2/3 bg-black flex items-center justify-center">
                                    <img
                                        src={selectedTheme.thumbNail || "/content/image/default_image2.png"}
                                        alt={selectedTheme.themeTitle}
                                        className="w-full h-auto max-h-[70vh] object-contain"
                                    />
                                </div>

                                {/* 테마 정보 및 댓글 */}
                                <div className="md:w-1/3 flex flex-col max-h-[90vh] bg-white">
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <button
                                            onClick={() => handleShare(selectedTheme.themeId)}
                                            className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                            title="공유하기"
                                        >
                                            <Share2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => setSelectedTheme(null)}
                                            className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                            title="닫기"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                    
                                    {/* 프로필 정보 */}
                                    <div className="flex items-center p-4 border-b">
                                        <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                                            <img
                                                src={
                                                    profile?.avatarImage ||
                                                    "https://cdn.discordapp.com/embed/avatars/1.png"
                                                }
                                                alt={
                                                    profile?.userNickname ||
                                                    "프로필"
                                                }
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <span className="font-semibold text-sm">
                                            {profile?.userNickname || "사용자"}
                                        </span>
                                    </div>

                                    {/* 테마 정보 */}
                                    <div className="flex-grow overflow-y-auto p-4">
                                        <h3 className="text-xl font-bold mb-4">
                                            {selectedTheme.themeTitle}
                                        </h3>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-500">가격</h4>
                                                <p>{selectedTheme.themePrice?.toLocaleString()}원</p>
                                            </div>
                                            
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-500">인원</h4>
                                                <p>
                                                    {selectedTheme.themeMinPlayer === selectedTheme.themeMaxPlayer 
                                                        ? `${selectedTheme.themeMinPlayer}인` 
                                                        : `${selectedTheme.themeMinPlayer}~${selectedTheme.themeMaxPlayer}인`}
                                                </p>
                                            </div>
                                            
                                            <div className="pt-4 border-t">
                                                <Button
                                                    variant="default"
                                                    className="w-full"
                                                    onClick={() => window.open(`/themes/detail/${selectedTheme.themeId}`, '_blank')}
                                                >
                                                    테마 상세 페이지로 이동
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 액션 버튼 */}
                                    <div className="border-t p-4">
                                        <div className="flex justify-between mb-2">
                                            <div className="flex space-x-4">
                                                <button className="text-gray-800 hover:text-red-500 transition-colors">
                                                    <Heart size={24} />
                                                </button>
                                                <button className="text-gray-800 hover:text-blue-500 transition-colors">
                                                    <MessageSquare size={24} />
                                                </button>
                                                <button 
                                                    className="text-gray-800 hover:text-green-500 transition-colors"
                                                    onClick={() => handleShare(selectedTheme.themeId)}
                                                >
                                                    <Share2 size={24} />
                                                </button>
                                            </div>
                                            <button className="text-gray-800 hover:text-gray-600 transition-colors">
                                                <Bookmark size={24} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                <div className="md:flex">
                    {/* 왼쪽 섹션: 프로필 정보 */}
                    <div className="md:w-1/3 p-8 bg-gradient-to-b from-gray-50 to-white border-r border-gray-100">
                        {/* 프로필 이미지 */}
                        <div className="mx-auto w-36 h-36 rounded-full border-2 border-pink-100 p-1 bg-white shadow-md overflow-hidden">
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

                        {/* 사용자 이름 */}
                        <div className="mt-4 text-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                {profile?.userNickname || "알 수 없음"}
                            </h2>
                            <div className="mt-1 inline-block px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-500 font-medium">
                                @user{profile?.userId?.slice(0, 6) || "123456"}
                            </div>
                        </div>

                        {/* 통계 - 수정됨 */}
                        <div className="mt-6 grid grid-cols-3 gap-2 border-t border-b border-gray-100 py-4">
                            <div className="text-center">
                                <div className="text-lg font-bold text-gray-800">
                                    {userThemes.length}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center justify-center">
                                    <PackageIcon size={12} className="mr-1" />
                                    제작
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-gray-800">
                                    {profile?.playCount || 0}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center justify-center">
                                    <GamepadIcon size={12} className="mr-1" />
                                    플레이
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-gray-800">
                                    {profile?.point?.toLocaleString() || 0}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center justify-center">
                                    <CoinsIcon size={12} className="mr-1" />
                                    포인트
                                </div>
                            </div>
                        </div>

                        {/* 소셜 미디어 링크 - 항상 표시 */}
                        <div className="mt-6 flex justify-center space-x-3">
                            <button
                                onClick={() =>
                                    openSocialLink(
                                        profile?.socialLinks?.instagram
                                    )
                                }
                                className={`p-2 rounded-full ${profile?.socialLinks?.instagram ? 'bg-gradient-to-br from-purple-600 to-pink-500 text-white' : 'bg-gray-200 text-gray-400'} hover:opacity-90 transition-all`}
                                aria-label="인스타그램 프로필 열기"
                                disabled={!profile?.socialLinks?.instagram}
                            >
                                <Instagram size={18} />
                            </button>

                            <button
                                onClick={() =>
                                    openSocialLink(profile?.socialLinks?.x)
                                }
                                className={`p-2 rounded-full ${profile?.socialLinks?.x ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'} hover:opacity-90 transition-all`}
                                aria-label="X(트위터) 프로필 열기"
                                disabled={!profile?.socialLinks?.x}
                            >
                                <Twitter size={18} />
                            </button>

                            <button
                                onClick={() =>
                                    openSocialLink(
                                        profile?.socialLinks?.kakao
                                    )
                                }
                                className={`p-2 rounded-full ${profile?.socialLinks?.kakao ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-400'} hover:opacity-90 transition-all`}
                                aria-label="카카오톡 오픈프로필 열기"
                                disabled={!profile?.socialLinks?.kakao}
                            >
                                <MessageCircle size={18} />
                            </button>
                        </div>

                        {/* 웹사이트 링크 (예시) */}
                        <div className="mt-4 text-center">
                            <a
                                href="#"
                                className="text-blue-500 hover:underline text-sm inline-flex items-center"
                            >
                                <LinkIcon size={14} className="mr-1" />
                                crimecat.net
                            </a>
                        </div>
                    </div>

                    {/* 오른쪽 섹션: Bio와 테마 목록 */}
                    <div className="md:w-2/3 flex flex-col">
                        {/* Bio */}
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-500 mb-2">
                                자기소개
                            </h3>
                            <div className="text-gray-800 leading-relaxed">
                                {profile?.bio ? (
                                    <MarkdownRenderer content={profile.bio} />
                                ) : (
                                    <p className="text-gray-400 italic">
                                        자기소개가 없습니다.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 탭 - '제작테마'로 통합 */}
                        <div className="flex border-b border-gray-100">
                            <div className="flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium text-blue-500 border-b-2 border-blue-500">
                                <PackageIcon size={16} />
                                제작테마
                            </div>
                        </div>

                        {/* 테마 갤러리 */}
                        <div className="p-4 flex-grow overflow-y-auto max-h-[400px]">
                            {userThemes && userThemes.length > 0 ? (
                                <div className="grid grid-cols-3 gap-1">
                                    {userThemes.map((theme) => (
                                        <div
                                            key={theme.themeId}
                                            className="relative aspect-square bg-gray-100 overflow-hidden group cursor-pointer"
                                            onClick={() => setSelectedTheme(theme)}
                                        >
                                            <img
                                                src={theme.thumbNail || "/content/image/default_image2.png"}
                                                alt={theme.themeTitle}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity flex items-center justify-center">
                                                <div className="text-white flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
                                                    <span className="text-xs font-semibold text-center line-clamp-2">
                                                        {theme.themeTitle}
                                                    </span>
                                                    <div className="mt-2 flex items-center text-xs">
                                                        <Badge variant="outline" className="bg-white/20 text-white border-white/50">
                                                            {theme.themePrice?.toLocaleString()}원
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                    <PackageIcon size={48} className="mb-4" />
                                    <p className="text-sm">
                                        제작한 테마가 없습니다.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileDetailModal;
