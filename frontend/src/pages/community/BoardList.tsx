import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { boardPostService } from '@/api/boardPostService';
import { BoardPost, BoardType, PostType, BoardPostSortType } from '@/lib/types/board';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BoardHeader from '@/components/boards/BoardHeader';
import BoardFilter from '@/components/boards/BoardFilter';
import BoardPostItem from '@/components/boards/BoardPostItem';
import BoardPagination from '@/components/boards/BoardPagination';

const BOARD_INFO = {
  [BoardType.QUESTION]: {
    title: '질문게시판',
    description: '크라임 테마와 관련된 질문을 할 수 있는 공간입니다.',
  },
  [BoardType.CHAT]: {
    title: '자유게시판',
    description: '자유롭게 이야기를 나눌 수 있는 공간입니다.',
  },
  [BoardType.CREATOR]: {
    title: '제작자게시판',
    description: '테마 제작자들의 커뮤니티 공간입니다.',
  },
};

interface BoardListProps {
  boardType: BoardType;
}

const BoardList: React.FC<BoardListProps> = ({ boardType }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL 쿼리 파라미터 파싱
  const queryParams = new URLSearchParams(location.search);
  const pageParam = queryParams.get('page');
  const keywordParam = queryParams.get('kw');
  const sortParam = queryParams.get('sort');
  
  const [page, setPage] = useState(pageParam ? parseInt(pageParam) : 0);
  const [keyword, setKeyword] = useState(keywordParam || '');
  const [searchKeyword, setSearchKeyword] = useState(keywordParam || '');
  const [sortType, setSortType] = useState<BoardPostSortType>(
    sortParam ? sortParam as BoardPostSortType : BoardPostSortType.LATEST
  );
  
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['boardPosts', boardType, page, searchKeyword, sortType],
    queryFn: async () => {
      try {
        return await boardPostService.getBoardPosts({
          page,
          size: 20,
          kw: searchKeyword,
          boardType,
          sort: [sortType]
        });
      } catch (error) {
        console.error('게시글 로딩 오류:', error);
        // 빈 응답 객체 반환
        return {
          content: [],
          pageable: {
            pageNumber: page,
            pageSize: 20,
            sort: { sorted: false, unsorted: true, empty: true },
            offset: 0,
            paged: true,
            unpaged: false
          },
          totalPages: 0,
          totalElements: 0,
          last: true,
          size: 20,
          number: page,
          sort: { sorted: false, unsorted: true, empty: true },
          numberOfElements: 0,
          first: true,
          empty: true
        };
      }
    },
    keepPreviousData: true,
    retry: 1, // 실패시 1번만 재시도
  });
  
  // URL 쿼리 파라미터 업데이트
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 0) params.append('page', page.toString());
    if (searchKeyword) params.append('kw', searchKeyword);
    if (sortType !== BoardPostSortType.LATEST) params.append('sort', sortType);
    
    const newSearch = params.toString();
    const path = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;
    
    navigate(path, { replace: true });
  }, [page, searchKeyword, sortType, navigate, location.pathname]);
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  const handleSortChange = (newSortType: BoardPostSortType) => {
    setSortType(newSortType);
    setPage(0);
  };
  
  const handleSearch = () => {
    setSearchKeyword(keyword);
    setPage(0);
  };
  
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  };
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">{BOARD_INFO[boardType].title}</h1>
        <p className="text-muted-foreground mt-1">{BOARD_INFO[boardType].description}</p>
      </div>
      
      <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
        <CardHeader className="p-4 pb-0">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="posts">기본 게시글</TabsTrigger>
                <TabsTrigger value="hot">인기글</TabsTrigger>
                <TabsTrigger value="photos">사진글</TabsTrigger>
              </TabsList>
              
              <TabsContent value="posts" className="p-0 mt-0">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-2">
                  <BoardFilter 
                    sortType={sortType}
                    onSortChange={handleSortChange}
                    keyword={keyword}
                    onKeywordChange={handleKeywordChange}
                    onSearch={handleSearch}
                  />
                  
                  <Button onClick={() => navigate(`/community/${boardType.toLowerCase()}/new`)}>
                    글쓰기
                  </Button>
                </div>
                
                {/* 게시글 헤더 (테이블 헤더) */}
                <div className="border-t border-b border-gray-200 dark:border-gray-700 bg-muted/40 py-2 px-4 hidden md:flex">
                  <div className="flex-shrink-0 w-12 text-center text-xs font-medium text-muted-foreground">번호</div>
                  <div className="flex-grow text-xs font-medium text-muted-foreground">제목</div>
                  <div className="flex-shrink-0 w-24 text-center text-xs font-medium text-muted-foreground hidden lg:block">작성자</div>
                  <div className="flex-shrink-0 w-20 text-center text-xs font-medium text-muted-foreground hidden md:block">날짜</div>
                  <div className="flex-shrink-0 w-16 text-center text-xs font-medium text-muted-foreground hidden md:block">조회</div>
                  <div className="flex-shrink-0 w-16 text-center text-xs font-medium text-muted-foreground hidden md:block">추천</div>
                </div>
                
                {isLoading ? (
                  <div className="py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">게시글을 불러오는 중...</p>
                  </div>
                ) : isError ? (
                  <div className="py-20 text-center">
                    <p className="text-destructive">게시글을 불러오는 중 오류가 발생했습니다.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => refetch()}
                    >
                      다시 시도
                    </Button>
                  </div>
                ) : !data || data.content.length === 0 ? (
                  <div className="py-12 text-center border-b border-gray-200 dark:border-gray-700">
                    <div className="mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted-foreground/50 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <p className="text-muted-foreground mb-2">아직 게시글이 없습니다.</p>
                    <p className="text-sm text-muted-foreground/70">가장 먼저 글을 작성해보세요.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {/* 공지사항 게시글 (상단 고정) */}
                    {data.content
                      .filter(post => post.postType === PostType.NOTICE)
                      .map(post => (
                        <div key={post.id} className="bg-blue-50/50 dark:bg-blue-900/10">
                          <BoardPostItem post={post} boardType={boardType} />
                        </div>
                      ))
                    }
                    
                    {/* 일반 게시글 */}
                    {data.content
                      .filter(post => post.postType !== PostType.NOTICE)
                      .map(post => (
                        <BoardPostItem key={post.id} post={post} boardType={boardType} />
                      ))
                    }
                    
                    {/* 게시글이 없는 경우에도 빈 테두리만 표시하기 위해 추가 */}
                    {data.content.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground">
                        여기에 첫 번째 게시글을 작성해보세요!
                      </div>
                    )}
                  </div>
                )}
                
                {/* 페이지네이션 */}
                {data && data.totalElements > 0 && (
                  <div className="py-4 px-4 border-t border-gray-200 dark:border-gray-700">
                    <BoardPagination
                      currentPage={page}
                      totalPages={data.totalPages || 1}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="hot" className="p-0 mt-0">
                <div className="py-12 text-center border-t border-b border-gray-200 dark:border-gray-700">
                  <p className="text-muted-foreground">인기글 기능은 준비 중입니다.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="photos" className="p-0 mt-0">
                <div className="py-12 text-center border-t border-b border-gray-200 dark:border-gray-700">
                  <p className="text-muted-foreground">사진글 기능은 준비 중입니다.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

export default BoardList;
