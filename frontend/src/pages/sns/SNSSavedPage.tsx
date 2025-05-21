import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Loader2, Folder, Grid, Plus, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostGrid from '@/components/sns/post/PostGrid';
import { savePostService, CollectionResponse } from '@/api/sns/savePostService';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const SNSSavedPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [posts, setPosts] = useState<Array<any>>([]);
  const [collections, setCollections] = useState<CollectionResponse[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const observer = useRef<IntersectionObserver | null>(null);
  
  // 로그인 상태 확인
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  // 컬렉션 목록 로드
  const loadCollections = useCallback(async () => {
    try {
      const collectionList = await savePostService.getCollections();
      setCollections(collectionList);
    } catch (error) {
      console.error('컬렉션 목록 로드 실패:', error);
    }
  }, []);
  
  // 저장된 게시물 로드
  const loadSavedPosts = useCallback(async (resetPage = false) => {
    if (isLoading || (!hasMore && !resetPage)) return;
    
    const currentPage = resetPage ? 0 : page;
    
    setIsLoading(true);
    try {
      let postsData;
      
      if (activeTab === 'all') {
        // 모든 저장된 게시물
        postsData = await savePostService.getSavedPosts(currentPage);
      } else {
        // 특정 컬렉션의 게시물
        postsData = await savePostService.getSavedPostsByCollection(activeTab, currentPage);
      }
      
      if (resetPage || currentPage === 0) {
        setPosts(postsData.content);
      } else {
        setPosts(prevPosts => [...prevPosts, ...postsData.content]);
      }
      
      // 더 불러올 데이터가 있는지 확인
      setHasMore(!postsData.pageable || postsData.pageable.pageNumber < postsData.totalPages - 1);
      
      if (resetPage) {
        setPage(1);
      } else {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('저장된 게시물 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, isLoading, hasMore]);
  
  // 첫 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadCollections();
      loadSavedPosts(true);
    }
  }, [isAuthenticated, activeTab]);
  
  // 무한 스크롤 설정
  const lastPostElementRef = useCallback((node: HTMLElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadSavedPosts();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, loadSavedPosts]);
  
  // 탭 변경 처리
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPosts([]);
    setPage(0);
    setHasMore(true);
  };
  
  // 새 컬렉션 생성 처리
  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    
    try {
      // 더미 포스트 ID (실제로는 첫 번째로 저장하는 포스트 ID 필요)
      // 여기서는 컬렉션만 생성하고 실제 저장은 하지 않음
      const dummyPostId = 'temp-id';
      await savePostService.toggleSavePost(dummyPostId, newCollectionName.trim());
      
      toast.success(`'${newCollectionName}' 컬렉션이 생성되었습니다.`);
      setNewCollectionName('');
      setShowNewCollection(false);
      
      // 컬렉션 목록 새로고침
      loadCollections();
    } catch (error) {
      console.error('컬렉션 생성 실패:', error);
      toast.error('컬렉션 생성에 실패했습니다.');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">저장된 게시물</h1>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowNewCollection(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          새 컬렉션
        </Button>
      </div>
      
      {/* 컬렉션 탭 */}
      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={handleTabChange} 
        className="mb-6"
      >
        <TabsList className="mb-4 flex w-full overflow-x-auto pb-1">
          <TabsTrigger value="all" className="flex items-center">
            <Grid className="h-4 w-4 mr-1" />
            전체
          </TabsTrigger>
          
          {collections.map(collection => (
            <TabsTrigger 
              key={collection.name} 
              value={collection.name}
              className="flex items-center"
            >
              <Folder className="h-4 w-4 mr-1" />
              {collection.name}
              <span className="ml-1 text-xs text-muted-foreground">
                ({collection.postCount})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={activeTab}>
          {/* 게시물 그리드 */}
          <PostGrid posts={posts} lastPostRef={lastPostElementRef} />
          
          {/* 로딩 표시 */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {/* 더 이상 결과가 없음 */}
          {!isLoading && !hasMore && posts.length > 0 && (
            <div className="text-center py-6 text-muted-foreground">
              더 이상 표시할 게시물이 없습니다.
            </div>
          )}
          
          {/* 저장된 게시물 없음 */}
          {!isLoading && posts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Folder className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg mb-2">저장된 게시물이 없습니다.</p>
              <p className="text-sm">게시물을 저장하면 여기에 표시됩니다.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* 새 컬렉션 생성 다이얼로그 */}
      <Dialog open={showNewCollection} onOpenChange={setShowNewCollection}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>새 컬렉션 만들기</DialogTitle>
            <DialogDescription>
              새 컬렉션의 이름을 입력하세요. 첫 번째로 저장하는 게시물에 이 컬렉션이 적용됩니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="컬렉션 이름"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNewCollection(false)}
            >
              취소
            </Button>
            <Button 
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim()}
            >
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SNSSavedPage;
