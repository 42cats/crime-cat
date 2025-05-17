import React from "react";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
    LayoutDashboard,
    Server,
    Users,
    UserCog,
    UserRoundPen,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Coins,
    Bell,
    History,
    Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    SidebarProvider,
    Sidebar,
    SidebarContent,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/hooks/useTheme";

const DashboardLayout: React.FC = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const location = useLocation();
    const isMobile = useIsMobile();
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    return (
        <SidebarProvider>
            <MobileSidebarToggle />
            <div className="flex min-h-screen w-full bg-muted/30 dark:bg-background">
                {/* 사이드바 */}
                <div className="relative z-10">
                    <Sidebar
                        collapsible="icon"
                        className="min-h-screen border-r"
                        >
                        <SidebarInner />
                    </Sidebar>
                </div>

                {/* 메인 콘텐츠 */}
                <main className="flex-1 flex items-start justify-center">
                    <div className="w-full max-w-6xl px-6 py-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
};

const MobileSidebarToggle = () => {
    const isMobile = useIsMobile();
    const { toggleSidebar } = useSidebar();
    
    if (!isMobile) return null;
    
    return (
        <div className="fixed top-4 left-4 z-50">
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-10 w-10 border rounded-md bg-background shadow-md"
                >
                <Menu className="w-6 h-6" />
                <span className="sr-only">사이드바 열기</span>
            </Button>
        </div>
    );
};

const SidebarInner = () => {
    const { state } = useSidebar();
    const { user, logout } = useAuth();
    const location = useLocation();
    const isCollapsed = state === "collapsed";
    const { theme } = useTheme(); // theme === "light" | "dark" | "system"
    
    return (
        <>
            {!isCollapsed && (
                <div className="flex h-14 justify-between items-center px-4 border-b">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="relative w-10 h-10 overflow-hidden">
                            <img
                                src={
                                    theme === "dark"
                                    ? "/content/image/logo_dark.png"
                                    : "/content/image/logo_light.png"
                                }
                                alt="미스터리 플레이스 로고"
                                className="w-full h-full object-cover"
                                />
                        </div>
                        <div className="relative w-20 h-15 overflow-hidden">
                            <img
                                src={
                                    theme === "dark"
                                        ? "/content/image/mystery_place_dark.png"
                                        : "/content/image/mystery_place_light.png"
                                }
                                alt="미스터리 플레이스 latter"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </Link>
                    <div className="ml-auto">
                        <ThemeToggle />
                    </div>
                </div>
            )}

            <SidebarContent>
                <ScrollArea className="h-[calc(100vh-8rem)]">
                    <div className="px-3 py-2">
                        {!isCollapsed && (
                            <>
                                <div className="mb-6">
                                    <div className="px-4 py-2">
                                        <p className="text-xs font-medium text-muted-foreground">
                                            주요 메뉴
                                        </p>
                                    </div>
                                    <nav className="grid gap-1">
                                        {[
                                            {
                                                name: "대시보드",
                                                path: "/dashboard",
                                                icon: LayoutDashboard,
                                                roles: [
                                                    "ADMIN",
                                                    "MANAGER",
                                                    "USER",
                                                ],
                                            },
                                            {
                                                name: "알림",
                                                path: "/dashboard/notifications",
                                                icon: Bell,
                                                roles: [
                                                    "ADMIN",
                                                    "MANAGER",
                                                    "USER",
                                                ],
                                            },
                                            {
                                                name: "길드",
                                                path: "/dashboard/guilds",
                                                icon: Server,
                                                roles: [
                                                    "ADMIN",
                                                    "MANAGER",
                                                    "USER",
                                                ],
                                            },
                                            {
                                                name: "플레이기록",
                                                path: "/dashboard/users/my-history",
                                                icon: History,
                                                roles: [
                                                    "ADMIN",
                                                    "MANAGER",
                                                    "USER",
                                                ],
                                            },
                                            {
                                                name: "포인트 내역",
                                                path: "/dashboard/point-history",
                                                icon: Coins,
                                                roles: [
                                                    "ADMIN",
                                                    "MANAGER",
                                                    "USER",
                                                ],
                                            },
                                            {
                                                name: "프로필",
                                                path: "/dashboard/profile",
                                                icon: UserRoundPen,
                                                roles: [
                                                    "ADMIN",
                                                    "MANAGER",
                                                    "USER",
                                                ],
                                            },
                                            {
                                                name: "팀",
                                                path: "/dashboard/teams",
                                                icon: Users,
                                                roles: [
                                                    "ADMIN",
                                                    "MANAGER",
                                                    "USER",
                                                ],
                                            },
                                            {
                                                name: "사용자 관리",
                                                path: "/dashboard/users",
                                                icon: UserCog,
                                                roles: ["ADMIN"],
                                            },
                                            {
                                                name: "설정",
                                                path: "/dashboard/settings",
                                                icon: Settings,
                                                roles: ["ADMIN", "MANAGER"],
                                            },
                                        ]
                                            .filter((item) =>
                                                item.roles.includes(
                                                    user?.role || "USER"
                                                )
                                            )
                                            .map((item) => (
                                                <Link
                                                    key={item.path}
                                                    to={item.path}
                                                    className={`group flex items-center gap-x-3 rounded-md px-3 py-2 transition-colors
                            ${
                                location.pathname === item.path
                                    ? "text-foreground bg-muted"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            }
                            justify-start`}
                                                >
                                                    <item.icon className="h-4 w-4" />
                                                    <span className="text-sm font-medium">
                                                        {item.name}
                                                    </span>
                                                </Link>
                                            ))}
                                    </nav>
                                </div>

                                <Separator className="my-4" />

                                <div className="px-4 py-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        사용자
                                    </p>
                                </div>

                                <div className="px-3 py-2">
                                    <div className="flex items-center gap-x-3">
                                        <img
                                            src={user?.profile_image_path}
                                            alt={user?.nickname}
                                            className="h-8 w-8 rounded-full"
                                        />
                                        <div className="flex flex-col">
                                            <p className="text-sm font-medium">
                                                {user?.nickname}
                                            </p>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {user?.role}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={logout}
                                    variant="ghost"
                                    className="w-full justify-start text-muted-foreground hover:text-destructive mt-1"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    로그아웃
                                </Button>
                            </>
                        )}
                    </div>
                </ScrollArea>
            </SidebarContent>

            {/* 데스크탑용 사이드바 토글 버튼 */}
            <div className="absolute top-1/2 -translate-y-1/2 right-[-1rem] z-20 hidden md:block">
                <SidebarTrigger>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0 border rounded-md bg-background shadow-md"
                    >
                        {isCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </Button>
                </SidebarTrigger>
            </div>
        </>
    );
};

export default DashboardLayout;
