import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
    CardDescription,
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
import { User, Bell, Trash2, Save, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// 유효성 검사 유틸리티
import {
    validateInstagramUrl,
    validateTwitterUrl,
    validateDiscordUrl,
} from "@/utils/validators";

// 컴포넌트 가져오기
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import ProfileForm from "@/components/profile/ProfileForm";
import SocialLinks from "@/components/profile/SocialLinks";
import NotificationSettings from "@/components/profile/NotificationSettings";
import CropImageModal from "@/components/profile/CropImageModal";
import BadgeSelectModal from "@/components/profile/BadgeSelectModal";

// API 훅 임포트
import { useProfileAPI } from "@/hooks/profile";
import { ProfileUpdateParams } from "@/api/profile";
import { useAuth } from "@/hooks/useAuth";

/**
 * 프로필 관리 페이지 컴포넌트
 */
const Profile: React.FC = () => {
    // 테마 상태 관리 훅 - useTheme 훅 사용 대신 기본값 설정
    // const { theme } = useTheme?.() || { theme: 'light' };
    const isDark = document.documentElement.classList.contains("dark");

    // 인증 및 라우팅 훅
    const { user } = useAuth();
    const navigate = useNavigate();

    // 프로필 API 훅
    const {
        loading,
        fetchProfile,
        updateProfile,
        updateProfileImage,
        checkNickname,
        fetchUserBadges,
        setActiveBadge,
        fetchNotificationSettings,
        updateEmailNotification,
        updateDiscordNotification,
        deleteUserAccount,
    } = useProfileAPI();

    // 프로필 상태
    const [nickname, setNickname] = useState("");
    const [bio, setBio] = useState("");
    const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
    const [isNicknameValid, setIsNicknameValid] = useState(true);
    const [nicknameChecked, setNicknameChecked] = useState(false);

    // 프로필 이미지 상태
    const [avatar, setAvatar] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    // 모달 상태
    const [showCropModal, setShowCropModal] = useState(false);
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");

    // 알림 설정
    const [notifyByEmail, setNotifyByEmail] = useState(true);
    const [notifyByDiscord, setNotifyByDiscord] = useState(true);

    // 소셜 미디어 상태
    const [instagram, setInstagram] = useState("");
    const [twitter, setTwitter] = useState("");
    const [discord, setDiscord] = useState("");

    // URL 유효성 검사 상태
    const [instagramValid, setInstagramValid] = useState<boolean | null>(null);
    const [twitterValid, setTwitterValid] = useState<boolean | null>(null);
    const [discordValid, setDiscordValid] = useState<boolean | null>(null);

    // 칭호 목록
    // const [badgeList, setBadgeList] = useState<Array<any>>([]);

    // 원본 데이터 (변경 감지용)
    const [originalData, setOriginalData] = useState<any>({});

    /**
     * URL 유효성 검사 래퍼 함수
     */
    const validateInstagramUrlWrapper = (url: string) => {
        if (!url) {
            setInstagramValid(null);
            return;
        }
        setInstagramValid(validateInstagramUrl(url));
    };

    const validateTwitterUrlWrapper = (url: string) => {
        if (!url) {
            setTwitterValid(null);
            return;
        }
        setTwitterValid(validateTwitterUrl(url));
    };

    const validateDiscordUrlWrapper = (url: string) => {
        if (!url) {
            setDiscordValid(null);
            return;
        }
        setDiscordValid(validateDiscordUrl(url));
    };

    /**
     * 초기 데이터 로드
     */
    useEffect(() => {
        const loadProfileData = async () => {
            if (!user?.id) return;

            const profileData = await fetchProfile();
            if (profileData) {
                setNickname(profileData.nickName || "");
                setBio(profileData.bio || "");
                setSelectedBadge(profileData.badge || null);
                setCroppedImageUrl(
                    profileData.avatar || "/default-profile.jpg"
                );

                // 소셜 링크 설정
                if (profileData.socialLinks) {
                    setInstagram(profileData.socialLinks.instagram || "");
                    setTwitter(profileData.socialLinks.x || "");
                    setDiscord(profileData.socialLinks.openkakao || "");

                    // 초기 URL 유효성 검사
                    validateInstagramUrlWrapper(
                        profileData.socialLinks.instagram || ""
                    );
                    validateTwitterUrlWrapper(profileData.socialLinks.x || "");
                    validateDiscordUrlWrapper(
                        profileData.socialLinks.openkakao || ""
                    );
                }

                setOriginalData(profileData);
            }
        };

        const loadBadges = async () => {
            if (!user?.id) return;

            const userBadges = await fetchUserBadges();
            if (userBadges.length > 0) {
                setBadgeList(userBadges.map((badge) => badge.name));
            } else {
                // 기본 배지 목록 사용
                setBadgeList([]);
            }
        };

        const loadNotificationSettings = async () => {
            if (!user?.id) return;

            const settings = await fetchNotificationSettings();
            if (settings) {
                setNotifyByEmail(settings.email);
                setNotifyByDiscord(settings.discord);
            }
        };

        loadProfileData();
        // loadBadges();
        loadNotificationSettings();
    }, [fetchProfile, fetchUserBadges, fetchNotificationSettings, user?.id]);

    /**
     * 닉네임 중복 체크 핸들러
     */
    const handleCheckNickname = async () => {
        if (!nickname.trim()) {
            setIsNicknameValid(false);
            setNicknameChecked(true);
            return;
        }

        // 원래 닉네임과 같으면 유효함
        if (nickname === originalData?.nickname) {
            setIsNicknameValid(true);
            setNicknameChecked(true);
            return;
        }

        try {
            const result = await checkNickname(nickname);
            console.log("API 결과:", result);

            // API 결과 { message: "사용 가능한 닉네임입니다.", available: true } 형식 확인
            // available 속성 또는 result 자체가 true인 경우 유효함
            const isAvailable = result?.available === true;

            setIsNicknameValid(isAvailable);
            setNicknameChecked(true);
        } catch (error) {
            console.error("닉네임 중복 확인 오류:", error);
            setIsNicknameValid(false);
            setNicknameChecked(true);
        }
    };

    /**
     * 이미지 변경 핸들러
     */
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAvatar(e.target.files[0]);
            setPreviewUrl(URL.createObjectURL(e.target.files[0]));
            setShowCropModal(true);
        }
    };

    /**
     * 이미지 크롭 관련 핸들러
     */
    const onCropComplete = useCallback((_croppedArea: any, pixels: any) => {
        setCroppedAreaPixels(pixels);
    }, []);

    /**
     * 크롭된 이미지 생성
     */
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

    /**
     * 크롭된 이미지 적용
     */
    const applyCroppedImage = async () => {
        const blob = await getCroppedImage();
        if (blob) {
            const url = URL.createObjectURL(blob);
            setCroppedImageUrl(url);
            setShowCropModal(false);

            // 크롭된 이미지를 File 객체로 변환
            const file = new File([blob], "profile.jpg", {
                type: "image/jpeg",
            });
            setAvatar(file);
        }
    };

    /**
     * 이메일 알림 설정 변경 핸들러
     */
    const handleEmailNotificationChange = async (enabled: boolean) => {
        setNotifyByEmail(enabled);
        await updateEmailNotification(enabled);
    };

    /**
     * 디스코드 알림 설정 변경 핸들러
     */
    const handleDiscordNotificationChange = async (enabled: boolean) => {
        setNotifyByDiscord(enabled);
        await updateDiscordNotification(enabled);
    };

    /**
     * 칭호 선택 핸들러
     */
    // const handleBadgeSelection = async (badgeId: string | null) => {
    //     setSelectedBadge(badgeId);
    //     if (user?.id) {
    //         await setActiveBadge(badgeId);
    //     }
    // };

    /**
     * 계정 탈퇴 핸들러
     */
    const handleDeleteAccount = () => {
        setShowDeleteModal(true);
    };

    /**
     * 계정 탈퇴 확인 핸들러
     */
    const confirmDeleteAccount = async () => {
        if (!deletePassword || !user?.id) return;

        const success = await deleteUserAccount(deletePassword);
        if (success) {
            setShowDeleteModal(false);
            // 로그인 페이지로 이동
            setTimeout(() => {
                navigate("/login");
            }, 1500);
        }
    };

    /**
     * 프로필 폼 제출 핸들러
     */
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

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
                {/* 헤더 */}
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

                {/* 로딩 상태 표시 */}
                {loading && (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    </div>
                )}

                {/* 탭 내비게이션 */}
                <Tabs defaultValue="profile" className="w-full">
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
                        {/* 프로필 설정 탭 */}
                        <TabsContent value="profile" className="space-y-6">
                            <Card className="overflow-hidden">
                                {/* 헤더 컴포넌트 */}
                                <ProfileHeader
                                    nickname={nickname}
                                    selectedBadge={selectedBadge}
                                    isDark={isDark}
                                />

                                <CardHeader className="relative pb-0">
                                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                                        {/* 프로필 아바타 컴포넌트 */}
                                        <ProfileAvatar
                                            croppedImageUrl={croppedImageUrl}
                                            handleImageChange={
                                                handleImageChange
                                            }
                                        />
                                        <div className="mt-8 sm:ml-28 sm:mt-0 flex-1 text-center"></div>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-6 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* 프로필 폼 컴포넌트 */}
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

                                        {/* 소셜 링크 컴포넌트 */}
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
                                    {/* <Button
                                        type="button"
                                        variant="outline"
                                        className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-950 dark:hover:text-red-400 gap-2"
                                        onClick={handleDeleteAccount}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        계정 탈퇴하기
                                    </Button> */}
                                    <Button
                                        type="submit"
                                        className="gap-2"
                                        disabled={loading}
                                    >
                                        <Save className="w-4 h-4" />
                                        저장하기
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        {/* 알림 설정 탭 */}
                        <TabsContent
                            value="notifications"
                            className="space-y-6"
                        >
                            <NotificationSettings
                                notifyByEmail={notifyByEmail}
                                notifyByDiscord={notifyByDiscord}
                                setNotifyByEmail={handleEmailNotificationChange}
                                setNotifyByDiscord={
                                    handleDiscordNotificationChange
                                }
                                isDark={isDark}
                            />
                        </TabsContent>
                    </form>
                </Tabs>

                {/* 크롭 이미지 모달 */}
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

                {/* 칭호 선택 모달 */}
                {/* <BadgeSelectModal
                    showModal={showBadgeModal}
                    setShowModal={setShowBadgeModal}
                    badgeList={badgeList}
                    selectedBadge={selectedBadge}
                    setSelectedBadge={handleBadgeSelection}
                    isDark={isDark}
                /> */}

                {/* 계정 탈퇴 확인 모달 */}
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
                                삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                계속 진행하시겠습니까?
                            </p>

                            <div className="mt-4">
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium mb-1"
                                >
                                    비밀번호 확인
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={deletePassword}
                                    onChange={(e) =>
                                        setDeletePassword(e.target.value)
                                    }
                                    placeholder="계정 비밀번호를 입력하세요"
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
                                onClick={confirmDeleteAccount}
                                disabled={!deletePassword}
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
