import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { noticesService } from '@/api/noticesService';
import { Notice, NoticePage } from '@/lib/types';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import PageTransition from '@/components/PageTransition';
import { isWithinDays } from '@/utils/highlight';
import { useAuth } from '@/hooks/useAuth';
import { Pin } from 'lucide-react';

const PAGE_SIZE = 10;

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

const formatDateTime = (dateString: string) => {
  const d = new Date(dateString);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  return d.toLocaleString('ko-KR', isMobile
    ? { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
    : { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
  );
};

const NoticeList: React.FC = () => {
  const [page, setPage] = useState(0);
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery<NoticePage>({
    queryKey: ['notices', page],
    queryFn: () => noticesService.getNotices(page, PAGE_SIZE),
    keepPreviousData: true,
  });

  const handleClick = (notice: Notice) => {
    navigate(`/notices/${notice.id}`);
  };

  const renderPagination = () => {
    if (!data) return null;
    const { totalPages } = data;
    const start = Math.max(0, page - 2);
    const end = Math.min(totalPages, start + 5);
    const pages = Array.from({ length: end - start }, (_, i) => start + i);

    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          disabled={!data.hasPrevious}
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
        >
          이전
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPage(p)}
          >
            {p + 1}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          disabled={!data.hasNext}
          onClick={() => setPage((p) => p + 1)}
        >
          다음
        </Button>
      </div>
    );
  };

  return (
    <PageTransition>
      <div className="container mx-auto px-6 py-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">공지사항</h1>
          {hasRole(['ADMIN']) && (
            <Link to="/notices/new">
              <Button size="sm">글쓰기</Button>
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <p className="text-red-500">공지 목록을 불러오는 데 실패했습니다.</p>
        ) : data?.content?.length ? (
          <div className="space-y-4">
            {data.content.map((notice) => {
              const isNew = isWithinDays(notice.createdAt, 7);
              const isUpdated = isWithinDays(notice.updatedAt, 7);

              return (
                <div
                  key={notice.id}
                  className={`relative glass p-4 rounded-lg cursor-pointer transition-colors hover:bg-slate-100/5 ${
                    notice.isPinned ? 'border border-yellow-300 ring-1 ring-yellow-200' : ''
                  }`}
                  onClick={() => handleClick(notice)}
                >
                  {notice.isPinned && (
                    <div className="absolute top-1.5 left-1.5 z-10">
                      <Pin className="w-4 h-4 text-yellow-500" />
                    </div>
                  )}

                  <div className="pl-6">
                    <div className="block sm:flex sm:justify-between sm:items-start mb-1">
                      <div className="flex items-center gap-2 flex-wrap text-sm mb-1 sm:mb-0">
                        {noticeTypeBadge(notice.noticeType)}
                        {isNew && <span className="twinkle-badge twinkle-badge-yellow">New</span>}
                        {isUpdated && (!isNew || notice.createdAt !== notice.updatedAt) && (
                          <span className="twinkle-badge twinkle-badge-blue">Updated</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap sm:text-right">
                        {formatDateTime(notice.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold line-clamp-1 sm:line-clamp-2 mb-1">
                      {notice.title}
                    </h3>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notice.summary || notice.content}
                    </p>
                  </div>
                </div>
              );
            })}
            {renderPagination()}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-10">공지사항이 없습니다.</p>
        )}
      </div>
    </PageTransition>
  );
};

export default NoticeList;