import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { BoardCommentItem } from './BoardCommentItem';
import { boardCommentService, CreateBoardCommentRequest, UpdateBoardCommentRequest } from '../../api/boards/boardCommentService';
import { useToast } from '@/hooks/useToast';
import { MessageCircle, Plus } from 'lucide-react';

interface BoardCommentListProps {
  postId: number;
  onProfileClick: (userId: number) => void;
}

export const BoardCommentList: React.FC<BoardCommentListProps> = ({
  postId,
  onProfileClick
}) => {
  const [newComment, setNewComment] = useState('');
  const [newCommentIsSecret, setNewCommentIsSecret] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 댓글 목록 조회
  const {
    data: commentsData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['boardComments', postId, currentPage],
    queryFn: () => boardCommentService.getComments(postId, currentPage, 20),
    enabled: !!postId
  });

  // 댓글 작성 뮤테이션
  const createCommentMutation = useMutation({
    mutationFn: (data: CreateBoardCommentRequest) => 
      boardCommentService.createComment(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boardComments', postId] });
      setNewComment('');
      setNewCommentIsSecret(false);
      setIsWriting(false);
      toast({
        title: "댓글이 작성되었습니다.",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "댓글 작성에 실패했습니다.",
        description: error.response?.data?.message || "오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  });

  // 댓글 수정 뮤테이션
  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, data }: { commentId: number; data: UpdateBoardCommentRequest }) =>
      boardCommentService.updateComment(postId, commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boardComments', postId] });
      toast({
        title: "댓글이 수정되었습니다.",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "댓글 수정에 실패했습니다.",
        description: error.response?.data?.message || "오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  });

  // 댓글 삭제 뮤테이션
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) =>
      boardCommentService.deleteComment(postId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boardComments', postId] });
      toast({
        title: "댓글이 삭제되었습니다.",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "댓글 삭제에 실패했습니다.",
        description: error.response?.data?.message || "오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  });

  // 답글 작성 뮤테이션
  const createReplyMutation = useMutation({
    mutationFn: ({ parentId, content, isSecret }: { parentId: number; content: string; isSecret: boolean }) =>
      boardCommentService.createReply(postId, parentId, { content, isSecret }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boardComments', postId] });
      toast({
        title: "답글이 작성되었습니다.",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "답글 작성에 실패했습니다.",
        description: error.response?.data?.message || "오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  });

  const handleSubmitNewComment = () => {
    if (!newComment.trim()) return;

    createCommentMutation.mutate({
      content: newComment,
      isSecret: newCommentIsSecret
    });
  };

  const handleEditComment = (commentId: number, data: UpdateBoardCommentRequest) => {
    updateCommentMutation.mutate({ commentId, data });
  };

  const handleDeleteComment = (commentId: number) => {
    deleteCommentMutation.mutate(commentId);
  };

  const handleReply = (parentCommentId: number, content: string, isSecret: boolean) => {
    createReplyMutation.mutate({
      parentId: parentCommentId,
      content,
      isSecret
    });
  };

  if (isError) {
    return (
      <Alert className="mb-6">
        <AlertDescription>
          댓글을 불러오는 중 오류가 발생했습니다: {(error as any)?.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* 댓글 작성 섹션 */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5" />
          <h3 className="text-lg font-semibold">
            댓글 {commentsData?.totalElements || 0}개
          </h3>
        </div>

        {!isWriting ? (
          <Button
            variant="outline"
            onClick={() => setIsWriting(true)}
            className="w-full justify-start text-gray-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            댓글을 작성해보세요...
          </Button>
        ) : (
          <div className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="min-h-[100px]"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newCommentIsSecret}
                  onChange={(e) => setNewCommentIsSecret(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">비밀 댓글</span>
              </label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsWriting(false);
                    setNewComment('');
                    setNewCommentIsSecret(false);
                  }}
                >
                  취소
                </Button>
                <Button
                  onClick={handleSubmitNewComment}
                  disabled={!newComment.trim() || createCommentMutation.isPending}
                >
                  {createCommentMutation.isPending ? '작성 중...' : '댓글 작성'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 댓글 목록 */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">댓글을 불러오는 중...</div>
        </div>
      ) : !commentsData?.comments?.length ? (
        <div className="text-center py-8">
          <div className="text-gray-500">첫 번째 댓글을 작성해보세요!</div>
        </div>
      ) : (
        <div className="space-y-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {commentsData.comments.map((comment) => (
            <BoardCommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              onReply={handleReply}
              onProfileClick={onProfileClick}
            />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {commentsData && commentsData.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={!commentsData.hasPrevious}
          >
            이전
          </Button>
          <span className="flex items-center px-3 text-sm">
            {currentPage + 1} / {commentsData.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={!commentsData.hasNext}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
};