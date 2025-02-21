import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import remarkGfm from "remark-gfm";

export default function ContentArea() { // export default 추가
    const { category, subcategory } = useParams();
    const [markdownContent, setMarkdownContent] = useState("");
    const [notFound, setNotFound] = useState(false);

    const formatText = (text) =>
        text
            ?.split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

    useEffect(() => {
        const fetchMarkdown = async () => {
            try {
                const response = await fetch(`/content/${subcategory}.md`);
                if (response.status === 404) {
                    setNotFound(true);
                    setMarkdownContent("");
                    return;
                }
                const text = await response.text();
                setMarkdownContent(text);
                setNotFound(false);
            } catch (error) {
                setNotFound(true);
                setMarkdownContent("");
            }
        };

        fetchMarkdown();
    }, [subcategory]);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-800 mb-2">
                    {formatText(subcategory)}
                </h1>
                <div className="text-sm text-gray-500">
                    {formatText(category)}
                </div>
            </div>
            <div className="prose prose-gray">
                {notFound ? (
                    <div className="text-center text-gray-600">
                        <h2 className="text-2xl font-bold text-red-500">
                            Page Not Found
                        </h2>
                        <p>
                            The content you're looking for doesn't exist. Please
                            check the URL or select another option from the
                            menu.
                        </p>
                    </div>
                ) : (
                    <ReactMarkdown
                        className="text-gray-600"
                        rehypePlugins={[rehypeRaw, rehypeHighlight, remarkGfm]}
                    >
                        {markdownContent}
                    </ReactMarkdown>
                )}
            </div>
        </div>
    );
}