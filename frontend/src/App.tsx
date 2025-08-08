import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthInitializer from "@/components/AuthInitializer";
import PrivateRoute from "@/components/PrivateRoute";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { RecoilRoot } from "recoil";
import { SEOProvider } from "@/components/seo";
import { useAudioService } from "@/hooks/useAudioService";
import { useRouterAudioCleanup } from "@/hooks/useRouterAudioCleanup";
import { audioService } from "@/services/AudioService";
import { audioManager } from "@/services/AudioManager";

// Types
import { BoardType } from "@/lib/types/board";

// Community Write
import BoardWrite from "@/pages/community/BoardWrite";

// Layouts
import MainLayout from "@/layout/MainLayout";
import DashboardLayout from "@/layout/DashboardLayout";

// Main Pages
import Index from "@/pages/Index";
import Commands from "@/pages/commands/Commands";
import CommandDetail from "@/pages/commands/CommandDetail";
import CreateCommand from "@/pages/commands/CreateCommand";
import EditCommand from "@/pages/commands/EditCommand";
import ThemeList from "@/pages/themes/ThemeList";
import ThemeDetailRouter from "@/components/themes/router/ThemeDetailRouter";
import CreateTheme from "@/pages/themes/CreateTheme";
import EditTheme from "@/pages/themes/EditTheme";
import Login from "@/pages/Login";
import LoginError from "@/pages/LoginError";
import NotFound from "@/pages/NotFound";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import ContactPage from "@/pages/ContactPage";
import DonationPage from "@/pages/DonationPage";
import Unauthorized from "@/pages/Unauthorized";
import NoticeList from "@/pages/notices/NoticeList";
import NoticeDetail from "@/pages/notices/NoticeDetail";
import CreateNotice from "@/pages/notices/CreateNotice";
import EditNotice from "@/pages/notices/EditNotice";
import NotificationListPage from "@/pages/notifications/NotificationListPage";
import ProfilePage from "@/pages/profile/ProfilePage";
import PostsPage from "@/pages/posts/PostsPage";
import PostDetailPage from "@/pages/posts/PostDetailPage";
import PostEditorPage from "@/pages/posts/PostEditorPage";
import FollowsPage from "@/pages/dashboard/follows/FollowsPage";

// Community Pages
import QuestionBoard from "@/pages/community/QuestionBoard";
import FreeBoard from "@/pages/community/FreeBoard";
import CreatorBoard from "@/pages/community/CreatorBoard";
import QuestionPostDetail from "@/pages/community/QuestionPostDetail";
import FreePostDetail from "@/pages/community/FreePostDetail";
import CreatorPostDetail from "@/pages/community/CreatorPostDetail";

// Dashboard Pages
import Dashboard from "@/pages/dashboard/Dashboard";
import Guilds from "@/pages/dashboard/Guilds";
import Profile from "@/pages/dashboard/Profile";
import MessageFormat from "@/pages/MessageButtonEditor";
import Teams from "@/pages/dashboard/Teams";
import PointHistoryPage from "@/pages/PointHistory/PointHistoryPage";

// Admin Pages
import UserRoleManagementPage from "@/pages/admin/UserRoleManagementPage";
import CouponManagementPage from "@/pages/admin/CouponManagementPage";
import LocationMappingPage from "@/pages/admin/LocationMappingPage";
import PointMonitoringPage from "./pages/admin/point-monitoring";
import ThemeAdsPage from "./pages/admin/theme-ads";
import ThemeAdvertisements from "@/pages/themes/ThemeAdvertisements";
import ThemeAdvertisementStats from "@/pages/dashboard/ThemeAdvertisementStats";

// SNS Pages
import SNSFeedPage from "@/pages/sns/SNSFeedPage";
import SNSExplorePage from "@/pages/sns/SNSExplorePage";
import SNSCreatePage from "@/pages/sns/SNSCreatePage";
import SNSPostDetailPage from "@/pages/sns/SNSPostDetailPage";
import SNSMyPostsPage from "@/pages/sns/SNSMyPostsPage";

import { queryClient } from "@/lib/reactQuery";
import GameHistoryManager from "@/pages/GameHistoryOwnerBoard";
import UserGameHistoryPage from "@/pages/UserGameHistoryPage";
import UserGameHistoryPageV2 from "@/pages/UserGameHistoryPageV2";
import GameComparisonPage from "@/pages/GameComparisonPage";
import ButtonAutomationPage from "@/pages/dashboard/ButtonAutomationPage";

// Router 내부에서 실행되는 컴포넌트 (useLocation 사용 가능)
const AppContent = () => {
    const location = useLocation();
    
    // 전역 AudioService 메모리 관리
    useAudioService();
    
    // 페이지 변경 시 오디오 자동 정리 (참조 카운팅 시스템과 함께 작동)
    useRouterAudioCleanup();

    return (
        <>
            <AuthInitializer />
            <AnimatePresence mode="wait" onExitComplete={() => {
                audioManager.forceStopAll();
            }}>
                        <Routes>
                            {/* Main Layout Routes */}
                            <Route element={<MainLayout />}>
                                <Route path="/" element={<Index />} />
                                <Route
                                    path="/commands"
                                    element={<Commands />}
                                />
                                <Route
                                    path="/commands/:id"
                                    element={<CommandDetail />}
                                />
                                <Route
                                    path="/commands/new"
                                    element={
                                        <PrivateRoute
                                            allowedRoles={["ADMIN", "MANAGER"]}
                                        >
                                            <CreateCommand />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/commands/edit/:id"
                                    element={
                                        <PrivateRoute
                                            allowedRoles={["ADMIN", "MANAGER"]}
                                        >
                                            <EditCommand />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/notices"
                                    element={<NoticeList />}
                                />
                                <Route
                                    path="/notices/:id"
                                    element={<NoticeDetail />}
                                />
                                <Route
                                    path="/notices/new"
                                    element={
                                        <PrivateRoute
                                            allowedRoles={["ADMIN", "MANAGER"]}
                                        >
                                            <CreateNotice />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/notices/edit/:id"
                                    element={
                                        <PrivateRoute
                                            allowedRoles={["ADMIN", "MANAGER"]}
                                        >
                                            <EditNotice />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/themes/:category"
                                    element={<ThemeList />}
                                />
                                <Route
                                    path="/themes/:category/:id"
                                    element={<ThemeDetailRouter />}
                                />
                                <Route
                                    path="/themes/new"
                                    element={<CreateTheme />}
                                />
                                <Route
                                    path="/themes/edit/:id"
                                    element={<EditTheme />}
                                />

                                {/* SNS 라우트 */}
                                <Route
                                    path="/sns/feed"
                                    element={<SNSFeedPage />}
                                />
                                <Route
                                    path="/sns/explore"
                                    element={<SNSExplorePage />}
                                />
                                <Route
                                    path="/sns/create"
                                    element={<SNSCreatePage />}
                                />
                                <Route
                                    path="/sns/post/:postId"
                                    element={<SNSPostDetailPage />}
                                />
                                <Route
                                    path="/sns/my-posts"
                                    element={<SNSMyPostsPage />}
                                />
                                <Route
                                    path="/sns/hashtag/:tagName"
                                    element={<SNSExplorePage />}
                                />

                                {/* 커뮤니티 게시판 라우트 - 순서가 중요합니다! 더 구체적인 경로가 먼저 와야 합니다 */}
                                {/* 질문게시판 */}
                                <Route
                                    path="/community/question/new"
                                    element={
                                        <BoardWrite
                                            boardType={BoardType.QUESTION}
                                        />
                                    }
                                />
                                <Route
                                    path="/community/question/edit/:id"
                                    element={
                                        <BoardWrite
                                            boardType={BoardType.QUESTION}
                                        />
                                    }
                                />
                                <Route
                                    path="/community/question/:id"
                                    element={<QuestionPostDetail />}
                                />
                                <Route
                                    path="/community/question"
                                    element={<QuestionBoard />}
                                />

                                {/* 자유게시판 */}
                                <Route
                                    path="/community/chat/new"
                                    element={
                                        <BoardWrite
                                            boardType={BoardType.CHAT}
                                        />
                                    }
                                />
                                <Route
                                    path="/community/chat/edit/:id"
                                    element={
                                        <BoardWrite
                                            boardType={BoardType.CHAT}
                                        />
                                    }
                                />
                                <Route
                                    path="/community/chat/:id"
                                    element={<FreePostDetail />}
                                />
                                <Route
                                    path="/community/chat"
                                    element={<FreeBoard />}
                                />

                                {/* 제작자게시판 */}
                                <Route
                                    path="/community/creator/new"
                                    element={
                                        <BoardWrite
                                            boardType={BoardType.CREATOR}
                                        />
                                    }
                                />
                                <Route
                                    path="/community/creator/edit/:id"
                                    element={
                                        <BoardWrite
                                            boardType={BoardType.CREATOR}
                                        />
                                    }
                                />
                                <Route
                                    path="/community/creator/:id"
                                    element={<CreatorPostDetail />}
                                />
                                <Route
                                    path="/community/creator"
                                    element={<CreatorBoard />}
                                />

                                {/* 동적 경로를 위한 추가 라우트 */}
                                <Route
                                    path="/community/:boardType/new"
                                    element={<BoardWrite />}
                                />

                                <Route path="/terms" element={<TermsPage />} />
                                <Route
                                    path="/privacy"
                                    element={<PrivacyPage />}
                                />
                                <Route path="/login" element={<Login />} />
                                <Route
                                    path="/login-error"
                                    element={<LoginError />}
                                />
                                <Route
                                    path="/contact"
                                    element={<ContactPage />}
                                />
                                <Route
                                    path="/donate"
                                    element={<DonationPage />}
                                />
                                <Route
                                    path="/profile/:userId"
                                    element={<ProfilePage />}
                                />
                            </Route>

                            {/* Dashboard Layout Routes */}
                            <Route
                                path="/dashboard"
                                element={<DashboardLayout />}
                            >
                                <Route index element={<Dashboard />} />
                                <Route path="guilds" element={<Guilds />} />
                                <Route
                                    path="guilds/message-format"
                                    element={<MessageFormat />}
                                />
                                <Route
                                    path="guilds/automation/:guildId"
                                    element={<ButtonAutomationPage />}
                                />
                                <Route
                                    path="guilds/crime-scene-history"
                                    element={<GameHistoryManager />}
                                />
                                <Route
                                    path="users/my-history"
                                    element={<UserGameHistoryPage />}
                                />
                                <Route
                                    path="users/my-history-v2"
                                    element={<UserGameHistoryPageV2 />}
                                />
                                <Route
                                    path="game-comparison"
                                    element={<GameComparisonPage />}
                                />
                                <Route
                                    path="point-history"
                                    element={<PointHistoryPage />}
                                />
                                <Route
                                    path="notifications"
                                    element={<NotificationListPage />}
                                />
                                <Route path="posts" element={<PostsPage />} />
                                <Route
                                    path="posts/:postId"
                                    element={<PostDetailPage />}
                                />
                                <Route
                                    path="posts/new"
                                    element={<PostEditorPage />}
                                />
                                <Route
                                    path="posts/edit/:postId"
                                    element={<PostEditorPage />}
                                />
                                <Route path="profile" element={<Profile />} />
                                <Route path="teams" element={<Teams />} />
                                <Route
                                    path="follows"
                                    element={<FollowsPage />}
                                />
                                <Route
                                    path="theme-ads"
                                    element={<ThemeAdvertisements />}
                                />
                                <Route
                                    path="theme-ad-stats"
                                    element={<ThemeAdvertisementStats />}
                                />

                                {/* 관리자 페이지 라우트 */}
                                <Route
                                    path="admin/user-role"
                                    element={
                                        <PrivateRoute allowedRoles={["ADMIN"]}>
                                            <UserRoleManagementPage />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="admin/coupon"
                                    element={
                                        <PrivateRoute allowedRoles={["ADMIN"]}>
                                            <CouponManagementPage />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="admin/location-mappings"
                                    element={
                                        <PrivateRoute
                                            allowedRoles={["ADMIN", "MANAGER"]}
                                        >
                                            <LocationMappingPage />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="admin/point-monitoring"
                                    element={
                                        <PrivateRoute
                                            allowedRoles={["ADMIN", "MANAGER"]}
                                        >
                                            <PointMonitoringPage />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="admin/theme-ads"
                                    element={
                                        <PrivateRoute
                                            allowedRoles={["ADMIN", "MANAGER"]}
                                        >
                                            <ThemeAdsPage />
                                        </PrivateRoute>
                                    }
                                />
                            </Route>

                            {/* 404 Route */}
                            <Route path="*" element={<NotFound />} />

                            <Route
                                path="/unauthorized"
                                element={<Unauthorized />}
                            />
                        </Routes>
            </AnimatePresence>
        </>
    );
};

const App = () => {
    return (
        <RecoilRoot>
            <QueryClientProvider client={queryClient}>
                <SEOProvider>
                    <TooltipProvider>
                        <Toaster />
                        <Sonner />
                        <BrowserRouter>
                            <AppContent />
                        </BrowserRouter>
                    </TooltipProvider>
                </SEOProvider>
            </QueryClientProvider>
        </RecoilRoot>
    );
};

export default App;
