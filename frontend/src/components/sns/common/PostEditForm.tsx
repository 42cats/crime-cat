import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Upload, MapPin, Loader2 } from "lucide-react";
import { UserPostDto, Location } from "@/api/posts/postService";
import { parsePostContent } from "@/utils/postUtils";
import HashtagBadges from "@/components/sns/common/HashtagBadges";
import HashtagEditor from "@/components/sns/common/HashtagEditor";
import { useToast } from "@/hooks/useToast";

interface PostEditFormProps {
    initialPost: UserPostDto;
    onSave: (data: PostEditData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export interface PostEditData {
    content: string;
    hashtags: string[];
    newImages: File[];
    keepImageUrls: string[];
    location?: Location | null;
    isPrivate: boolean;
    isFollowersOnly: boolean;
}

interface ImageItem {
    id: string;
    url: string;
    file?: File;
    isNew: boolean;
}

const PostEditForm: React.FC<PostEditFormProps> = ({
    initialPost,
    onSave,
    onCancel,
    isLoading = false,
}) => {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 폼 상태
    const [content, setContent] = useState(initialPost.content);
    const [manualHashtags, setManualHashtags] = useState<string[]>(
        initialPost.hashtags || []
    );
    const [isPrivate, setIsPrivate] = useState(initialPost.private);
    const [isFollowersOnly, setIsFollowersOnly] = useState(
        initialPost.followersOnly
    );
    const [location, setLocation] = useState<Location | null>(
        initialPost.locationName
            ? {
                  id: initialPost.locationId || "",
                  name: initialPost.locationName,
                  latitude: initialPost.latitude || 0,
                  longitude: initialPost.longitude || 0,
              }
            : null
    );

    // 이미지 상태
    const [images, setImages] = useState<ImageItem[]>(
        initialPost.imageUrls.map((url, index) => ({
            id: `existing-${index}`,
            url,
            isNew: false,
        }))
    );

    // 해시태그 미리보기 (내용에서 자동 추출 + 수동 추가)
    const { hashtags: autoHashtags } = parsePostContent(content);
    const allHashtags = [...new Set([...autoHashtags, ...manualHashtags])];

    // Switch 컴포너트 상태 변경 오류 예방 (flushSync 문제 해결)
    const handlePrivateChange = useCallback((checked: boolean) => {
        // 비동기로 상태 변경
        setTimeout(() => {
            setIsPrivate(checked);
        }, 0);
    }, []);

    const handleFollowersOnlyChange = useCallback((checked: boolean) => {
        // 비동기로 상태 변경
        setTimeout(() => {
            setIsFollowersOnly(checked);
        }, 0);
    }, []);

    // 이미지 추가
    const handleImageAdd = (files: FileList | null) => {
        if (!files) return;

        const newImages: ImageItem[] = [];
        Array.from(files).forEach((file, index) => {
            if (file.type.startsWith("image/")) {
                const id = `new-${Date.now()}-${index}`;
                newImages.push({
                    id,
                    url: URL.createObjectURL(file),
                    file,
                    isNew: true,
                });
            }
        });

        if (newImages.length > 0) {
            setImages((prev) => [...prev, ...newImages]);
        }

        // 파일 input 초기화
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // 이미지 제거
    const handleImageRemove = (id: string) => {
        setImages((prev) => {
            const filtered = prev.filter((img) => img.id !== id);
            // 새 이미지의 URL 정리
            const removedImage = prev.find((img) => img.id === id);
            if (removedImage?.isNew && removedImage.url.startsWith("blob:")) {
                URL.revokeObjectURL(removedImage.url);
            }
            return filtered;
        });
    };

    // 위치 제거
    const handleLocationRemove = () => {
        setLocation(null);
    };

    // 폼 제출
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) {
            toast({
                title: "내용을 입력해주세요",
                description: "포스트 내용은 필수입니다.",
                variant: "destructive",
            });
            return;
        }

        // 데이터 준비
        const newImages = images
            .filter((img) => img.isNew && img.file)
            .map((img) => img.file!);

        const keepImageUrls = images
            .filter((img) => !img.isNew)
            .map((img) => img.url);

        const editData: PostEditData = {
            content: content.trim(),
            hashtags: allHashtags,
            newImages,
            keepImageUrls,
            location,
            isPrivate,
            isFollowersOnly,
        };

        try {
            await onSave(editData);
        } catch (error) {
            console.error("포스트 수정 중 오류:", error);
        }
    };

    // 컴포넌트 언마운트시 blob URL 정리
    React.useEffect(() => {
        return () => {
            images.forEach((img) => {
                if (img.isNew && img.url.startsWith("blob:")) {
                    URL.revokeObjectURL(img.url);
                }
            });
        };
    }, []);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* 내용 입력 */}
            <div className="space-y-2">
                <Label htmlFor="content">내용</Label>
                <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="무슨 일이 일어나고 있나요?"
                    className="min-h-[120px] resize-none"
                    disabled={isLoading}
                />
                <div className="text-xs text-muted-foreground">
                    {content.length}/2000자
                </div>
            </div>

            {/* 해시태그 미리보기 */}
            {allHashtags.length > 0 && (
                <div className="space-y-2">
                    <Label>모든 해시태그 미리보기</Label>
                    <HashtagBadges
                        hashtags={allHashtags}
                        maxDisplay={15}
                        size="sm"
                        variant="light"
                    />
                </div>
            )}

            {/* 해시태그 편집기 */}
            <HashtagEditor
                hashtags={manualHashtags}
                onChange={setManualHashtags}
                maxTags={20}
                disabled={isLoading}
            />

            {/* 이미지 관리 */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>이미지 ({images.length}/10)</Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading || images.length >= 10}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        이미지 추가
                    </Button>
                </div>

                {/* 이미지 그리드 - 작은 크기로 수정 */}
                {images.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {images.map((image) => (
                            <div key={image.id} className="relative group">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                        src={image.url}
                                        alt="업로드된 이미지"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleImageRemove(image.id)}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    disabled={isLoading}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                                {image.isNew && (
                                    <div className="absolute bottom-0 left-0 px-1 py-0.5 bg-blue-500 text-white text-xs rounded-tr-md">
                                        새로운
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageAdd(e.target.files)}
                />
            </div>

            {/* 위치 정보 */}
            {location && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{location.name}</span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleLocationRemove}
                                disabled={isLoading}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Separator />

            {/* 프라이버시 설정 */}
            <div className="space-y-4">
                <Label>프라이버시 설정</Label>

                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="text-sm font-medium">비공개 포스트</div>
                        <div className="text-xs text-muted-foreground">
                            나만 볼 수 있습니다
                        </div>
                    </div>
                    <Switch
                        checked={isPrivate}
                        onCheckedChange={handlePrivateChange}
                        disabled={isLoading}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="text-sm font-medium">팔로워 전용</div>
                        <div className="text-xs text-muted-foreground">
                            팔로워만 볼 수 있습니다
                        </div>
                    </div>
                    <Switch
                        checked={isFollowersOnly}
                        onCheckedChange={handleFollowersOnlyChange}
                        disabled={isLoading || isPrivate} // 비공개일 때는 비활성화
                    />
                </div>
            </div>

            <Separator />

            {/* 액션 버튼 */}
            <div className="flex justify-end space-x-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    취소
                </Button>
                <Button type="submit" disabled={isLoading || !content.trim()}>
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            저장 중...
                        </>
                    ) : (
                        "저장"
                    )}
                </Button>
            </div>
        </form>
    );
};

export default PostEditForm;
