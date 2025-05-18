import React, { useState } from "react";
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

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
    content,
    className,
}) => {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark";
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
                    // 인라인 코드 처리
                    code({ node, inline, className, children, ...props }) {
                        // 인라인 코드
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

                        // 코드 블록 처리
                        const [copied, setCopied] = useState(false);
                        const codeContent = String(children).replace(/\n$/, "");

                        // 마크다운에서 언어 추출
                        const match = /language-(\w+)/.exec(className || "");
                        const language = match ? match[1] : "";

                        const handleCopy = async () => {
                            try {
                                await navigator.clipboard.writeText(
                                    codeContent
                                );
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            } catch (err) {
                                console.error("Failed to copy text: ", err);
                            }
                        };

                        // 백틱 관련 문제를 해결하기 위한 정규식 추가
                        const cleanCode = () => {
                            // 백틱 이슈 수정을 위한 추가 처리
                            let code = codeContent;

                            // 첫 번째와 마지막 줄에서 백틱만 있는 줄 제거
                            code = code
                                .replace(/^`+\s*\n/, "")
                                .replace(/\n\s*`+$/, "");

                            // 첫 번째 줄에서 ```language 제거
                            code = code.replace(/^```\w*\s*\n/, "");

                            // 마지막 줄에서 ``` 제거
                            code = code.replace(/\n\s*```$/, "");

                            return code;
                        };

                        return (
                            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-md my-2 group overflow-hidden">
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button
                                        onClick={handleCopy}
                                        className="bg-gray-200 dark:bg-gray-700 p-1 rounded hover:bg-gray-600 dark:hover:bg-gray-600 transition-colors"
                                        title="코드 복사"
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
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
                                        backgroundColor: isDarkMode
                                            ? "#1e293b"
                                            : "#f3f4f6", // 배경색 설정
                                        fontSize: "1.0rem", // 텍스트 크기 두 배로 키움
                                    }}
                                    codeTagProps={{
                                        className:
                                            "text-gray-800 dark:text-gray-100 font-mono",
                                    }}
                                    showLineNumbers={false}
                                >
                                    {cleanCode()}
                                </SyntaxHighlighter>
                            </div>
                        );
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
                    // 링크
                    a({ href, children }) {
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
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
