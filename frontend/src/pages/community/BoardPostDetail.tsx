import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BoardType } from '@/lib/types/board';
import { boardPostService } from '@/api/boardPostService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare, ThumbsUp, Eye, Share2 } from 'lucide-react';

interface BoardPostDetailProps {
  boardType: BoardType;
}

const BoardPostDetail: React.FC<BoardPostDetailProps> = ({ boardType }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['boardPost', id],
    queryFn: () => boardPostService.getBoardPostById(id!),
    enabled: !!id,
  });
  
  const handleBack = () => {
    navigate(`/community/${boardType.toLowerCase()}`);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }
  
  if (isError || !post) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="py-20 text-center">
          <p className="text-destructive">게시글을 찾을 수 없습니다.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={handleBack}
          >
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Button 
        variant="ghost" 
        onClick={handleBack}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        목록으로
      </Button>
      
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-start">
            <div>
              {post.postType === 'NOTICE' && (
                <Badge className="mb-2 bg-blue-500">공지</Badge>
              )}
              {post.postType === 'EVENT' && (
                <Badge className="mb-2 bg-orange-500">이벤트</Badge>
              )}
              <CardTitle className="text-xl font-bold">{post.title}</CardTitle>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.authorProfileImagePath} alt={post.authorName} />
                <AvatarFallback>{post.authorName.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <span>{post.authorName}</span>
              <span>•</span>
              <span>{new Date(post.createdAt).toLocaleString()}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{post.viewCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                <span>{post.likeCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{post.commentCount}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="py-6">
          {/* 게시글 내용 */}
          <div 
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </CardContent>
        
        <CardFooter className="flex justify-between border-t py-4">
          <div>
            {/* 여기에 게시글 작성자인 경우 수정/삭제 버튼 추가 */}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <ThumbsUp className="mr-2 h-4 w-4" />
              추천
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              공유
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* 댓글 영역 (추후 구현) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">댓글 {post.commentCount}개</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-10">
            댓글 기능은 현재 준비 중입니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BoardPostDetail;
