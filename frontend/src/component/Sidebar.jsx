import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import categories from "../Commands.json";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import remarkGfm from "remark-gfm";

export const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    const handleCategoryClick = (category) => {
        setExpandedCategory((prev) => (prev === category ? null : category));
    };

    const handleSubcategoryClick = (category, subcategory) => {
        const slug = categories[category]?.[subcategory];
        if (!slug) {
            console.error("슬러그를 찾을 수 없습니다:", category, subcategory);
            return;
        }
        navigate(`/${category.toLowerCase().replace(/ /g, "-")}/${slug}`);
    };

    const getIsActive = (category, subcategory) => {
        const slug = categories[category]?.[subcategory];
        return location.pathname.endsWith(`/${slug}`);
    };

    return (
        <div>
            <button
                onClick={toggleSidebar}
                className={`fixed top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1.5 shadow-md border border-gray-200 hover:bg-gray-50 z-10 transition-all duration-300 ${
                    isCollapsed ? "left-0" : "left-60"
                }`}
            >
                <ChevronLeft
                    size={18}
                    className={`text-gray-500 transform transition-transform ${
                        isCollapsed ? "rotate-180" : ""
                    }`}
                />
            </button>

            <nav
                className={`${
                    isCollapsed ? "hidden" : "w-64"
                } bg-white border-r border-gray-200 min-h-screen p-4 select-none transition-all duration-300 fixed top-0 left-0 h-full`}
            >
                <div className="transition-opacity sticky top-0 overflow-y-auto h-full">
                    <div className="mb-8 pl-2">
                        <h1
                            className="text-xl font-semibold text-gray-800 cursor-pointer hover:text-gray-900 transition-colors"
                            onClick={() => navigate("/")}
                        >
                            뱜냥이 사용설명서
                        </h1>
                    </div>

                    <div className="space-y-1">
                        {Object.entries(categories).map(
                            ([category, subcategories]) => (
                                <div key={category}>
                                    <button
                                        onClick={() =>
                                            handleCategoryClick(category)
                                        }
                                        className="w-full flex items-center justify-between px-3 py-2.5 text-left rounded-lg hover:bg-gray-50 transition-colors"
                                        aria-expanded={
                                            expandedCategory === category
                                        }
                                    >
                                        <span className="text-gray-700 font-medium">
                                            {category}
                                        </span>
                                        {expandedCategory === category ? (
                                            <ChevronDown
                                                size={18}
                                                className="text-gray-500 ml-2 transform transition-transform"
                                            />
                                        ) : (
                                            <ChevronRight
                                                size={18}
                                                className="text-gray-500 ml-2 transform transition-transform"
                                            />
                                        )}
                                    </button>

                                    {expandedCategory === category && (
                                        <div className="ml-4 mt-1 space-y-1">
                                            {Object.keys(subcategories).map(
                                                (subcategory) => {
                                                    const isActive =
                                                        getIsActive(
                                                            category,
                                                            subcategory
                                                        );
                                                    return (
                                                        <button
                                                            key={subcategory}
                                                            onClick={() =>
                                                                handleSubcategoryClick(
                                                                    category,
                                                                    subcategory
                                                                )
                                                            }
                                                            className={`w-full block px-3 py-2 text-sm rounded-lg transition-colors
                                                        ${
                                                            isActive
                                                                ? "bg-blue-50 text-blue-700 font-medium"
                                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                                        }
                                                    `}
                                                            aria-current={
                                                                isActive
                                                                    ? "page"
                                                                    : undefined
                                                            }
                                                        >
                                                            <span className="text-left inline-block w-full">
                                                                {subcategory}
                                                            </span>
                                                        </button>
                                                    );
                                                }
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </nav>
        </div>
    );
};
