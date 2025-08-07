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
        console.log('🎬 EnhancedMarkdownRenderer useMemo() START');
        
        // 안전한 content 처리
        const safeContent = content || '';
        console.log('📥 Renderer received content:', JSON.stringify(safeContent));
        console.log('⚡ enableAudioProcessing:', enableAudioProcessing);
        
        if (!enableAudioProcessing || !safeContent || typeof safeContent !== 'string') {
            console.log('⏭️  Skipping audio processing, returning as-is');
            const earlyReturn = { processedContent: safeContent, audioTokens: [] };
            console.log('🔍 Early return object:', earlyReturn);
            return earlyReturn;
        }
        
        console.log('🎵 Calling audioParser.parseContent()');
        const result = audioParser.parseContent(safeContent);
        console.log('📊 Parser result detailed:');
        console.log('  - Full result object:', result);
        console.log('  - result.content:', JSON.stringify(result.content));
        console.log('  - result.audioTokens:', result.audioTokens);
        console.log('  - typeof result.content:', typeof result.content);
        console.log('  - result.content === undefined:', result.content === undefined);
        console.log('  - Object.keys(result):', Object.keys(result));
        
        // 구조분해 할당 문제 확인을 위한 명시적 반환
        const returnObj = {
            processedContent: result.content,  // 명시적 매핑
            audioTokens: result.audioTokens
        };
        console.log('🔍 Prepared return object:', returnObj);
        console.log('  - returnObj.processedContent:', JSON.stringify(returnObj.processedContent));
        console.log('  - returnObj.audioTokens:', returnObj.audioTokens);
        
        return returnObj;
    }, [content, enableAudioProcessing, audioParser]);
    
    // useMemo 결과 검증
    console.log('🔍 After useMemo destructuring:');
    console.log('  - processedContent:', JSON.stringify(processedContent));
    console.log('  - typeof processedContent:', typeof processedContent);
    console.log('  - processedContent === undefined:', processedContent === undefined);
    console.log('  - audioTokens:', audioTokens);
    console.log('  - audioTokens.length:', audioTokens?.length);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            audioResolver.cleanup();
        };
    }, [audioResolver]);

    // 오디오 토큰을 React 컴포넌트로 변환
    const renderContentWithAudio = (markdownContent: string) => {
        console.log('\n🎨 renderContentWithAudio() START');
        console.log('📥 Received markdownContent:', JSON.stringify(markdownContent));
        console.log('🎯 audioTokens count:', audioTokens.length);
        console.log('🎯 audioTokens detail:', audioTokens);
        
        // 안전한 기본값 설정
        console.log('🔍 markdownContent parameter analysis:');
        console.log('  - markdownContent raw:', markdownContent);
        console.log('  - typeof markdownContent:', typeof markdownContent);
        console.log('  - markdownContent === undefined:', markdownContent === undefined);
        console.log('  - markdownContent === null:', markdownContent === null);
        console.log('  - markdownContent === "":', markdownContent === '');
        
        const safeMarkdownContent = markdownContent || '';
        console.log('✅ safeMarkdownContent:', JSON.stringify(safeMarkdownContent));
        console.log('  - safeMarkdownContent length:', safeMarkdownContent.length);
        
        if (!enableAudioProcessing || audioTokens.length === 0) {
            console.log('⏭️  No audio processing needed, returning as-is');
            return { content: safeMarkdownContent, placeholders: {} };
        }

        // 마크다운 오디오 문법을 임시 플레이스홀더로 변환
        let contentWithPlaceholders = safeMarkdownContent;
        const placeholders: { [key: string]: AudioToken } = {};
        const validTokens: AudioToken[] = [];

        console.log('🔄 Starting token processing...');
        audioTokens.forEach((token, index) => {
            console.log(`\n🎯 Processing token ${index}:`, token);
            
            // 방어적 검증: 필수 필드 확인
            if (!token || !token.originalMatch || !token.url || !token.title) {
                console.warn(`❌ Invalid audio token at index ${index}:`, token);
                return;
            }

            // originalMatch가 현재 콘텐츠에 실제로 존재하는지 확인
            console.log('🔍 Checking originalMatch in content:');
            console.log('  - originalMatch:', JSON.stringify(token.originalMatch));
            console.log('  - originalMatch length:', token.originalMatch.length);
            console.log('  - content:', JSON.stringify(contentWithPlaceholders));
            console.log('  - content length:', contentWithPlaceholders.length);
            
            // 문자별 비교 디버깅
            const isValidMatch = contentWithPlaceholders.includes(token.originalMatch);
            console.log('  - includes() result:', isValidMatch);
            
            if (!isValidMatch) {
                console.warn(`❌ Audio token originalMatch not found in content!`);
                console.log('🔬 Character-level debugging:');
                
                // 첫 50자 비교
                const contentStart = contentWithPlaceholders.substring(0, 50);
                const tokenStart = token.originalMatch.substring(0, 50);
                console.log('  - content start:', JSON.stringify(contentStart));
                console.log('  - token start:', JSON.stringify(tokenStart));
                
                // indexOf 시도
                const indexOfResult = contentWithPlaceholders.indexOf(token.originalMatch);
                console.log('  - indexOf result:', indexOfResult);
                
                // 부분 매치 시도
                const titleMatch = contentWithPlaceholders.includes(`[audio:${token.title}]`);
                const urlMatch = contentWithPlaceholders.includes(token.url);
                console.log('  - title portion match:', titleMatch);
                console.log('  - url portion match:', urlMatch);
                
                return;
            }

            console.log('✅ originalMatch found in content, proceeding...');
            const placeholder = `{{AUDIO_PLACEHOLDER_${validTokens.length}}}`;
            placeholders[placeholder] = token;
            console.log('🏷️  Generated placeholder:', placeholder);
            
            try {
                const beforeReplace = contentWithPlaceholders;
                contentWithPlaceholders = contentWithPlaceholders.replace(
                    token.originalMatch,
                    placeholder
                );
                console.log('🔄 Replace operation:');
                console.log('  - BEFORE:', JSON.stringify(beforeReplace));
                console.log('  - AFTER:', JSON.stringify(contentWithPlaceholders));
                
                validTokens.push(token);
                console.log('✅ Token processed successfully');
            } catch (error) {
                console.error(`💥 Error replacing audio token ${index}:`, error, token);
            }
        });

        // 유효한 토큰만 사용하도록 상태 업데이트
        if (validTokens.length !== audioTokens.length) {
            console.warn(`⚠️ Filtered ${audioTokens.length - validTokens.length} invalid audio tokens`);
        }

        const result = {
            content: contentWithPlaceholders,
            placeholders
        };
        
        console.log('📤 renderContentWithAudio() RESULT:', result);
        return result;
    };

    // renderContentWithAudio 호출 전 최종 검증
    console.log('🚀 About to call renderContentWithAudio:');
    console.log('  - processedContent value:', JSON.stringify(processedContent));
    console.log('  - processedContent type:', typeof processedContent);
    console.log('  - processedContent length:', processedContent?.length);
    
    const { content: renderContent, placeholders } = renderContentWithAudio(processedContent);
    
    console.log('🏁 renderContentWithAudio completed:');
    console.log('  - renderContent:', JSON.stringify(renderContent));
    console.log('  - placeholders keys:', Object.keys(placeholders));

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
                    // 플레이스홀더가 있는 단락을 div로 처리하여 DOM 중첩 에러 방지
                    p({ children }) {
                        console.log('\n📄 ReactMarkdown p() component called');
                        console.log('  - children:', children);
                        console.log('  - typeof children:', typeof children);
                        console.log('  - children length:', React.Children.count(children));
                        console.log('  - placeholders object exists:', !!placeholders);
                        console.log('  - placeholders keys:', Object.keys(placeholders || {}));
                        
                        // 오디오 플레이스홀더가 있는지 확인
                        const hasAudioPlaceholder = React.Children.toArray(children).some(child => 
                            typeof child === 'string' && /{{AUDIO_PLACEHOLDER_\d+}}/.test(child)
                        );
                        
                        console.log('  🎯 Has audio placeholder:', hasAudioPlaceholder);
                        
                        const processedChildren = React.Children.map(children, (child, childIndex) => {
                            console.log(`\n🔍 Processing child ${childIndex}:`, child, typeof child);
                            
                            if (typeof child === 'string') {
                                console.log('  📝 String child detected, splitting for placeholders');
                                // 플레이스홀더를 오디오 컴포넌트로 교체
                                const parts = child.split(/({{AUDIO_PLACEHOLDER_\d+}})/);
                                console.log('  🔪 Split result:', parts);
                                console.log('  📊 Parts count:', parts.length);
                                return parts.map((part, partIndex) => {
                                    console.log(`\n  🧩 Processing part ${partIndex}:`, JSON.stringify(part));
                                    console.log(`    - part length:`, part.length);
                                    console.log(`    - placeholders exists:`, !!placeholders);
                                    console.log(`    - placeholders[part] exists:`, !!(placeholders && placeholders[part]));
                                    
                                    if (placeholders && placeholders[part]) {
                                        console.log(`    ✅ MATCH! Creating AudioComponent for:`, part);
                                        console.log(`    🎯 Token data:`, placeholders[part]);
                                        return (
                                            <AudioComponent
                                                key={`audio-${partIndex}`}
                                                token={placeholders[part]}
                                                resolver={audioResolver}
                                            />
                                        );
                                    } else {
                                        console.log(`    ❌ NO MATCH - returning text:`, JSON.stringify(part));
                                        if (placeholders) {
                                            console.log(`    🔍 Available placeholder keys:`, Object.keys(placeholders));
                                            console.log(`    🔍 Looking for key:`, JSON.stringify(part));
                                            console.log(`    🔍 Key comparison results:`);
                                            Object.keys(placeholders).forEach(key => {
                                                console.log(`      - "${key}" === "${part}":`, key === part);
                                                console.log(`      - "${key}" length:`, key.length, `"${part}" length:`, part.length);
                                            });
                                        }
                                    }
                                    return part || null;
                                });
                            }
                            return child;
                        });

                        console.log('📤 ReactMarkdown p() returning processed children:', processedChildren);
                        console.log('  📊 Processed children count:', React.Children.count(processedChildren));
                        console.log('  🔍 Processed children types:', processedChildren?.map((child, i) => 
                            `${i}: ${typeof child} ${child?.type?.name || 'unknown'}`
                        ));

                        // 오디오 플레이스홀더가 있으면 div로, 없으면 p로 렌더링
                        if (hasAudioPlaceholder) {
                            return <div className="markdown-paragraph-with-audio">{processedChildren}</div>;
                        } else {
                            return <p>{processedChildren}</p>;
                        }
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