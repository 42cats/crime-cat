import React, { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { boardPostService } from "@/api/posts/boardPostService";
import { BoardType, DetailedPostType } from "@/lib/types/board";
import {
    BOARD_POST_TYPES,
    POST_TYPE_LABELS,
} from "@/lib/constants/boardPostTypes";
import { MarkdownEditor } from "@/components/markdown";

interface FormData {
    subject: string;
    content: string;
    postType: string;
    isSecret: boolean;
    isPinned: boolean;
}

interface BoardWriteProps {
    boardType?: BoardType;
}

const BoardWrite: React.FC<BoardWriteProps> = ({
    boardType: propsBoardType,
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();
    const { user } = useAuth();
    const { hasRole } = useAuth();
    const [markdownContent, setMarkdownContent] = useState("");
    const [tempAudioIds, setTempAudioIds] = useState<string[]>([]);
    const tempAudioIdsRef = useRef<string[]>([]);

    // tempAudioIdsRef 동기화
    useEffect(() => {
        tempAudioIdsRef.current = tempAudioIds;
    }, [tempAudioIds]);
    const isEditMode = !!id;

    // URL에서 boardType 파라미터 읽기
    const query = new URLSearchParams(location.search);
    const urlBoardType = query.get("boardType");

    // props나 URL에서 boardType 가져오기 (props 우선)
    const boardType =
        propsBoardType ||
        (urlBoardType ? (urlBoardType as BoardType) : BoardType.CHAT);

    // 수정 모드일 때 기존 게시글 데이터 가져오기
    const { data: existingPost, isLoading: isLoadingPost } = useQuery({
        queryKey: ["boardPost", id],
        queryFn: () => boardPostService.getBoardPostById(id!),
        enabled: isEditMode,
    });

    // 게시판 유형에 따른 기본 게시글 유형 선택
    const getDefaultPostType = () => {
        if (
            !BOARD_POST_TYPES[boardType] ||
            BOARD_POST_TYPES[boardType].length === 0
        ) {
            return DetailedPostType.GENERAL;
        }
        return BOARD_POST_TYPES[boardType][0];
    };

    // 현재 사용자가 접근 가능한 게시글 유형 목록
    const getAvailablePostTypes = () => {
        const baseTypes = BOARD_POST_TYPES[boardType] || [
            DetailedPostType.GENERAL,
        ];

        // 관리자/매니저인 경우 NOTICE 유형 추가
        if (hasRole(["ADMIN", "MANAGER"])) {
            return [...baseTypes, DetailedPostType.NOTICE];
        }

        return baseTypes;
    };

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        defaultValues: {
            subject: "",
            content: "",
            postType: getDefaultPostType(),
            isSecret: false,
            isPinned: false,
        },
    });

    // 임시 파일 정리 함수
    const cleanupTempFiles = async () => {
        const currentTempIds = tempAudioIdsRef.current;

        if (currentTempIds.length > 0) {
            try {
                await apiClient.post("/board/audio/temp-cleanup", {
                    tempIds: currentTempIds,
                });
            } catch (error) {
                console.warn("임시 파일 정리 실패:", error);
            }
        }
    };

    // 수정 모드에서 기존 데이터 로드 및 이벤트 리스너 설정
    useEffect(() => {
        const handleAudioUploaded = (event: CustomEvent) => {
            setTempAudioIds((prev) => [...prev, event.detail.tempId]);
        };

        const handleBeforeUnload = () => {
            const currentTempIds = tempAudioIdsRef.current;

            if (currentTempIds.length > 0) {
                const blob = new Blob(
                    [JSON.stringify({ tempIds: currentTempIds })],
                    {
                        type: "application/json",
                    }
                );
                navigator.sendBeacon("/api/v1/board/audio/temp-cleanup", blob);
            }
        };

        const handleVisibilityChange = () => {
            const currentTempIds = tempAudioIdsRef.current;

            if (
                document.visibilityState === "hidden" &&
                currentTempIds.length > 0
            ) {
                cleanupTempFiles();
            }
        };

        window.addEventListener(
            "audioUploaded",
            handleAudioUploaded as EventListener
        );
        window.addEventListener("beforeunload", handleBeforeUnload);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        if (isEditMode && existingPost) {
            reset({
                subject: existingPost.subject || existingPost.title || "",
                content: existingPost.content || "",
                postType: existingPost.postType || getDefaultPostType(),
                isSecret: existingPost.isSecret || false,
                isPinned: existingPost.isPinned || false,
            });
            setMarkdownContent(existingPost.content || "");
        }

        return () => {
            window.removeEventListener(
                "audioUploaded",
                handleAudioUploaded as EventListener
            );
            window.removeEventListener("beforeunload", handleBeforeUnload);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, [isEditMode, existingPost, reset]); // tempAudioIds 의존성 제거

    // 게시판 유형에 따른 타이틀 설정
    const getBoardTitle = () => {
        switch (boardType) {
            case BoardType.QUESTION:
                return "질문게시판";
            case BoardType.CHAT:
                return "자유게시판";
            case BoardType.CREATOR:
                return "제작자게시판";
            default:
                return "게시판";
        }
    };

    // 마크다운 에디터 변경 핸들러
    const handleEditorChange = (value?: string) => {
        const content = value || "";
        setMarkdownContent(content);
        setValue("content", content);
    };

    // 폼 제출 핸들러
    const onSubmit = async (data: FormData) => {
        try {
            if (!markdownContent.trim()) {
                toast({
                    title: "오류",
                    description: "내용을 입력해주세요.",
                    variant: "destructive",
                });
                return;
            }

            if (isEditMode) {
                // 수정 모드
                await boardPostService.updateBoardPost(id!, {
                    subject: data.subject,
                    content: markdownContent,
                    boardType: boardType,
                    postType: data.postType,
                    isSecret: data.isSecret,
                    tempAudioIds: tempAudioIds, // Add this line
                    isPinned: data.isPinned,
                });

                toast({
                    title: "성공",
                    description: "게시글이 성공적으로 수정되었습니다.",
                });
            } else {
                // 작성 모드
                await boardPostService.createBoardPost({
                    subject: data.subject,
                    content: markdownContent,
                    boardType: boardType,
                    postType: data.postType,
                    isSecret: data.isSecret,
                    tempAudioIds: tempAudioIds, // Add this line
                    isPinned: data.isPinned,
                });

                toast({
                    title: "성공",
                    description: "게시글이 성공적으로 등록되었습니다.",
                });
            }

            // 게시글 목록 페이지로 이동
            const boardPath =
                boardType === BoardType.CHAT
                    ? "chat"
                    : boardType === BoardType.QUESTION
                    ? "question"
                    : boardType === BoardType.CREATOR
                    ? "creator"
                    : "";
            navigate(`/community/${boardPath}`);
        } catch (error) {
            console.error("게시글 처리 오류:", error);
            toast({
                title: "오류",
                description: isEditMode
                    ? "게시글 수정 중 오류가 발생했습니다."
                    : "게시글 등록 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    const handleCancel = async () => {
        if (
            window.confirm(
                "작성 중인 내용이 저장되지 않습니다. 정말 취소하시겠습니까?"
            )
        ) {
            // 먼저 임시 파일 정리
            await cleanupTempFiles();

            const boardPath =
                boardType === BoardType.CHAT
                    ? "chat"
                    : boardType === BoardType.QUESTION
                    ? "question"
                    : boardType === BoardType.CREATOR
                    ? "creator"
                    : "";

            navigate(`/community/${boardPath}`);
        }
    };

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold">
                    {getBoardTitle()} {isEditMode ? "글 수정" : "글쓰기"}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {isEditMode
                        ? "게시글을 수정합니다."
                        : "새로운 게시글을 작성합니다."}
                </p>
            </div>

            <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader className="p-6">
                    <CardTitle>
                        {isEditMode ? "게시글 수정" : "게시글 작성"}
                    </CardTitle>
                    <CardDescription>
                        제목과 내용을 입력하고 게시글 유형을 선택해주세요.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="p-6 pt-0 space-y-6">
                        {/* 제목 입력 */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="subject"
                                className="text-sm font-medium"
                            >
                                제목
                            </Label>
                            <Input
                                id="subject"
                                placeholder="제목을 입력하세요"
                                {...register("subject", {
                                    required: "제목을 입력해주세요",
                                })}
                                className="w-full"
                            />
                            {errors.subject && (
                                <p className="text-sm text-red-500 mt-1">
                                    {errors.subject.message}
                                </p>
                            )}
                        </div>

                        {/* 게시글 유형 선택 */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="postType"
                                className="text-sm font-medium"
                            >
                                게시글 유형
                            </Label>
                            <Select
                                defaultValue={getDefaultPostType()}
                                onValueChange={(value) =>
                                    setValue("postType", value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="게시글 유형 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getAvailablePostTypes().map((postType) => (
                                        <SelectItem
                                            key={postType}
                                            value={postType}
                                        >
                                            {POST_TYPE_LABELS[postType]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 비밀글 설정 */}
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="isSecret"
                                checked={watch("isSecret")}
                                onCheckedChange={(checked) =>
                                    setValue("isSecret", checked)
                                }
                            />
                            <Label
                                htmlFor="isSecret"
                                className="text-sm font-medium"
                            >
                                비밀글로 설정
                            </Label>
                        </div>

                        {/* 핀설정 (관리자/매니저만) */}
                        {hasRole(["ADMIN"]) && (
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isPinned"
                                    checked={watch("isPinned")}
                                    onCheckedChange={(checked) =>
                                        setValue("isPinned", checked)
                                    }
                                />
                                <Label
                                    htmlFor="isPinned"
                                    className="text-sm font-medium"
                                >
                                    상단 고정 (관리자 전용)
                                </Label>
                            </div>
                        )}

                        {/* MarkdownEditor 컴포넌트 사용 */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="content"
                                className="text-sm font-medium"
                            >
                                내용
                            </Label>
                            <MarkdownEditor
                                value={markdownContent}
                                onChange={handleEditorChange}
                                height={400}
                                userRole={user?.role || "USER"}
                            />
                            {errors.content && (
                                <p className="text-sm text-red-500 mt-1">
                                    {errors.content.message}
                                </p>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="p-6 flex flex-col sm:flex-row gap-3 justify-end border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                        >
                            취소
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <span className="mr-2">저장 중...</span>
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                                </>
                            ) : isEditMode ? (
                                "수정하기"
                            ) : (
                                "등록하기"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default BoardWrite;
