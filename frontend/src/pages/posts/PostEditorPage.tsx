import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userPostService, UserPostDto } from '@/api/userPost/userPostService';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Save, Trash2, Image, Loader2, X, PlusCircle, 
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/useToast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MAX_IMAGES = 5; // 최대 이미지 수
const MAX_CONTENT_LENGTH = 500; // 최대 글자수

const PostEditorPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const isEditMode = Boolean(postId);
  
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 편집 모드인 경우 포스트 정보 로드
  useEffect(() => {
    if (isEditMode && postId) {
      const loadPost = async () => {
        setLoading(true);
        try {
          const data = await userPostService.getUserPostDetail(postId);
          setContent(data.content);
          if (data.imageUrls && data.imageUrls.length > 0) {
            setExistingImageUrls(data.imageUrls);
          }
        } catch (error) {
          console.error('포스트 로드 실패:', error);
          setError('포스트를 불러오는데 실패했습니다.');
        } finally {
          setLoading(false);
        }
      };
      
      loadPost();
    }
  }, [postId, isEditMode]);
  
  // 이미지 미리보기 생성
  useEffect(() => {
    // 이미 URL인 기존 이미지와 파일에서 생성한 미리보기 URL을 합침
    const previews = [
      ...existingImageUrls,
      ...images.map(image => URL.createObjectURL(image))
    ];
    setImagePreviews(previews);
    
    // 컴포넌트 언마운트 시 URL 객체 해제
    return () => {
      images.forEach(image => {
        const previewUrl = URL.createObjectURL(image);
        URL.revokeObjectURL(previewUrl);
      });
    };
  }, [images, existingImageUrls]);
  
  // 이미지 추가 핸들러
  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    
    const totalImages = images.length + existingImageUrls.length;
    if (totalImages >= MAX_IMAGES) {
      toast({
        title: '이미지 제한',
        description: `최대 ${MAX_IMAGES}개의 이미지만 추가할 수 있습니다.`,
        variant: 'destructive',
      });
      return;
    }
    
    const newImages = Array.from(e.target.files);
    setImages(prev => [...prev, ...newImages]);
    e.target.value = ''; // 입력 필드 초기화
  };
  
  // 이미지 삭제 핸들러
  const handleRemoveImage = (index: number) => {
    const existingImagesCount = existingImageUrls.length;
    
    if (index < existingImagesCount) {
      // 기존 이미지 삭제
      setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
    } else {
      // 새로 추가한 이미지 삭제
      const adjustedIndex = index - existingImagesCount;
      setImages(prev => prev.filter((_, i) => i !== adjustedIndex));
    }
    
    // 현재 보고 있는 이미지 인덱스 조정
    if (currentPreviewIndex >= imagePreviews.length - 1) {
      setCurrentPreviewIndex(Math.max(0, imagePreviews.length - 2));
    }
  };
  
  // 이미지 이전/다음 핸들러
  const handlePrevImage = () => {
    if (imagePreviews.length <= 1) return;
    setCurrentPreviewIndex(prev => 
      prev === 0 ? imagePreviews.length - 1 : prev - 1
    );
  };
  
  const handleNextImage = () => {
    if (imagePreviews.length <= 1) return;
    setCurrentPreviewIndex(prev => 
      prev === imagePreviews.length - 1 ? 0 : prev + 1
    );
  };
  
  // 포스트 저장 핸들러
  const handleSavePost = async () => {
    if (!content.trim()) {
      toast({
        title: '내용 필수',
        description: '포스트 내용을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    
    if (content.length > MAX_CONTENT_LENGTH) {
      toast({
        title: '내용 길이 초과',
        description: `내용은 최대 ${MAX_CONTENT_LENGTH}자까지 입력할 수 있습니다.`,
        variant: 'destructive',
      });
      return;
    }
    
    setSaving(true);
    try {
      if (isEditMode && postId) {
        // 편집 모드
        await userPostService.updatePost(
          postId,
          content,
          images,
          existingImageUrls
        );
        toast({
          title: '포스트 수정 완료',
          description: '포스트가 성공적으로 수정되었습니다.',
        });
      } else {
        // 새 포스트 작성 모드
        await userPostService.createPost(content, images);
        toast({
          title: '포스트 작성 완료',
          description: '새 포스트가 성공적으로 작성되었습니다.',
        });
      }
      navigate('/dashboard/posts');
    } catch (error) {
      console.error('포스트 저장 실패:', error);
      toast({
        title: '저장 실패',
        description: '포스트 저장 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  // 작성 취소
  const handleDiscard = () => {
    navigate('/dashboard/posts');
  };
  
  // 로딩 중 표시
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">포스트를 불러오는 중...</p>
      </div>
    );
  }
  
  // 에러 표시
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-center max-w-md">
          <Image className="h-16 w-16 text-muted-foreground opacity-30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">포스트를 찾을 수 없습니다</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/dashboard/posts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            포스트 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setDiscardDialogOpen(true)}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로가기
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditMode ? '포스트 수정' : '새 포스트 작성'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleSavePost}
            disabled={saving || !content.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                저장
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Separator />
      
      {/* 에디터 */}
      <Tabs 
        value={previewTab} 
        onValueChange={(v) => setPreviewTab(v as 'edit' | 'preview')}
        className="max-w-4xl mx-auto"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="edit">편집</TabsTrigger>
          <TabsTrigger value="preview">미리보기</TabsTrigger>
        </TabsList>
        
        {/* 편집 탭 */}
        <TabsContent value="edit" className="space-y-4">
          {/* 이미지 업로드 섹션 */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">이미지</h3>
                <div className="text-sm text-muted-foreground">
                  {existingImageUrls.length + images.length}/{MAX_IMAGES}
                </div>
              </div>
              
              {imagePreviews.length > 0 ? (
                <div className="relative">
                  <div className="aspect-video md:aspect-[16/9] bg-muted overflow-hidden rounded-md mb-2">
                    <img 
                      src={imagePreviews[currentPreviewIndex]} 
                      alt={`이미지 ${currentPreviewIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 h-8 w-8 rounded-full"
                      onClick={() => handleRemoveImage(currentPreviewIndex)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* 이미지 네비게이션 */}
                  {imagePreviews.length > 1 && (
                    <div className="flex items-center justify-center space-x-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handlePrevImage}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="text-sm">
                        {currentPreviewIndex + 1} / {imagePreviews.length}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleNextImage}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 bg-muted/30 rounded-md border border-dashed mb-2">
                  <Image className="h-12 w-12 text-muted-foreground opacity-30 mb-2" />
                  <p className="text-muted-foreground text-sm">
                    이미지를 추가해주세요
                  </p>
                </div>
              )}
              
              <div className="mt-4">
                <label htmlFor="image-upload">
                  <Button 
                    variant="outline" 
                    type="button" 
                    className="w-full"
                    disabled={existingImageUrls.length + images.length >= MAX_IMAGES}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    이미지 추가하기
                  </Button>
                  <input 
                    id="image-upload" 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={handleImageAdd} 
                    disabled={existingImageUrls.length + images.length >= MAX_IMAGES}
                  />
                </label>
              </div>
            </CardContent>
          </Card>
          
          {/* 내용 작성 */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">내용</h3>
                <div className={`text-sm ${content.length > MAX_CONTENT_LENGTH ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {content.length}/{MAX_CONTENT_LENGTH}
                </div>
              </div>
              
              <Textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="포스트 내용을 작성해주세요..."
                className="min-h-[200px] resize-none"
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 미리보기 탭 */}
        <TabsContent value="preview">
          <Card className="overflow-hidden">
            {/* 이미지 미리보기 */}
            {imagePreviews.length > 0 ? (
              <div className="relative">
                <div className="aspect-video md:aspect-[16/9] bg-muted overflow-hidden">
                  <img 
                    src={imagePreviews[currentPreviewIndex]} 
                    alt={`이미지 ${currentPreviewIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* 이미지 네비게이션 */}
                {imagePreviews.length > 1 && (
                  <>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full opacity-70 hover:opacity-100"
                      onClick={handlePrevImage}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full opacity-70 hover:opacity-100"
                      onClick={handleNextImage}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                    
                    {/* 이미지 인디케이터 */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                      {imagePreviews.map((_, index) => (
                        <div 
                          key={index} 
                          className={`w-2 h-2 rounded-full ${
                            index === currentPreviewIndex ? 'bg-primary' : 'bg-primary/30'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center bg-muted">
                <Image className="h-20 w-20 text-muted-foreground opacity-20" />
              </div>
            )}
            
            {/* 내용 미리보기 */}
            <CardContent className="p-6">
              <div className="whitespace-pre-line">
                {content || '내용이 없습니다.'}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* 취소 확인 다이얼로그 */}
      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>작성 취소</AlertDialogTitle>
            <AlertDialogDescription>
              작성 중인 내용이 있습니다. 정말 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>계속 작성</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDiscard}
              className="bg-red-500 hover:bg-red-600"
            >
              취소하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PostEditorPage;