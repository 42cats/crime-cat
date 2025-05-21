import React, { useState, useEffect, useRef } from 'react';
import { hashtagService } from '@/api/sns/hashtagService';

interface HashTagInputProps {
  value: string;
  onChange: (value: string) => void;
}

const HashTagInput: React.FC<HashTagInputProps> = ({ value, onChange }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // 해시태그 정규식 (# 다음에 영문자, 숫자, 언더스코어, 한글 등)
  const hashTagRegex = /#[\w\p{L}]+$/u;
  
  // 해시태그 추천 검색
  useEffect(() => {
    const searchHashTags = async () => {
      const match = value.slice(0, cursorPosition).match(hashTagRegex);
      
      if (match) {
        const query = match[0].slice(1); // # 제외한 검색어
        if (query.length > 0) {
          try {
            const hashTags = await hashtagService.searchHashTags(query);
            setSuggestions(hashTags.map(tag => tag.name));
            setShowSuggestions(true);
          } catch (error) {
            console.error('해시태그 검색 오류:', error);
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
      }
    };
    
    searchHashTags();
  }, [value, cursorPosition]);
  
  // 입력 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setCursorPosition(e.target.selectionStart || 0);
  };
  
  // 추천 해시태그 선택
  const handleSelectHashTag = (tagName: string) => {
    const beforeCursor = value.slice(0, cursorPosition);
    const afterCursor = value.slice(cursorPosition);
    const match = beforeCursor.match(hashTagRegex);
    
    if (match) {
      const newValue = beforeCursor.replace(hashTagRegex, `#${tagName}`) + afterCursor;
      onChange(newValue);
      setShowSuggestions(false);
      
      // 포커스 위치 조정
      setTimeout(() => {
        if (inputRef.current) {
          const newPosition = beforeCursor.length - match[0].length + tagName.length + 1;
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newPosition, newPosition);
          setCursorPosition(newPosition);
        }
      }, 0);
    }
  };
  
  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); // 스크롤 방지
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };
  
  // 내용에서 해시태그 색상 변경 표시
  const renderHighlightedContent = () => {
    if (!value) return null;
    
    const parts = [];
    let lastIndex = 0;
    const hashTagRegex = /#[\w\p{L}]+/gu;
    let match;
    
    while ((match = hashTagRegex.exec(value)) !== null) {
      const matchStart = match.index;
      const matchEnd = matchStart + match[0].length;
      
      // 해시태그 이전 텍스트
      if (matchStart > lastIndex) {
        parts.push({
          type: 'text',
          content: value.substring(lastIndex, matchStart)
        });
      }
      
      // 해시태그
      parts.push({
        type: 'hashtag',
        content: match[0]
      });
      
      lastIndex = matchEnd;
    }
    
    // 마지막 텍스트
    if (lastIndex < value.length) {
      parts.push({
        type: 'text',
        content: value.substring(lastIndex)
      });
    }
    
    return (
      <div className="whitespace-pre-wrap">
        {parts.map((part, index) => {
          if (part.type === 'hashtag') {
            return <span key={index} className="text-blue-500">{part.content}</span>;
          }
          return <span key={index}>{part.content}</span>;
        })}
      </div>
    );
  };
  
  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        className="w-full p-3 rounded-md border border-border bg-background text-foreground resize-none min-h-[120px]"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="내용을 입력하세요... (#으로 해시태그 추가)"
        onClick={() => setCursorPosition(inputRef.current?.selectionStart || 0)}
        onSelect={() => setCursorPosition(inputRef.current?.selectionStart || 0)}
      />
      
      {/* 해시태그 추천 드롭다운 */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-48 overflow-y-auto w-full bg-card rounded-md border border-border shadow-md">
          {suggestions.map((tag, index) => (
            <div
              key={index}
              className="p-2 cursor-pointer hover:bg-muted flex items-center"
              onClick={() => handleSelectHashTag(tag)}
            >
              <span className="text-blue-500 mr-1">#{tag}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* 해시태그 하이라이트 표시 (개발용, 숨겨진 상태) */}
      <div className="hidden">
        {renderHighlightedContent()}
      </div>
    </div>
  );
};

export default HashTagInput;
