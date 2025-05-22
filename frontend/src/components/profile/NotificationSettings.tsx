import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings } from "lucide-react";
import { 
  basicNotificationService, 
  userPostNotificationService,
  type NotificationSettingsResponse,
  type UserPostNotificationResponse 
} from "@/api/notifications";
import { useToast } from "@/hooks/useToast";
import type { 
  NotificationSettings, 
  UserPostNotificationSettings 
} from "@/types/profile";

interface NotificationSettingsProps {
  userId: string;
  initialSettings?: NotificationSettings;
}

export const NotificationSettingsSection: React.FC<NotificationSettingsProps> = ({ 
  userId, 
  initialSettings 
}) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [basicSettings, setBasicSettings] = useState<NotificationSettings>({
    email: initialSettings?.email ?? false,
    discord: initialSettings?.discord ?? false,
  });
  const [userPostSettings, setUserPostSettings] = useState<UserPostNotificationSettings>({
    userPostNew: true,
    userPostComment: true,
    userPostCommentReply: true,
  });
  const { toast } = useToast();

  // 초기 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // 기본 알림 설정 로드
        const basicResponse = await basicNotificationService.getNotificationSettings(userId);
        setBasicSettings({
          email: basicResponse.email,
          discord: basicResponse.discord,
        });

        // 유저 포스트 알림 설정 로드
        const userPostResponse = await userPostNotificationService.getUserPostNotificationSettings(userId);
        setUserPostSettings({
          userPostNew: userPostResponse.userPostNew,
          userPostComment: userPostResponse.userPostComment,
          userPostCommentReply: userPostResponse.userPostCommentReply,
        });
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    };

    loadSettings();
  }, [userId]);

  const handleBasicNotificationChange = async (type: 'email' | 'discord', value: boolean) => {
    try {
      let response: NotificationSettingsResponse;
      
      if (type === 'email') {
        response = await basicNotificationService.updateEmailNotification(userId, value);
      } else {
        response = await basicNotificationService.updateDiscordNotification(userId, value);
      }
      
      setBasicSettings({
        email: response.email,
        discord: response.discord,
      });
      
      toast({
        title: "알림 설정 변경됨",
        description: `${type === 'email' ? '이메일' : '디스코드'} 알림이 ${value ? '활성화' : '비활성화'}되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "설정 저장 실패",
        description: "알림 설정을 저장하는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleUserPostNotificationChange = async (
    key: keyof UserPostNotificationSettings, 
    value: boolean
  ) => {
    try {
      const response = await userPostNotificationService.updateUserPostNotificationSettings(
        userId,
        { [key]: value }
      );
      
      setUserPostSettings({
        userPostNew: response.userPostNew,
        userPostComment: response.userPostComment,
        userPostCommentReply: response.userPostCommentReply,
      });
      
      toast({
        title: "알림 설정 변경됨",
        description: "설정이 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      toast({
        title: "설정 저장 실패",
        description: "알림 설정을 저장하는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">알림 설정</p>
        
        {/* 기본 알림 설정 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notification" className="text-sm">
              이메일 알림
            </Label>
            <Switch
              id="email-notification"
              checked={basicSettings.email}
              onCheckedChange={(checked) => 
                handleBasicNotificationChange('email', checked)
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="discord-notification" className="text-sm">
              디스코드 알림
            </Label>
            <Switch
              id="discord-notification"
              checked={basicSettings.discord}
              onCheckedChange={(checked) => 
                handleBasicNotificationChange('discord', checked)
              }
            />
          </div>
        </div>

        {/* 유저 포스트 알림 설정 */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">포스트 알림 설정</p>
            <Button
              size="icon"
              variant="ghost"
              className="w-5 h-5"
              onClick={() => setModalOpen(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="userpost-new" className="text-sm">
                새 게시글 알림
              </Label>
              <Switch
                id="userpost-new"
                checked={userPostSettings.userPostNew}
                onCheckedChange={(checked) => 
                  handleUserPostNotificationChange('userPostNew', checked)
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="userpost-comment" className="text-sm">
                댓글 알림
              </Label>
              <Switch
                id="userpost-comment"
                checked={userPostSettings.userPostComment}
                onCheckedChange={(checked) => 
                  handleUserPostNotificationChange('userPostComment', checked)
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="userpost-reply" className="text-sm">
                답글 알림
              </Label>
              <Switch
                id="userpost-reply"
                checked={userPostSettings.userPostCommentReply}
                onCheckedChange={(checked) => 
                  handleUserPostNotificationChange('userPostCommentReply', checked)
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* 알림 설정 상세 모달 */}
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>유저 포스트 알림 설정</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="modal-userPostNew">새 게시글 알림</Label>
                <p className="text-sm text-muted-foreground">
                  팔로우한 사용자가 새 게시글을 올릴 때 알림을 받습니다
                </p>
              </div>
              <Switch
                id="modal-userPostNew"
                checked={userPostSettings.userPostNew}
                onCheckedChange={(checked) => 
                  handleUserPostNotificationChange('userPostNew', checked)
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="modal-userPostComment">댓글 알림</Label>
                <p className="text-sm text-muted-foreground">
                  내 게시글에 댓글이 달릴 때 알림을 받습니다
                </p>
              </div>
              <Switch
                id="modal-userPostComment"
                checked={userPostSettings.userPostComment}
                onCheckedChange={(checked) => 
                  handleUserPostNotificationChange('userPostComment', checked)
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="modal-userPostCommentReply">답글 알림</Label>
                <p className="text-sm text-muted-foreground">
                  내 댓글에 답글이 달릴 때 알림을 받습니다
                </p>
              </div>
              <Switch
                id="modal-userPostCommentReply"
                checked={userPostSettings.userPostCommentReply}
                onCheckedChange={(checked) => 
                  handleUserPostNotificationChange('userPostCommentReply', checked)
                }
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
