import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import PageTransition from "@/components/PageTransition";
import { User, Bell, Save, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import {
    validateInstagramUrl,
    validateTwitterUrl,
    validateDiscordUrl,
} from "@/utils/validators";

import ProfileAvatar from "@/components/profile/ProfileAvatar";
import ProfileForm from "@/components/profile/ProfileForm";
import SocialLinks from "@/components/profile/SocialLinks";
import { NotificationSettingsContainer } from "@/components/profile/notifications";
import CropImageModal from "@/components/profile/CropImageModal";
import BadgeSelectModal from "@/components/profile/BadgeSelectModal";

import { useProfileAPI } from "@/hooks/profile";
import { ProfileUpdateParams } from "@/api/profile";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { compressImageOnly, formatFileSize } from "@/utils/imageCompression";
import { useToast } from "@/hooks/useToast";

/** 프로필 관리 페이지 */
const Profile: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const { toast } = useToast();

    const { user } = useAuth();
    const navigate = useNavigate();

    const {
        loading,
        fetchProfile,
        updateProfile,
        checkNickname,
        fetchUserBadges,
        deleteUserAccount,
    } = useProfileAPI();

    /* ---------- 상태 ---------- */
    const [nickname, setNickname] = useState("");
    const [bio, setBio] = useState("");
    const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
    const [badgeList, setBadgeList] = useState<string[]>([]);

    const [isNicknameValid, setIsNicknameValid] = useState(true);
    const [nicknameChecked, setNicknameChecked] = useState(false);

    const [avatar, setAvatar] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCompressing, setIsCompressing] = useState(false);

    const [showCropModal, setShowCropModal] = useState(false);
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");



    const [instagram, setInstagram] = useState("");
    const [twitter, setTwitter] = useState("");
    const [discord, setDiscord] = useState("");
    const [instagramValid, setInstagramValid] = useState<boolean | null>(null);
    const [twitterValid, setTwitterValid] = useState<boolean | null>(null);
    const [discordValid, setDiscordValid] = useState<boolean | null>(null);

    const [originalData, setOriginalData] = useState<any>({});

    /* ---------- 유효성 ---------- */
    const validateInstagramUrlWrapper = (url: string) => {
        if (!url) return setInstagramValid(null);
        setInstagramValid(validateInstagramUrl(url));
    };
    const validateTwitterUrlWrapper = (url: string) => {
        if (!url) return setTwitterValid(null);
        setTwitterValid(validateTwitterUrl(url));
    };
    const validateDiscordUrlWrapper = (url: string) => {
        if (!url) return setDiscordValid(null);
        setDiscordValid(validateDiscordUrl(url));
    };

    /* ---------- 데이터 로드 ---------- */
    useEffect(() => {
        if (!user?.id) return;
        (async () => {
            const profile = await fetchProfile();
            if (profile) {
                setNickname(profile.nickName || "");
                setBio(profile.bio || "");
                setSelectedBadge(profile.badge || null);
                setCroppedImageUrl(profile.avatar || "/default-profile.jpg");
                if (profile.socialLinks) {
                    setInstagram(profile.socialLinks.instagram || "");
                    setTwitter(profile.socialLinks.x || "");
                    setDiscord(profile.socialLinks.openkakao || "");
                    validateInstagramUrlWrapper(
                        profile.socialLinks.instagram || ""
                    );
                    validateTwitterUrlWrapper(profile.socialLinks.x || "");
                    validateDiscordUrlWrapper(
                        profile.socialLinks.openkakao || ""
                    );
                }
                setOriginalData(profile);
            }
            // const badges = await fetchUserBadges();
            // setBadgeList(badges.map((b) => b.name));
        })();
    }, [user?.id]);

    /* ---------- 닉네임 체크 ---------- */
    const handleCheckNickname = async () => {
        if (!nickname.trim()) {
            setIsNicknameValid(false);
            setNicknameChecked(true);
            return;
        }
        if (nickname === originalData?.nickname) {
            setIsNicknameValid(true);
            setNicknameChecked(true);
            return;
        }
        const res = await checkNickname(nickname);
        setIsNicknameValid(res?.available === true);
        setNicknameChecked(true);
    };

    /* ---------- 이미지 처리 ---------- */
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setAvatar(e.target.files[0]);
        setPreviewUrl(URL.createObjectURL(e.target.files[0]));
        setShowCropModal(true);
    };
    const onCropComplete = useCallback(
        (_area: any, pixels: any) => setCroppedAreaPixels(pixels),
        []
    );
    const getCroppedImage = async (): Promise<Blob | null> => {
        if (!previewUrl || !croppedAreaPixels) return null;

        const image = new Image();
        image.src = previewUrl;
        await new Promise((res) => (image.onload = res));

        const canvas = document.createElement("canvas");
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(
            image,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            croppedAreaPixels.width,
            croppedAreaPixels.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), "image/jpeg");
        });
    };

    const applyCroppedImage = async () => {
        const blob = await getCroppedImage();
        if (blob) {
            try {
                setIsCompressing(true);
                
                // 크롭된 이미지를 File 객체로 변환
                const croppedFile = new File([blob], "profile.jpg", {
                    type: "image/jpeg",
                });
                
                // 이미지 압축 처리
                const originalSize = croppedFile.size;
                const compressionResult = await compressImageOnly(croppedFile, {
                    maxSizeMB: 1,
                    quality: 0.7
                });
                
                // 압축 결과 정보 (클라이언트용)
                console.log(`프로필 이미지 압축: ${formatFileSize(originalSize)} → ${formatFileSize(compressionResult.compressedSize)} (${compressionResult.compressionRate}% 감소)`);
                
                // 압축된 이미지 사용
                const url = URL.createObjectURL(compressionResult.file);
                setCroppedImageUrl(url);
                setAvatar(compressionResult.file);
                setShowCropModal(false);
                
                // 압축 성공 메시지
                if (compressionResult.compressionRate > 5) { // 5% 이상 압축된 경우만 표시
                    toast({
                        title: "이미지 압축 완료",
                        description: `이미지 크기가 ${compressionResult.compressionRate}% 감소되었습니다.`,
                    });
                }
                
            } catch (error) {
                console.error('이미지 압축 오류:', error);
                // 압축 실패 시 원본 사용
                const url = URL.createObjectURL(blob);
                setCroppedImageUrl(url);
                setAvatar(new File([blob], "profile.jpg", { type: "image/jpeg" }));
                setShowCropModal(false);
            } finally {
                setIsCompressing(false);
            }
        }
    };



    /* ---------- 제출 ---------- */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 닉네임 유효성 확인
        if (
            !isNicknameValid ||
            (!nicknameChecked && nickname !== originalData?.nickname)
        ) {
            await handleCheckNickname();
            if (!isNicknameValid) return;
        }

        // 소셜 링크 유효성 검사
        let hasInvalidLink = false;

        if (instagram && !instagramValid) {
            hasInvalidLink = true;
        }

        if (twitter && !twitterValid) {
            hasInvalidLink = true;
        }

        if (discord && !discordValid) {
            hasInvalidLink = true;
        }

        if (hasInvalidLink) return;

        try {
            // 프로필 업데이트 데이터 준비
            const profileData: ProfileUpdateParams = {
                nickname,
                bio,
                badge: selectedBadge,
                socialLinks: {
                    instagram,
                    x: twitter,
                    openkakao: discord,
                },
            };

            // 이미지가 변경된 경우
            if (avatar) {
                profileData.avatar = avatar;
            }

            // 프로필 업데이트 요청
            if (user?.id) {
                await updateProfile(profileData);
            }

            setTimeout(() => {
                navigate("/dashboard/profile");
            }, 1000);
        } catch {
            // 에러 처리는 useProfileAPI 내부에서 처리됨
        }
    };

    /* ---------- 렌더 ---------- */
    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6"
                >
                    <h1 className="text-3xl font-bold tracking-tight mb-1">
                        프로필 관리
                    </h1>
                    <p className="text-muted-foreground">
                        계정 설정을 통해 프로필을 업데이트하고 기본 설정을
                        변경하세요.
                    </p>
                </motion.div>

                {loading && (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    </div>
                )}

                <Tabs defaultValue="profile">
                    <TabsList className="mb-6 w-full sm:w-auto">
                        <TabsTrigger
                            value="profile"
                            className="flex items-center gap-2"
                        >
                            <User className="w-4 h-4" />
                            <span className="hidden sm:inline">프로필</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="notifications"
                            className="flex items-center gap-2"
                        >
                            <Bell className="w-4 h-4" />
                            <span className="hidden sm:inline">알림 설정</span>
                        </TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit}>
                        <TabsContent value="profile" className="space-y-6">
                            <Card className="overflow-hidden">
                                {/* ----- 인라인 헤더 (기존 ProfileHeader JSX) ----- */}
                                <div
                                    className={cn(
                                        "h-32 w-full bg-gradient-to-r relative",
                                        isDark
                                            ? "from-indigo-950 to-purple-900"
                                            : "from-indigo-200 to-purple-300"
                                    )}
                                >
                                    <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center pb-4">
                                        <h2
                                            className={cn(
                                                "text-xl sm:text-2xl font-bold text-center",
                                                isDark
                                                    ? "text-white"
                                                    : "text-gray-800"
                                            )}
                                        >
                                            {nickname || "프로필 설정"}
                                        </h2>
                                        {selectedBadge && (
                                            <span
                                                className={cn(
                                                    "text-sm py-1 px-3 font-medium mt-1 rounded",
                                                    isDark
                                                        ? "bg-indigo-900/70 text-white"
                                                        : "bg-white/70 text-indigo-800"
                                                )}
                                            >
                                                {selectedBadge}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <CardHeader className="relative pb-0">
                                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                                        <ProfileAvatar
                                            croppedImageUrl={croppedImageUrl}
                                            handleImageChange={
                                                handleImageChange
                                            }
                                        />
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-6 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <ProfileForm
                                            nickname={nickname}
                                            setNickname={setNickname}
                                            bio={bio}
                                            setBio={setBio}
                                            selectedBadge={selectedBadge}
                                            setShowBadgeModal={
                                                setShowBadgeModal
                                            }
                                            checkNickname={handleCheckNickname}
                                            isNicknameValid={isNicknameValid}
                                            nicknameChecked={nicknameChecked}
                                            isDark={isDark}
                                        />
                                        <SocialLinks
                                            instagram={instagram}
                                            twitter={twitter}
                                            discord={discord}
                                            instagramValid={instagramValid}
                                            twitterValid={twitterValid}
                                            discordValid={discordValid}
                                            setInstagram={setInstagram}
                                            setTwitter={setTwitter}
                                            setDiscord={setDiscord}
                                            validateInstagramUrl={
                                                validateInstagramUrlWrapper
                                            }
                                            validateTwitterUrl={
                                                validateTwitterUrlWrapper
                                            }
                                            validateDiscordUrl={
                                                validateDiscordUrlWrapper
                                            }
                                            isDark={isDark}
                                        />
                                    </div>
                                </CardContent>
                                <Separator />
                                <CardFooter className="justify-end py-6">
                                    <Button
                                        type="submit"
                                        className="gap-2"
                                        disabled={loading}
                                    >
                                        <Save className="w-4 h-4" /> 저장하기
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        <TabsContent
                            value="notifications"
                            className="space-y-6"
                        >
                            <NotificationSettingsContainer />
                        </TabsContent>
                    </form>
                </Tabs>

                {/* 모달들 */}
                <CropImageModal
                    showModal={showCropModal}
                    setShowModal={setShowCropModal}
                    previewUrl={previewUrl}
                    crop={crop}
                    zoom={zoom}
                    setCrop={setCrop}
                    setZoom={setZoom}
                    onCropComplete={onCropComplete}
                    applyCroppedImage={applyCroppedImage}
                    isDark={isDark}
                />
                {/* <BadgeSelectModal
                    showModal={showBadgeModal}
                    setShowModal={setShowBadgeModal}
                    badgeList={badgeList}
                    selectedBadge={selectedBadge}
                    setSelectedBadge={setSelectedBadge}
                    isDark={isDark}
                /> */}
                <Dialog
                    open={showDeleteModal}
                    onOpenChange={setShowDeleteModal}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-red-500">
                                <AlertCircle className="w-5 h-5" />
                                계정 탈퇴 확인
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-2">
                            <p>
                                계정을 삭제하면 모든 데이터가 영구적으로
                                삭제됩니다.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                계속 진행하시겠습니까?
                            </p>
                            <div className="mt-4">
                                <label
                                    htmlFor="pwd"
                                    className="block text-sm font-medium mb-1"
                                >
                                    비밀번호 확인
                                </label>
                                <input
                                    id="pwd"
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) =>
                                        setDeletePassword(e.target.value)
                                    }
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <DialogFooter className="flex flex-col sm:flex-row gap-2">
                            <Button
                                variant="outline"
                                className="sm:flex-1"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                취소
                            </Button>
                            <Button
                                variant="destructive"
                                className="sm:flex-1"
                                disabled={!deletePassword}
                                onClick={async () => {
                                    const ok = await deleteUserAccount(
                                        deletePassword
                                    );
                                    if (ok) {
                                        navigate("/login");
                                    }
                                }}
                            >
                                계정 삭제 확인
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </PageTransition>
    );
};
export default Profile;
