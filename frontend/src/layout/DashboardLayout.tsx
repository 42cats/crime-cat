import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  LayoutDashboard, 
  Server, 
  Users, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  PanelLeft 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarProvider, Sidebar, SidebarContent, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

const DashboardLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <SidebarProvider>
      <DashboardContent user={user} logout={logout} location={location} />
    </SidebarProvider>
  );
};

const DashboardContent = ({ user, logout, location }: { user: any, logout: () => void, location: any }) => {
  const { isMobile, toggleSidebar } = useSidebar();

  const navItems = [
    { name: '개요', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER'] },
    { name: '길드', path: '/dashboard/guilds', icon: Server, roles: ['ADMIN', 'MANAGER', 'USER'] },
    { name: '사용자 관리', path: '/dashboard/users', icon: Users, roles: ['ADMIN'] },
    { name: '설정', path: '/dashboard/settings', icon: Settings, roles: ['ADMIN', 'MANEGER'] },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role || 'USER'));

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <div className="min-h-screen flex w-full">
        {/* ✅ 모바일 토글 버튼 */}
        {isMobile && (
          <div className="fixed top-4 left-4 z-50 md:hidden">
            <Button onClick={toggleSidebar} variant="ghost" className="h-10 w-10 p-0">
              <PanelLeft />
            </Button>
          </div>
        )}

        {/* 사이드바 */}
        <Sidebar collapsible="icon" className="border-r">
          <div className="flex h-14 items-center px-4 border-b">
            <Link to="/" className="flex items-center space-x-2">
              <div className="relative w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">B</div>
              <span className="text-lg font-semibold">대시보드</span>
            </Link>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>

          <SidebarContent>
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="px-3 py-2">
                <div className="mb-6">
                  <div className="px-4 py-2">
                    <p className="text-xs font-medium text-muted-foreground">주요 메뉴</p>
                  </div>
                  <nav className="grid gap-1">
                    {filteredNavItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`group flex items-center gap-x-3 rounded-md px-3 py-2 transition-colors
                          ${isActive(item.path)
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{item.name}</span>
                      </Link>
                    ))}
                  </nav>
                </div>

                <Separator className="my-4" />

                <div className="px-4 py-2">
                  <p className="text-xs font-medium text-muted-foreground">사용자</p>
                </div>

                <div className="px-3 py-2">
                  <div className="flex items-center gap-x-3">
                    <img src={user?.avatar} alt={user?.nickname} className="h-8 w-8 rounded-full" />
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{user?.nickname}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
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
              </div>
            </ScrollArea>
          </SidebarContent>

          <div className="mt-auto h-12 border-t flex items-center px-4">
            <SidebarTrigger>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-70">
                <ChevronLeft className="h-4 w-4 sidebar-expanded:hidden" />
                <ChevronRight className="h-4 w-4 hidden sidebar-expanded:block" />
              </Button>
            </SidebarTrigger>
          </div>
        </Sidebar>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 overflow-auto">
          <div className="container px-6 py-8 max-w-6xl">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;