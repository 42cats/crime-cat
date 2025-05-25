import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Users, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import StarInput from '@/components/ui/star-input';
import { 
    escapeRoomHistoryService, 
    EscapeRoomHistoryRequest, 
    EscapeRoomHistoryResponse,
    SuccessStatus 
} from '@/api/game/escapeRoomHistoryService';

interface GameHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    themeId: string;
    historyId?: string;
    initialData?: EscapeRoomHistoryResponse;
    onSuccess?: () => void;
}

const GameHistoryModal: React.FC<GameHistoryModalProps> = ({
    isOpen,
    onClose,
    themeId,
    historyId,
    initialData,
    onSuccess
}) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<EscapeRoomHistoryRequest>>({
        escapeRoomThemeId: themeId,
        teamSize: 4,
        successStatus: 'SUCCESS' as SuccessStatus,
        playDate: format(new Date(), 'yyyy-MM-dd'),
        isSpoiler: false,
        difficultyRating: 0,
        funRating: 0,
        storyRating: 0,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                escapeRoomThemeId: initialData.escapeRoomThemeId,
                escapeRoomLocationId: initialData.escapeRoomLocationId,
                teamSize: initialData.teamSize,
                successStatus: initialData.successStatus,
                clearTime: initialData.clearTime,
                hintCount: initialData.hintCount,
                difficultyRating: initialData.difficultyRating,
                funRating: initialData.funRating,
                storyRating: initialData.storyRating,
                playDate: initialData.playDate,
                memo: initialData.memo,
                isSpoiler: initialData.isSpoiler,
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.playDate) {
            toast({
                title: "날짜를 선택해주세요",
                variant: "destructive"
            });
            return;
        }

        setIsLoading(true);
        try {
            const requestData: EscapeRoomHistoryRequest = {
                escapeRoomThemeId: themeId,
                teamSize: formData.teamSize || 1,
                successStatus: formData.successStatus || 'SUCCESS',
                playDate: formData.playDate,
                isSpoiler: formData.isSpoiler || false,
                ...(formData.escapeRoomLocationId && { escapeRoomLocationId: formData.escapeRoomLocationId }),
                ...(formData.clearTime && { clearTime: formData.clearTime }),
                ...(formData.hintCount !== undefined && { hintCount: formData.hintCount }),
                ...(formData.difficultyRating !== undefined && { difficultyRating: formData.difficultyRating }),
                ...(formData.funRating !== undefined && { funRating: formData.funRating }),
                ...(formData.storyRating !== undefined && { storyRating: formData.storyRating }),
                ...(formData.memo && { memo: formData.memo }),
            };

            if (historyId) {
                await escapeRoomHistoryService.updateHistory(historyId, requestData);
                toast({
                    title: "기록 수정 완료",
                    description: "플레이 기록이 수정되었습니다.",
                });
            } else {
                await escapeRoomHistoryService.createHistory(requestData);
                toast({
                    title: "기록 추가 완료",
                    description: "플레이 기록이 추가되었습니다.",
                });
            }

            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('기록 저장 실패:', error);
            toast({
                title: "저장 실패",
                description: "기록 저장 중 오류가 발생했습니다.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {historyId ? '플레이 기록 수정' : '플레이 기록 추가'}
                    </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 플레이 날짜 */}
                    <div className="space-y-2">
                        <Label>플레이 날짜</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formData.playDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.playDate ? 
                                        format(new Date(formData.playDate), "PPP", { locale: ko }) : 
                                        "날짜를 선택하세요"
                                    }
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={formData.playDate ? new Date(formData.playDate) : undefined}
                                    onSelect={(date) => 
                                        setFormData({ ...formData, playDate: date ? format(date, 'yyyy-MM-dd') : '' })
                                    }
                                    disabled={(date) => date > new Date()}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* 성공 여부 */}
                    <div className="space-y-2">
                        <Label>성공 여부</Label>
                        <Select
                            value={formData.successStatus}
                            onValueChange={(value) => 
                                setFormData({ ...formData, successStatus: value as SuccessStatus })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SUCCESS">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-green-600" />
                                        성공
                                    </div>
                                </SelectItem>
                                <SelectItem value="FAIL">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-red-600" />
                                        실패
                                    </div>
                                </SelectItem>
                                <SelectItem value="PARTIAL">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-yellow-600" />
                                        부분 성공
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 팀 인원수 */}
                    <div className="space-y-2">
                        <Label>팀 인원수</Label>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <Input
                                type="number"
                                min="1"
                                max="10"
                                value={formData.teamSize}
                                onChange={(e) => 
                                    setFormData({ ...formData, teamSize: parseInt(e.target.value) || 1 })
                                }
                            />
                            <span className="text-sm text-gray-500">명</span>
                        </div>
                    </div>

                    {/* 클리어 시간 (성공/부분성공인 경우에만) */}
                    {(formData.successStatus === 'SUCCESS' || formData.successStatus === 'PARTIAL') && (
                        <div className="space-y-2">
                            <Label>클리어 시간</Label>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <Input
                                    type="number"
                                    min="1"
                                    max="180"
                                    placeholder="60"
                                    value={formData.clearTime || ''}
                                    onChange={(e) => 
                                        setFormData({ ...formData, clearTime: parseInt(e.target.value) || undefined })
                                    }
                                />
                                <span className="text-sm text-gray-500">분</span>
                            </div>
                        </div>
                    )}

                    {/* 힌트 사용 횟수 */}
                    <div className="space-y-2">
                        <Label>힌트 사용 횟수</Label>
                        <Input
                            type="number"
                            min="0"
                            max="20"
                            placeholder="0"
                            value={formData.hintCount ?? ''}
                            onChange={(e) => 
                                setFormData({ ...formData, hintCount: parseInt(e.target.value) || 0 })
                            }
                        />
                    </div>

                    {/* 평점들 */}
                    <StarInput 
                        value={formData.difficultyRating || 0}
                        onChange={(value) => setFormData({ ...formData, difficultyRating: value })}
                        label="난이도"
                        description="테마의 난이도를 평가해주세요 (0-10점)"
                    />
                    <StarInput 
                        value={formData.funRating || 0}
                        onChange={(value) => setFormData({ ...formData, funRating: value })}
                        label="재미"
                        description="테마의 재미를 평가해주세요 (0-10점)"
                    />
                    <StarInput 
                        value={formData.storyRating || 0}
                        onChange={(value) => setFormData({ ...formData, storyRating: value })}
                        label="스토리"
                        description="테마의 스토리를 평가해주세요 (0-10점)"
                    />

                    {/* 메모 */}
                    <div className="space-y-2">
                        <Label>메모</Label>
                        <Textarea
                            placeholder="플레이 경험을 공유해주세요"
                            value={formData.memo || ''}
                            onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                            rows={3}
                            maxLength={1000}
                        />
                        <p className="text-xs text-gray-500">
                            {formData.memo?.length || 0}/1000
                        </p>
                    </div>

                    {/* 스포일러 여부 */}
                    <div className="flex items-center justify-between">
                        <Label htmlFor="spoiler-switch">스포일러 포함</Label>
                        <Switch
                            id="spoiler-switch"
                            checked={formData.isSpoiler}
                            onCheckedChange={(checked) => 
                                setFormData({ ...formData, isSpoiler: checked })
                            }
                        />
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            취소
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {isLoading ? "저장 중..." : historyId ? "수정" : "추가"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default GameHistoryModal;