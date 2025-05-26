import React from "react";
import { NavigateFunction } from "react-router-dom";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ContactUserModal from "@/components/themes/modals/ContactUserModal";
import PostDetailModal from "@/components/profile/PostDetailModal";
import ProfileDetailModal from "@/components/profile/ProfileDetailModal";
import { ThemeDetailType } from "@/lib/types";
import { UserPostDto } from '@/api/posts';

interface ThemeModalsProps {
    theme: ThemeDetailType;
    navigate: NavigateFunction;
    isDeleteDialogOpen: boolean;
    setIsDeleteDialogOpen: (open: boolean) => void;
    showLoginDialog: boolean;
    setShowLoginDialog: (open: boolean) => void;
    showContactModal: boolean;
    setShowContactModal: (open: boolean) => void;
    showRequestModal: boolean;
    setShowRequestModal: (open: boolean) => void;
    requestMessage: string;
    setRequestMessage: (message: string) => void;
    isSubmittingRequest: boolean;
    handleRequestGame: () => void;
    handleDelete: () => void;
    showProfileModal: boolean;
    setShowProfileModal: (open: boolean) => void;
    selectedUserId: string;
    selectedPost: UserPostDto | null;
    showProfileDetailModal: boolean;
    setShowProfileDetailModal: (open: boolean) => void;
    profileDetailUserId: string;
}

const ThemeModals: React.FC<ThemeModalsProps> = ({
    theme,
    navigate,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    showLoginDialog,
    setShowLoginDialog,
    showContactModal,
    setShowContactModal,
    showRequestModal,
    setShowRequestModal,
    requestMessage,
    setRequestMessage,
    isSubmittingRequest,
    handleRequestGame,
    handleDelete,
    showProfileModal,
    setShowProfileModal,
    selectedUserId,
    selectedPost,
    showProfileDetailModal,
    setShowProfileDetailModal,
    profileDetailUserId,
}) => {
    return (
        <>
            <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            정말 삭제하시겠습니까?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDelete}
                        >
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={showLoginDialog}
                onOpenChange={setShowLoginDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>로그인이 필요합니다</AlertDialogTitle>
                        <AlertDialogDescription>
                            추천 기능은 로그인한 사용자만 사용할 수 있습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>닫기</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setShowLoginDialog(false);
                                navigate("/login");
                            }}
                        >
                            로그인 하러 가기
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog
                open={showRequestModal}
                onOpenChange={(open) => {
                    setShowRequestModal(open);
                    if (!open) setRequestMessage("");
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>기록 요청</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="request-message">요청 메시지</Label>
                            <Textarea
                                id="request-message"
                                placeholder="기록 요청 내용을 작성해주세요..."
                                value={requestMessage}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value.length <= 100) {
                                        setRequestMessage(value);
                                    }
                                }}
                                className="min-h-[100px]"
                            />
                        </div>
                        <div
                            className={`text-right text-sm mt-1 ${
                                requestMessage.length > 100
                                    ? "text-red-500 font-semibold"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {requestMessage.length} / 100자
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowRequestModal(false)}
                        >
                            취소
                        </Button>
                        <Button
                            onClick={handleRequestGame}
                            disabled={
                                isSubmittingRequest || !requestMessage.trim()
                            }
                        >
                            {isSubmittingRequest ? (
                                <>전송 중...</>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    요청 전송
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {theme.author?.id && (
                <ContactUserModal
                    open={showContactModal}
                    userId={theme.author.id}
                    onOpenChange={setShowContactModal}
                />
            )}

            {/* 프로필 상세 모달 */}
            {selectedPost && (
                <PostDetailModal
                    post={selectedPost}
                    isOpen={showProfileModal}
                    onClose={() => setShowProfileModal(false)}
                    userId={selectedUserId}
                />
            )}

            {/* 프로필 디테일 모달 */}
            {profileDetailUserId && (
                <ProfileDetailModal
                    userId={profileDetailUserId}
                    open={showProfileDetailModal}
                    onOpenChange={setShowProfileDetailModal}
                />
            )}
        </>
    );
};

export default ThemeModals;
