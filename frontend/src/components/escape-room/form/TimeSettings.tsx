import React from 'react';
import { Clock, Minus, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TimeSettingsProps {
    estimatedDuration: number;
    onDurationChange: (duration: number) => void;
    disabled?: boolean;
}

const TimeSettings: React.FC<TimeSettingsProps> = ({
    estimatedDuration,
    onDurationChange,
    disabled = false
}) => {
    const handleDurationChange = (value: number) => {
        const newDuration = Math.max(15, Math.min(value, 180));
        onDurationChange(newDuration);
    };

    const formatDuration = (minutes: number): string => {
        if (minutes < 60) {
            return `${minutes}분`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`;
    };

    const quickTimeButtons = [30, 45, 60, 75, 90, 120];

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <Label className="text-sm font-medium">예상 플레이 시간</Label>
            </div>
            
            <p className="text-xs text-gray-500">
                이 테마를 클리어하는데 걸리는 예상 시간을 설정하세요 (15분 ~ 3시간)
            </p>

            {/* 시간 입력 컨트롤 */}
            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDurationChange(estimatedDuration - 15)}
                    disabled={disabled || estimatedDuration <= 15}
                    className="h-8 w-8 p-0"
                >
                    <Minus className="w-3 h-3" />
                </Button>
                
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        value={estimatedDuration}
                        onChange={(e) => handleDurationChange(parseInt(e.target.value) || estimatedDuration)}
                        min={15}
                        max={180}
                        step={15}
                        disabled={disabled}
                        className="w-20 h-8 text-center"
                    />
                    <span className="text-sm text-gray-500">분</span>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDurationChange(estimatedDuration + 15)}
                    disabled={disabled || estimatedDuration >= 180}
                    className="h-8 w-8 p-0"
                >
                    <Plus className="w-3 h-3" />
                </Button>
            </div>

            {/* 빠른 선택 버튼들 */}
            <div className="space-y-2">
                <Label className="text-xs text-gray-500">빠른 선택:</Label>
                <div className="flex flex-wrap gap-2">
                    {quickTimeButtons.map((minutes) => (
                        <Button
                            key={minutes}
                            type="button"
                            variant={estimatedDuration === minutes ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleDurationChange(minutes)}
                            disabled={disabled}
                            className="h-7 text-xs"
                        >
                            {formatDuration(minutes)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* 시간 설정 요약 */}
            <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                        예상 플레이 시간: {formatDuration(estimatedDuration)}
                    </span>
                </div>
                <p className="text-xs text-gray-500">
                    {estimatedDuration <= 45 
                        ? "짧은 플레이 시간으로 부담 없이 즐길 수 있습니다"
                        : estimatedDuration <= 90
                        ? "적당한 플레이 시간으로 만족스러운 경험을 제공합니다"
                        : "긴 플레이 시간으로 깊이 있는 경험을 제공합니다"
                    }
                </p>
            </div>

            {/* 시간 설정 가이드 */}
            <div className="text-xs text-gray-400 space-y-1">
                <p><strong>추천 시간:</strong></p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>초급자용: 30-45분</li>
                    <li>일반적인 테마: 60-75분</li>
                    <li>어려운 테마: 90-120분</li>
                    <li>극한 난이도: 120분 이상</li>
                </ul>
            </div>
        </div>
    );
};

export default TimeSettings;