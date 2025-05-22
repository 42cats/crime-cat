import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPostDto, userPostService } from "@/api/sns/post";
import PostEditForm, { PostEditData } from "./PostEditForm";
import { toast } from "sonner";

interface PostEditModalProps {
  post: UserPostDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // 수정 성공 시 콜백
}

const PostEditModal: React.FC<PostEditModalProps> = ({
  post,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (editData: PostEditData) => {
    setIsLoading(true);
    try {
      await userPostService.updatePost(
        post.postId,
        editData.content,
        editData.newImages,
        editData.keepImageUrls,
        editData.location
      );

      toast.success("포스트가 성공적으로 수정되었습니다.");
      
      // 성공 콜백 호출
      if (onSuccess) {
        onSuccess();
      }
      
      // 모달 닫기
      onClose();
    } catch (error) {
      console.error("포스트 수정 실패:", error);
      toast.error("포스트 수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isLoading) return;
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>포스트 수정</DialogTitle>
        </DialogHeader>
        
        <PostEditForm
          initialPost={post}
          onSave={handleSave}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PostEditModal;
