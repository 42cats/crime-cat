import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Home, Search, PlusSquare, BookmarkIcon, User } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/ui/alert-dialog';

const SnsBottomNavigation: React.FC = () => {
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();
    const [showLoginDialog, setShowLoginDialog] = useState(false);

    const handleProtectedAction = (path: string) => {
        if (!isAuthenticated) {
            setShowLoginDialog(true);
            return;
        }
        window.location.href = path;
    };

    const getProfilePath = () => {
        if (isAuthenticated && user?.id) {
            return `/profile/${user.id}`;
        }
        return '/profile';
    };

    const handleProfileClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            setShowLoginDialog(true);
            return;
        }
        window.location.href = getProfilePath();
    };

    return (
        <>
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
                    <button
                        onClick={() => handleProtectedAction('/sns/create')}
                        className={`flex flex-col items-center p-2 ${
                            location.pathname === "/sns/create"
                                ? "text-primary"
                                : "text-muted-foreground"
                        }`}
                    >
                        <PlusSquare className="w-6 h-6" />
                        <span className="text-xs mt-1">작성</span>
                    </button>
                    <button
                        onClick={() => handleProtectedAction('/sns/saved')}
                        className={`flex flex-col items-center p-2 ${
                            location.pathname === "/sns/saved"
                                ? "text-primary"
                                : "text-muted-foreground"
                        }`}
                    >
                        <BookmarkIcon className="w-6 h-6" />
                        <span className="text-xs mt-1">저장됨</span>
                    </button>
                    <button
                        onClick={handleProfileClick}
                        className={`flex flex-col items-center p-2 ${
                            location.pathname.startsWith("/profile")
                                ? "text-primary"
                                : "text-muted-foreground"
                        }`}
                    >
                        <User className="w-6 h-6" />
                        <span className="text-xs mt-1">프로필</span>
                    </button>
                </div>
            </div>

            {/* 로그인 필요 다이얼로그 */}
            <AlertDialog
                open={showLoginDialog}
                onOpenChange={setShowLoginDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>로그인이 필요합니다</AlertDialogTitle>
                        <AlertDialogDescription>
                            이 기능을 사용하려면 로그인이 필요합니다. 로그인
                            페이지로 이동하시겠습니까?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setShowLoginDialog(false);
                                window.location.href = "/login";
                            }}
                        >
                            로그인 하러 가기
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default SnsBottomNavigation;