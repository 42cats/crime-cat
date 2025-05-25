import React, { useState, useEffect, useRef } from 'react';
import { X, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { hashtagService } from "@/api/hashtags/hashtagService";

interface TagInputFieldProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

const TagInputField: React.FC<TagInputFieldProps> = ({
  tags,
  onTagsChange,
  placeholder = "태그를 입력하세요...",
  maxTags = 10
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 해시태그 추천 검색
  useEffect(() => {
  const searchHashTags = async () => {
  if (inputValue.length > 0) {
  try {
  const hashTags = await hashtagService.searchHashTags(inputValue);
  const filteredSuggestions = hashTags
  .map(tag => tag.name)
  .filter(tagName => !tags.includes(tagName))
  .slice(0, 5);
  setSuggestions(filteredSuggestions);
  setShowSuggestions(filteredSuggestions.length > 0);
  } catch (error) {
  console.error('해시태그 검색 오류:', error);
  setSuggestions([]);
  setShowSuggestions(false);
  }
  } else {
  setShowSuggestions(false);
  }
  };

  const timeoutId = setTimeout(searchHashTags, 300); // 디바운싱
  return () => clearTimeout(timeoutId);
  }, [inputValue, tags]);

  // 태그 추가
  const addTag = (tagName: string) => {
    const cleanTag = tagName.trim().replace(/^#/, ''); // # 제거
    
    if (cleanTag && !tags.includes(cleanTag) && tags.length < maxTags) {
      onTagsChange([...tags, cleanTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  // 태그 제거
  const removeTag = (indexToRemove: number) => {
    onTagsChange(tags.filter((_, index) => index !== indexToRemove));
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 한글 입력 중 조합 상태일 때는 태그 추가하지 않음
    if (e.nativeEvent.isComposing) {
      return;
    }

    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // 입력값이 없을 때 백스페이스로 마지막 태그 제거
      removeTag(tags.length - 1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // 한글 입력 완료 시 처리 (compositionend 이벤트)
  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    // 한글 입력이 완료된 후 스페이스나 쉼표가 있으면 태그로 추가
    const value = e.currentTarget.value;
    if (value.includes(' ') || value.includes(',')) {
      const parts = value.split(/[\s,]+/).filter(part => part.trim());
      if (parts.length > 1) {
        // 여러 태그가 한번에 입력된 경우
        parts.forEach(part => {
          if (part.trim()) {
            addTag(part.trim());
          }
        });
      } else if (parts.length === 1 && (value.endsWith(' ') || value.endsWith(','))) {
        // 하나의 태그 뒤에 구분자가 있는 경우
        addTag(parts[0]);
      }
    }
  };

  // 추천 태그 선택
  const handleSelectSuggestion = (tagName: string) => {
    addTag(tagName);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center">
        <Hash className="h-4 w-4 mr-1" />
        태그
      </label>
      
      {/* 태그 표시 영역 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/20 rounded-md">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
            >
              <Hash className="h-3 w-3" />
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive/20"
                onClick={() => removeTag(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </span>
          ))}
        </div>
      )}

      {/* 태그 입력 */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionEnd={handleCompositionEnd}
          placeholder={tags.length >= maxTags ? `최대 ${maxTags}개까지 가능` : placeholder}
          disabled={tags.length >= maxTags}
          className="pr-12"
        />
        
        {/* 태그 추가 버튼 */}
        {inputValue.trim() && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => addTag(inputValue)}
          >
            <Hash className="h-4 w-4" />
          </Button>
        )}

        {/* 추천 태그 드롭다운 */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 max-h-48 overflow-y-auto w-full bg-card rounded-md border border-border shadow-md">
            {suggestions.map((tag, index) => (
              <div
                key={index}
                className="p-2 cursor-pointer hover:bg-muted flex items-center"
                onClick={() => handleSelectSuggestion(tag)}
              >
                <Hash className="h-4 w-4 mr-2 text-primary" />
                <span className="text-foreground">{tag}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 도움말 텍스트 */}
      <p className="text-xs text-muted-foreground">
        Enter나 쉼표로 태그를 추가할 수 있습니다. 한글 입력 후 스페이스도 가능합니다. ({tags.length}/{maxTags})
      </p>
    </div>
  );
};

export default TagInputField;