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
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? "답글을 작성하세요..." : "댓글을 작성하세요..."}
        className="min-h-16 p-2 text-sm resize-none border-border"
      />
      
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Switch
            id={`spoiler-mode-${parentId || 'main'}`}
            checked={isSpoiler}
            onCheckedChange={setIsSpoiler}
          />
          <label 
            htmlFor={`spoiler-mode-${parentId || 'main'}`} 
            className="text-xs text-muted-foreground cursor-pointer"
          >
            스포일러
          </label>
        </div>
        
        <div className="flex space-x-2">
          {isEditing && onCancel && (
            <button 
              type="button"
              onClick={onCancel} 
              disabled={isSubmitting}
              className="text-xs px-3 py-1.5 text-muted-foreground"
            >
              취소
            </button>
          )}
          
          <button 
            type="submit" 
            disabled={!content.trim() || isSubmitting}
            className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-md disabled:opacity-50"
          >
            {isEditing ? "수정" : parentId ? "답글 작성" : "댓글 작성"}
          </button>
        </div>
      </div>
    </form>
  );
}
