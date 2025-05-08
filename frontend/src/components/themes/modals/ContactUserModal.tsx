import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/api/profile/profile";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Instagram, MessageCircleMore, X } from "lucide-react";

interface ContactUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const ContactUserModal: React.FC<ContactUserModalProps> = ({ open, onOpenChange, userId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: () => getUserProfile(userId),
    enabled: open,
  });

  const user = data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>작성자 정보</DialogTitle>
        </DialogHeader>

        {isLoading && <p>불러오는 중...</p>}
        {error && <p className="text-red-500">정보를 불러오지 못했습니다.</p>}

        {user && (
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.avatar} alt={user.nickName} />
            </Avatar>
            <div>
              <p className="text-xl font-bold">{user.nickName}</p>
              {user.badge && (
                <span className="text-sm text-muted-foreground">{user.badge}</span>
              )}
            </div>
            {user.bio && <p className="text-sm text-foreground">{user.bio}</p>}

            <div className="flex gap-4 mt-2 justify-center">
              {user.socialLinks?.instagram && (
                <a href={user.socialLinks.instagram} target="_blank" rel="noopener noreferrer" title="Instagram">
                  <Instagram className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                </a>
              )}
              {user.socialLinks?.x && (
                <a href={user.socialLinks.x} target="_blank" rel="noopener noreferrer" title="X (Twitter)">
                  <X className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                </a>
              )}
              {user.socialLinks?.openkakao && (
                <a href={user.socialLinks.openkakao} target="_blank" rel="noopener noreferrer" title="오픈카카오">
                  <MessageCircleMore className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                </a>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactUserModal;