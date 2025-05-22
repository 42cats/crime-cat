import React, { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface HashtagEditorProps {
    hashtags: string[];
    onChange: (hashtags: string[]) => void;
    maxTags?: number;
    placeholder?: string;
    disabled?: boolean;
}

const HashtagEditor: React.FC<HashtagEditorProps> = ({
    hashtags,
    onChange,
    maxTags = 20,
    placeholder = "해시태그 입력 후 Enter",
    disabled = false,
}) => {
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // 해시태그 형식 검증
    const isValidHashtag = (tag: string): boolean => {
        const trimmed = tag.trim();
        return (
            trimmed.length > 0 &&
            trimmed.length <= 20 &&
            /^[가-힣a-zA-Z0-9_]+$/.test(trimmed) &&
            !hashtags.includes(trimmed)
        );
    };

    // 해시태그 추가
    const handleAddHashtag = () => {
        const newTag = inputValue.replace("#", "").trim();
        
        if (isValidHashtag(newTag) && hashtags.length < maxTags) {
            onChange([...hashtags, newTag]);
            setInputValue("");
        }
    };

    // 엔터키 처리
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddHashtag();
        } else if (e.key === "Backspace" && inputValue === "" && hashtags.length > 0) {
            // 빈 입력창에서 백스페이스 시 마지막 해시태그 삭제
            onChange(hashtags.slice(0, -1));
        }
    };

    // 해시태그 제거
    const handleRemoveHashtag = (tagToRemove: string) => {
        onChange(hashtags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label>해시태그 ({hashtags.length}/{maxTags})</Label>
            </div>

            {/* 기존 해시태그 표시 */}
            {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {hashtags.map((tag, index) => (
                        <Badge
                            key={`${tag}-${index}`}
                            variant="secondary"
                            className="flex items-center gap-1 px-2 py-1"
                        >
                            #{tag}
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveHashtag(tag)}
                                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </Badge>
                    ))}
                </div>
            )}

            {/* 해시태그 입력 */}
            {!disabled && hashtags.length < maxTags && (
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Input
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className="pr-8"
                        />
                        {inputValue.length > 0 && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                {inputValue.length}/20
                            </span>
                        )}
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleAddHashtag}
                        disabled={!isValidHashtag(inputValue.replace("#", "").trim())}
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* 도움말 텍스트 */}
            <div className="text-xs text-muted-foreground space-y-1">
                <p>• 한글, 영문, 숫자, 언더스코어(_)만 사용 가능</p>
                <p>• 최대 20자, 중복 불가</p>
                <p>• Enter키로 추가, 백스페이스로 삭제</p>
            </div>
        </div>
    );
};

export default HashtagEditor;