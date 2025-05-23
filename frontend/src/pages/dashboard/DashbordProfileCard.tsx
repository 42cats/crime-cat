import React, { useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Gift, CheckCircle, Copy } from "lucide-react";
import { couponService } from "@/api/misc/couponService";
import { useToast } from "@/hooks/useToast";
import { UserPermissionCard } from "@/components/UserPermissionCard";
import { UTCToKST } from "@/lib/dateFormat";
interface Props {
    user: {
        id: string;
        nickname: string;
        profile_image_path?: string;
        setting?: {
            notifyByEmail: boolean;
            notifyByDiscord: boolean;
        };
        social_links?: {
            instagram?: string;
            x?: string;
            openkakao?: string;
        };
        bio?: string;
        title?: string;
        badge?: string;
        snowflake?: string;
        last_login_at?: string;
        point?: number;
    };
    dailyCheck: {
        isComplete: boolean;
    };
    onCheckDaily: () => void;
    isChecking: boolean;
    additionalInfo?: {
        themePlayCount?: string;
        recentlyPlayCrimeSeenTheme?: string;
        recentlyPlayCrimeSeenThemeTime?: string;
        mostFavoriteCrimeSeenMaker?: string;
    };
    // permissions: 기존 prop 제거 - 이제 UserPermissionCard에서 직접 fetch
}

export const DashboardProfileCard: React.FC<Props> = ({
    user,
    dailyCheck,
    onCheckDaily,
    isChecking,
    additionalInfo,
}) => {
    const [isCouponModalOpen, setCouponModalOpen] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const [point, setPoint] = useState(user.point);
    const { toast } = useToast();

    // 포인트 변경 핸들러 - 연장 시 특별 처리
    const handlePointChange = (newPoint: number) => {
        if (newPoint === -1) {
            // 특별한 시그널 값으로 전체 새로고침 필요
            // 이 경우 페이지 새로고침
            // 대신 전체 사용자 정보를 다시 불러오는 방식을 추천
            window.location.reload();
        } else {
            setPoint(newPoint);
        }
    };

    const handleApplyCoupon = async () => {
        try {
            const res = await couponService.requestCoupon(user.id, couponCode);
            setPoint(res.point);
            toast({
                title: "쿠폰 적용 완료 🎉",
                description: `적용된 포인트: ${res.point}P`,
            });
            setCouponModalOpen(false);
            setCouponCode("");
        } catch (error) {
            toast({
                title: "쿠폰을 사용할 수 없습니다.",
                description: "올바른 쿠폰 코드인지 확인해주세요.",
                variant: "destructive",
            });
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast({
                title: "복사 완료",
                description: "고유 아이디가 클립보드에 복사되었습니다.",
            });
        } catch (error) {
            toast({
                title: "복사 실패",
                description: "클립보드 복사에 실패했습니다.",
                variant: "destructive",
            });
        }
    };

    return (
        <>
            <Card className="w-full max-w-2xl space-y-6">
                <CardHeader>
                    <CardTitle>📋 내 프로필</CardTitle>
                    <CardDescription>
                        회원님의 출석과 활동 기록을 확인하세요.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* 프로필 이미지 */}
                    {user.profile_image_path && (
                        <div className="w-24 h-24 rounded-full overflow-hidden mx-auto">
                            <img
                                src={user.profile_image_path}
                                alt="프로필 이미지"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* 기본 정보 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ProfileField label="닉네임" value={user.nickname} />
                        {/* <ProfileField label="타이틀" value={user.title} />
                        <ProfileField
                            label="뱃지"
                            value={<Badge>{user.badge || "없음"}</Badge>}
                        /> */}
                        <ProfileField
                            label="포인트"
                            value={
                                <div className="flex items-center gap-2">
                                    {point ?? "-"}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="ml-2"
                                        onClick={() => setCouponModalOpen(true)}
                                    >
                                        쿠폰 사용
                                    </Button>
                                </div>
                            }
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
                        <ProfileField
                            label="고유 아이디"
                            value={
                                user.snowflake ? (
                                    <div className="flex items-center gap-2">
                                        <span>{user.snowflake}</span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                copyToClipboard(user.snowflake!)
                                            }
                                            className="h-8 w-8 p-0"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    "디스코드 정보가 없습니다."
                                )
                            }
                        />
                    </div>

                    {/* 출석 체크 */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="attendance"
                            className="h-4 w-4"
                            checked={dailyCheck.isComplete}
                            readOnly
                        />
                        <label
                            htmlFor="attendance"
                            className="text-sm text-muted-foreground"
                        >
                            {dailyCheck.isComplete ? (
                                <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="w-4 h-4" /> 오늘
                                    출석 완료
                                </span>
                            ) : (
                                "아직 출석하지 않음"
                            )}
                        </label>

                        {!dailyCheck.isComplete && (
                            <Button
                                size="sm"
                                onClick={onCheckDaily}
                                disabled={isChecking}
                            >
                                {isChecking ? "출석 중..." : "출석 체크"}
                            </Button>
                        )}
                    </div>

                    {/* 자기소개 */}
                    <div>
                        <p className="text-sm text-muted-foreground">
                            자기소개
                        </p>
                        <p className="mt-1 text-base whitespace-pre-line">
                            {user.bio || "-"}
                        </p>
                    </div>

                    {/* 알림 설정 */}
                    {user.setting && (
                        <div>
                            <p className="text-sm text-muted-foreground">
                                알림 설정
                            </p>
                            <p className="mt-1 text-base">
                                이메일: {user.setting.notifyByEmail ? "O" : "X"}
                                , 디스코드:{" "}
                                {user.setting.notifyByDiscord ? "O" : "X"}
                            </p>
                        </div>
                    )}

                    {/* 소셜 링크 */}
                    {user.social_links && (
                        <div>
                            <p className="text-sm text-muted-foreground">
                                소셜 링크
                            </p>
                            <ul className="mt-1 space-y-1 text-base">
                                {user.social_links.instagram && (
                                    <li>
                                        Instagram: {user.social_links.instagram}
                                    </li>
                                )}
                                {user.social_links.x && (
                                    <li>X: {user.social_links.x}</li>
                                )}
                                {user.social_links.openkakao && (
                                    <li>
                                        OpenKakao: {user.social_links.openkakao}
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    {/* 추가 정보 */}
                    {additionalInfo && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <ProfileField
                                label="총 테마 플레이 수"
                                value={additionalInfo.themePlayCount || "-"}
                            />
                            <ProfileField
                                label="최근 플레이 테마"
                                value={
                                    additionalInfo.recentlyPlayCrimeSeenTheme ||
                                    "-"
                                }
                            />
                            <ProfileField
                                label="최근 플레이 시간"
                                value={
                                    additionalInfo.recentlyPlayCrimeSeenThemeTime ||
                                    "-"
                                }
                            />
                            <ProfileField
                                label="자주 플레이한 제작자"
                                value={
                                    additionalInfo.mostFavoriteCrimeSeenMaker ||
                                    "-"
                                }
                            />
                        </div>
                    )}

                    {/* 권한 관리 섹션 */}
                    <div className="mt-8">
                        <UserPermissionCard
                            userId={user.id}
                            onPointChange={handlePointChange}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 쿠폰 입력 모달 */}
            <Dialog open={isCouponModalOpen} onOpenChange={setCouponModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>쿠폰 코드 입력</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder="쿠폰 코드를 입력하세요"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                        />
                        <Button className="w-full" onClick={handleApplyCoupon}>
                            등록하기
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
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
