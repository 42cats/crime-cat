import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthInitializer from "@/components/AuthInitializer";
import PrivateRoute from "@/components/PrivateRoute";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { RecoilRoot } from "recoil";

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
import ThemeDetail from "@/pages/themes/ThemeDetail";
import CreateTheme from "@/pages/themes/CreateTheme";
import EditTheme from "@/pages/themes/EditTheme";
import Login from "@/pages/Login";
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

// Dashboard Pages
import Dashboard from "@/pages/dashboard/Dashboard";
import Guilds from "@/pages/dashboard/Guilds";
import Profile from "@/pages/dashboard/Profile";
import MessageFormat from "@/pages/MessageButtonEditor";
import Teams from "@/pages/dashboard/Teams";
import PointHistoryPage from "@/pages/PointHistory/PointHistoryPage";

import { queryClient } from "@/lib/reactQuery";
import GameHistoryManager from "@/pages/GameHistoryOwnerBoard";
import UserGameHistoryPage from "@/pages/UserGameHistoryPage";

const App = () => (
  <RecoilRoot>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <AuthInitializer />
          <AnimatePresence mode="wait">
            <Routes>
              {/* Main Layout Routes */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/commands" element={<Commands />} />
                <Route path="/commands/:id" element={<CommandDetail />} />
                <Route path="/commands/new"
                       element={<PrivateRoute allowedRoles={['ADMIN', 'MANAGER']}>
                                  <CreateCommand />
                                </PrivateRoute>} />
                <Route path="/commands/edit/:id"
                       element={<PrivateRoute allowedRoles={['ADMIN', 'MANAGER']}>
                                  <EditCommand />
                                </PrivateRoute>} />
                <Route path="/notices" element={<NoticeList />} />
                <Route path="/notices/:id" element={<NoticeDetail />} />
                <Route path="/notices/new" 
                       element={<PrivateRoute allowedRoles={['ADMIN', 'MANAGER']}>
                                  <CreateNotice />
                                </PrivateRoute>} />
                <Route path="/notices/edit/:id" 
                       element={<PrivateRoute allowedRoles={['ADMIN', 'MANAGER']}>
                                  <EditNotice />
                                 </PrivateRoute>} />
                <Route path="/themes/:category" element={<ThemeList />} />
                <Route path="/themes/:category/:id" element={<ThemeDetail />} />
                <Route path="/themes/new" element={<CreateTheme />} />
                <Route path="/themes/:category/edit/:id" element={<EditTheme />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/donate" element={<DonationPage />} />
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
                                    path="guilds/crime-scene-history"
                                    element={<GameHistoryManager />}
                                />
                                <Route
                                    path="users/my-history"
                                    element={<UserGameHistoryPage />}
                                />
                                <Route
                                    path="point-history"
                                    element={<PointHistoryPage />}
                                />
                                <Route
                                    path="notifications"
                                    element={<NotificationListPage />}
                                />
                                <Route path="profile" element={<Profile />} />
                                <Route path="teams" element={<Teams />} />
                            </Route>

                            {/* 404 Route */}
                            <Route path="*" element={<NotFound />} />

                            <Route
                                path="/unauthorized"
                                element={<Unauthorized />}
                            />
                        </Routes>
                    </AnimatePresence>
                </BrowserRouter>
            </TooltipProvider>
        </QueryClientProvider>
    </RecoilRoot>
);

export default App;
