import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageTransition from '@/components/PageTransition';
import { noticesService } from '@/api/noticesService';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Share2, Edit, Trash } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { useAuth } from '@/hooks/useAuth';

const noticeTypeBadge = (type: string) => {
  switch (type) {
    case 'SYSTEM':
      return <Badge variant="outline" className="text-blue-600 border-blue-600">시스템</Badge>;
    case 'EVENT':
      return <Badge variant="outline" className="text-green-600 border-green-600">이벤트</Badge>;
    case 'UPDATE':
      return <Badge variant="outline" className="text-purple-600 border-purple-600">업데이트</Badge>;
    default:
      return null;
  }
};

const NoticeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const { data: notice, isLoading, error } = useQuery({
    queryKey: ['notice', id],
    queryFn: () => id ? noticesService.getNoticeById(id) : Promise.reject('No ID'),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => noticesService.deleteNotice(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      navigate('/notices');
    },
  });

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: '링크 복사 완료', description: '페이지 링크가 복사되었습니다.' });
    } catch (err) {
      toast({ title: '복사 실패', description: '클립보드 접근이 차단되었습니다.', variant: 'destructive' });
    }
  };

  const handleEdit = () => navigate(`/notices/edit/${id}`, { state: { notice } });
  const handleDelete = () => deleteMutation.mutate();

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString('ko-KR', {
      year: '2-digit', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="container mx-auto px-6 py-20">
          <Skeleton className="h-10 w-1/2 mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-48 w-full" />
        </div>
      </PageTransition>
    );
  }

  if (error || !notice) {
    return (
      <PageTransition>
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">공지를 찾을 수 없습니다</h1>
          <Button onClick={() => navigate('/notices')}>목록으로 돌아가기</Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto space-y-8">
          <Link to="/notices" className="inline-flex items-center text-muted-foreground hover:text-primary">
            <ChevronLeft className="w-4 h-4 mr-1" />
            목록으로 돌아가기
          </Link>

          <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {noticeTypeBadge(notice.noticeType)}
              </div>
              <h1 className="text-3xl font-bold break-words whitespace-pre-wrap leading-tight">{notice.title}</h1>
            </div>

            <div className="flex flex-col items-end gap-2 whitespace-nowrap">
              <div className="flex gap-2">
                {hasRole(['ADMIN', 'MANAGER']) && (
                  <>
                    <Button variant="outline" className="h-8 px-2 text-sm" onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-1" /> 수정
                    </Button>
                    <Button variant="destructive" className="h-8 px-2 text-sm" onClick={handleDelete}>
                      <Trash className="h-4 w-4 mr-1" /> 삭제
                    </Button>
                  </>
                )}
                <Button variant="outline" className="h-8 px-2 text-sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-1" /> 공유
                </Button>
              </div>
              <div className="text-sm text-muted-foreground text-right">
                <div><strong>작성일</strong> {formatDate(notice.createdAt)}</div>
                <div><strong>수정일</strong> {formatDate(notice.updatedAt)}</div>
              </div>
            </div>
          </div>

          <section className="mt-6">
            <div className="prose max-w-none dark:prose-invert mt-2">
              <MarkdownRenderer content={notice.content} />
            </div>
          </section>
        </div>
      </div>
    </PageTransition>
  );
};

export default NoticeDetail;