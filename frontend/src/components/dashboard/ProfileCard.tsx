import React, { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Gift, Settings } from "lucide-react";
import { couponService } from "@/api/couponService";
import { userPostNotificationService, UserPostNotificationSettings, BasicNotificationSettings } from "@/api/userPostNotificationService";
import { useToast } from "@/hooks/useToast";
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
}

export const ProfileCard: React.FC<Props> = ({ user }) => {
    const [isCouponModalOpen, setCouponModalOpen] = useState(false);
    const [isNotificationModalOpen, setNotificationModalOpen] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const [point, setPoint] = useState(user.point);
    const [notificationSettings, setNotificationSettings] = useState<UserPostNotificationSettings>({
        userPostNew: true,
        userPostComment: true,
        userPostCommentReply: true,
    });
    const { toast } = useToast();

    // 알림 설정 로드
    useEffect(() => {
        const loadNotificationSettings = async () => {
            try {
                const settings = await userPostNotificationService.getUserPostNotificationSettings(user.id);
                setNotificationSettings(settings);
            } catch (error) {
                console.error('Failed to load notification settings:', error);
            }
        };
        loadNotificationSettings();
    }, [user.id]);

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

    const handleNotificationChange = async (key: keyof UserPostNotificationSettings, value: boolean) => {
        try {
            const updatedSettings = await userPostNotificationService.updateUserPostNotificationSettings(
                user.id,
                { [key]: value }
            );
            setNotificationSettings(updatedSettings);
            toast({
                title: "알림 설정 변경됨",
                description: "설정이 성공적으로 저장되었습니다.",
            });
        } catch (error) {
            toast({
                title: "설정 저장 실패",
                description: "알림 설정을 저장하는데 실패했습니다.",
                variant: "destructive",
            });
        }
    };

    const handleBasicNotificationChange = async (type: 'email' | 'discord', value: boolean) => {
        try {
            if (type === 'email') {
                await userPostNotificationService.updateEmailNotification(user.id, value);
            } else {
                await userPostNotificationService.updateDiscordNotification(user.id, value);
            }
            
            toast({
                title: "알림 설정 변경됨",
                description: `${type === 'email' ? '이메일' : '디스코드'} 알림이 ${value ? '활성화' : '비활성화'}되었습니다.`,
            });
        } catch (error) {
            toast({
                title: "설정 저장 실패",
                description: "알림 설정을 저장하는데 실패했습니다.",
                variant: "destructive",
            });
        }
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <>
            <Card className="w-full max-w-xl">
                <CardHeader>
                    <CardTitle>내 프로필</CardTitle>
                    <CardDescription>
                        회원님의 전체 프로필 정보입니다.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {user.profile_image_path && (
                        <div className="w-24 h-24 rounded-full overflow-hidden mx-auto">
                            <img
                                src={user.profile_image_path}
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
                            label="포인트"
                            value={
                                <div className="flex items-center gap-2">
                                    {point ?? "-"}
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="w-5 h-5"
                                        onClick={() => setCouponModalOpen(true)}
                                    >
                                        <Gift className="w-4 h-4" />
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
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground">
                            자기소개
                        </p>
                        <p className="mt-1 text-base whitespace-pre-line">
                            {user.bio || "-"}
                        </p>
                    </div>

                    {user.setting && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                알림 설정
                            </p>
                            
                            {/* 기본 알림 설정 */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="email-notification" className="text-sm">
                                        이메일 알림
                                    </Label>
                                    <Switch
                                        id="email-notification"
                                        checked={user.setting.notifyByEmail}
                                        onCheckedChange={(checked) => 
                                            handleBasicNotificationChange('email', checked)
                                        }
                                    />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="discord-notification" className="text-sm">
                                        디스코드 알림
                                    </Label>
                                    <Switch
                                        id="discord-notification"
                                        checked={user.setting.notifyByDiscord}
                                        onCheckedChange={(checked) => 
                                            handleBasicNotificationChange('discord', checked)
                                        }
                                    />
                                </div>
                            </div>

                            {/* 유저 포스트 알림 설정 */}
                            <div className="border-t pt-3">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm text-muted-foreground">
                                        포스트 알림 설정
                                    </p>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="w-5 h-5"
                                        onClick={() => setNotificationModalOpen(true)}
                                    >
                                        <Settings className="w-4 h-4" />
                                    </Button>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="userpost-new" className="text-sm">
                                            새 게시글 알림
                                        </Label>
                                        <Switch
                                            id="userpost-new"
                                            checked={notificationSettings.userPostNew}
                                            onCheckedChange={(checked) => 
                                                handleNotificationChange('userPostNew', checked)
                                            }
                                        />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="userpost-comment" className="text-sm">
                                            댓글 알림
                                        </Label>
                                        <Switch
                                            id="userpost-comment"
                                            checked={notificationSettings.userPostComment}
                                            onCheckedChange={(checked) => 
                                                handleNotificationChange('userPostComment', checked)
                                            }
                                        />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="userpost-reply" className="text-sm">
                                            답글 알림
                                        </Label>
                                        <Switch
                                            id="userpost-reply"
                                            checked={notificationSettings.userPostCommentReply}
                                            onCheckedChange={(checked) => 
                                                handleNotificationChange('userPostCommentReply', checked)
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
                                        Open Kakao:{" "}
                                        {user.social_links.openkakao}
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
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

            {/* 알림 설정 모달 */}
            <Dialog open={isNotificationModalOpen} onOpenChange={setNotificationModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>유저 포스트 알림 설정</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="userPostNew">새 게시글 알림</Label>
                                <p className="text-sm text-muted-foreground">
                                    팔로우한 사용자가 새 게시글을 올릴 때 알림을 받습니다
                                </p>
                            </div>
                            <Switch
                                id="userPostNew"
                                checked={notificationSettings.userPostNew}
                                onCheckedChange={(checked) => 
                                    handleNotificationChange('userPostNew', checked)
                                }
                            />
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="userPostComment">댓글 알림</Label>
                                <p className="text-sm text-muted-foreground">
                                    내 게시글에 댓글이 달릴 때 알림을 받습니다
                                </p>
                            </div>
                            <Switch
                                id="userPostComment"
                                checked={notificationSettings.userPostComment}
                                onCheckedChange={(checked) => 
                                    handleNotificationChange('userPostComment', checked)
                                }
                            />
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="userPostCommentReply">답글 알림</Label>
                                <p className="text-sm text-muted-foreground">
                                    내 댓글에 답글이 달릴 때 알림을 받습니다
                                </p>
                            </div>
                            <Switch
                                id="userPostCommentReply"
                                checked={notificationSettings.userPostCommentReply}
                                onCheckedChange={(checked) => 
                                    handleNotificationChange('userPostCommentReply', checked)
                                }
                            />
                        </div>
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
