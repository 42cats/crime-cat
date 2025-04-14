import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import imageIcon from "@/assets/icon.png";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar: React.FC = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    // Handle scroll effect for glass navbar
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const navItems = [
        { name: "홈", path: "/" },
        { name: "명령어", path: "/commands" },
        { name: "테마", path: "/themes" },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
                isScrolled ? "glass py-3 shadow-sm" : "bg-transparent py-5"
            }`}
        >
            <div className="container mx-auto px-6 flex items-center justify-between">
                <Link to="/" className="flex items-center space-x-2">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        <img
                            src={imageIcon}
                            alt="짭냥이 로고"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="text-xl font-semibold">짭냥이</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-8">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
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
                    ))}
                </div>

                {/* Auth Buttons / User Menu */}
                <div className="hidden md:flex items-center space-x-2">
                    <ThemeToggle />

                    {isAuthenticated ? (
                        <div className="flex items-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="relative rounded-full"
                                    >
                                        <img
                                            src={user?.avatar}
                                            alt={user?.displayName}
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
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Dashboard</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={logout}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Logout</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <Link to="/">
                            <Button variant="default" size="sm">
                                Login
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center space-x-2">
                    <ThemeToggle />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden glass animate-fade-in">
                    <div className="py-4 px-6 space-y-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`block py-2 text-sm font-medium ${
                                    isActive(item.path)
                                        ? "text-primary"
                                        : "text-foreground/80"
                                }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <div className="pt-4 border-t border-border/40">
                            {isAuthenticated ? (
                                <>
                                    <Link
                                        to="/dashboard"
                                        className="flex items-center py-2 text-sm font-medium"
                                    >
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Dashboard</span>
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="flex items-center py-2 text-sm font-medium text-destructive"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Logout</span>
                                    </button>
                                </>
                            ) : (
                                <Link to="/login" className="block py-2">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="w-full"
                                    >
                                        Login
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
