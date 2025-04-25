import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { themesService } from '@/api/themesService';
import { formatDateTime } from '@/utils/formatDateTime';
import { Theme } from '@/lib/types';

const BoardSection = ({
  title,
  category,
}: {
  title: string;
  category: 'CRIMESCENE' | 'ESCAPE_ROOM' | 'MURDER_MYSTERY' | 'REALWORLD';
}) => {
  const navigate = useNavigate();
  const {
    data: posts,
    isLoading,
    isError,
  } = useQuery<Theme[]>({
    queryKey: ['latest-themes', category],
    queryFn: () => themesService.getLatestThemes(category),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold">{title}</h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 px-2"
          onClick={() => navigate(`/themes/${category}`)}
        >
          더보기 <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>

      <div className="glass p-3 rounded-lg min-h-[180px]">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : isError ? (
          <p className="text-sm text-red-500">게시글을 불러오지 못했습니다.</p>
        ) : posts?.length ? (
          <ul className="space-y-2">
            {posts.map((post) => (
              <li
                key={post.id}
                className="border-b border-slate-700/20 pb-2 last:border-0 last:pb-0"
              >
                <button
                  className="text-left w-full hover:text-primary transition-colors"
                  onClick={() => navigate(`/themes/${post.id}`)}
                >
                  <h4 className="text-sm font-medium truncate">{post.title}</h4>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>조회수 {post.views}</span>
                    <span>{formatDateTime(post.createdAt)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">게시글이 없습니다.</p>
        )}
      </div>
    </div>
  );
};

const LatestPostsSection: React.FC = () => {
  return (
    <section className="py-8 px-4">
      <div className="container mx-auto">
        <h2 className="text-xl font-bold mb-4">최신 게시글</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <BoardSection title="크라임씬" category="CRIMESCENE" />
          <BoardSection title="방탈출" category="ESCAPE_ROOM" />
          <BoardSection title="머더미스터리" category="MURDER_MYSTERY" />
          <BoardSection title="리얼월드" category="REALWORLD" />
        </div>
      </div>
    </section>
  );
};

export default LatestPostsSection;