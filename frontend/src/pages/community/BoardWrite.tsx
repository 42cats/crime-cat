import React, { useState, useEffect } from "react";
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
import { boardPostService } from "@/api/posts/boardPostService";
import { BoardType, DetailedPostType } from "@/lib/types/board";
import { MarkdownEditor } from "@/components/markdown";

interface FormData {
    subject: string;
    content: string;
    postType: string;
    isSecret: boolean;
}

interface BoardWriteProps {
    boardType?: BoardType;
}

// 게시판 유형별 사용 가능한 게시글 유형 정의
const BOARD_POST_TYPES: Record<BoardType, DetailedPostType[]> = {
    [BoardType.NONE]: [DetailedPostType.GENERAL],
    [BoardType.CHAT]: [
        DetailedPostType.GENERAL,
        DetailedPostType.PHOTO,
        DetailedPostType.SECRET,
        DetailedPostType.PROMOTION,
        DetailedPostType.RECRUIT,
        DetailedPostType.CRIME_SCENE,
        DetailedPostType.MURDER_MYSTERY,
        DetailedPostType.ESCAPE_ROOM,
        DetailedPostType.REAL_WORLD,
    ],
    [BoardType.QUESTION]: [
        DetailedPostType.QUESTION,
        DetailedPostType.GENERAL,
        DetailedPostType.SECRET,
    ],
    [BoardType.CREATOR]: [
        DetailedPostType.GENERAL,
        DetailedPostType.CRIME_SCENE,
        DetailedPostType.QUESTION,
        DetailedPostType.MURDER_MYSTERY,
        DetailedPostType.ESCAPE_ROOM,
        DetailedPostType.REAL_WORLD,
        DetailedPostType.PROMOTION,
        DetailedPostType.RECRUIT,
    ],
};

const POST_TYPE_LABELS: Record<string, string> = {
    [DetailedPostType.GENERAL]: "일반",
    [DetailedPostType.QUESTION]: "질문",
    [DetailedPostType.PHOTO]: "사진",
    [DetailedPostType.SECRET]: "비밀",
    [DetailedPostType.PROMOTION]: "홍보",
    [DetailedPostType.RECRUIT]: "모집",
    [DetailedPostType.CRIME_SCENE]: "크라임씬",
    [DetailedPostType.MURDER_MYSTERY]: "머더미스터리",
    [DetailedPostType.ESCAPE_ROOM]: "방탈출",
    [DetailedPostType.REAL_WORLD]: "리얼월드",
};

const BoardWrite: React.FC<BoardWriteProps> = ({
    boardType: propsBoardType,
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();
    const [markdownContent, setMarkdownContent] = useState("");
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
        },
    });

    // 수정 모드에서 기존 데이터 로드
    useEffect(() => {
        if (isEditMode && existingPost) {
            reset({
                subject: existingPost.subject || existingPost.title || "",
                content: existingPost.content || "",
                postType: existingPost.postType || getDefaultPostType(),
                isSecret: existingPost.isSecret || false,
            });
            setMarkdownContent(existingPost.content || "");
        }
    }, [isEditMode, existingPost, reset]);

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

    const handleCancel = () => {
        if (
            window.confirm(
                "작성 중인 내용이 저장되지 않습니다. 정말 취소하시겠습니까?"
            )
        ) {
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
                                    {BOARD_POST_TYPES[boardType].map(
                                        (postType) => (
                                            <SelectItem
                                                key={postType}
                                                value={postType}
                                            >
                                                {POST_TYPE_LABELS[postType]}
                                            </SelectItem>
                                        )
                                    )}
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
