import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  return (
    <div className={className || 'prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:text-muted-foreground prose-a:text-primary'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // 인라인 코드 처리
          code({ node, inline, className, children, ...props }) {
            // 인라인 코드
            if (inline) {
              return (
                <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded" {...props}>
                  {children}
                </code>
              );
            }
            
            // 코드 블록 - 디스코드 스타일
            return (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 my-2">
                <code className="block whitespace-pre overflow-x-auto text-sm" {...props}>
                  {String(children).replace(/\n$/, '')}
                </code>
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
            return <a href={href} className="text-blue-500 hover:underline" target="_blank" rel="noreferrer">{children}</a>;
          },
          // 인용구
          blockquote({ children }) {
            return <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 py-1 my-2">{children}</div>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
