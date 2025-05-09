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
        className="min-h-24 p-3"
      />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id={`spoiler-mode-${parentId || 'main'}`}
            checked={isSpoiler}
            onCheckedChange={setIsSpoiler}
          />
          <label 
            htmlFor={`spoiler-mode-${parentId || 'main'}`} 
            className="text-sm cursor-pointer"
          >
            스포일러
          </label>
        </div>
        
        <div className="flex space-x-2">
          {isEditing && onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
              취소
            </Button>
          )}
          
          <Button type="submit" disabled={!content.trim() || isSubmitting}>
            {isEditing ? "수정하기" : parentId ? "답글 작성" : "댓글 작성"}
          </Button>
        </div>
      </div>
    </form>
  );
}
