import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Loader2, Folder, Grid, Plus, X, Settings, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostGrid from '@/components/sns/post/PostGrid';
import { savePostService, CollectionResponse } from '@/api/sns/savePostService';
import { Button } from '@/components/ui/button';
import SnsBottomNavigation from '@/components/sns/SnsBottomNavigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
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
      
      // 더 불러올 데이터가 있는지 정확하게 확인
      const isLastPage = postsData.last || postsData.content.length === 0;
      setHasMore(!isLastPage);
      
      if (resetPage) {
        setPage(1);
      } else {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('저장된 게시물 로드 실패:', error);
      setHasMore(false); // 에러 발생시 무한스크롤 중단
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
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        loadSavedPosts();
      }
    }, {
      rootMargin: '100px' // 100px 며리에서 미리 로드
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
    if (!newCollectionName.trim()) {
      toast.error('컬렉션 이름을 입력해주세요.');
      return;
    }
    
    if (collections.some(col => col.name === newCollectionName.trim())) {
      toast.error('이미 존재하는 컬렉션 이름입니다.');
      return;
    }
    
    setIsCreatingCollection(true);
    
    try {
      const newCollection = await savePostService.createCollection({
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim() || undefined,
        isPrivate: isPrivate
      });
      
      toast.success(`'${newCollection.name}' 컬렉션이 생성되었습니다.`);
      
      // 상태 초기화
      setNewCollectionName('');
      setNewCollectionDescription('');
      setIsPrivate(false);
      setShowNewCollection(false);
      
      // 컬렉션 목록 새로고침
      loadCollections();
    } catch (error: any) {
      console.error('컬렉션 생성 실패:', error);
      
      if (error.response?.status === 409 || error.message?.includes('중복')) {
        toast.error('이미 존재하는 컬렉션 이름입니다.');
      } else {
        toast.error('컬렉션 생성에 실패했습니다.');
      }
    } finally {
      setIsCreatingCollection(false);
    }
  };
  
  // 컬렉션 생성 다이얼로그 닫기
  const handleCloseNewCollectionDialog = () => {
    setShowNewCollection(false);
    setNewCollectionName('');
    setNewCollectionDescription('');
    setIsPrivate(false);
  };
  
  return (
    <>
    <div className="container mx-auto px-4 py-6 mb-16 md:mb-0">
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
              key={collection.id} 
              value={collection.name}
              className="flex items-center relative group"
            >
              <Folder className="h-4 w-4 mr-1" />
              {collection.name}
              {collection.isPrivate && (
                <span className="ml-1 text-xs opacity-60">🔒</span>
              )}
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
            <div className="text-center py-8 text-muted-foreground border-t border-border mt-6">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-16 h-0.5 bg-muted rounded"></div>
                <p className="text-sm font-medium">마지막 게시물입니다</p>
                <p className="text-xs">모든 저장된 게시물을 확인하셨습니다.</p>
              </div>
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
      <Dialog open={showNewCollection} onOpenChange={handleCloseNewCollectionDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>새 컬렉션 만들기</DialogTitle>
            <DialogDescription>
              새로운 컬렉션을 만들어 게시물을 체계적으로 정리해보세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">컬렉션 이름 *</label>
              <Input
                placeholder="컬렉션 이름"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                maxLength={50}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">설명 (선택사항)</label>
              <Textarea
                placeholder="이 컬렉션에 대한 간단한 설명을 작성해주세요."
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                maxLength={200}
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrivate"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isPrivate" className="text-sm font-medium cursor-pointer">
                비공개 컬렉션 🔒
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCloseNewCollectionDialog}
              disabled={isCreatingCollection}
            >
              취소
            </Button>
            <Button 
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim() || isCreatingCollection}
            >
              {isCreatingCollection ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  생성 중...
                </>
              ) : (
                '생성'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    <SnsBottomNavigation />
    </>
  );
};

export default SNSSavedPage;
