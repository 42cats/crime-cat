import React from 'react';
import { Star, Stars } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface DifficultySelectorProps {
    difficulty: number;
    onDifficultyChange: (difficulty: number) => void;
    disabled?: boolean;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({
    difficulty,
    onDifficultyChange,
    disabled = false
}) => {
    const difficultyLabels = {
        1: { label: '매우 쉬움', color: 'bg-green-100 text-green-800', description: '초보자도 쉽게 클리어 가능' },
        2: { label: '쉬움', color: 'bg-blue-100 text-blue-800', description: '약간의 도움이 있으면 클리어 가능' },
        3: { label: '보통', color: 'bg-yellow-100 text-yellow-800', description: '적당한 난이도, 대부분의 사람들에게 적합' },
        4: { label: '어려움', color: 'bg-orange-100 text-orange-800', description: '경험이 있는 플레이어에게 적합' },
        5: { label: '매우 어려움', color: 'bg-red-100 text-red-800', description: '고수들을 위한 극한의 난이도' }
    };

    const renderStars = (level: number, isSelected: boolean) => {
        return Array.from({ length: 5 }, (_, index) => (
            <Star
                key={index}
                className={`w-5 h-5 ${
                    index < level
                        ? isSelected
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300 fill-gray-300'
                        : 'text-gray-200'
                }`}
            />
        ));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">난이도</Label>
                <Badge 
                    variant="outline" 
                    className={`${difficultyLabels[difficulty as keyof typeof difficultyLabels].color}`}
                >
                    <Stars className="w-3 h-3 mr-1" />
                    {difficultyLabels[difficulty as keyof typeof difficultyLabels].label}
                </Badge>
            </div>
            
            <p className="text-xs text-gray-500">
                테마의 난이도를 1~5단계로 설정하세요
            </p>

            {/* 난이도 선택 버튼들 */}
            <div className="grid grid-cols-1 gap-3">
                {Object.entries(difficultyLabels).map(([level, info]) => {
                    const levelNum = parseInt(level);
                    const isSelected = difficulty === levelNum;
                    
                    return (
                        <button
                            key={level}
                            type="button"
                            onClick={() => onDifficultyChange(levelNum)}
                            disabled={disabled}
                            className={`
                                p-4 rounded-lg border-2 transition-all text-left
                                ${isSelected 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }
                                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{info.label}</span>
                                    <Badge 
                                        variant="outline" 
                                        className={`text-xs ${isSelected ? info.color : 'bg-gray-100 text-gray-600'}`}
                                    >
                                        Level {level}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                    {renderStars(levelNum, isSelected)}
                                </div>
                            </div>
                            <p className={`text-xs ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                                {info.description}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* 현재 선택된 난이도 요약 */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-700">
                            선택된 난이도: {difficultyLabels[difficulty as keyof typeof difficultyLabels].label}
                        </p>
                        <p className="text-xs text-gray-500">
                            {difficultyLabels[difficulty as keyof typeof difficultyLabels].description}
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
                        {renderStars(difficulty, true)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DifficultySelector;