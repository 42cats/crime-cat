import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
    /**
     * 별점 값 (1-10 또는 0.5-5.0)
     */
    rating: number;
    
    /**
     * 최대 별 개수 (기본값: 5)
     */
    maxStars?: number;
    
    /**
     * 1-10 스케일인지 여부 (기본값: false, 0.5-5.0 스케일)
     */
    isOneToTen?: boolean;
    
    /**
     * 별 크기 클래스
     */
    size?: 'sm' | 'md' | 'lg';
    
    /**
     * 읽기 전용인지 여부 (기본값: true)
     */
    readOnly?: boolean;
    
    /**
     * 클릭 이벤트 핸들러 (readOnly가 false일 때 사용)
     */
    onChange?: (rating: number) => void;
    
    /**
     * 추가 CSS 클래스
     */
    className?: string;
    
    /**
     * 빈 별 표시 여부 (기본값: true)
     */
    showEmptyStars?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
    rating,
    maxStars = 5,
    isOneToTen = false,
    size = 'md',
    readOnly = true,
    onChange,
    className,
    showEmptyStars = true
}) => {
    // 1-10 스케일을 0.5-5.0으로 변환
    const normalizedRating = isOneToTen ? rating / 2 : rating;
    
    // 별 크기 클래스
    const sizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };
    
    const starSize = sizeClasses[size];
    
    // 별 클릭 핸들러
    const handleStarClick = (starIndex: number) => {
        if (readOnly || !onChange) return;
        
        const newRating = starIndex + 1;
        const outputRating = isOneToTen ? newRating * 2 : newRating;
        onChange(outputRating);
    };
    
    // 별 반개 클릭 핸들러
    const handleStarHalfClick = (starIndex: number) => {
        if (readOnly || !onChange) return;
        
        const newRating = starIndex + 0.5;
        const outputRating = isOneToTen ? newRating * 2 : newRating;
        onChange(outputRating);
    };
    
    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            {Array.from({ length: maxStars }, (_, index) => {
                const starValue = index + 1;
                const isFullStar = normalizedRating >= starValue;
                const isHalfStar = normalizedRating >= starValue - 0.5 && normalizedRating < starValue;
                const isEmpty = normalizedRating < starValue - 0.5;
                
                return (
                    <div 
                        key={index} 
                        className={cn(
                            "relative",
                            !readOnly && "cursor-pointer"
                        )}
                    >
                        {/* 빈 별 (배경) */}
                        {(showEmptyStars || !isEmpty) && (
                            <Star 
                                className={cn(
                                    starSize,
                                    "text-gray-300 stroke-gray-300",
                                    !readOnly && "hover:text-yellow-400 hover:stroke-yellow-400"
                                )}
                                onClick={() => handleStarClick(index)}
                            />
                        )}
                        
                        {/* 반별 또는 전체별 */}
                        {(isHalfStar || isFullStar) && (
                            <div className="absolute inset-0">
                                {isHalfStar && (
                                    <>
                                        {/* 왼쪽 반쪽 (채워진 부분) */}
                                        <div className="absolute inset-0 overflow-hidden w-1/2">
                                            <Star 
                                                className={cn(
                                                    starSize,
                                                    "text-yellow-400 fill-yellow-400 stroke-yellow-400"
                                                )}
                                                onClick={() => handleStarHalfClick(index)}
                                            />
                                        </div>
                                        {/* 오른쪽 반쪽 (빈 부분) */}
                                        <div className="absolute inset-0 overflow-hidden left-1/2 w-1/2">
                                            <Star 
                                                className={cn(
                                                    starSize,
                                                    "text-gray-300 stroke-gray-300 -translate-x-1/2"
                                                )}
                                                onClick={() => handleStarClick(index)}
                                            />
                                        </div>
                                    </>
                                )}
                                
                                {isFullStar && (
                                    <Star 
                                        className={cn(
                                            starSize,
                                            "text-yellow-400 fill-yellow-400 stroke-yellow-400"
                                        )}
                                        onClick={() => handleStarClick(index)}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
            
            {/* 숫자 표시 */}
            <span className={cn(
                "ml-2 text-sm font-medium text-gray-600",
                size === 'sm' && "text-xs",
                size === 'lg' && "text-base"
            )}>
                {isOneToTen ? rating : normalizedRating.toFixed(1)}
            </span>
        </div>
    );
};

export default StarRating;