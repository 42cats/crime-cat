import React from 'react';
import { Users, Minus, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ParticipantSettingsProps {
    minParticipants: number;
    maxParticipants: number;
    onMinChange: (min: number) => void;
    onMaxChange: (max: number) => void;
    error?: string;
    disabled?: boolean;
}

const ParticipantSettings: React.FC<ParticipantSettingsProps> = ({
    minParticipants,
    maxParticipants,
    onMinChange,
    onMaxChange,
    error,
    disabled = false
}) => {
    const handleMinChange = (value: number) => {
        const newMin = Math.max(1, Math.min(value, maxParticipants));
        onMinChange(newMin);
    };

    const handleMaxChange = (value: number) => {
        const newMax = Math.max(minParticipants, Math.min(value, 20));
        onMaxChange(newMax);
    };

    const NumberInput = ({ 
        label, 
        value, 
        onChange, 
        min, 
        max 
    }: { 
        label: string; 
        value: number; 
        onChange: (value: number) => void; 
        min: number; 
        max: number; 
    }) => (
        <div className="flex items-center gap-2">
            <Label className="text-sm font-medium min-w-16">{label}</Label>
            <div className="flex items-center gap-1">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onChange(value - 1)}
                    disabled={disabled || value <= min}
                    className="h-8 w-8 p-0"
                >
                    <Minus className="w-3 h-3" />
                </Button>
                <Input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value) || value)}
                    min={min}
                    max={max}
                    disabled={disabled}
                    className="w-16 h-8 text-center"
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onChange(value + 1)}
                    disabled={disabled || value >= max}
                    className="h-8 w-8 p-0"
                >
                    <Plus className="w-3 h-3" />
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                <Label className="text-sm font-medium">참가 인원</Label>
            </div>
            
            <p className="text-xs text-gray-500">
                이 테마에 참가할 수 있는 최소/최대 인원을 설정하세요
            </p>

            {/* 인원 설정 */}
            <div className="grid grid-cols-2 gap-4">
                <NumberInput
                    label="최소"
                    value={minParticipants}
                    onChange={handleMinChange}
                    min={1}
                    max={maxParticipants}
                />
                <NumberInput
                    label="최대"
                    value={maxParticipants}
                    onChange={handleMaxChange}
                    min={minParticipants}
                    max={20}
                />
            </div>

            {/* 에러 메시지 */}
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {/* 인원 설정 요약 */}
            <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                        {minParticipants === maxParticipants 
                            ? `${minParticipants}명`
                            : `${minParticipants}-${maxParticipants}명`
                        }
                    </span>
                </div>
                <p className="text-xs text-gray-500">
                    {minParticipants === maxParticipants 
                        ? `정확히 ${minParticipants}명이 참가해야 합니다`
                        : `최소 ${minParticipants}명, 최대 ${maxParticipants}명까지 참가 가능합니다`
                    }
                </p>
            </div>

            {/* 추천 인원 가이드 */}
            <div className="text-xs text-gray-400 space-y-1">
                <p><strong>추천 설정:</strong></p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>개인 플레이: 1-2명</li>
                    <li>커플/친구: 2-4명</li>
                    <li>소그룹: 4-6명</li>
                    <li>팀빌딩: 6-10명</li>
                </ul>
            </div>
        </div>
    );
};

export default ParticipantSettings;