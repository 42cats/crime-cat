import React, { useState, useRef } from 'react';
import { X, Hash, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface GenreTagInputProps {
    genreTags: string[];
    onGenreTagsChange: (tags: string[]) => void;
    label?: string;
    placeholder?: string;
    maxTags?: number;
    required?: boolean;
    className?: string;
    description?: string;
    disabled?: boolean;
}

// 일반적인 방탈출 장르들 (추천 목록)
const COMMON_GENRES = [
    '공포', '추리', '액션', '판타지', 'SF', '로맨스', '코미디', '스릴러',
    '미스터리', '어드벤처', '역사', '좀비', '마피아', '학교', '감옥',
    '병원', '호러', '범죄', '탈옥', '마법', '모험', '전쟁', '우주',
    '수사', '형사', '첩보', '생존', '퍼즐', '암호'
];

const GenreTagInput: React.FC<GenreTagInputProps> = ({
    genreTags,
    onGenreTagsChange,
    label = "장르 태그",
    placeholder = "장르를 입력하세요 (예: 공포, 추리, 액션)",
    maxTags = 10,
    required = false,
    className,
    description,
    disabled = false
}) => {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // 입력값을 기반으로 추천 장르 필터링
    const filteredSuggestions = COMMON_GENRES
        .filter(genre => 
            genre.toLowerCase().includes(inputValue.toLowerCase()) &&
            !genreTags.includes(genre) &&
            inputValue.length > 0
        )
        .slice(0, 8);

    // 태그 추가
    const addTag = (tag: string) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && 
            !genreTags.includes(trimmedTag) && 
            genreTags.length < maxTags &&
            trimmedTag.length <= 20) {
            onGenreTagsChange([...genreTags, trimmedTag]);
            setInputValue('');
            setShowSuggestions(false);
        }
    };

    // 태그 제거
    const removeTag = (tagToRemove: string) => {
        onGenreTagsChange(genreTags.filter(tag => tag !== tagToRemove));
    };

    // 입력 처리
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        setShowSuggestions(value.length > 0 && filteredSuggestions.length > 0);
    };

    // 키보드 이벤트 처리
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (inputValue.trim()) {
                addTag(inputValue);
            }
        } else if (e.key === 'Backspace' && inputValue === '' && genreTags.length > 0) {
            removeTag(genreTags[genreTags.length - 1]);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    // 추천 태그 클릭
    const handleSuggestionClick = (suggestion: string) => {
        addTag(suggestion);
        inputRef.current?.focus();
    };

    // 일반적인 장르 태그 클릭 (빠른 추가용)
    const handleCommonTagClick = (genre: string) => {
        if (!genreTags.includes(genre) && genreTags.length < maxTags) {
            addTag(genre);
        }
    };

    return (
        <div className={cn("space-y-3", className)}>
            {/* 라벨 */}
            {label && (
                <Label className="text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                    <span className="text-gray-500 ml-1">
                        ({genreTags.length}/{maxTags})
                    </span>
                </Label>
            )}

            {/* 입력 필드 */}
            <div className="relative">
                <div className={cn(
                    "flex flex-wrap gap-2 p-3 border rounded-md bg-white min-h-[42px]",
                    "focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500",
                    disabled && "bg-gray-50 cursor-not-allowed"
                )}>
                    {/* 선택된 태그들 */}
                    {genreTags.map((tag, index) => (
                        <Badge 
                            key={index} 
                            variant="secondary" 
                            className="flex items-center gap-1 px-2 py-1"
                        >
                            <Hash className="w-3 h-3" />
                            {tag}
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="ml-1 text-gray-500 hover:text-red-500"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </Badge>
                    ))}
                    
                    {/* 입력 필드 */}
                    {!disabled && genreTags.length < maxTags && (
                        <Input
                            ref={inputRef}
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setShowSuggestions(inputValue.length > 0 && filteredSuggestions.length > 0)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            placeholder={genreTags.length === 0 ? placeholder : ""}
                            className="border-none p-0 h-auto flex-1 min-w-[120px] focus-visible:ring-0"
                            maxLength={20}
                        />
                    )}
                </div>

                {/* 추천 드롭다운 */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {filteredSuggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 flex items-center gap-2"
                            >
                                <Hash className="w-3 h-3 text-gray-400" />
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* 일반적인 장르 태그들 (빠른 선택) */}
            {!disabled && (
                <div className="space-y-2">
                    <Label className="text-xs text-gray-500">추천 장르 (클릭하여 추가)</Label>
                    <div className="flex flex-wrap gap-1">
                        {COMMON_GENRES.slice(0, 12).map((genre) => {
                            const isSelected = genreTags.includes(genre);
                            const isDisabled = genreTags.length >= maxTags && !isSelected;
                            
                            return (
                                <button
                                    key={genre}
                                    type="button"
                                    onClick={() => handleCommonTagClick(genre)}
                                    disabled={isSelected || isDisabled}
                                    className={cn(
                                        "px-2 py-1 text-xs rounded-full border transition-colors",
                                        isSelected 
                                            ? "bg-blue-100 text-blue-700 border-blue-300 cursor-not-allowed" 
                                            : isDisabled
                                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                                    )}
                                >
                                    <Hash className="w-2 h-2 inline mr-1" />
                                    {genre}
                                    {isSelected && <span className="ml-1">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 설명 텍스트 */}
            {description && (
                <p className="text-xs text-gray-500">{description}</p>
            )}

            {/* 유효성 검사 메시지 */}
            {required && genreTags.length === 0 && (
                <p className="text-xs text-red-500">최소 1개 이상의 장르 태그가 필요합니다.</p>
            )}
        </div>
    );
};

export default GenreTagInput;