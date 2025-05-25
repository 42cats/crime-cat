import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { BoardComment, UpdateBoardCommentRequest } from '../../api/boards/boardCommentService';
import { formatRelativeTime } from '../../lib/dateFormat';
import { Pencil, Trash2, Reply, Lock } from 'lucide-react';

interface BoardCommentItemProps {
  comment: BoardComment;
  postId: number;
  onEdit: (commentId: number, data: UpdateBoardCommentRequest) => void;
  onDelete: (commentId: number) => void;
  onReply: (parentCommentId: number, content: string, isSecret: boolean) => void;
  onProfileClick: (userId: number) => void;
  isReply?: boolean;
}

export const BoardCommentItem: React.FC<BoardCommentItemProps> = ({
  comment,
  postId,
  onEdit,
  onDelete,
  onReply,
  onProfileClick,
  isReply = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [editIsSecret, setEditIsSecret] = useState(comment.isSecret);
  const [replyContent, setReplyContent] = useState('');
  const [replyIsSecret, setReplyIsSecret] = useState(false);

  if (!comment.canView) {
    return (
      <div className={`p-4 bg-gray-50 dark:bg-gray-800 rounded-lg ${isReply ? 'ml-8' : ''}`}>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Lock className="w-4 h-4" />
          <span>비밀 댓글입니다.</span>
        </div>
      </div>
    );
  }

  const handleEditSubmit = () => {
    onEdit(comment.id, {
      content: editContent,
      isSecret: editIsSecret
    });
    setIsEditing(false);
  };

  const handleReplySubmit = () => {
    onReply(comment.id, replyContent, replyIsSecret);
    setIsReplying(false);
    setReplyContent('');
    setReplyIsSecret(false);
  };

  const handleProfileClick = () => {
    onProfileClick(comment.authorId);
  };

  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 ${isReply ? 'ml-8' : ''}`}>
      <div className="p-4">
        {/* 댓글 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar 
              className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleProfileClick}
            >
              <AvatarImage src={comment.authorAvatar} />
              <AvatarFallback>{comment.authorNickname[0]}</AvatarFallback>
            </Avatar>
            <div>
              <span 
                className="font-medium text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={handleProfileClick}
              >
                {comment.authorNickname}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {formatRelativeTime(comment.createdAt)}
                </span>
                {comment.isSecret && (
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    비밀
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* 댓글 액션 버튼 */}
          <div className="flex items-center gap-2">
            {comment.canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs"
              >
                <Pencil className="w-3 h-3 mr-1" />
                수정
              </Button>
            )}
            {comment.canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs text-red-600 hover:text-red-700">
                    <Trash2 className="w-3 h-3 mr-1" />
                    삭제
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>댓글 삭제</AlertDialogTitle>
                    <AlertDialogDescription>
                      이 댓글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(comment.id)}>
                      삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
                className="text-xs"
              >
                <Reply className="w-3 h-3 mr-1" />
                답글
              </Button>
            )}
          </div>
        </div>

        {/* 댓글 내용 또는 수정 폼 */}
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="min-h-[80px]"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editIsSecret}
                  onChange={(e) => setEditIsSecret(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">비밀 댓글</span>
              </label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={handleEditSubmit}
                  disabled={!editContent.trim()}
                >
                  수정
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {comment.content}
          </div>
        )}

        {/* 답글 작성 폼 */}
        {isReplying && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="답글을 입력하세요..."
              className="min-h-[60px]"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={replyIsSecret}
                  onChange={(e) => setReplyIsSecret(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">비밀 답글</span>
              </label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReplying(false)}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={handleReplySubmit}
                  disabled={!replyContent.trim()}
                >
                  답글 작성
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 대댓글 목록 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-l-2 border-gray-200 dark:border-gray-700">
          {comment.replies.map((reply) => (
            <BoardCommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              onEdit={onEdit}
              onDelete={onDelete}
              onReply={onReply}
              onProfileClick={onProfileClick}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};