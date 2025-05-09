import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { CommentRequest } from '@/types/comment';

interface CommentFormProps {
  onSubmit: (data: CommentRequest) => Promise<void>;
  initialData?: Partial<CommentRequest>;
  parentId?: string;
  isEditing?: boolean;
  onCancel?: () => void;
}

export function CommentForm({
  onSubmit,
  initialData,
  parentId,
  isEditing = false,
  onCancel
}: CommentFormProps) {
  const [content, setContent] = useState(initialData?.content || '');
  const [isSpoiler, setIsSpoiler] = useState(initialData?.isSpoiler || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const commentData: CommentRequest = {
        content: content.trim(),
        isSpoiler,
        ...(parentId && { parentId })
      };
      
      await onSubmit(commentData);
      
      // 폼 초기화 (수정 모드가 아닐 경우)
      if (!isEditing) {
        setContent('');
        setIsSpoiler(false);
      }
    } catch (error) {
      console.error('댓글 제출 중 오류 발생:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? "답글을 작성하세요..." : "댓글을 작성하세요..."}
        className="min-h-24 p-3 text-foreground bg-background border-border focus-visible:ring-primary resize-none"
      />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Switch
            id={`spoiler-mode-${parentId || 'main'}`}
            checked={isSpoiler}
            onCheckedChange={setIsSpoiler}
            className="data-[state=checked]:bg-amber-500"
          />
          <label 
            htmlFor={`spoiler-mode-${parentId || 'main'}`} 
            className="text-sm cursor-pointer flex items-center gap-1 text-muted-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
            </svg>
            스포일러 표시
          </label>
        </div>
        
        <div className="flex space-x-2 sm:justify-end">
          {isEditing && onCancel && (
            <Button 
              variant="outline" 
              onClick={onCancel} 
              disabled={isSubmitting}
              className="border-border hover:bg-muted transition-colors"
            >
              취소
            </Button>
          )}
          
          <Button 
            type="submit" 
            disabled={!content.trim() || isSubmitting}
            className={`flex items-center gap-1 ${isSubmitting ? 'opacity-70' : ''}`}
          >
            {isSubmitting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isEditing ? "수정하기" : parentId ? "답글 작성" : "댓글 작성"}
          </Button>
        </div>
      </div>
    </form>
  );
}
