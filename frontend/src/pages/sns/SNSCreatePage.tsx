import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/auth";
import { Loader2, Image, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TagInputField from "@/components/sns/input/TagInputField";
import ContentTextArea from "@/components/sns/input/ContentTextArea";
import LocationPicker from "@/components/sns/location/LocationPicker";
import { Location } from '@/api/posts';
import { userPostService } from "@/api/posts";
import PrivacySettingsComponent, {
    PrivacySettings,
} from "@/components/sns/privacy/PrivacySettings";
import { toast } from "sonner";
import SnsBottomNavigation from "@/components/sns/SnsBottomNavigation";
import { compressImageOnly, isValidImageFile } from "@/utils/imageCompression";

const SNSCreatePageContent: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [content, setContent] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [location, setLocation] = useState<Location | null>(null);
    const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
        isPrivate: false,
        isFollowersOnly: false,
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 이미지 선택 처리
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();

        const files = Array.from(e.target.files || []);

        // 최대 5개 이미지만 허용
        if (images.length + files.length > 5) {
            toast.warning("최대 5개의 이미지만 업로드할 수 있습니다.");
            return;
        }

        // 이미지 파일만 허용 (유효성 검사)
        const validFiles = files.filter((file) =>
            file.type.startsWith("image/")
        );

        if (validFiles.length !== files.length) {
            toast.warning("이미지 파일만 업로드할 수 있습니다.");
        }

        if (validFiles.length === 0) return;

        try {
            setIsCompressing(true);
            
            // 각 이미지 압축 처리
            const compressedResults = await Promise.all(
                validFiles.map(async (file) => {
                    // 이미지 파일 확인
                    const isValid = await isValidImageFile(file);
                    if (!isValid) return null;

                    // 이미지 압축
                    try {
                        return await compressImageOnly(file, {
                            maxSizeMB: 1, // 최대 1MB
                            quality: 0.7 // 70% 품질
                        });
                    } catch (err) {
                        console.error(`이미지 압축 실패: ${file.name}`, err);
                        return null;
                    }
                })
            );

            // null 값 필터링 및 압축된 파일 추출
            const compressedFiles = compressedResults
                .filter(result => result !== null)
                .map(result => result!.file);

            if (compressedFiles.length === 0) {
                toast.error("이미지 처리 중 오류가 발생했습니다.");
                return;
            }

            // 미리보기 URL 생성
            const newPreviewUrls = compressedFiles.map((file) =>
                URL.createObjectURL(file)
            );

            // 상태 업데이트
            setImages((prevImages) => [...prevImages, ...compressedFiles]);
            setImagePreviewUrls((prevUrls) => [...prevUrls, ...newPreviewUrls]);
        } catch (error) {
            console.error("이미지 압축 중 오류:", error);
            toast.error("이미지 처리 중 오류가 발생했습니다.");
        } finally {
            setIsCompressing(false);
            
            // 파일 입력 초기화 (동일 파일 재선택 가능하게)
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    // 이미지 삭제
    const handleRemoveImage = (index: number) => {
        // URL 객체 해제 (메모리 누수 방지)
        URL.revokeObjectURL(imagePreviewUrls[index]);

        // 배열에서 해당 항목 제거
        setImages((prevImages) => prevImages.filter((_, i) => i !== index));
        setImagePreviewUrls((prevUrls) =>
            prevUrls.filter((_, i) => i !== index)
        );
    };

    // 이미지 추가 버튼 클릭
    const handleAddImageClick = () => {
        fileInputRef.current?.click();
    };

    // 폼 제출 처리
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim() && images.length === 0) {
            toast.warning("내용을 입력하거나 이미지를 추가해주세요.");
            return;
        }

        setIsLoading(true);

        try {
            // 태그와 콘텐츠를 분리하여 전송
            await userPostService.createPost(
                content, // 콘텐츠만 전송 (태그 제외)
                tags, // 태그는 별도 전송
                privacySettings.isPrivate,
                privacySettings.isFollowersOnly,
                images,
                location
            );
            toast.success("게시물이 작성되었습니다.");
            navigate("/sns/feed");
        } catch (error) {
            console.error("게시물 작성 오류:", error);
            toast.error("게시물 작성에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="container mx-auto px-4 py-6 max-w-lg mb-16 md:mb-0">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">새 게시물 작성</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 이미지 업로드 영역 */}
                    <div className="border border-dashed border-border rounded-md p-4">
                        {imagePreviewUrls.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {imagePreviewUrls.map((url, index) => (
                                    <div
                                        key={index}
                                        className="relative aspect-square"
                                    >
                                        <img
                                            src={url}
                                            alt={`미리보기 ${index + 1}`}
                                            className="w-full h-full object-cover rounded-md"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 rounded-full"
                                            onClick={() =>
                                                handleRemoveImage(index)
                                            }
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}

                                {/* 이미지 추가 버튼 (5개 미만일 때만 표시) */}
                                {images.length < 5 && (
                                    <button
                                        type="button"
                                        className="aspect-square border border-dashed border-border rounded-md flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                                        onClick={handleAddImageClick}
                                        disabled={isCompressing}
                                    >
                                        {isCompressing ? (
                                            <>
                                                <Loader2 className="h-8 w-8 mb-2 animate-spin" />
                                                <span className="text-sm">압축 중...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-8 w-8 mb-2" />
                                                <span className="text-sm">추가</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="w-full py-12 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                                onClick={handleAddImageClick}
                                disabled={isCompressing}
                            >
                                {isCompressing ? (
                                    <>
                                        <Loader2 className="h-12 w-12 mb-2 animate-spin" />
                                        <span className="font-medium">이미지 압축 중...</span>
                                        <span className="text-sm mt-1">잠시만 기다려주세요</span>
                                    </>
                                ) : (
                                    <>
                                        <Image className="h-12 w-12 mb-2" />
                                        <span className="font-medium">이미지 추가</span>
                                        <span className="text-sm mt-1">
                                            최대 5개까지 업로드 가능
                                        </span>
                                    </>
                                )}
                            </button>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </div>

                    {/* 태그 입력 */}
                    <TagInputField
                        tags={tags}
                        onTagsChange={setTags}
                        placeholder="태그를 입력하세요... (예: 일상, 맛집, 여행)"
                        maxTags={10}
                    />

                    {/* 내용 입력 */}
                    <ContentTextArea
                        value={content}
                        onChange={setContent}
                        placeholder="무슨 일이 일어나고 있나요?"
                        maxLength={500}
                    />

                    {/* 위치 선택 */}
                    {/* <div className="space-y-2">
          <label className="text-sm font-medium">위치 정보 (선택)</label>
          <LocationPicker
            value={location}
            onChange={setLocation}
          />
        </div> */}

                    {/* 공개 설정 */}
                    <PrivacySettingsComponent
                        value={privacySettings}
                        onChange={setPrivacySettings}
                    />

                    {/* 제출 버튼 */}
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            className="mr-2"
                            onClick={() => navigate(-1)}
                            disabled={isLoading}
                        >
                            취소
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                isLoading || isCompressing ||
                                (!content.trim() && images.length === 0)
                            }
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    게시 중...
                                </>
                            ) : (
                                "게시하기"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
            <SnsBottomNavigation />
        </>
    );
};

const SNSCreatePage: React.FC = () => {
    return (
        <AuthGuard>
            <SNSCreatePageContent />
        </AuthGuard>
    );
};

export default SNSCreatePage;
