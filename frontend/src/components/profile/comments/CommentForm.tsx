import React, { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CommentRequest } from "@/types/comment";

interface CommentFormProps {
    onSubmit: (data: CommentRequest) => Promise<void>;
    gameThemeId: string;
    isAuthenticated: boolean;
    onLoginRequired: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({
    onSubmit,
    gameThemeId,
    isAuthenticated,
    onLoginRequired
}) => {
    const [content, setContent] = useState('');
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isAuthenticated) {
            // 외부에서 로그인 필요 콜백 호출
            onLoginRequired();
            return;
        }
        
        if (!content.trim()) return;
        
        setIsSubmitting(true);
        
        try {
            const commentData: CommentRequest = {
                content: content.trim(),
                isSpoiler
            };
            
            await onSubmit(commentData);
            setContent('');
            setIsSpoiler(false);
        } catch (error) {
            console.error('댓글 제출 중 오류 발생:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2 mt-3">
            <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={isAuthenticated ? "댓글을 작성하세요..." : "로그인 후 댓글을 작성할 수 있습니다"}
                className="min-h-16 p-2 text-sm resize-none border-border"
                disabled={!isAuthenticated || isSubmitting}
            />
            
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="spoiler-mode"
                        checked={isSpoiler}
                        onCheckedChange={setIsSpoiler}
                        disabled={!isAuthenticated}
                    />
                    <label 
                        htmlFor="spoiler-mode" 
                        className={`text-xs cursor-pointer ${!isAuthenticated ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}
                    >
                        스포일러
                    </label>
                </div>
                
                <button 
                    type="submit" 
                    disabled={!content.trim() || isSubmitting || !isAuthenticated}
                    className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-md disabled:opacity-50"
                >
                    {isSubmitting ? "게시 중..." : "댓글 게시"}
                </button>
            </div>
        </form>
    );
};

export default CommentForm;