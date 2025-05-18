import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
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
import { boardPostService } from "@/api/boardPostService";
import { BoardType, DetailedPostType } from "@/lib/types/board";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import MarkdownRenderer from "@/components/MarkdownRenderer";

// 에디터 스타일 가져오기
import "@/styles/editor.css";

// Tiptap 에디터 가져오기
import {
    useEditor,
    EditorContent,
    Editor as TiptapEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";

// 마크다운 처리를 위한 markdown-it
import MarkdownIt from "markdown-it";

// 아이콘
import {
    Bold,
    Italic,
    Strikethrough,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    Code,
    Image as ImageIcon,
    Link as LinkIcon,
    MinusSquare,
    CheckSquare,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Smile,
    Paperclip,
    XCircle,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface FormData {
    subject: string;
    content: string;
    postType: string;
    secret: boolean;
}

interface BoardWriteProps {
    boardType?: BoardType;
}

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

interface EditorButtonProps {
    onClick: () => void;
    isActive?: boolean;
    icon: React.ReactNode;
    tooltip: string;
}

const EditorButton: React.FC<EditorButtonProps> = ({
    onClick,
    isActive,
    icon,
    tooltip,
}) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onClick}
                        className={`h-8 w-8 p-0 ${
                            isActive ? "bg-muted text-primary" : ""
                        }`}
                    >
                        {icon}
                        <span className="sr-only">{tooltip}</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

interface LinkDialogProps {
    editor: TiptapEditor | null;
}

const LinkDialog: React.FC<LinkDialogProps> = ({ editor }) => {
    const [url, setUrl] = useState("");
    const [text, setText] = useState("");

    const handleInsertLink = () => {
        if (editor && url) {
            if (editor.getAttributes("link").href) {
                editor
                    .chain()
                    .focus()
                    .extendMarkRange("link")
                    .setLink({ href: url })
                    .run();
            } else {
                if (text) {
                    editor
                        .chain()
                        .focus()
                        .insertContent(`<a href="${url}">${text}</a>`)
                        .run();
                } else {
                    editor.chain().focus().setLink({ href: url }).run();
                }
            }
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0"
                >
                    <LinkIcon className="h-4 w-4" />
                    <span className="sr-only">링크 삽입</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>링크 삽입</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="link-url" className="text-right">
                            URL
                        </Label>
                        <Input
                            id="link-url"
                            type="url"
                            placeholder="https://example.com"
                            className="col-span-3"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="link-text" className="text-right">
                            텍스트
                        </Label>
                        <Input
                            id="link-text"
                            placeholder="링크 텍스트 (선택사항)"
                            className="col-span-3"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            취소
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button type="button" onClick={handleInsertLink}>
                            삽입
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

interface ImageDialogProps {
    editor: TiptapEditor | null;
}

const ImageDialog: React.FC<ImageDialogProps> = ({ editor }) => {
    const [url, setUrl] = useState("");
    const [alt, setAlt] = useState("");

    const handleInsertImage = () => {
        if (editor && url) {
            editor
                .chain()
                .focus()
                .setImage({
                    src: url,
                    alt: alt || undefined,
                })
                .run();
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0"
                >
                    <ImageIcon className="h-4 w-4" />
                    <span className="sr-only">이미지 삽입</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>이미지 삽입</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="image-url" className="text-right">
                            이미지 URL
                        </Label>
                        <Input
                            id="image-url"
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            className="col-span-3"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="image-alt" className="text-right">
                            대체 텍스트
                        </Label>
                        <Input
                            id="image-alt"
                            placeholder="이미지 설명 (선택사항)"
                            className="col-span-3"
                            value={alt}
                            onChange={(e) => setAlt(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            취소
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button type="button" onClick={handleInsertImage}>
                            삽입
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const EditorToolbar = ({ editor }: { editor: TiptapEditor | null }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="border-b border-gray-200 dark:border-gray-700 p-1 flex flex-wrap gap-0.5 bg-muted/20">
            <div className="flex items-center mr-1 space-x-0.5 border-r pr-1 border-gray-200 dark:border-gray-700">
                <EditorButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive("bold")}
                    icon={<Bold className="h-4 w-4" />}
                    tooltip="굵게"
                />
                <EditorButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive("italic")}
                    icon={<Italic className="h-4 w-4" />}
                    tooltip="기울임"
                />
                <EditorButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive("strike")}
                    icon={<Strikethrough className="h-4 w-4" />}
                    tooltip="취소선"
                />
                <EditorButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    isActive={editor.isActive("code")}
                    icon={<Code className="h-4 w-4" />}
                    tooltip="코드"
                />
            </div>

            <div className="flex items-center mr-1 space-x-0.5 border-r pr-1 border-gray-200 dark:border-gray-700">
                <EditorButton
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 1 }).run()
                    }
                    isActive={editor.isActive("heading", { level: 1 })}
                    icon={<Heading1 className="h-4 w-4" />}
                    tooltip="제목 1"
                />
                <EditorButton
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    isActive={editor.isActive("heading", { level: 2 })}
                    icon={<Heading2 className="h-4 w-4" />}
                    tooltip="제목 2"
                />
                <EditorButton
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 3 }).run()
                    }
                    isActive={editor.isActive("heading", { level: 3 })}
                    icon={<Heading3 className="h-4 w-4" />}
                    tooltip="제목 3"
                />
            </div>

            <div className="flex items-center mr-1 space-x-0.5 border-r pr-1 border-gray-200 dark:border-gray-700">
                <EditorButton
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                    isActive={editor.isActive("bulletList")}
                    icon={<List className="h-4 w-4" />}
                    tooltip="글머리 기호 목록"
                />
                <EditorButton
                    onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                    }
                    isActive={editor.isActive("orderedList")}
                    icon={<ListOrdered className="h-4 w-4" />}
                    tooltip="번호 매기기 목록"
                />
                <EditorButton
                    onClick={() =>
                        editor.chain().focus().toggleBlockquote().run()
                    }
                    isActive={editor.isActive("blockquote")}
                    icon={<Quote className="h-4 w-4" />}
                    tooltip="인용구"
                />
                <EditorButton
                    onClick={() =>
                        editor.chain().focus().toggleTaskList().run()
                    }
                    isActive={editor.isActive("taskList")}
                    icon={<CheckSquare className="h-4 w-4" />}
                    tooltip="할 일 목록"
                />
            </div>

            <div className="flex items-center mr-1 space-x-0.5 border-r pr-1 border-gray-200 dark:border-gray-700">
                <EditorButton
                    onClick={() =>
                        editor.chain().focus().setHorizontalRule().run()
                    }
                    isActive={false}
                    icon={<MinusSquare className="h-4 w-4" />}
                    tooltip="구분선"
                />
                <LinkDialog editor={editor} />
                <ImageDialog editor={editor} />
            </div>

            <div className="flex items-center space-x-0.5">
                <EditorButton
                    onClick={() => editor.chain().focus().undo().run()}
                    isActive={false}
                    icon={<Undo className="h-4 w-4" />}
                    tooltip="실행 취소"
                />
                <EditorButton
                    onClick={() => editor.chain().focus().redo().run()}
                    isActive={false}
                    icon={<Redo className="h-4 w-4" />}
                    tooltip="다시 실행"
                />
            </div>
        </div>
    );
};

const TiptapEditor = ({ onChange, formValues }: { onChange: (html: string) => void; formValues: any }) => {
    const [isMarkdownView, setIsMarkdownView] = useState(false);
    const [markdownText, setMarkdownText] = useState("");
    const [previewContent, setPreviewContent] = useState("");
    const editorContainerRef = useRef<HTMLDivElement>(null);

    // markdown-it 인스턴스 생성
    const md = new MarkdownIt({
        html: true,
        breaks: true,
        linkify: true,
    });

    const editor = useEditor({
        editorProps: {
            attributes: {
                class: 'outline-none focus:outline-none focus-visible:outline-none',
                spellcheck: 'false'
            },
        },
        extensions: [
            StarterKit.configure({
                blockquote: true,
                bold: true,
                bulletList: true,
                code: true,
                codeBlock: true,
                dropcursor: true,
                gapcursor: true,
                hardBreak: true,
                heading: true,
                history: true,
                horizontalRule: true,
                italic: true,
                listItem: true,
                orderedList: true,
                paragraph: true,
                strike: true,
                text: true,
            }),
            Placeholder.configure({
                placeholder: "내용을 입력하세요...",
            }),
            Image.configure({
                allowBase64: true,
                inline: false,
            }),
            Link.configure({
                openOnClick: false,
                linkOnPaste: true,
            }),
        ],
        content: "",
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html);
            setPreviewContent(html);

            // HTML을 마크다운으로 변환 (간단한 방법으로 구현)
            // 실제로는 보다 정교한 HTML-to-Markdown 라이브러리를 사용하는 것이 좋습니다
            // 여기서는 간단한 예시만 제공합니다
            try {
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = html;
                let markdown = "";

                // 간단한 변환 로직 (제한적입니다)
                const convertNodeToMarkdown = (node: Node): string => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        return node.textContent || "";
                    }

                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const el = node as HTMLElement;
                        let result = "";

                        // 자식 노드 컨텐츠 변환
                        const childContent = Array.from(el.childNodes)
                            .map(convertNodeToMarkdown)
                            .join("");

                        // 노드 타입에 따른 변환
                        switch (el.tagName.toLowerCase()) {
                            case "h1":
                                return `# ${childContent}\n\n`;
                            case "h2":
                                return `## ${childContent}\n\n`;
                            case "h3":
                                return `### ${childContent}\n\n`;
                            case "p":
                                return `${childContent}\n\n`;
                            case "strong":
                                return `**${childContent}**`;
                            case "em":
                                return `*${childContent}*`;
                            case "a":
                                return `[${childContent}](${el.getAttribute(
                                    "href"
                                )})`;
                            case "img":
                                return `![${
                                    el.getAttribute("alt") || ""
                                }](${el.getAttribute("src")})`;
                            case "blockquote":
                                return `> ${childContent}\n\n`;
                            case "pre":
                                return `\`\`\`\n${childContent}\n\`\`\`\n\n`;
                            case "code":
                                return `\`${childContent}\``;
                            case "ul": {
                                const listItems = Array.from(el.children)
                                    .map(
                                        (li) => `- ${convertNodeToMarkdown(li)}`
                                    )
                                    .join("");
                                return listItems + "\n";
                            }
                            case "ol": {
                                const listItems = Array.from(el.children)
                                    .map(
                                        (li, i) =>
                                            `${i + 1}. ${convertNodeToMarkdown(
                                                li
                                            )}`
                                    )
                                    .join("");
                                return listItems + "\n";
                            }
                            default:
                                return childContent;
                        }
                    }

                    return "";
                };

                markdown = convertNodeToMarkdown(tempDiv);
                setMarkdownText(markdown);
            } catch (error) {
                console.error("HTML to Markdown conversion error:", error);
            }
        },
    });
    
    // 에디터 초기화 후 ResizeObserver 설정
    useEffect(() => {
        if (!editor || !editorContainerRef.current) return;
        
        // 포커스 시 윤곽선 제거
        const editorView = editor.view;
        if (editorView && editorView.dom) {
            editorView.dom.style.outline = 'none';
            editorView.dom.style.boxShadow = 'none';
        }
        
        // 화면 크기 변경 시 처리
        const resizeObserver = new ResizeObserver(() => {
            if (editorView && editorView.dom) {
                editorView.dom.style.outline = 'none';
                editorView.dom.style.boxShadow = 'none';
            }
        });

        resizeObserver.observe(editorContainerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [editor]);

    // 마크다운 모드에서 텍스트 변경 처리
    const handleMarkdownChange = (mdText: string) => {
        setMarkdownText(mdText);

        try {
            // 마크다운을 HTML로 변환
            const html = md.render(mdText);
            onChange(html);
            setPreviewContent(html);
            
            // 에디터 콘텐츠 업데이트 (시각적 편집기 전환 시 적용)
            if (editor) {
                editor.commands.setContent(html, {
                    emitUpdate: false,
                });
            }
        } catch (error) {
            console.error("Markdown to HTML conversion error:", error);
        }
    };

    // 키 입력 이벤트 처리 함수 (마크다운 단축키 처리)
    const handleKeyDown = (event: React.KeyboardEvent) => {
        // 테스트용 기능 - 실제로는 Tiptap의 editorProps.handleDOMEvents 내에서 처리하는 것이 좋음
        if (event.key === '#') {
            const lineStart = event.currentTarget.selectionStart === 0 || 
                             event.currentTarget.value.charAt(event.currentTarget.selectionStart - 1) === '\n';
            if (lineStart) {
                // # 입력 시 제목 형식으로 변환하기 위한 로직
                console.log('마크다운 제목 처리');
            }
        }
    };

    return (
        <div ref={editorContainerRef} className="editor-container border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden shadow-sm">
            <Tabs
            defaultValue="visual"
            onValueChange={(value) =>
            setIsMarkdownView(value === "markdown")
            }
            >
            <div className="flex items-center justify-between bg-muted/20 border-b border-gray-200 dark:border-gray-700">
                <TabsList className="px-2 py-1">
                    <TabsTrigger
                        value="visual"
                        className="px-3 py-1 text-sm"
                    >
                        편집기
                    </TabsTrigger>
                    <TabsTrigger
                        value="preview"
                        className="px-3 py-1 text-sm"
                    >
                        미리보기
                    </TabsTrigger>
                </TabsList>
        </div>

                <TabsContent value="visual" className="p-0 m-0">
                    <EditorToolbar editor={editor} />
                    <div className="editor-content-wrapper outline-none border-none focus-visible:outline-none">
                        <EditorContent
                            editor={editor}
                            className="prose prose-sm sm:prose dark:prose-invert max-w-none p-4 min-h-[400px] outline-none focus:outline-none focus:ring-0 border-none ProseMirror"
                            spellCheck="false"
                            style={{ boxSizing: 'border-box', transition: 'none', display: 'block', width: '100%' }}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="preview" className="p-0 m-0">
                    <div className="border-b border-gray-200 dark:border-gray-700 p-1 bg-muted/20">
                        <div className="text-xs text-muted-foreground px-2">
                            미리보기 - 실제 표시될 내용입니다.
                        </div>
                    </div>
                    <div className="p-6 min-h-[400px] overflow-auto bg-background">
                        <MarkdownRenderer content={markdownText} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

const BoardWrite: React.FC<BoardWriteProps> = ({
    boardType: propsBoardType,
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [editorContent, setEditorContent] = useState("");

    // URL에서 boardType 파라미터 읽기
    const query = new URLSearchParams(location.search);
    const urlBoardType = query.get("boardType");

    // props나 URL에서 boardType 가져오기 (props 우선)
    const boardType =
        propsBoardType ||
        (urlBoardType ? (urlBoardType as BoardType) : BoardType.CHAT);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        defaultValues: {
            subject: "",
            content: "",
            postType: DetailedPostType.GENERAL,
            secret: false,
        },
    });

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

    // 에디터 콘텐츠 변경 핸들러
    const handleEditorChange = (html: string) => {
        setEditorContent(html);
        setValue("content", html);
    };

    // 폼 제출 핸들러
    const onSubmit = async (data: FormData) => {
        try {
            if (!editorContent.trim()) {
                toast({
                    title: "오류",
                    description: "내용을 입력해주세요.",
                    variant: "destructive",
                });
                return;
            }

            await boardPostService.createBoardPost({
                subject: data.subject,
                content: editorContent,
                boardType: boardType,
                postType: data.postType,
                secret: data.secret,
            });

            toast({
                title: "성공",
                description: "게시글이 성공적으로 등록되었습니다.",
            });

            // 게시글 목록 페이지로 이동
            const boardPath =
                boardType === BoardType.CHAT
                    ? "free"
                    : boardType === BoardType.QUESTION
                    ? "questions"
                    : boardType === BoardType.CREATOR
                    ? "creators"
                    : "";
            navigate(`/community/${boardPath}`);
        } catch (error) {
            console.error("게시글 등록 오류:", error);
            toast({
                title: "오류",
                description: "게시글 등록 중 오류가 발생했습니다.",
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
                    ? "free"
                    : boardType === BoardType.QUESTION
                    ? "questions"
                    : boardType === BoardType.CREATOR
                    ? "creators"
                    : "";
            navigate(`/community/${boardPath}`);
        }
    };

    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold">
                    {getBoardTitle()} 글쓰기
                </h1>
                <p className="text-muted-foreground mt-1">
                    새로운 게시글을 작성합니다.
                </p>
            </div>

            <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader className="p-6">
                    <CardTitle>게시글 작성</CardTitle>
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
                                defaultValue={DetailedPostType.GENERAL}
                                onValueChange={(value) =>
                                    setValue("postType", value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="게시글 유형 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(POST_TYPE_LABELS).map(
                                        ([type, label]) => (
                                            <SelectItem key={type} value={type}>
                                                {label}
                                            </SelectItem>
                                        )
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 비밀글 설정 */}
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="secret"
                                checked={Boolean(register("secret").value)}
                                onCheckedChange={(checked) =>
                                    setValue("secret", checked)
                                }
                            />
                            <Label
                                htmlFor="secret"
                                className="text-sm font-medium"
                            >
                                비밀글로 설정
                            </Label>
                        </div>

                        {/* Tiptap 에디터 */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="content"
                                className="text-sm font-medium"
                            >
                                내용
                            </Label>
                            <TiptapEditor onChange={handleEditorChange} formValues={{
                                subject: register("subject").value,
                                postType: register("postType").value,
                                secret: register("secret").value
                            }} />
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
