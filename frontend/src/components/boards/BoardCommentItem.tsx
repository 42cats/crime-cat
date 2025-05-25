import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { BoardComment, UpdateBoardCommentRequest } from '../../api/boards/boardCommentService';
import { formatRelativeTime, UTCToKST } from '../../lib/dateFormat';
import { Heart, MessageSquare, Lock } from 'lucide-react';

interface BoardCommentItemProps {
  comment: BoardComment;
  postId: string;
  onEdit: (commentId: string, data: UpdateBoardCommentRequest) => void;
  onDelete: (commentId: string) => void;
  onReply: (parentCommentId: string, content: string, isSecret: boolean) => void;
  onLike: (commentId: string) => void;
  onProfileClick: (userId: string) => void;
  isReply?: boolean;
  depth?: number;
}

export const BoardCommentItem: React.FC<BoardCommentItemProps> = ({
  comment,
  postId,
  onEdit,
  onDelete,
  onReply,
  onLike,
  onProfileClick,
  isReply = false,
  depth = 0
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [editIsSecret, setEditIsSecret] = useState(comment.isSecret);
  const [replyContent, setReplyContent] = useState('');
  const [replyIsSecret, setReplyIsSecret] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  // 비밀 댓글이고 내 댓글이 아닌 경우
  if (comment.isSecret && !comment.isOwnComment && comment.content === "[비밀댓글]") {
    return (
      <div className={`py-3 ${isReply ? 'ml-12' : ''}`}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 rounded-full border bg-muted/20 shrink-0">
            <AvatarImage src={comment.authorProfileImage} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {comment.authorName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{comment.authorName}</span>
              <span className="text-xs text-muted-foreground">
                <UTCToKST date={comment.createdAt} />
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
              <Lock className="w-3.5 h-3.5" />
              <span>비밀 댓글입니다.</span>
            </div>
          </div>
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
    <div className={`${isReply ? 'ml-12 py-3' : 'p-4'}`}>
      <div className="flex gap-3">
        {/* 아바타 */}
        <Avatar 
          className="h-8 w-8 rounded-full border bg-muted/20 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
          onClick={handleProfileClick}
        >
          <AvatarImage src={comment.authorProfileImage} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {comment.authorName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* 작성자 정보 */}
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className="font-medium text-foreground text-sm cursor-pointer hover:text-primary transition-colors"
                  onClick={handleProfileClick}
                >
                  {comment.authorName}
                </span>
                <span className="text-xs text-muted-foreground">
                  <UTCToKST date={comment.createdAt} />
                </span>
                {comment.isSecret && (
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">
                    <Lock className="w-3 h-3 mr-0.5" />
                    비밀
                  </Badge>
                )}
              </div>

              {/* 댓글 내용 또는 수정 폼 */}
              {isEditing ? (
                <div className="mt-2 mb-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                    className="min-h-[80px] text-sm"
                  />
                  <div className="flex items-center justify-between mt-2">
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
                <div className="whitespace-pre-wrap break-words text-foreground text-sm mt-2 mb-2">
                  {comment.content}
                </div>
              )}

              {/* 좋아요/답글 버튼 */}
              <div className="flex items-center gap-4">
                <button
                  className={`text-xs flex items-center gap-1 transition-colors ${
                    comment.isLikedByCurrentUser
                      ? "text-red-500 dark:text-red-400"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => onLike(comment.id)}
                >
                  <Heart
                    className={`h-3.5 w-3.5 ${
                      comment.isLikedByCurrentUser
                        ? "fill-red-500 dark:fill-red-400"
                        : ""
                    }`}
                  />
                  <span>
                    좋아요{" "}
                    {comment.likes > 0 && (
                      <span className="font-medium">
                        ({comment.likes})
                      </span>
                    )}
                  </span>
                </button>

                {depth < 2 && (
                  <button
                    className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsReplying(!isReplying)}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>
                      답글{isReplying ? " 취소" : ""}
                    </span>
                  </button>
                )}

                {/* 수정/삭제 버튼 */}
                {comment.isOwnComment && (
                  <>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setIsEditing(true)}
                    >
                      수정
                    </button>
                    <button
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 답글 작성 폼 */}
          {isReplying && (
            <div className="mt-3 p-3 bg-muted/30 rounded-lg space-y-3">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="답글을 입력하세요..."
                className="min-h-[60px] text-sm"
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
                    onClick={() => {
                      setIsReplying(false);
                      setReplyContent('');
                      setReplyIsSecret(false);
                    }}
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

          {/* 답글 목록 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              {comment.replies.length > 1 && (
                <button
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
                  onClick={() => setShowReplies(!showReplies)}
                >
                  {showReplies
                    ? "답글 숨기기"
                    : `답글 ${comment.replies.length}개 보기`}
                </button>
              )}
              
              {showReplies && (
                <div className="space-y-0">
                  {comment.replies.map((reply) => (
                    <BoardCommentItem
                      key={reply.id}
                      comment={reply}
                      postId={postId}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onReply={onReply}
                      onLike={onLike}
                      onProfileClick={onProfileClick}
                      isReply={true}
                      depth={depth + 1}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
    </div>
  );
};