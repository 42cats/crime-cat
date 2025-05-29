import React, { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MarkdownEditor } from "@/components/markdown";
import { useToast } from "@/hooks/useToast";
import PageTransition from "@/components/PageTransition";
import { useLocation } from "react-router-dom";
import { Star, X, Loader2, MapPin } from "lucide-react";
import CrimeSceneFields from "@/components/themes/type/CrimeSceneFields";
import EscapeRoomFields from "@/components/themes/type/EscapeRoomFields";
import MurderMysteryFields from "@/components/themes/type/MurderMysteryFields";
import RealWorldFields from "@/components/themes/type/RealWorldFields";
import TeamSelectModal from "@/components/themes/modals/TeamSelectModal";
import GuildSelectModal from "@/components/themes/modals/GuildSelectModal";
import { useFormValidator } from "@/hooks/useFormValidator";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import {
    compressImage,
    isValidImageFile,
    formatFileSize,
    ResizeMode,
} from "@/utils/imageCompression";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ThemeFormProps {
    mode: "create" | "edit";
    title: string;
    initialData?: Partial<any>;
    onSubmit: (data: FormData) => void;
    isLoading?: boolean;
    // 이미지 리사이징 관련 옵션
    imageOptions?: {
        width?: number; // 이미지 타겟 너비
        height?: number; // 이미지 타겟 높이
        quality?: number; // 이미지 품질 (0-1)
        backgroundColor?: string; // 배경색 (기본값: 흰색)
    };
}

const initialExtraFieldsMap = {
    CRIMESCENE: {
        makerTeamsId: "",
        makerTeamsName: "",
        guildSnowflake: "",
        guildName: "",
        extra: { characters: [] },
    },
    ESCAPE_ROOM: {
        horrorLevel: 0,
        deviceRatio: 0,
        activityLevel: 0,
        openDate: "",
        isOperating: true,

        locations: [],
        homepageUrl: "",
        reservationUrl: "",
    },
    MURDER_MYSTERY: { extra: {} },
    REALWORLD: { extra: {} },
};

// 별점 표시 및 선택 컴포넌트
const RatingStars: React.FC<{
    rating: number;
    onRatingChange: (value: number) => void;
    hoveredRating: number | null;
    onHover: (value: number | null) => void;
}> = ({ rating, onRatingChange, hoveredRating, onHover }) => {
    const starElements = [];

    const displayValue = hoveredRating !== null ? hoveredRating : rating;

    for (let i = 1; i <= 5; i++) {
        const starFill = Math.min(Math.max(displayValue - (i - 1) * 2, 0), 2); // 0 ~ 2

        starElements.push(
            <div key={i} className="relative w-6 h-6 cursor-pointer group">
                {/* 기본 빈 별 */}
                <Star className="w-6 h-6 text-muted-foreground" />

                {/* 덮어 씌우는 채워진 별 */}
                {starFill > 0 && (
                    <div
                        className="absolute top-0 left-0 h-full overflow-hidden"
                        style={{ width: `${(starFill / 2) * 100}%` }}
                    >
                        <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    </div>
                )}

                {/* 호버 핸들링 (왼쪽, 오른쪽 영역 나눠서 처리) */}
                <div
                    className="absolute top-0 left-0 w-1/2 h-full z-10"
                    onMouseEnter={() => onHover(i * 2 - 1)}
                    onClick={() => onRatingChange(i * 2 - 1)}
                />
                <div
                    className="absolute top-0 right-0 w-1/2 h-full z-10"
                    onMouseEnter={() => onHover(i * 2)}
                    onClick={() => onRatingChange(i * 2)}
                />
            </div>
        );
    }

    return (
        <div className="flex gap-1 w-fit" onMouseLeave={() => onHover(null)}>
            {starElements}
        </div>
    );
};

const ThemeForm: React.FC<ThemeFormProps> = ({
    mode,
    title,
    initialData = {},
    onSubmit,
    isLoading = false,
    imageOptions,
}) => {
    const location = useLocation();
    const state = location.state as { category?: string };
    const initialType = (state?.category?.toUpperCase() ??
        "") as keyof typeof initialExtraFieldsMap;
    const { toast } = useToast();

    // 이미지 리사이징 모드 상태 추가
    const [resizeMode, setResizeMode] = useState<ResizeMode>("fit");

    const [form, setForm] = useState({
        type: initialData.type || initialType || "CRIMESCENE",
        title: initialData.title || "",
        summary: initialData.summary || "",
        tags: initialData.tags || [],
        tagInput: "",
        playerMin: initialData.playersMin || "",
        playerMax: initialData.playersMax || "",
        playtimeMin: initialData.playTimeMin || "",
        playtimeMax: initialData.playTimeMax || "",
        price: initialData.price || "",
        difficulty: initialData.difficulty || 0,
        content: initialData.content || "",
        thumbnail: initialData.thumbnail || "",
        publicStatus: initialData.publicStatus ?? true,
        recommendationEnabled: initialData.recommendationEnabled ?? true,
        commentEnabled: initialData.commentEnabled ?? true,
    });

    const initialExtraFields = React.useMemo(() => {
        console.log("ThemeForm - mode:", mode, "initialData:", initialData);
        if (mode === "edit" && initialData) {
            if (initialData.type === "CRIMESCENE") {
                return {
                    makerMode: initialData.team ? "team" : "personal",
                    makerTeamsId: initialData.team?.id || "",
                    makerTeamsName: initialData.team?.name || "",
                    guildSnowflake: initialData.guild?.snowflake || "",
                    guildName: initialData.guild?.name || "",
                    extra: initialData.extra || { characters: [] },
                };
            } else if (initialData.type === "ESCAPE_ROOM") {
                return {
                    horrorLevel: initialData.horrorLevel || 0,
                    deviceRatio: initialData.deviceRatio || 0,
                    activityLevel: initialData.activityLevel || 0,
                    openDate: initialData.openDate
                        ? initialData.openDate.split("T")[0]
                        : "",
                    isOperating: initialData.isOperating ?? true,

                    locations: initialData.locations || [],
                    homepageUrl: initialData.homepageUrl || "",
                    reservationUrl: initialData.reservationUrl || "",
                };
            }
        }
        return initialExtraFieldsMap[initialType] || {};
    }, [mode, initialData, initialType]);

    const [extraFields, setExtraFields] = useState<any>(initialExtraFields);

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [imageStats, setImageStats] = useState<{
        originalSize: number;
        compressedSize: number;
        compressionRate: number;
    } | null>(null);
    const [hovered, setHovered] = useState<number | null>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [isTeamModalOpen, setTeamModalOpen] = useState(false);
    const [isGuildModalOpen, setGuildModalOpen] = useState(false);

    const didMountRef = useRef(false);

    React.useEffect(() => {
        if (didMountRef.current) {
            // 타입 변경 시에만 초기화 (편집 모드에서 최초 로드 시에는 실행하지 않음)
            if (
                mode === "create" ||
                (mode === "edit" && initialData?.type !== form.type)
            ) {
                setExtraFields(
                    initialExtraFieldsMap[
                        form.type as keyof typeof initialExtraFieldsMap
                    ]
                );
            }

            // 방탈출 테마일 때 강제로 모든 설정을 허용으로 변경
            if (form.type === "ESCAPE_ROOM") {
                setForm((prev) => ({
                    ...prev,
                    publicStatus: true,
                    recommendationEnabled: true,
                    commentEnabled: true,
                }));
            }
        } else {
            didMountRef.current = true;
        }
    }, [form.type, mode, initialData?.type]);

    const { errors, validateField, validateWithErrors } = useFormValidator(
        (data: Record<string, any>) => {
            const newErrors: Record<string, string> = {};
            if (!data.title || data.title.trim() == "")
                newErrors.title = "제목은 필수입니다.";
            if (!data.summary || data.summary.trim() == "")
                newErrors.summary = "설명은 필수입니다.";
            if (!data.tags || data.tags.length === 0)
                newErrors.tags = "태그를 하나 이상 입력해주세요.";
            if (!data.playerMin || Number(data.playerMin) <= 0)
                newErrors.playerMin = "최소 인원은 1명 이상이어야 합니다.";
            if (
                !data.playerMax ||
                Number(data.playerMax) < Number(data.playerMin)
            )
                newErrors.playerMax =
                    "최대 인원은 최소 인원보다 같거나 커야 합니다.";
            // 방탈출이 아닌 경우에만 최소 시간 검증
            if (data.type !== "ESCAPE_ROOM") {
                if (!data.playtimeMin || Number(data.playtimeMin) < 0)
                    newErrors.playtimeMin = "최소 시간은 0분 이상이어야 합니다.";
                if (
                    !data.playtimeMax ||
                    Number(data.playtimeMax) < Number(data.playtimeMin)
                )
                    newErrors.playtimeMax =
                        "최대 시간은 최소 시간보다 같거나 커야 합니다.";
            } else {
                // 방탈출인 경우 시간 필드만 검증
                if (!data.playtimeMax || Number(data.playtimeMax) <= 0)
                    newErrors.playtimeMax = "시간은 1분 이상이어야 합니다.";
            }
            if (!data.price || Number(data.price) < 0)
                newErrors.price = "가격은 0 이상이어야 합니다.";
            if (!data.difficulty || Number(data.difficulty) < 1)
                newErrors.difficulty = "난이도를 선택해주세요.";
            if (!data.content || data.content.trim() == "")
                newErrors.content = "본문 내용을 작성해주세요.";
            if (
                data.type === "CRIMESCENE" &&
                extraFields.makerMode === "team" &&
                (!extraFields.makerTeamsId ||
                    extraFields.makerTeamsId.trim() === "")
            ) {
                newErrors.makerTeamsId = "팀 선택이 필요합니다.";
            }
            if (
                data.type === "ESCAPE_ROOM" &&
                extraFields &&
                (!extraFields.locations || extraFields.locations.length === 0)
            ) {
                newErrors.locations =
                    "최소 1개 이상의 매장 위치를 등록해주세요.";
            }
            return newErrors;
        }
    );

    const addTagsFromInput = () => {
        const parts = form.tagInput
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0 && !form.tags.includes(t));
        if (parts.length > 0) {
            setForm((prev) => ({
                ...prev,
                tags: [...prev.tags, ...parts],
                tagInput: "",
            }));
        }
    };

    const handleSubmit = () => {
        const currentErrors = validateWithErrors(form);
        const errorMessages = Object.values(currentErrors);

        if (errorMessages.length > 0) {
            toast({
                title: "입력 오류",
                description: (
                    <div>
                        {errorMessages.map((msg, idx) => (
                            <div key={idx}>{msg}</div>
                        ))}
                    </div>
                ),
                variant: "destructive",
            });
            return;
        }

        const { tagInput, ...data } = form;
        const formData = new FormData();

        if (thumbnailFile instanceof File) {
            formData.append("thumbnail", thumbnailFile);
        } else if (data.thumbnail == "") {
            formData.append("thumbnail", null);
        }

        const jsonData: any = {
            title: data.title.trim(),
            summary: data.summary.trim(),
            tags: data.tags,
            content: data.content.trim(),
            playerMin: Number(data.playerMin),
            playerMax: Number(data.playerMax),
            playtimeMin: Number(data.playtimeMin),
            playtimeMax: Number(data.playtimeMax),
            price: Number(data.price),
            difficulty: Number(data.difficulty),
            publicStatus: data.publicStatus,
            recommendationEnabled: data.recommendationEnabled,
            commentEnabled: data.commentEnabled,
            type: data.type,
        };

        if (data.type === "CRIMESCENE" && extraFields) {
            jsonData.makerTeamsId = extraFields.makerTeamsId || null;
            jsonData.guildSnowflake = extraFields.guildSnowflake || null;
            if (extraFields.extra) {
                jsonData.extra = extraFields.extra;
            }
        }

        if (data.type === "ESCAPE_ROOM" && extraFields) {
            // 방탈출 전용 필드들 - 백엔드 AddEscapeRoomThemeRequest 스펙에 맞춤
            jsonData.horrorLevel = extraFields.horrorLevel || null;
            jsonData.deviceRatio = extraFields.deviceRatio || null;
            jsonData.activityLevel = extraFields.activityLevel || null;
            jsonData.openDate = extraFields.openDate || null;
            jsonData.isOperating = extraFields.isOperating ?? true;

            // 매장 위치 (List<EscapeRoomLocation> 형태)
            jsonData.locations = extraFields.locations || [];

            // URL 정보
            jsonData.homepageUrl = extraFields.homepageUrl || null;
            jsonData.reservationUrl = extraFields.reservationUrl || null;

            // 추가 정보
            if (extraFields.extra) {
                jsonData.extra = extraFields.extra;
            }
        }

        formData.append(
            "data",
            new Blob([JSON.stringify(jsonData)], { type: "application/json" })
        );

        onSubmit(formData);
    };

    const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetFileInput = useCallback(() => {
        fileInputRef.current!.value = "";
        setForm((prev) => ({ ...prev, thumbnail: "" }));
        setThumbnailFile(null);
        setImageStats(null);
    }, []);

    // 기존 이미지를 새로운 resizeMode로 재압축하는 함수
    const recompressImage = useCallback(
        async (newResizeMode: ResizeMode) => {
            if (
                !thumbnailFile ||
                !imageOptions?.width ||
                !imageOptions?.height
            ) {
                return;
            }

            try {
                setIsCompressing(true);

                toast({
                    title: "이미지 재처리 중",
                    description:
                        "표시 방식 변경에 따라 이미지를 다시 처리하고 있습니다.",
                });

                // 압축 및 리사이징 옵션 설정
                const compressionOptions = {
                    maxSizeMB: 1.9,
                    quality: imageOptions?.quality || 0.8,
                    targetWidth: imageOptions.width,
                    targetHeight: imageOptions.height,
                    resizeMode: newResizeMode,
                    backgroundColor: imageOptions.backgroundColor || "#FFFFFF",
                };

                // 이미지 재압축 실행
                const compressionResult = await compressImage(
                    thumbnailFile,
                    compressionOptions
                );

                // 압축 결과 저장
                setImageStats({
                    originalSize: compressionResult.originalSize,
                    compressedSize: compressionResult.compressedSize,
                    compressionRate: compressionResult.compressionRate,
                });

                // 기존 미리보기 URL 정리
                if (form.thumbnail && form.thumbnail.startsWith("blob:")) {
                    URL.revokeObjectURL(form.thumbnail);
                }

                // 새로운 압축된 이미지 사용
                const previewURL = URL.createObjectURL(compressionResult.file);
                setThumbnailFile(compressionResult.file);
                setForm((prev) => ({ ...prev, thumbnail: previewURL }));

                toast({
                    title: "이미지 재처리 완료",
                    description: `${
                        newResizeMode === "fit"
                            ? "전체 이미지 표시"
                            : "꽉 채워 표시"
                    } 방식으로 변경되었습니다.`,
                });
            } catch (error) {
                console.error("이미지 재처리 중 오류:", error);
                toast({
                    title: "이미지 재처리 실패",
                    description: "이미지를 재처리하는 중 오류가 발생했습니다.",
                    variant: "destructive",
                });
            } finally {
                setIsCompressing(false);
            }
        },
        [thumbnailFile, imageOptions, form.thumbnail, toast]
    );

    const handleImageChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 이미지 파일 유효성 검사
        const isImage = await isValidImageFile(file);
        if (!isImage) {
            toast({
                title: "유효하지 않은 이미지입니다",
                description: "정상적인 이미지 파일만 업로드 가능합니다.",
                variant: "destructive",
            });
            resetFileInput();
            return;
        }

        try {
            setIsCompressing(true);

            // 리사이징 옵션 확인
            const needsResize = imageOptions?.width && imageOptions?.height;

            // 파일 크기가 2MB를 초과하거나 리사이징이 필요한 경우
            if (file.size > MAX_IMAGE_SIZE || needsResize) {
                const toastMessage = needsResize
                    ? "이미지 리사이징 및 최적화 중"
                    : "이미지 압축 중";

                toast({
                    title: toastMessage,
                    description:
                        "이미지를 처리하고 있습니다. 잠시만 기다려주세요.",
                });

                // 압축 및 리사이징 옵션 설정
                const compressionOptions = {
                    maxSizeMB: 1.9, // 2MB보다 약간 작게 설정
                    quality: imageOptions?.quality || 0.8,
                    onProgress: (progress) => {
                        // 압축 진행 상태 처리 (필요시 상태 업데이트)
                    },
                };

                // 리사이징 옵션 추가
                if (needsResize) {
                    Object.assign(compressionOptions, {
                        targetWidth: imageOptions.width,
                        targetHeight: imageOptions.height,
                        resizeMode: resizeMode, // 사용자가 선택한 모드 사용
                        backgroundColor:
                            imageOptions.backgroundColor || "#FFFFFF",
                    });
                }

                // 이미지 압축 및 리사이징 실행
                const compressionResult = await compressImage(
                    file,
                    compressionOptions
                );

                // 압축 결과 저장
                setImageStats({
                    originalSize: compressionResult.originalSize,
                    compressedSize: compressionResult.compressedSize,
                    compressionRate: compressionResult.compressionRate,
                });

                // 압축된 이미지 사용
                const previewURL = URL.createObjectURL(compressionResult.file);
                setThumbnailFile(compressionResult.file);
                setForm((prev) => ({ ...prev, thumbnail: previewURL }));

                // 압축 결과 알림
                const resultMessage = needsResize
                    ? `${formatFileSize(
                          compressionResult.originalSize
                      )} → ${formatFileSize(compressionResult.compressedSize)}`
                    : `${formatFileSize(
                          compressionResult.originalSize
                      )} → ${formatFileSize(
                          compressionResult.compressedSize
                      )} (${compressionResult.compressionRate}% 감소)`;

                toast({
                    title: needsResize
                        ? "이미지 리사이징 완료"
                        : "이미지 최적화 완료",
                    description: resultMessage,
                });
            } else {
                // 압축이나 리사이징이 필요 없는 경우 원본 사용
                const previewURL = URL.createObjectURL(file);
                setThumbnailFile(file);
                setForm((prev) => ({ ...prev, thumbnail: previewURL }));
                setImageStats(null);
            }
        } catch (error) {
            console.error("이미지 처리 중 오류:", error);
            toast({
                title: "이미지 처리 실패",
                description: "이미지를 처리하는 중 오류가 발생했습니다.",
                variant: "destructive",
            });
            resetFileInput();
        } finally {
            setIsCompressing(false);
        }
    };

    return (
        <PageTransition>
            <div className="max-w-3xl mx-auto px-6 py-20 space-y-6">
                <h1 className="text-3xl font-bold mb-8">{title}</h1>

                {/* 카테고리 드롭다운 */}
                <div>
                    <Label className="font-bold mb-1 block">카테고리 *</Label>
                    <Select
                        value={form.type}
                        onValueChange={(val) => setForm({ ...form, type: val })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="타입을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="CRIMESCENE">크라임씬</SelectItem>
                            <SelectItem value="ESCAPE_ROOM">방탈출</SelectItem>
                            <SelectItem value="MURDER_MYSTERY">
                                머더미스터리
                            </SelectItem>
                            <SelectItem value="REALWORLD">리얼월드</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.type && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.type}
                        </p>
                    )}
                </div>

                {/* 공개 / 추천 / 댓글 여부 설정 */}
                {form.type === "ESCAPE_ROOM" ? (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-blue-800">
                                방탈출 테마 설정
                            </span>
                        </div>
                        <p className="text-sm text-blue-700 mb-3">
                            방탈출 테마는 정보 공유를 위해{" "}
                            <strong>공개, 추천, 댓글이 모두 허용</strong>으로
                            자동 설정됩니다.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <Label className="font-medium text-blue-800">
                                    공개
                                </Label>
                                <Switch checked={true} disabled />
                                <span className="text-sm text-blue-600">
                                    공개
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="font-medium text-blue-800">
                                    추천
                                </Label>
                                <Switch checked={true} disabled />
                                <span className="text-sm text-blue-600">
                                    허용
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="font-medium text-blue-800">
                                    댓글
                                </Label>
                                <Switch checked={true} disabled />
                                <span className="text-sm text-blue-600">
                                    허용
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 min-w-[120px]">
                            <Label className="font-bold">공개</Label>
                            <Switch
                                checked={form.publicStatus}
                                onCheckedChange={(v) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        publicStatus: v,
                                    }))
                                }
                            />
                            <span className="text-sm text-muted-foreground">
                                {form.publicStatus ? "공개" : "비공개"}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 min-w-[150px]">
                            <Label className="font-bold">추천</Label>
                            <Switch
                                checked={form.recommendationEnabled}
                                onCheckedChange={(v) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        recommendationEnabled: v,
                                    }))
                                }
                            />
                            <span className="text-sm text-muted-foreground">
                                {form.recommendationEnabled ? "허용" : "차단"}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 min-w-[150px]">
                            <Label className="font-bold">댓글</Label>
                            <Switch
                                checked={form.commentEnabled}
                                onCheckedChange={(v) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        commentEnabled: v,
                                    }))
                                }
                            />
                            <span className="text-sm text-muted-foreground">
                                {form.commentEnabled ? "허용" : "차단"}
                            </span>
                        </div>
                    </div>
                )}

                {/* 제목 */}
                <div>
                    <Label className="font-bold mb-1 block">제목 *</Label>
                    <Input
                        value={form.title}
                        onChange={(e) =>
                            setForm({ ...form, title: e.target.value })
                        }
                        onBlur={() => validateField("title", form.title)}
                        placeholder="테마 제목"
                    />
                    {errors.title && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.title}
                        </p>
                    )}
                </div>

                {/* 썸네일 */}
                <div>
                    <Label className="font-bold mb-1 block">썸네일</Label>

                    {/* 이미지 리사이징 모드 선택 */}
                    {imageOptions?.width && imageOptions?.height && (
                        <div className="mb-4">
                            <Label className="text-sm font-medium mb-2 block">
                                이미지 표시 방식
                            </Label>
                            <RadioGroup
                                value={resizeMode}
                                onValueChange={async (value) => {
                                    const newMode = value as ResizeMode;
                                    setResizeMode(newMode);
                                    // 기존 이미지가 있으면 새로운 모드로 재압축
                                    await recompressImage(newMode);
                                }}
                                className="flex gap-6"
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="fit" id="fit" />
                                        <Label
                                            htmlFor="fit"
                                            className="text-sm font-normal cursor-pointer"
                                        >
                                            전체 이미지 표시 (Fit)
                                        </Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground max-w-[150px] text-center">
                                        전체 이미지가 보이도록 여백을 추가합니다
                                    </p>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="cover"
                                            id="cover"
                                        />
                                        <Label
                                            htmlFor="cover"
                                            className="text-sm font-normal cursor-pointer"
                                        >
                                            꽉 채워 표시 (Cover)
                                        </Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground max-w-[150px] text-center">
                                        이미지 일부가 잘리더라도 공간을 꽉
                                        채웁니다
                                    </p>
                                </div>
                            </RadioGroup>
                        </div>
                    )}

                    {/* 압축 중 로딩 표시 */}
                    {isCompressing && (
                        <div className="flex items-center justify-center py-4 mb-2">
                            <Loader2 className="w-6 h-6 text-primary animate-spin mr-2" />
                            <span className="text-sm">이미지 최적화 중...</span>
                        </div>
                    )}

                    {/* 썸네일 미리보기 */}
                    {!isCompressing && form.thumbnail && (
                        <div className="mb-2 flex justify-center relative">
                            <div className="w-full max-w-sm h-48 rounded overflow-hidden border border-muted bg-muted/20 relative">
                                <img
                                    src={form.thumbnail}
                                    alt="썸네일 미리보기"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={resetFileInput}
                                    className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 shadow transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-700" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 압축 정보 표시 */}
                    {imageStats && (
                        <div className="text-xs text-muted-foreground mb-2">
                            <span className="font-medium">JPEG 최적화:</span>{" "}
                            {formatFileSize(imageStats.originalSize)} →{" "}
                            {formatFileSize(imageStats.compressedSize)}(
                            {imageStats.compressionRate}% 감소)
                        </div>
                    )}

                    {/* 파일 입력 */}
                    <div className="space-y-2">
                        <Input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            disabled={isCompressing}
                        />
                        <p className="text-xs text-muted-foreground">
                            {imageOptions?.width && imageOptions?.height
                                ? `이미지는 ${imageOptions.width}x${imageOptions.height} 크기로 자동 리사이징됩니다.`
                                : "모든 이미지는 자동으로 최적화됩니다. 2MB 초과 시 JPEG 형식으로 변환됩니다."}
                        </p>
                    </div>
                </div>

                {/* 설명 */}
                <div>
                    <Label className="font-bold mb-1 block">설명 *</Label>
                    <Input
                        value={form.summary}
                        onChange={(e) =>
                            setForm({ ...form, summary: e.target.value })
                        }
                        onBlur={() => validateField("summary", form.summary)}
                        placeholder="간단한 테마 소개"
                    />
                    {errors.summary && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.summary}
                        </p>
                    )}
                </div>

                {/* 태그 입력 */}
                <div>
                    <Label className="font-bold mb-1 block">태그 *</Label>
                    <div className="flex gap-2 mt-1 mb-2 flex-wrap">
                        {form.tags.map((tag) => (
                            <Badge
                                key={tag}
                                className="cursor-pointer"
                                onClick={() =>
                                    setForm((prev) => ({
                                        ...prev,
                                        tags: prev.tags.filter(
                                            (t) => t !== tag
                                        ),
                                    }))
                                }
                            >
                                #{tag}
                            </Badge>
                        ))}
                    </div>
                    <Input
                        value={form.tagInput}
                        onChange={(e) =>
                            setForm({ ...form, tagInput: e.target.value })
                        }
                        onKeyDown={(e) => {
                            if (
                                !isComposing &&
                                (e.key === "Enter" || e.key === ",")
                            ) {
                                e.preventDefault();
                                addTagsFromInput();
                            }
                        }}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={() => setIsComposing(false)}
                        placeholder="쉼표 또는 Enter로 구분"
                    />
                    {errors.tags && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.tags}
                        </p>
                    )}
                </div>

                {/* 인원/가격/시간/난이도 */}
                <div className="flex flex-wrap gap-4">
                    <div className="flex flex-col w-24">
                        <Label className="font-bold mb-1 block">
                            최소 인원 *
                        </Label>
                        <Input
                            type="number"
                            value={form.playerMin}
                            onChange={(e) =>
                                setForm({ ...form, playerMin: e.target.value })
                            }
                            onBlur={() =>
                                validateField("playerMin", form.playerMin)
                            }
                            placeholder="예: 1"
                        />
                        {errors.playerMin && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.playerMin}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col w-24">
                        <Label className="font-bold mb-1 block">
                            최대 인원 *
                        </Label>
                        <Input
                            type="number"
                            value={form.playerMax}
                            onChange={(e) =>
                                setForm({ ...form, playerMax: e.target.value })
                            }
                            onBlur={() =>
                                validateField("playerMax", form.playerMax)
                            }
                            placeholder="예: 2"
                        />
                        {errors.playerMax && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.playerMax}
                            </p>
                        )}
                    </div>
                    {form.type !== "ESCAPE_ROOM" && (
                        <div className="flex flex-col w-28">
                            <Label className="font-bold mb-1 block">
                                최소 시간 *
                            </Label>
                            <Input
                                type="number"
                                value={form.playtimeMin}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        playtimeMin: e.target.value,
                                    })
                                }
                                onBlur={() =>
                                    validateField("playtimeMin", form.playtimeMin)
                                }
                                placeholder="예: 60"
                            />
                            {errors.playtimeMin && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.playtimeMin}
                                </p>
                            )}
                        </div>
                    )}
                    <div className="flex flex-col w-28">
                        <Label className="font-bold mb-1 block">
                            {form.type === "ESCAPE_ROOM" ? "시간 *" : "최대 시간 *"}
                        </Label>
                        <Input
                            type="number"
                            value={form.playtimeMax}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (form.type === "ESCAPE_ROOM") {
                                    // 방탈출일 때는 최소시간도 같은 값으로 설정
                                    setForm({
                                        ...form,
                                        playtimeMin: value,
                                        playtimeMax: value,
                                    });
                                } else {
                                    setForm({
                                        ...form,
                                        playtimeMax: value,
                                    });
                                }
                            }}
                            onBlur={() =>
                                validateField("playtimeMax", form.playtimeMax)
                            }
                            placeholder={form.type === "ESCAPE_ROOM" ? "예: 60" : "예: 120"}
                        />
                        {errors.playtimeMax && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.playtimeMax}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col w-28">
                        <Label className="font-bold mb-1 block">가격 *</Label>
                        <Input
                            type="number"
                            value={form.price}
                            onChange={(e) =>
                                setForm({ ...form, price: e.target.value })
                            }
                            onBlur={() => validateField("price", form.price)}
                            placeholder="₩"
                        />
                        {errors.price && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.price}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col w-32">
                        <Label className="font-bold mb-1 block">난이도 *</Label>
                        <div className="flex flex-col gap-1">
                            <RatingStars
                                rating={form.difficulty}
                                onRatingChange={(value) =>
                                    setForm({ ...form, difficulty: value })
                                }
                                hoveredRating={hovered}
                                onHover={setHovered}
                            />
                            <div className="text-sm text-muted-foreground">
                                {form.difficulty > 0
                                    ? `${form.difficulty}/10`
                                    : "선택 안함"}
                            </div>
                        </div>
                        {errors.difficulty && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.difficulty}
                            </p>
                        )}
                    </div>
                </div>
                {/* 타입별 추가필드 */}
                {form.type === "CRIMESCENE" && (
                    <>
                        <CrimeSceneFields
                            extraFields={extraFields}
                            setExtraFields={setExtraFields}
                            onOpenTeamModal={() => setTeamModalOpen(true)}
                            onOpenGuildModal={() => setGuildModalOpen(true)}
                        />
                        <TeamSelectModal
                            open={isTeamModalOpen}
                            onOpenChange={setTeamModalOpen}
                            onSelect={(id, name) =>
                                setExtraFields((prev) => ({
                                    ...prev,
                                    makerTeamsId: id,
                                    makerTeamsName: name,
                                }))
                            }
                        />
                        <GuildSelectModal
                            open={isGuildModalOpen}
                            onOpenChange={setGuildModalOpen}
                            onSelect={(id, name) =>
                                setExtraFields((prev) => ({
                                    ...prev,
                                    guildSnowflake: id,
                                    guildName: name,
                                }))
                            }
                        />
                        {errors.makerTeamsId && (
                            <p className="text-red-500 text-sm mt-2">
                                팀을 선택해주세요.
                            </p>
                        )}
                    </>
                )}
                {form.type === "ESCAPE_ROOM" && (
                    <>
                        <EscapeRoomFields
                            extraFields={extraFields}
                            setExtraFields={setExtraFields}
                        />
                        {errors.locations && (
                            <p className="text-red-500 text-sm mt-2">
                                {errors.locations}
                            </p>
                        )}
                    </>
                )}
                {form.type === "MURDER_MYSTERY" && (
                    <MurderMysteryFields
                        extraFields={extraFields}
                        setExtraFields={setExtraFields}
                    />
                )}
                {form.type === "REALWORLD" && (
                    <RealWorldFields
                        extraFields={extraFields}
                        setExtraFields={setExtraFields}
                    />
                )}

                {/* 본문 */}
                <div>
                    <MarkdownEditor
                        label="본문 내용 *"
                        value={form.content}
                        onChange={(val) =>
                            setForm({ ...form, content: val || "" })
                        }
                        onBlur={() => validateField("content", form.content)}
                        height={400}
                        error={errors.content}
                    />
                </div>

                {/* 제출 */}
                <div className="text-right">
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {mode === "edit" ? "수정" : "등록"}
                    </Button>
                </div>
            </div>
        </PageTransition>
    );
};

export default ThemeForm;
