import React, { useState, useEffect } from 'react';
import { Bookmark, X, Plus, Folder } from 'lucide-react';
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
import { savePostService } from '@/api/sns/savePostService';

interface SaveButtonProps {
  postId: string;
  onChange?: (saved: boolean) => void;
}

const SaveButton: React.FC<SaveButtonProps> = ({ postId, onChange }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [collections, setCollections] = useState<{ name: string, postCount: number }[]>([]);
  const [newCollection, setNewCollection] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 초기 저장 상태 확인
  useEffect(() => {
    const checkSavedStatus = async () => {
      try {
        const status = await savePostService.isPostSaved(postId);
        setIsSaved(status);
      } catch (error) {
        console.error('저장 상태 확인 오류:', error);
      }
    };
    
    checkSavedStatus();
  }, [postId]);
  
  // 컬렉션 목록 가져오기
  useEffect(() => {
    if (showCollections) {
      const fetchCollections = async () => {
        setIsLoading(true);
        try {
          const collectionList = await savePostService.getCollections();
          setCollections(collectionList);
        } catch (error) {
          console.error('컬렉션 로드 오류:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchCollections();
    }
  }, [showCollections]);
  
  // 저장/취소 토글
  const handleToggleSave = async () => {
    if (isSaved) {
      // 바로 저장 취소
      try {
        await savePostService.toggleSavePost(postId);
        setIsSaved(false);
        if (onChange) onChange(false);
      } catch (error) {
        console.error('저장 취소 오류:', error);
      }
    } else {
      // 컬렉션 선택 모달 표시
      setShowCollections(true);
    }
  };
  
  // 컬렉션에 저장
  const handleSaveToCollection = async (collectionName: string | null) => {
    setIsLoading(true);
    try {
      await savePostService.toggleSavePost(postId, collectionName);
      setIsSaved(true);
      setShowCollections(false);
      if (onChange) onChange(true);
    } catch (error) {
      console.error('컬렉션에 저장 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 새 컬렉션 생성
  const handleCreateCollection = async () => {
    if (newCollection.trim()) {
      setIsLoading(true);
      try {
        await savePostService.toggleSavePost(postId, newCollection.trim());
        setIsSaved(true);
        setShowCollections(false);
        setNewCollection('');
        if (onChange) onChange(true);
      } catch (error) {
        console.error('새 컬렉션 저장 오류:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-9 w-9"
        onClick={handleToggleSave}
        aria-label={isSaved ? '저장 취소' : '저장'}
      >
        <Bookmark 
          className={`h-6 w-6 ${isSaved ? 'fill-foreground' : ''}`}
        />
      </Button>
      
      <Dialog open={showCollections} onOpenChange={setShowCollections}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>컬렉션에 저장</DialogTitle>
            <DialogDescription>
              게시물을 저장할 컬렉션을 선택하거나 새 컬렉션을 만드세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[240px] overflow-y-auto my-2 space-y-2">
            <Button 
              variant="outline"
              className="w-full justify-start text-left"
              onClick={() => handleSaveToCollection(null)}
              disabled={isLoading}
            >
              <Bookmark className="h-4 w-4 mr-2" />
              <span>모든 게시물</span>
            </Button>
            
            {collections.map((collection) => (
              <Button
                key={collection.name}
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => handleSaveToCollection(collection.name)}
                disabled={isLoading}
              >
                <Folder className="h-4 w-4 mr-2" />
                <span>{collection.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {collection.postCount}개
                </span>
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <Input
              placeholder="새 컬렉션 이름"
              value={newCollection}
              onChange={(e) => setNewCollection(e.target.value)}
              disabled={isLoading}
            />
            <Button 
              onClick={handleCreateCollection}
              disabled={isLoading || !newCollection.trim()}
            >
              <Plus className="h-4 w-4 mr-1" />
              생성
            </Button>
          </div>
          
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowCollections(false)}
              disabled={isLoading}
            >
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SaveButton;
