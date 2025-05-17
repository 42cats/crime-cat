import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationIcon } from '@/components/NotificationIcon';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [showSubnav, setShowSubnav] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsThemeOpen(false);
    setShowSubnav(false);
  }, [location.pathname]);

  const navItems = [
    { name: '홈', path: '/' },
    { name: '공지사항', path: '/notices' },
    { name: '명령어', path: '/commands' },
    { name: '테마' }, // path 없음
  ];

  const themeSubItems = [
    { name: '크라임씬', path: '/themes/crimescene' },
    { name: '방탈출', path: '/themes/escape_room' },
    { name: '머더미스터리', path: '/themes/murder_mystery' },
    { name: '리얼월드', path: '/themes/realworld' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      onMouseLeave={() => setShowSubnav(false)}
      className={`w-full z-50 transition-all duration-300 border-b ${isScrolled ? 'glass shadow-sm' : 'bg-transparent'}`}
    >
      <div className="container mx-auto px-6 py-4 transition-all duration-200">
        <div className="flex justify-between items-center">
          {/* 로고 */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="relative w-10 h-10 overflow-hidden">
              <img src="/content/image/logo.png" alt="미스터리 플레이스 로고" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-semibold">미스터리 플레이스</span>
          </Link>

          {/* 데스크탑 메뉴 */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <div
                key={item.name}
                onMouseEnter={() => item.name === '테마' && setShowSubnav(true)}
              >
                {item.path ? (
                  <Link
                    to={item.path}
                    className={`relative text-sm font-medium transition-colors ${
                      isActive(item.path) ? 'text-primary' : 'text-foreground/80 hover:text-foreground'
                    }`}
                  >
                    {item.name}
                    {isActive(item.path) && (
                      <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full" />
                    )}
                  </Link>
                ) : (
                  <span className="relative text-sm font-medium text-foreground/80 hover:text-foreground cursor-pointer">
                    {item.name}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* 사용자 메뉴 */}
          <div className="hidden md:flex items-center space-x-2">
            <ThemeToggle />
            {isAuthenticated && <NotificationIcon />}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative rounded-full">
                    <img src={user?.profile_image_path} alt={user?.nickname} className="w-8 h-8 rounded-full" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center">
                      <User className="mr-2 h-4 w-4" /> <span>대시보드</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" /> <span>로그아웃</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button variant="default" size="sm">로그인</Button>
              </Link>
            )}
          </div>

          {/* 모바일 메뉴 토글 */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            {isAuthenticated && <NotificationIcon />}
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* 데스크탑 테마 서브 메뉴 */}
        {showSubnav && (
          <div className="mt-4 flex justify-center gap-8 animate-fade-slide-in">
            {themeSubItems.map((sub) => (
              <Link
                key={sub.name}
                to={sub.path}
                className="text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 모바일 메뉴 */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass border-t animate-fade-slide-in">
          <div className="py-4 px-6 space-y-4">
            {navItems.map((item) => (
              <div key={item.name}>
                {item.path ? (
                  <Link
                    to={item.path}
                    className={`block py-2 text-sm font-medium ${isActive(item.path) ? 'text-primary' : 'text-foreground/80'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <button
                    onClick={() => setIsThemeOpen(!isThemeOpen)}
                    className="block py-2 text-sm font-medium text-foreground/80 w-full text-left"
                  >
                    {item.name}
                  </button>
                )}
                {item.name === '테마' && isThemeOpen && (
                  <div className="ml-4 pl-2 border-l border-border/30 space-y-2">
                    {themeSubItems.map((sub) => (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        className="block py-1 text-sm text-muted-foreground hover:text-primary"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* 모바일 사용자 메뉴 */}
            <div className="pt-4 border-t border-border/40">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="flex items-center py-2 text-sm font-medium">
                    <User className="mr-2 h-4 w-4" /> <span>대시보드</span>
                  </Link>
                  <button onClick={logout} className="flex items-center py-2 text-sm font-medium text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> <span>로그아웃</span>
                  </button>
                </>
              ) : (
                <Link to="/login" className="block py-2">
                  <Button variant="default" size="sm" className="w-full">로그인</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;