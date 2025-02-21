import React from "react";
import { Routes, Route } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import ContentArea from "./ContentArea"; // default import로 변경

const WelcomePage = () => {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center">
                <img
                    src="../content/image/icon.png"
                    alt="뱜냥이 소개 이미지"
                    className="w-64 h-auto mx-auto mb-6 rounded-lg shadow-lg"
                />
                <h1 className="text-2xl font-semibold text-gray-800 mb-4">
                    뱀의 해를 맞아 새롭게 업데이트 및 성능 향상을 한 뱜냥이를
                    소개합니다
                </h1>
                <p className="text-gray-600">
                    좌측 메뉴로 뱜냥이에 대해 알아보세요!
                </p>
            </div>
        </div>
    );
};

export const Layout = () => {
    return (
        <div className="flex w-full min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 p-6 transition-all duration-300">
                <Routes>
                    <Route path="/" element={<WelcomePage />} />
                    <Route
                        path="/:category/:subcategory"
                        element={<ContentArea />}
                    />
                </Routes>
            </main>
        </div>
    );
};
