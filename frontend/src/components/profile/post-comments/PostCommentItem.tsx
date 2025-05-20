import React, { useState } from 'react';
import { UserPostCommentDto, UserPostCommentRequest } from '@/api/userPost/userPostCommentService';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  MessageSquare, Trash2, Edit, Lock, 
  ChevronDown, ChevronUp, AlertTriangle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PostCommentForm from './PostCommentForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PostCommentItemProps {
  comment: UserPostCommentDto;
  postId: string;
  postAuthorId: string;
  onReply: (parentId: string, data: UserPostCommentRequest) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onUpdate: (commentId: string, data: UserPostCommentRequest) => Promise<void>;
  currentUserId?: string;
  onLoginRequired: () => void;
  isAuthenticated: boolean;
}

const PostCommentItem: React.FC<PostCommentItemProps> = ({
  comment,
  postId,
  postAuthorId,
  onReply,
  onDelete,
  onUpdate,
  currentUserId,
  onLoginRequired,
  isAuthenticated
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  
  // 비밀댓글 접근 권한 확인 - 포스트 작성자, 댓글 작성자만 볼 수 있음
  const canViewSecretComment = 
    !comment.isPrivate || 
    comment.authorId === currentUserId || 
    postAuthorId === currentUserId || 
    comment.isVisible; // 서버에서 가시성 여부 추가 확인

  const handleReplySubmit = async (data: UserPostCommentRequest) => {
    await onReply(comment.id, data);
    setIsReplying(false);
  };

  const handleUpdateSubmit = async (data: UserPostCommentRequest) => {
    await onUpdate(comment.id, data);
    setIsEditing(false);
  };

  const handleDeleteComment = async () => {
    if (window.confirm('댓글을 삭제하시겠습니까?')) {
      await onDelete(comment.id);
    }
  };

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ko });
    } catch (error) {
      return '날짜 정보 없음';
    }
  };

  if (comment.isDeleted) {
    return (
      <div className="py-3 px-2 text-gray-500 italic text-sm">
        삭제된 댓글입니다.
        
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 pl-5 border-l-2 border-gray-100 space-y-2">
            {comment.replies.map(reply => (
              <PostCommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                postAuthorId={postAuthorId}
                onReply={onReply}
                onDelete={onDelete}
                onUpdate={onUpdate}
                currentUserId={currentUserId}
                onLoginRequired={onLoginRequired}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="py-3 border-t border-gray-100 first:border-t-0">
      {/* 비밀글이고, 볼 수 없는 경우 */}
      {comment.isPrivate && !canViewSecretComment ? (
        <div className="flex items-center text-gray-500 text-sm py-2">
          <Lock className="h-4 w-4 mr-2" />
          <span>비밀 댓글입니다.</span>
        </div>
      ) : (
        /* 댓글 내용 표시 */
        <div>
          {/* 댓글 헤더 */}
          <div className="flex items-start">
            <Avatar className="h-7 w-7 mr-2">
              <AvatarImage src={comment.authorAvatarUrl || undefined} alt={comment.authorNickname} />
              <AvatarFallback>{comment.authorNickname ? comment.authorNickname[0] : '?'}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-medium text-sm">{comment.authorNickname}</span>
                {comment.isPrivate && (
                  <span className="ml-2 text-xs text-gray-500 flex items-center">
                    <Lock className="h-3 w-3 mr-1" />
                    비밀
                  </span>
                )}
                <span className="ml-auto text-xs text-gray-500">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              
              {isEditing ? (
                <PostCommentForm
                  onSubmit={handleUpdateSubmit}
                  initialContent={comment.content}
                  isAuthenticated={isAuthenticated}
                  onLoginRequired={onLoginRequired}
                  onCancel={() => setIsEditing(false)}
                  postId={postId}
                  placeholder="댓글을 수정하세요..."
                />
              ) : (
                <p className="text-sm mt-1 whitespace-pre-line">{comment.content}</p>
              )}
            </div>
          </div>
          
          {/* 댓글 액션 버튼 */}
          {!isEditing && (
            <div className="flex items-center mt-2 pl-9 space-x-4 text-xs text-gray-500">
              <button 
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center hover:text-blue-500 transition-colors"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                답글
              </button>
              
              {comment.isOwnComment && (
                <>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center hover:text-green-500 transition-colors"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    수정
                  </button>
                  
                  <button 
                    onClick={handleDeleteComment}
                    className="flex items-center hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    삭제
                  </button>
                </>
              )}
            </div>
          )}
          
          {/* 답글 작성 폼 */}
          {isReplying && (
            <div className="mt-3 pl-9">
              <PostCommentForm
                onSubmit={handleReplySubmit}
                isReply={true}
                isAuthenticated={isAuthenticated}
                onLoginRequired={onLoginRequired}
                onCancel={() => setIsReplying(false)}
                postId={postId}
                placeholder="답글을 작성하세요..."
              />
            </div>
          )}
        </div>
      )}
      
      {/* 답글 목록 (있는 경우만) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center mb-1 pl-9">
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs flex items-center text-gray-500 hover:text-blue-500"
            >
              {showReplies ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  답글 접기
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  답글 {comment.replies.length}개 보기
                </>
              )}
            </button>
          </div>
          
          {showReplies && (
            <div className="pl-9 border-l-2 border-gray-100 space-y-2">
              {comment.replies.map(reply => (
                <PostCommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  postAuthorId={postAuthorId}
                  onReply={onReply}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  currentUserId={currentUserId}
                  onLoginRequired={onLoginRequired}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCommentItem;