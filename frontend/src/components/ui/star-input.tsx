import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarInputProps {
    /**
     * 현재 별점 값 (0-10)
     */
    value: number;
    
    /**
     * 별점 변경 핸들러
     */
    onChange: (rating: number) => void;
    
    /**
     * 라벨
     */
    label?: string;
    
    /**
     * 최대 별 개수 (기본값: 5)
     */
    maxStars?: number;
    
    /**
     * 별 크기
     */
    size?: 'sm' | 'md' | 'lg';
    
    /**
     * 필수 여부
     */
    required?: boolean;
    
    /**
     * 비활성화 여부
     */
    disabled?: boolean;
    
    /**
     * 추가 CSS 클래스
     */
    className?: string;
    
    /**
     * 설명 텍스트
     */
    description?: string;
}

const StarInput: React.FC<StarInputProps> = ({
    value,
    onChange,
    label,
    maxStars = 5,
    size = 'md',
    required = false,
    disabled = false,
    className,
    description
}) => {
    const [hoverRating, setHoverRating] = useState<number>(0);
    
    // 1-10 스케일을 0.5-5.0으로 변환
    const normalizedValue = value / 2;
    const normalizedHover = hoverRating / 2;
    
    // 별 크기 클래스
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };
    
    const starSize = sizeClasses[size];
    
    // 별 클릭 핸들러
    const handleStarClick = (starIndex: number, isHalf: boolean = false) => {
        if (disabled) return;
        
        // 이미 선택된 별을 다시 클릭하면 0점으로 리셋
        const clickedRating = starIndex + (isHalf ? 0.5 : 1);
        const clickedValue = Math.round(clickedRating * 2);
        
        if (clickedValue === value) {
            onChange(0);
        } else {
            onChange(clickedValue);
        }
    };
    
    // 마우스 호버 핸들러
    const handleStarHover = (starIndex: number, isHalf: boolean = false) => {
        if (disabled) return;
        
        const newRating = starIndex + (isHalf ? 0.5 : 1);
        const outputRating = Math.round(newRating * 2); // 1-10 스케일로 변환
        setHoverRating(outputRating);
    };
    
    const displayRating = hoverRating > 0 ? normalizedHover : normalizedValue;
    
    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <label className="text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            
            <div className="flex items-center gap-1">
                {Array.from({ length: maxStars }, (_, index) => {
                    const starValue = index + 1;
                    const isFullStar = displayRating >= starValue;
                    const isHalfStar = displayRating >= starValue - 0.5 && displayRating < starValue;
                    
                    return (
                        <div 
                            key={index} 
                            className={cn(
                                "relative",
                                !disabled && "cursor-pointer"
                            )}
                            onMouseLeave={() => setHoverRating(0)}
                        >
                            {/* 빈 별 (배경) */}
                            <Star 
                                className={cn(
                                    starSize,
                                    "text-gray-300 stroke-gray-300 transition-colors",
                                    !disabled && "hover:text-yellow-200 hover:stroke-yellow-200",
                                    disabled && "opacity-50"
                                )}
                                onClick={() => handleStarClick(index, false)}
                                onMouseEnter={() => handleStarHover(index, false)}
                            />
                            
                            {/* 반별 또는 전체별 */}
                            {(isHalfStar || isFullStar) && (
                                <div className="absolute inset-0 pointer-events-none">
                                    {isHalfStar && (
                                        <div className="absolute inset-0 overflow-hidden w-1/2">
                                            <Star 
                                                className={cn(
                                                    starSize,
                                                    "text-yellow-400 fill-yellow-400 stroke-yellow-400"
                                                )}
                                            />
                                        </div>
                                    )}
                                    
                                    {isFullStar && (
                                        <Star 
                                            className={cn(
                                                starSize,
                                                "text-yellow-400 fill-yellow-400 stroke-yellow-400"
                                            )}
                                        />
                                    )}
                                </div>
                            )}
                            
                            {/* 반별 클릭 영역 (보이지 않음) */}
                            {!disabled && (
                                <div 
                                    className="absolute inset-0 w-1/2"
                                    onClick={() => handleStarClick(index, true)}
                                    onMouseEnter={() => handleStarHover(index, true)}
                                />
                            )}
                        </div>
                    );
                })}
                
                {/* 숫자 표시 */}
                <span className={cn(
                    "ml-2 text-sm font-medium",
                    hoverRating > 0 ? "text-yellow-600" : "text-gray-600",
                    size === 'sm' && "text-xs",
                    size === 'lg' && "text-base"
                )}>
                    {hoverRating > 0 ? hoverRating : value}/10
                </span>
            </div>
            
            {description && (
                <p className="text-xs text-gray-500">{description}</p>
            )}
        </div>
    );
};

export default StarInput;