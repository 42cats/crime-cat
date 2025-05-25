import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Loader2 } from "lucide-react";
import {
    UserGameHistoryDto,
    UserGameHistoryToUserDto,
} from "@/types/integratedGameHistory";
import { GameHistoryUpdateRequest } from "@/types/gameHistory";
import { format, parseISO, isValid } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface CrimeSceneEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    history: UserGameHistoryToUserDto;
    onSave: (data: GameHistoryUpdateRequest) => Promise<void>;
}

export const CrimeSceneEditDialog: React.FC<CrimeSceneEditDialogProps> = ({
    open,
    onOpenChange,
    history,
    onSave,
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<GameHistoryUpdateRequest>({
        characterName: history.characterName || "",
        win: history.isWin,
        memo: history.memo || "",
        createdAt: history.createdAt,
    });
    const [date, setDate] = useState<Date | undefined>(() => {
        const dateStr = history.createdAt;
        if (dateStr) {
            const parsed = parseISO(dateStr);
            return isValid(parsed) ? parsed : undefined;
        }
        return undefined;
    });

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onSave({
                ...formData,
                createdAt: date
                    ? format(date, "yyyy-MM-dd'T'HH:mm:ss")
                    : undefined,
            });
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to update history:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>게임 기록 수정</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* 테마명 (읽기 전용) */}
                    <div className="grid gap-2">
                        <Label>테마</Label>
                        <Input
                            value={history.themeName || "크라임씬 테마"}
                            disabled
                            className="bg-gray-50"
                        />
                    </div>

                    {/* 길드명 (읽기 전용) */}
                    <div className="grid gap-2">
                        <Label>길드</Label>
                        <Input
                            value={history.guildName || "길드 정보 없음"}
                            disabled
                            className="bg-gray-50"
                        />
                    </div>

                    {/* 캐릭터명 */}
                    <div className="grid gap-2">
                        <Label htmlFor="characterName">캐릭터명</Label>
                        <Input
                            id="characterName"
                            value={formData.characterName}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    characterName: e.target.value,
                                })
                            }
                            placeholder="캐릭터 이름을 입력하세요"
                        />
                    </div>

                    {/* 승패 여부 */}
                    <div className="flex items-center justify-between">
                        <Label htmlFor="win">승리 여부</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">패배</span>
                            <Switch
                                id="win"
                                checked={formData.win}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, win: checked })
                                }
                            />
                            <span className="text-sm text-gray-600">승리</span>
                        </div>
                    </div>

                    {/* 플레이 날짜 */}
                    <div className="grid gap-2">
                        <Label>플레이 날짜</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? (
                                        format(date, "yyyy년 MM월 dd일", {
                                            locale: ko,
                                        })
                                    ) : (
                                        <span>날짜를 선택하세요</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto p-0"
                                align="start"
                            >
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    locale={ko}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* 메모 */}
                    <div className="grid gap-2">
                        <Label htmlFor="memo">메모</Label>
                        <Textarea
                            id="memo"
                            value={formData.memo}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    memo: e.target.value,
                                })
                            }
                            placeholder="게임에 대한 메모를 입력하세요"
                            rows={4}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        취소
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        저장
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
