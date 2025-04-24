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
import Commands from "@/pages/Commands";
import CommandDetail from "@/pages/CommandDetail";
import CreateCommand from "@/pages/CreateCommand";
import EditCommand from "@/pages/EditCommand";
import Themes from "@/pages/Themes";
import ThemeDetail from "@/pages/ThemeDetail";
import CreateTheme from "@/pages/CreateTheme";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import TermsPage from '@/pages/TermsPage';
import PrivacyPage from "./pages/PrivacyPage";
import ContactPage from '@/pages/ContactPage';
import DonationPage from '@/pages/DonationPage';
import Unauthorized from "@/pages/Unauthorized";

// Dashboard Pages
import Dashboard from "@/pages/Dashboard";
import Guilds from "@/pages/Guilds";
import Profile from "@/pages/Profile";
import MessageFormat from "@/pages/MessageButtonEditor";

import { queryClient } from '@/lib/reactQuery'

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
                <Route path="/themes" element={<Themes />} />
                <Route path="/themes/:id" element={<ThemeDetail />} />
                <Route path="/themes/new" element={<CreateTheme />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/donate" element={<DonationPage />} />
              </Route>

              {/* Dashboard Layout Routes */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="guilds" element={<Guilds />} />
                <Route path="guilds/:guildId/message-format" element={<MessageFormat />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />

              <Route path="/unauthorized" element={<Unauthorized />} />
            </Routes>
          </AnimatePresence>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </RecoilRoot>
);

export default App;