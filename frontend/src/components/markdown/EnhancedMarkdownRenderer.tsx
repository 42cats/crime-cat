import React, { useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
    vscDarkPlus,
    vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/hooks/useTheme";
import { Copy, Check } from "lucide-react";
import SmartAudioPlayer from "@/components/audio/SmartAudioPlayer";
import { AudioSyntaxParser } from "./AudioSyntaxParser";
import { AudioResolver } from "./AudioResolver";
import { AudioToken, ResolvedAudio } from "./types/AudioTypes";

interface EnhancedMarkdownRendererProps {
    content: string;
    className?: string;
    enableAudioProcessing?: boolean;
}

// Separate component for code blocks (기존과 동일)
interface CodeBlockProps {
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
    isDarkMode: boolean;
    [key: string]: any;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ inline, className, children, isDarkMode, ...props }) => {
    const [copied, setCopied] = useState(false);
    
    if (inline) {
        return (
            <code
                className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-gray-800 dark:text-gray-100"
                {...props}
            >
                {children}
            </code>
        );
    }

    const codeContent = String(children).replace(/\n$/, "");
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(codeContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    const cleanCode = () => {
        let code = codeContent;
        code = code
            .replace(/^`+\s*\n/, "")
            .replace(/\n\s*`+$/, "");
        code = code.replace(/^```\w*\s*\n/, "");
        code = code.replace(/\n\s*```$/, "");
        return code;
    };

    return (
        <div className="relative bg-gray-100 dark:bg-gray-800 rounded-md my-2 group overflow-hidden">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                    onClick={handleCopy}
                    className="bg-gray-200 dark:bg-gray-700 p-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors shadow-md"
                    title="코드 복사"
                >
                    {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                    ) : (
                        <Copy className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    )}
                </button>
            </div>
            <SyntaxHighlighter
                style={isDarkMode ? vscDarkPlus : vs}
                language={language || "javascript"}
                customStyle={{
                    margin: 0,
                    padding: "12px",
                    borderRadius: "6px",
                    backgroundColor: isDarkMode ? "#1e293b" : "#f3f4f6",
                    fontSize: "1.0rem",
                }}
                codeTagProps={{
                    className: "text-gray-800 dark:text-gray-100 font-mono",
                }}
                showLineNumbers={false}
            >
                {cleanCode()}
            </SyntaxHighlighter>
        </div>
    );
};

// 오디오 컴포넌트 렌더러
interface AudioComponentProps {
    token: AudioToken;
    resolver: AudioResolver;
}

const AudioComponent: React.FC<AudioComponentProps> = ({ token, resolver }) => {
    const [resolvedAudio, setResolvedAudio] = useState<ResolvedAudio | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const resolveAudio = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const resolved = await resolver.resolveAudio(token);
                setResolvedAudio(resolved);
            } catch (err) {
                console.error("Audio resolution failed:", err);
                setError(err instanceof Error ? err.message : "오디오를 로드할 수 없습니다.");
            } finally {
                setLoading(false);
            }
        };

        resolveAudio();

        // Cleanup on unmount
        return () => {
            if (resolvedAudio?.blobUrl && resolvedAudio.blobUrl.startsWith('blob:')) {
                URL.revokeObjectURL(resolvedAudio.blobUrl);
            }
        };
    }, [token, resolver]);

    if (loading) {
        return (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 my-4">
                <div className="animate-pulse flex items-center space-x-4">
                    <div className="rounded-full bg-gray-300 h-10 w-10"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                </div>
                <div className="mt-3 text-sm text-gray-500">오디오 로딩 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
                <div className="flex items-center">
                    <div className="text-red-500 mr-3">⚠️</div>
                    <div>
                        <div className="font-medium text-red-800 dark:text-red-200">{token.title}</div>
                        <div className="text-sm text-red-600 dark:text-red-300">{error}</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!resolvedAudio) {
        return null;
    }

    return (
        <div className="my-4">
            <SmartAudioPlayer
                src={resolvedAudio.blobUrl}
                title={resolvedAudio.metadata.title}
                isPrivate={resolvedAudio.metadata.isPrivate}
                duration={resolvedAudio.metadata.duration}
                className="w-full"
            />
        </div>
    );
};

const EnhancedMarkdownRenderer: React.FC<EnhancedMarkdownRendererProps> = ({
    content,
    className,
    enableAudioProcessing = true,
}) => {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark";
    
    // 오디오 처리 관련 상태
    const [audioParser] = useState(() => new AudioSyntaxParser());
    const [audioResolver] = useState(() => new AudioResolver());
    
    // 컨텐츠 파싱 및 처리
    const { processedContent, audioTokens } = useMemo(() => {
        if (!enableAudioProcessing) {
            return { processedContent: content, audioTokens: [] };
        }
        
        return audioParser.parseContent(content);
    }, [content, enableAudioProcessing, audioParser]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            audioResolver.cleanup();
        };
    }, [audioResolver]);

    // 오디오 토큰을 React 컴포넌트로 변환
    const renderContentWithAudio = (markdownContent: string) => {
        if (!enableAudioProcessing || audioTokens.length === 0) {
            return markdownContent;
        }

        // 마크다운 오디오 문법을 임시 플레이스홀더로 변환
        let contentWithPlaceholders = markdownContent;
        const placeholders: { [key: string]: AudioToken } = {};

        audioTokens.forEach((token, index) => {
            const placeholder = `__AUDIO_PLACEHOLDER_${index}__`;
            placeholders[placeholder] = token;
            contentWithPlaceholders = contentWithPlaceholders.replace(
                token.originalMatch,
                placeholder
            );
        });

        // 커스텀 텍스트 노드 렌더러에서 플레이스홀더를 오디오 컴포넌트로 변환
        return {
            content: contentWithPlaceholders,
            placeholders
        };
    };

    const { content: renderContent, placeholders } = renderContentWithAudio(processedContent);

    return (
        <div
            className={
                className ||
                "prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:text-muted-foreground prose-a:text-primary"
            }
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    // 텍스트 노드에서 오디오 플레이스홀더 처리
                    p({ children }) {
                        const processedChildren = React.Children.map(children, (child) => {
                            if (typeof child === 'string') {
                                // 플레이스홀더를 오디오 컴포넌트로 교체
                                const parts = child.split(/(__AUDIO_PLACEHOLDER_\d+__)/);
                                return parts.map((part, index) => {
                                    if (placeholders && placeholders[part]) {
                                        return (
                                            <AudioComponent
                                                key={`audio-${index}`}
                                                token={placeholders[part]}
                                                resolver={audioResolver}
                                            />
                                        );
                                    }
                                    return part || null;
                                });
                            }
                            return child;
                        });

                        return <p>{processedChildren}</p>;
                    },
                    // 기존 코드 블록 처리
                    code(props) {
                        return <CodeBlock {...props} isDarkMode={isDarkMode} />;
                    },
                    // 굵기
                    strong({ children }) {
                        return <span className="font-bold">{children}</span>;
                    },
                    // 기울임체
                    em({ children }) {
                        return <span className="italic">{children}</span>;
                    },
                    // 취소선
                    del({ children }) {
                        return <span className="line-through">{children}</span>;
                    },
                    // 밑줄
                    u({ children }) {
                        return <span className="underline">{children}</span>;
                    },
                    // 링크 (오디오가 아닌 일반 링크만)
                    a({ href, children }) {
                        // 오디오 문법이면 무시
                        const childText = React.Children.toArray(children).join('');
                        if (childText.startsWith('audio:')) {
                            return null;
                        }

                        return (
                            <a
                                href={href}
                                className="text-blue-500 hover:underline"
                                target="_blank"
                                rel="noreferrer"
                            >
                                {children}
                            </a>
                        );
                    },
                    // 인용구
                    blockquote({ children }) {
                        return (
                            <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 py-1 my-2">
                                {children}
                            </div>
                        );
                    },
                }}
            >
                {renderContent}
            </ReactMarkdown>
        </div>
    );
};

export default EnhancedMarkdownRenderer;