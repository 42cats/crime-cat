import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
    Menu,
    X,
    User,
    LogOut,
    Home,
    Search,
    PlusSquare,
    Heart,
    BookmarkIcon,
    Camera,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationIcon } from "@/components/NotificationIcon";
import { useTheme } from "@/hooks/useTheme";

const Navbar: React.FC = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isThemeOpen, setIsThemeOpen] = useState(false);
    const [isCommunityOpen, setIsCommunityOpen] = useState(false);
    const [isSnsOpen, setIsSnsOpen] = useState(false);
    const [activeSubnav, setActiveSubnav] = useState<string | null>(null);
    const location = useLocation();
    const { theme } = useTheme(); // theme === "light" | "dark" | "system"

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsThemeOpen(false);
        setIsCommunityOpen(false);
        setIsSnsOpen(false);
        setActiveSubnav(null);
    }, [location.pathname]);

    const navItems = [
        { name: "홈", path: "/" },
        { name: "공지사항", path: "/notices" },
        { name: "명령어", path: "/commands" },
        { name: "테마" }, // path 없음
        { name: "커뮤니티" }, // path 없음
        { name: "SNS" }, // path 없음
    ];

    const themeSubItems = [
        { name: "크라임씬", path: "/themes/crimescene" },
        { name: "방탈출", path: "/themes/escape_room" },
        { name: "머더미스터리", path: "/themes/murder_mystery" },
        { name: "리얼월드", path: "/themes/realworld" },
    ];

    const communitySubItems = [
        { name: "질문게시판", path: "/community/questions" },
        { name: "자유게시판", path: "/community/free" },
        { name: "제작자게시판", path: "/community/creators" },
    ];

    const snsSubItems = [
        {
            name: "SNS 피드",
            path: "/sns/feed",
            icon: <Home className="w-4 h-4 mr-1" />,
        },
        {
            name: "탐색",
            path: "/sns/explore",
            icon: <Search className="w-4 h-4 mr-1" />,
        },
        {
            name: "포스트 작성",
            path: "/sns/create",
            icon: <PlusSquare className="w-4 h-4 mr-1" />,
        },
        {
            name: "저장된 포스트",
            path: "/sns/saved",
            icon: <BookmarkIcon className="w-4 h-4 mr-1" />,
        },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div
            onMouseLeave={() => setActiveSubnav(null)}
            className={`w-full z-50 transition-all duration-300 border-b ${
                isScrolled ? "glass shadow-sm" : "bg-transparent"
            }`}
        >
            <div className="container mx-auto px-6 py-4 transition-all duration-200">
                <div className="flex justify-between items-center">
                    {/* 로고 */}
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

                    {/* 데스크탑 메뉴 */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navItems.map((item) => (
                            <div
                                key={item.name}
                                onMouseEnter={() => {
                                    if (
                                        item.name === "테마" ||
                                        item.name === "커뮤니티" ||
                                        item.name === "SNS"
                                    ) {
                                        setActiveSubnav(item.name);
                                    }
                                }}
                            >
                                {item.path ? (
                                    <Link
                                        to={item.path}
                                        className={`relative text-sm font-medium transition-colors ${
                                            isActive(item.path)
                                                ? "text-primary"
                                                : "text-foreground/80 hover:text-foreground"
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
                                    <Button
                                        variant="ghost"
                                        className="relative rounded-full"
                                    >
                                        <img
                                            src={user?.profile_image_path}
                                            alt={user?.nickname}
                                            className="w-8 h-8 rounded-full"
                                        />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link
                                            to="/dashboard"
                                            className="flex items-center"
                                        >
                                            <User className="mr-2 h-4 w-4" />{" "}
                                            <span>대시보드</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={logout}>
                                        <LogOut className="mr-2 h-4 w-4" />{" "}
                                        <span>로그아웃</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link to="/login">
                                <Button variant="default" size="sm">
                                    로그인
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* 모바일 메뉴 토글 */}
                    <div className="md:hidden flex items-center space-x-2">
                        <ThemeToggle />
                        {isAuthenticated && <NotificationIcon />}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                                setIsMobileMenuOpen(!isMobileMenuOpen)
                            }
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* 데스크탑 서브 메뉴 */}
                {activeSubnav && (
                    <div className="mt-4 flex justify-center gap-8 animate-fade-slide-in">
                        {activeSubnav === "테마" &&
                            themeSubItems.map((sub) => (
                                <Link
                                    key={sub.name}
                                    to={sub.path}
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
                                >
                                    {sub.name}
                                </Link>
                            ))}
                        {activeSubnav === "커뮤니티" &&
                            communitySubItems.map((sub) => (
                                <Link
                                    key={sub.name}
                                    to={sub.path}
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
                                >
                                    {sub.name}
                                </Link>
                            ))}
                        {activeSubnav === "SNS" &&
                            snsSubItems.map((sub) => (
                                <Link
                                    key={sub.name}
                                    to={sub.path}
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap flex items-center"
                                >
                                    {sub.icon}
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
                                        className={`block py-2 text-sm font-medium ${
                                            isActive(item.path)
                                                ? "text-primary"
                                                : "text-foreground/80"
                                        }`}
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                    >
                                        {item.name}
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => {
                                            if (item.name === "테마") {
                                                setIsThemeOpen(!isThemeOpen);
                                                setIsCommunityOpen(false);
                                                setIsSnsOpen(false);
                                            } else if (
                                                item.name === "커뮤니티"
                                            ) {
                                                setIsCommunityOpen(
                                                    !isCommunityOpen
                                                );
                                                setIsThemeOpen(false);
                                                setIsSnsOpen(false);
                                            } else if (item.name === "SNS") {
                                                setIsSnsOpen(!isSnsOpen);
                                                setIsThemeOpen(false);
                                                setIsCommunityOpen(false);
                                            }
                                        }}
                                        className="block py-2 text-sm font-medium text-foreground/80 w-full text-left"
                                    >
                                        {item.name}
                                    </button>
                                )}
                                {/* 테마 서브메뉴 */}
                                {item.name === "테마" && isThemeOpen && (
                                    <div className="ml-4 pl-2 border-l border-border/30 space-y-2">
                                        {themeSubItems.map((sub) => (
                                            <Link
                                                key={sub.path}
                                                to={sub.path}
                                                className="block py-1 text-sm text-muted-foreground hover:text-primary"
                                                onClick={() =>
                                                    setIsMobileMenuOpen(false)
                                                }
                                            >
                                                {sub.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                                {/* 커뮤니티 서브메뉴 */}
                                {item.name === "커뮤니티" &&
                                    isCommunityOpen && (
                                        <div className="ml-4 pl-2 border-l border-border/30 space-y-2">
                                            {communitySubItems.map((sub) => (
                                                <Link
                                                    key={sub.path}
                                                    to={sub.path}
                                                    className="block py-1 text-sm text-muted-foreground hover:text-primary"
                                                    onClick={() =>
                                                        setIsMobileMenuOpen(
                                                            false
                                                        )
                                                    }
                                                >
                                                    {sub.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                {/* SNS 서브메뉴 */}
                                {item.name === "SNS" && isSnsOpen && (
                                    <div className="ml-4 pl-2 border-l border-border/30 space-y-2">
                                        {snsSubItems.map((sub) => (
                                            <Link
                                                key={sub.path}
                                                to={sub.path}
                                                className="block py-1 text-sm text-muted-foreground hover:text-primary flex items-center"
                                                onClick={() =>
                                                    setIsMobileMenuOpen(false)
                                                }
                                            >
                                                {sub.icon}
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
                                    <Link
                                        to="/dashboard"
                                        className="flex items-center py-2 text-sm font-medium"
                                    >
                                        <User className="mr-2 h-4 w-4" />{" "}
                                        <span>대시보드</span>
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="flex items-center py-2 text-sm font-medium text-destructive"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />{" "}
                                        <span>로그아웃</span>
                                    </button>
                                </>
                            ) : (
                                <Link to="/login" className="block py-2">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="w-full"
                                    >
                                        로그인
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 모바일 SNS 네비게이션 */}
            {location.pathname.startsWith("/sns") && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
                    <div className="flex justify-around items-center py-2">
                        <Link
                            to="/sns/feed"
                            className={`flex flex-col items-center p-2 ${
                                location.pathname === "/sns/feed"
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            }`}
                        >
                            <Home className="w-6 h-6" />
                            <span className="text-xs mt-1">피드</span>
                        </Link>
                        <Link
                            to="/sns/explore"
                            className={`flex flex-col items-center p-2 ${
                                location.pathname === "/sns/explore"
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            }`}
                        >
                            <Search className="w-6 h-6" />
                            <span className="text-xs mt-1">탐색</span>
                        </Link>
                        <Link
                            to="/sns/create"
                            className={`flex flex-col items-center p-2 ${
                                location.pathname === "/sns/create"
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            }`}
                        >
                            <PlusSquare className="w-6 h-6" />
                            <span className="text-xs mt-1">작성</span>
                        </Link>
                        <Link
                            to="/sns/saved"
                            className={`flex flex-col items-center p-2 ${
                                location.pathname === "/sns/saved"
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            }`}
                        >
                            <BookmarkIcon className="w-6 h-6" />
                            <span className="text-xs mt-1">저장됨</span>
                        </Link>
                        <Link
                            to="/profile"
                            className={`flex flex-col items-center p-2 ${
                                location.pathname === "/dashboard"
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            }`}
                        >
                            <User className="w-6 h-6" />
                            <span className="text-xs mt-1">프로필</span>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Navbar;
