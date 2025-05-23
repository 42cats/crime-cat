import React, { useState, KeyboardEvent } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface GenreTagInputProps {
    tags: string[];
    onTagsChange: (tags: string[]) => void;
    maxTags?: number;
    disabled?: boolean;
    placeholder?: string;
}

const GenreTagInput: React.FC<GenreTagInputProps> = ({
    tags,
    onTagsChange,
    maxTags = 10,
    disabled = false,
    placeholder = "장르 태그를 입력하세요 (예: 호러, 추리, 스릴러)"
}) => {
    const [inputValue, setInputValue] = useState('');

    const addTag = (tag: string) => {
        const trimmedTag = tag.trim().toLowerCase();
        
        if (!trimmedTag) return;
        if (tags.includes(trimmedTag)) return;
        if (tags.length >= maxTags) return;

        onTagsChange([...tags, trimmedTag]);
        setInputValue('');
    };

    const removeTag = (indexToRemove: number) => {
        onTagsChange(tags.filter((_, index) => index !== indexToRemove));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(inputValue);
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    const handleAddClick = () => {
        addTag(inputValue);
    };

    // 인기 태그 제안
    const popularTags = [
        '호러', '추리', '스릴러', '어드벤처', '판타지', 
        'SF', '미스터리', '액션', '코미디', '로맨스'
    ];

    const suggestedTags = popularTags.filter(tag => 
        !tags.includes(tag.toLowerCase()) && 
        tag.toLowerCase().includes(inputValue.toLowerCase())
    ).slice(0, 5);

    return (
        <div className="space-y-3">
            <Label className="text-sm font-medium">
                장르 태그 ({tags.length}/{maxTags})
            </Label>
            
            <p className="text-xs text-gray-500">
                방탈출 테마의 장르나 분위기를 나타내는 태그를 추가하세요
            </p>

            {/* 태그 입력 필드 */}
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled || tags.length >= maxTags}
                        className="pr-10"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <Tag className="w-4 h-4 text-gray-400" />
                    </div>
                </div>
                <Button
                    type="button"
                    onClick={handleAddClick}
                    disabled={disabled || !inputValue.trim() || tags.length >= maxTags}
                    size="sm"
                    variant="outline"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    추가
                </Button>
            </div>

            {/* 제안된 태그들 */}
            {suggestedTags.length > 0 && inputValue && (
                <div className="space-y-2">
                    <Label className="text-xs text-gray-500">추천 태그:</Label>
                    <div className="flex flex-wrap gap-1">
                        {suggestedTags.map((tag) => (
                            <Button
                                key={tag}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addTag(tag)}
                                disabled={disabled}
                                className="h-6 text-xs"
                            >
                                {tag}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* 현재 선택된 태그들 */}
            {tags.length > 0 && (
                <div className="space-y-2">
                    <Label className="text-xs text-gray-500">선택된 태그:</Label>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                            <Badge 
                                key={index} 
                                variant="secondary" 
                                className="flex items-center gap-1 px-2 py-1"
                            >
                                <Tag className="w-3 h-3" />
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => removeTag(index)}
                                    disabled={disabled}
                                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                                    aria-label={`${tag} 태그 제거`}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* 최대 태그 수 도달 메시지 */}
            {tags.length >= maxTags && (
                <p className="text-xs text-orange-600">
                    최대 {maxTags}개의 태그까지 추가할 수 있습니다.
                </p>
            )}

            {/* 태그가 없을 때 안내 메시지 */}
            {tags.length === 0 && (
                <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                    <Tag className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                        아직 추가된 태그가 없습니다
                    </p>
                    <p className="text-xs text-gray-400">
                        위 입력 필드에 태그를 입력하고 Enter 키를 누르거나 추가 버튼을 클릭하세요
                    </p>
                </div>
            )}
        </div>
    );
};

export default GenreTagInput;