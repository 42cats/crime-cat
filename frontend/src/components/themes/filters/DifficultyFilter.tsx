import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";

interface DifficultyFilterProps {
    minValue: string;
    maxValue: string;
    onMinChange: (value: string) => void;
    onMaxChange: (value: string) => void;
}

const DifficultyFilter: React.FC<DifficultyFilterProps> = ({
    minValue,
    maxValue,
    onMinChange,
    onMaxChange,
}) => {
    const [minStar, setMinStar] = useState<number>(
        minValue ? parseInt(minValue) : 0
    );
    const [maxStar, setMaxStar] = useState<number>(
        maxValue ? parseInt(maxValue) : 0
    );
    const [hoveredMin, setHoveredMin] = useState<number | null>(null);
    const [hoveredMax, setHoveredMax] = useState<number | null>(null);

    useEffect(() => {
        setMinStar(minValue ? parseInt(minValue) : 0);
    }, [minValue]);

    useEffect(() => {
        setMaxStar(maxValue ? parseInt(maxValue) : 0);
    }, [maxValue]);

    const handleMinStarClick = (value: number) => {
        const newValue = minStar === value ? 0 : value;
        setMinStar(newValue);
        onMinChange(newValue === 0 ? "" : newValue.toString());

        // 최소값이 최대값보다 크면 최대값도 조정
        if (newValue > maxStar && maxStar !== 0) {
            setMaxStar(newValue);
            onMaxChange(newValue.toString());
        }
    };

    const handleMaxStarClick = (value: number) => {
        const newValue = maxStar === value ? 0 : value;
        setMaxStar(newValue);
        onMaxChange(newValue === 0 ? "" : newValue.toString());

        // 최대값이 최소값보다 작으면 최소값도 조정
        if (newValue < minStar && newValue !== 0) {
            setMinStar(newValue);
            onMinChange(newValue.toString());
        }
    };
    
    // 별표 렌더링 함수 생성
    const renderStars = (value: number, hoveredValue: number | null, onStarClick: (value: number) => void, onHover: (value: number | null) => void) => {
        const displayValue = hoveredValue !== null ? hoveredValue : value;
        const starElements = [];
        
        for (let i = 1; i <= 5; i++) {
            // 각 별마다 0~2 값을 계산 (0: 비어있음, 1: 반만 채워짐, 2: 완전히 채워짐)
            const starFill = Math.min(Math.max(displayValue - (i - 1) * 2, 0), 2);
            
            starElements.push(
                <div key={i} className="relative w-6 h-6 cursor-pointer group">
                    {/* 기본 빈 별 */}
                    <Star className="w-6 h-6 text-muted-foreground" />
                    
                    {/* 채워진 부분을 덕운 별로 표시 */}
                    {starFill > 0 && (
                        <div
                            className="absolute top-0 left-0 h-full overflow-hidden"
                            style={{ width: `${(starFill / 2) * 100}%` }}
                        >
                            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                        </div>
                    )}
                    
                    {/* 왼쪽 영역 (이 값을 클릭하면 홍수값, 예: 1, 3, 5, 7, 9) */}
                    <div
                        className="absolute top-0 left-0 w-1/2 h-full z-10"
                        onMouseEnter={() => onHover(i * 2 - 1)}
                        onClick={() => onStarClick(i * 2 - 1)}
                    />
                    
                    {/* 오른쪽 영역 (이 값을 클릭하면 짝수값, 예: 2, 4, 6, 8, 10) */}
                    <div
                        className="absolute top-0 right-0 w-1/2 h-full z-10"
                        onMouseEnter={() => onHover(i * 2)}
                        onClick={() => onStarClick(i * 2)}
                    />
                </div>
            );
        }
        
        return (
            <div className="flex gap-1 w-fit" onMouseLeave={() => onHover(null)}>
                {starElements}
            </div>
        );
    };

    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium">난이도</Label>

            <div className="space-y-2">
                <div className="flex items-center">
                    <span className="text-sm w-20 text-muted-foreground">
                        최소 난이도:
                    </span>
                    <div className="flex flex-col gap-1">
                        {renderStars(minStar, hoveredMin, handleMinStarClick, setHoveredMin)}
                        <div className="text-sm text-muted-foreground">
                            {minStar > 0 ? `${minStar}/10` : "선택 안함"}
                        </div>
                    </div>
                </div>

                <div className="flex items-center">
                    <span className="text-sm w-20 text-muted-foreground">
                        최대 난이도:
                    </span>
                    <div className="flex flex-col gap-1">
                        {renderStars(maxStar, hoveredMax, handleMaxStarClick, setHoveredMax)}
                        <div className="text-sm text-muted-foreground">
                            {maxStar > 0 ? `${maxStar}/10` : "선택 안함"}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DifficultyFilter;
