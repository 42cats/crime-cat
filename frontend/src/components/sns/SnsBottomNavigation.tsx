import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Home, Search, PlusSquare, User, FileText } from 'lucide-react';
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
import ProfileDetailModal from '@/components/profile/ProfileDetailModal';

const SnsBottomNavigation: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    const handleProtectedAction = (path: string) => {
        if (!isAuthenticated) {
            setShowLoginDialog(true);
            return;
        }
        navigate(path);
    };

    const handleProfileClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            setShowLoginDialog(true);
            return;
        }
        setShowProfileModal(true);
    };

    const handleLoginRedirect = () => {
        setShowLoginDialog(false);
        navigate('/login');
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
                        onClick={() => handleProtectedAction('/sns/my-posts')}
                        className={`flex flex-col items-center p-2 ${
                            location.pathname === "/sns/my-posts"
                                ? "text-primary"
                                : "text-muted-foreground"
                        }`}
                    >
                        <FileText className="w-6 h-6" />
                        <span className="text-xs mt-1">내글</span>
                    </button>
                    <button
                        onClick={handleProfileClick}
                        className={`flex flex-col items-center p-2 ${
                            showProfileModal
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
                            onClick={handleLoginRedirect}
                        >
                            로그인 하러 가기
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 프로필 모달 */}
            {isAuthenticated && user?.id && (
                <ProfileDetailModal
                    userId={user.id}
                    open={showProfileModal}
                    onOpenChange={setShowProfileModal}
                />
            )}
        </>
    );
};

export default SnsBottomNavigation;