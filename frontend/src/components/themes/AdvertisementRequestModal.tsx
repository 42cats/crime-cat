import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Coins, 
    Clock, 
    AlertCircle, 
    CheckCircle,
    Loader2,
    Plus,
    Sparkles
} from "lucide-react";
import { CreateAdvertisementRequest, QueueStatus } from "@/api/themeAdvertisementService";
import { UserTheme, getUserPublishedThemes } from "@/api/userThemesService";

interface AdvertisementRequestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreateAdvertisementRequest) => Promise<void>;
    queueStatus?: QueueStatus;
    userPoints?: number;
    loading?: boolean;
}

const AdvertisementRequestModal: React.FC<AdvertisementRequestModalProps> = ({
    open,
    onOpenChange,
    onSubmit,
    queueStatus,
    userPoints = 1250, // 임시 기본값
    loading = false
}) => {
    const [selectedTheme, setSelectedTheme] = useState<string>("");
    const [requestedDays, setRequestedDays] = useState<number>(1);
    const [daysInputValue, setDaysInputValue] = useState<string>("1");
    const [submitting, setSubmitting] = useState(false);
    const [userThemes, setUserThemes] = useState<UserTheme[]>([]);
    const [themesLoading, setThemesLoading] = useState(false);

    // 사용자 테마 목록 로드
    const loadUserThemes = async () => {
        try {
            setThemesLoading(true);
            const themes = await getUserPublishedThemes();
            setUserThemes(themes);
        } catch (error) {
            console.error('사용자 테마 로딩 실패:', error);
            setUserThemes([]);
        } finally {
            setThemesLoading(false);
        }
    };

    // 모달이 열릴 때 테마 목록 로드
    useEffect(() => {
        if (open) {
            loadUserThemes();
        }
    }, [open]);

    const COST_PER_DAY = 100;
    const MAX_DAYS = 15;

    const selectedThemeData = userThemes.find(theme => theme.id === selectedTheme);
    const totalCost = requestedDays * COST_PER_DAY;
    const canAfford = userPoints >= totalCost;
    const remainingBalance = userPoints - totalCost;

    const resetForm = () => {
        setSelectedTheme("");
        setRequestedDays(1);
        setDaysInputValue("1");
        setSubmitting(false);
    };

    useEffect(() => {
        if (!open) {
            resetForm();
        }
    }, [open]);

    const handleSubmit = async () => {
        if (!selectedThemeData || !canAfford) return;

        setSubmitting(true);
        try {
            await onSubmit({
                themeId: selectedThemeData.id,
                themeName: selectedThemeData.name,
                themeType: selectedThemeData.type,
                requestedDays
            });
            onOpenChange(false);
        } catch (error) {
            console.error('광고 신청 실패:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const getThemeTypeBadge = (type: UserTheme["type"]) => {
        const typeConfig = {
            CRIMESCENE: { label: "크라임씬", color: "bg-red-100 text-red-800" },
            ESCAPE_ROOM: { label: "방탈출", color: "bg-blue-100 text-blue-800" },
            MURDER_MYSTERY: { label: "머더미스터리", color: "bg-purple-100 text-purple-800" },
            REALWORLD: { label: "리얼월드", color: "bg-green-100 text-green-800" }
        };
        
        const config = typeConfig[type];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const publishedThemes = userThemes;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>테마 광고 신청</DialogTitle>
                    <DialogDescription>
                        내가 등록한 테마를 광고하여 더 많은 플레이어에게 노출시켜보세요
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* 큐 상태 안내 */}
                    {queueStatus && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>광고 큐 시스템 안내</AlertTitle>
                            <AlertDescription className="space-y-1">
                                <div>• 최대 {queueStatus.maxActiveSlots}개의 광고만 동시에 운영됩니다</div>
                                <div>• 현재 활성 광고: {queueStatus.activeCount}/{queueStatus.maxActiveSlots}</div>
                                {queueStatus.queuedCount > 0 && (
                                    <div>• 대기열: {queueStatus.queuedCount}개 ({queueStatus.estimatedWaitTime})</div>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* 테마 선택 */}
                    <div className="space-y-2">
                        <Label htmlFor="theme">광고할 테마 선택</Label>
                        <Select value={selectedTheme} onValueChange={setSelectedTheme} disabled={themesLoading}>
                            <SelectTrigger>
                                <SelectValue placeholder={themesLoading ? "테마 목록 로딩 중..." : "테마를 선택하세요"} />
                            </SelectTrigger>
                            <SelectContent>
                                {themesLoading ? (
                                    <div className="p-4 text-center text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                                        로딩 중...
                                    </div>
                                ) : publishedThemes.length === 0 ? (
                                    <div className="p-6 text-center">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                            <Plus className="w-8 h-8 text-white" />
                                        </div>
                                        <h4 className="font-semibold text-gray-700 mb-2">광고 가능한 테마가 없어요</h4>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            테마 광고를 신청하려면 먼저 메이커 팀에 가입하고<br />
                                            범죄현장 테마를 제작해서 출간해야 합니다.
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full mx-auto w-fit">
                                                <Sparkles className="w-4 h-4" />
                                                <span>메이커 팀 가입 → 테마 제작 → 출간</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                팀 페이지에서 팀을 생성하거나 기존 팀에 가입할 수 있어요
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    publishedThemes.map(theme => (
                                        <SelectItem key={theme.id} value={theme.id}>
                                            <div className="flex items-center gap-2">
                                                <span>{theme.name}</span>
                                                {getThemeTypeBadge(theme.type)}
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 광고 기간 설정 */}
                    <div className="space-y-2">
                        <Label htmlFor="days">광고 기간 (일)</Label>
                        <Input
                            type="number"
                            min={1}
                            max={MAX_DAYS}
                            value={daysInputValue}
                            onChange={(e) => {
                                const value = e.target.value;
                                // 빈 값이면 그대로 표시
                                if (value === '') {
                                    setDaysInputValue('');
                                    setRequestedDays(1);
                                    return;
                                }
                                
                                // 숫자로 변환
                                const numValue = parseInt(value, 10);
                                
                                // 유효한 숫자이고 범위 내에 있으면 업데이트
                                if (!isNaN(numValue) && numValue >= 1 && numValue <= MAX_DAYS) {
                                    setDaysInputValue(numValue.toString());
                                    setRequestedDays(numValue);
                                } else if (!isNaN(numValue)) {
                                    // 범위를 벗어나면 제한
                                    const clampedValue = Math.max(1, Math.min(MAX_DAYS, numValue));
                                    setDaysInputValue(clampedValue.toString());
                                    setRequestedDays(clampedValue);
                                }
                            }}
                            onBlur={(e) => {
                                // 포커스를 잃을 때 빈 값이면 1로 설정
                                if (e.target.value === '' || parseInt(e.target.value, 10) < 1) {
                                    setDaysInputValue('1');
                                    setRequestedDays(1);
                                }
                            }}
                            placeholder="1-15일"
                        />
                        <p className="text-xs text-muted-foreground">
                            1일당 {COST_PER_DAY}포인트가 차감됩니다 (최대 {MAX_DAYS}일)
                        </p>
                    </div>

                    {/* 비용 계산 */}
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span>총 비용</span>
                                <span className="font-semibold">{totalCost.toLocaleString()}포인트</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span>보유 포인트</span>
                                <span className={canAfford ? "text-green-600" : "text-red-600"}>
                                    {userPoints.toLocaleString()}포인트
                                </span>
                            </div>
                            <div className="border-t pt-2 flex items-center justify-between">
                                <span className="text-sm font-medium">차감 후 잔액</span>
                                <span className={remainingBalance >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                    {remainingBalance.toLocaleString()}포인트
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 포인트 부족 경고 */}
                    {!canAfford && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>포인트 부족</AlertTitle>
                            <AlertDescription>
                                광고 신청에 필요한 포인트가 부족합니다. 
                                {totalCost - userPoints}포인트가 더 필요합니다.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* 환불 정책 안내 */}
                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>환불 정책</AlertTitle>
                        <AlertDescription className="space-y-1">
                            <div>• 대기 중 취소: 전액 환불</div>
                            <div>• 활성 중 취소: 남은 일수만큼 부분 환불</div>
                            <div>• 포인트는 신청 즉시 차감됩니다</div>
                        </AlertDescription>
                    </Alert>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        취소
                    </Button>
                    <Button 
                        onClick={handleSubmit}
                        disabled={!selectedTheme || !canAfford || submitting || requestedDays < 1 || requestedDays > MAX_DAYS}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                신청 중...
                            </>
                        ) : (
                            <>
                                <Coins className="w-4 h-4 mr-2" />
                                {totalCost.toLocaleString()}P 결제하고 신청
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AdvertisementRequestModal;