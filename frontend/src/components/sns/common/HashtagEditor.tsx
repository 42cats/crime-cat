import React, { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    const [error, setError] = useState<string | null>(null);
    const [isComposing, setIsComposing] = useState(false); // 한글 조합 상태
    const inputRef = useRef<HTMLInputElement>(null);

    // 해시태그 형식 검증 (개선된 정규식)
    const isValidHashtag = (tag: string): boolean => {
        const trimmed = tag.trim();
        
        // 빈 값 체크
        if (!trimmed) {
            setError("해시태그를 입력해주세요.");
            return false;
        }
        
        // 길이 체크 (1-20자)
        if (trimmed.length > 20) {
            setError("해시태그는 20자 이내로 입력해주세요.");
            return false;
        }
        
        // 한글 완성형, 영문, 숫자, 언더스코어만 허용 (자음/모음 제외)
        if (!/^[\uac00-\ud7a3a-zA-Z0-9_]+$/.test(trimmed)) {
            setError("한글, 영문, 숫자, 언더스코어(_)만 사용 가능합니다.");
            return false;
        }
        
        // 중복 체크
        if (hashtags.includes(trimmed)) {
            setError("이미 추가된 해시태그입니다.");
            return false;
        }
        
        // 최대 개수 체크
        if (hashtags.length >= maxTags) {
            setError(`최대 ${maxTags}개까지만 추가할 수 있습니다.`);
            return false;
        }
        
        return true;
    };

    // 해시태그 추가
    const handleAddHashtag = () => {
        // 에러 초기화
        setError(null);
        
        // # 제거하고 트림
        const newTag = inputValue.replace(/^#+/, "").trim();
        
        if (isValidHashtag(newTag)) {
            onChange([...hashtags, newTag]);
            setInputValue(""); // 입력창 비우기
            
            // 포커스 유지
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
        }
    };

    // 엔터키 처리 (한글 조합 중일 때는 무시)
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            // 한글 조합 중이 아닐 때만 처리
            if (!isComposing) {
                handleAddHashtag();
            }
        } else if (e.key === "Backspace" && inputValue === "" && hashtags.length > 0) {
            // 빈 입력창에서 백스페이스 시 마지막 해시태그 삭제
            onChange(hashtags.slice(0, -1));
            setError(null);
        } else {
            // 입력 중에는 에러 메시지 제거
            if (error) {
                setError(null);
            }
        }
    };

    // 해시태그 제거
    const handleRemoveHashtag = (tagToRemove: string) => {
        onChange(hashtags.filter(tag => tag !== tagToRemove));
        setError(null);
    };

    // 입력값 변경 핸들러
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        // 에러가 있으면 제거
        if (error) {
            setError(null);
        }
    };

    // 한글 조합 시작
    const handleCompositionStart = () => {
        setIsComposing(true);
    };

    // 한글 조합 끝
    const handleCompositionEnd = () => {
        setIsComposing(false);
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
                            className="flex items-center gap-1 px-2 py-1 text-sm"
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
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Input
                                ref={inputRef}
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onCompositionStart={handleCompositionStart}
                                onCompositionEnd={handleCompositionEnd}
                                placeholder={placeholder}
                                className={`pr-8 ${error ? 'border-red-500 focus:border-red-500' : ''}`}
                                maxLength={20}
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
                            disabled={inputValue.trim().length === 0}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    
                    {/* 에러 메시지 */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
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