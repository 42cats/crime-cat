import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import PostDetail from "./post-detail/PostDetail";
import { UserPostDto } from "@/api/posts";

interface PostDetailModalProps {
    post?: UserPostDto;
    postId?: string;
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
    onLikeStatusChange?: (
        postId: string,
        liked: boolean,
        likeCount: number
    ) => void;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({
    post,
    postId,
    isOpen,
    onClose,
    userId,
    onLikeStatusChange,
}) => {
    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => !open && onClose()}
        >
            <DialogContent className="max-w-4xl w-[95%] md:w-full bg-white rounded-lg p-0 overflow-hidden">
                <DialogTitle className="sr-only">
                    게시물 상세 보기
                </DialogTitle>
                <div className="h-[85vh] md:h-[80vh] overflow-y-auto">
                    <PostDetail
                        post={post}
                        postId={postId}
                        userId={userId}
                        onLikeStatusChange={onLikeStatusChange}
                        onClose={onClose}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PostDetailModal;
