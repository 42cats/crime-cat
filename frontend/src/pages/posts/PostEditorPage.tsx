import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Image,
    Loader2,
    PlusCircle,
    Save,
    X,
} from "lucide-react";
import { userPostService } from '@/api/posts';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/useToast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** 최대 업로드 개수 및 글자 수 */
const MAX_IMAGES = 5;
const MAX_CONTENT_LENGTH = 500;

/**
 * 인스타그램 게시글 작성 페이지 느낌으로 재구성된 PostEditorPage
 */
const PostEditorPage: React.FC = () => {
    const { postId } = useParams<{ postId: string }>();
    const isEditMode = Boolean(postId);

    /** 본문, 이미지, 미리보기 */
    const [content, setContent] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

    /** 상태 플래그 */
    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /** UI 제어 */
    const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    /* -------------------------------------------------------------------------- */
    /*                               데이터 로딩                                 */
    /* -------------------------------------------------------------------------- */

    useEffect(() => {
        if (isEditMode && postId) {
            (async () => {
                try {
                    const data = await userPostService.getUserPostDetail(
                        postId
                    );
                    setContent(data.content);
                    setExistingImageUrls(data.imageUrls ?? []);
                } catch (e) {
                    console.error("포스트 로드 실패", e);
                    setError("포스트를 불러오는데 실패했습니다.");
                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [isEditMode, postId]);

    /* -------------------------------------------------------------------------- */
    /*                         이미지 프리뷰 URL 생성 & 해제                        */
    /* -------------------------------------------------------------------------- */

    useEffect(() => {
        const previews = [
            ...existingImageUrls,
            ...images.map((img) => URL.createObjectURL(img)),
        ];
        setImagePreviews(previews);
        return () => {
            images.forEach((img) =>
                URL.revokeObjectURL(URL.createObjectURL(img))
            );
        };
    }, [images, existingImageUrls]);

    /* -------------------------------------------------------------------------- */
    /*                              이미지 핸들러                                 */
    /* -------------------------------------------------------------------------- */

    const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const newImages = Array.from(e.target.files);

        // 전체 개수 제한 검사
        if (
            existingImageUrls.length + images.length + newImages.length >
            MAX_IMAGES
        ) {
            toast({
                title: "이미지 제한",
                description: `최대 ${MAX_IMAGES}장까지 업로드할 수 있습니다.`,
                variant: "destructive",
            });
            return;
        }

        // 이미지 타입 검사
        const valid = newImages.filter((file) =>
            file.type.startsWith("image/")
        );
        if (valid.length !== newImages.length) {
            toast({
                title: "이미지 형식 오류",
                description: "이미지 파일만 업로드 가능합니다.",
                variant: "destructive",
            });
        }

        setImages((prev) => [...prev, ...valid]);
        e.target.value = ""; // input 초기화
    };

    const handleRemoveImage = (idx: number) => {
        const existCnt = existingImageUrls.length;
        if (idx < existCnt)
            setExistingImageUrls((prev) => prev.filter((_, i) => i !== idx));
        else setImages((prev) => prev.filter((_, i) => i !== idx - existCnt));

        // 인덱스 보정
        setCurrentPreviewIndex((prev) => (prev > 0 ? prev - 1 : 0));
    };

    const movePrev = () =>
        setCurrentPreviewIndex((p) =>
            p === 0 ? imagePreviews.length - 1 : p - 1
        );
    const moveNext = () =>
        setCurrentPreviewIndex((p) =>
            p === imagePreviews.length - 1 ? 0 : p + 1
        );

    /* -------------------------------------------------------------------------- */
    /*                                 저장 로직                                  */
    /* -------------------------------------------------------------------------- */

    const handleSavePost = async () => {
        if (!content.trim()) {
            toast({
                title: "내용 필수",
                description: "게시글 내용을 입력해주세요.",
                variant: "destructive",
            });
            return;
        }
        if (content.length > MAX_CONTENT_LENGTH) {
            toast({
                title: "길이 초과",
                description: `최대 ${MAX_CONTENT_LENGTH}자까지 작성 가능합니다.`,
                variant: "destructive",
            });
            return;
        }
        setSaving(true);
        try {
            if (isEditMode && postId) {
                await userPostService.updatePost(
                    postId,
                    content,
                    images,
                    existingImageUrls
                );
                toast({
                    title: "수정 완료",
                    description: "게시글이 수정되었습니다.",
                });
            } else {
                await userPostService.createPost(content, images);
                toast({
                    title: "업로드 완료",
                    description: "새 게시글이 업로드되었습니다.",
                });
            }
            navigate("/dashboard/posts");
        } catch (e) {
            console.error("저장 실패", e);
            toast({
                title: "저장 실패",
                description: "잠시 후 다시 시도해주세요.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => navigate("/dashboard/posts");

    /* -------------------------------------------------------------------------- */
    /*                                   UI                                       */
    /* -------------------------------------------------------------------------- */

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-4">
                <Image className="h-20 w-20 text-gray-300 mx-auto" />
                <p className="text-xl font-semibold">{error}</p>
                <Button onClick={() => navigate("/dashboard/posts")}>
                    목록으로 이동
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* 헤더: 인스타그램 스타일 단색 상단바 */}
            <header className="flex items-center justify-between px-4 h-14 border-b">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDiscardDialogOpen(true)}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="font-semibold">
                    {isEditMode ? "게시글 수정" : "새 게시글"}
                </h1>
                <Button
                    size="sm"
                    disabled={saving || !content.trim()}
                    onClick={handleSavePost}
                >
                    {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                </Button>
            </header>

            <main className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
                {/* 단계 2: 캡션 작성 */}
                {
                    <div className="w-full grid md:grid-cols-2 gap-4">
                        {/* 이미지 영역 */}
                        <Card className="overflow-hidden">
                            <div className="relative bg-black">
                                {imagePreviews.length > 0 ? (
                                    <img
                                        src={imagePreviews[currentPreviewIndex]}
                                        alt="preview"
                                        className="object-contain w-full aspect-square"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center aspect-square bg-gray-50">
                                        <Image className="h-12 w-12 text-gray-300" />
                                    </div>
                                )}

                                {/* 네비게이션 */}
                                {imagePreviews.length > 1 && (
                                    <>
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="absolute top-1/2 -translate-y-1/2 left-2 bg-white/70 hover:bg-white"
                                            onClick={movePrev}
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="absolute top-1/2 -translate-y-1/2 right-2 bg-white/70 hover:bg-white"
                                            onClick={moveNext}
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </Button>
                                    </>
                                )}

                                {/* 삭제 버튼 */}
                                {imagePreviews.length > 0 && (
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        className="absolute top-2 right-2"
                                        onClick={() =>
                                            handleRemoveImage(
                                                currentPreviewIndex
                                            )
                                        }
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            {/* 하단 이미지 개수 / 추가 */}
                            <CardContent className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-500">
                                    {existingImageUrls.length + images.length}/
                                    {MAX_IMAGES}
                                </span>
                                {existingImageUrls.length + images.length <
                                    MAX_IMAGES && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            document
                                                .getElementById("image-upload")
                                                ?.click()
                                        }
                                    >
                                        <PlusCircle className="h-4 w-4 mr-1" />{" "}
                                        추가
                                    </Button>
                                )}
                                <input
                                    id="image-upload"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageAdd}
                                />
                            </CardContent>
                        </Card>

                        {/* 캡션 입력 */}
                        <Card>
                            <CardContent className="pt-4 pb-6 flex flex-col h-full">
                                <Textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="문구를 입력하세요..."
                                    className="flex-1 resize-none min-h-[200px] focus:ring-0 border-none"
                                />
                                <Separator className="my-2" />
                                <div className="text-right text-sm text-gray-500">
                                    {content.length}/{MAX_CONTENT_LENGTH}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                }
            </main>

            {/* 작성 취소 다이얼로그 */}
            <AlertDialog
                open={discardDialogOpen}
                onOpenChange={setDiscardDialogOpen}
            >
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>작성 취소</AlertDialogTitle>
                        <AlertDialogDescription>
                            작성 중인 내용을 취소하시겠습니까? 이 작업은 되돌릴
                            수 없습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>계속 작성</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500"
                            onClick={handleDiscard}
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
