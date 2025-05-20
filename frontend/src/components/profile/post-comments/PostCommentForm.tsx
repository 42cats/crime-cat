import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { UserPostCommentRequest } from '@/api/userPost/userPostCommentService';
import { Switch } from '@/components/ui/switch';
import { Lock } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface PostCommentFormProps {
  onSubmit: (data: UserPostCommentRequest) => Promise<void>;
  isReply?: boolean;
  initialContent?: string;
  isAuthenticated: boolean;
  onLoginRequired: () => void;
  onCancel?: () => void;
  postId: string;
  placeholder?: string;
}

const PostCommentForm: React.FC<PostCommentFormProps> = ({
  onSubmit,
  isReply = false,
  initialContent = '',
  isAuthenticated,
  onLoginRequired,
  onCancel,
  postId,
  placeholder = '댓글을 작성해주세요...',
}) => {
  const [content, setContent] = useState(initialContent);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }

    if (!content.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        content: content.trim(),
        isPrivate,
      });
      
      // 제출 성공 후 초기화
      setContent('');
      setIsPrivate(false);
    } catch (error) {
      console.error('댓글 제출 중 오류 발생:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFocus = () => {
    if (!isAuthenticated) {
      onLoginRequired();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        onFocus={handleFocus}
        className={`min-h-[70px] ${isReply ? 'text-sm' : ''}`}
        disabled={isSubmitting || !isAuthenticated}
      />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="secret-comment"
            checked={isPrivate}
            onCheckedChange={setIsPrivate}
            disabled={isSubmitting || !isAuthenticated}
          />
          <Label 
            htmlFor="secret-comment" 
            className="text-xs flex items-center cursor-pointer"
          >
            <Lock className="h-3 w-3 mr-1" />
            비밀댓글
          </Label>
        </div>
        
        <div className="flex space-x-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
              className="text-xs px-2 py-1"
            >
              취소
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isSubmitting || !isAuthenticated}
            className="text-xs px-3 py-1"
          >
            {isSubmitting ? '전송 중...' : isReply ? '답글작성' : '댓글작성'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default PostCommentForm;