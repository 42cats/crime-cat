import React, { useState, useEffect } from "react";
import { BasicNotificationSettings } from "./BasicNotificationSettings";
import { PostNotificationSettings } from "./PostNotificationSettings";
import { notificationService, type NotificationSettingsResponse } from "@/api/notifications";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

interface NotificationSettingsContainerProps {
  className?: string;
}

export const NotificationSettingsContainer: React.FC<NotificationSettingsContainerProps> = ({
  className = "",
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<NotificationSettingsResponse>({
    email: false,
    discord: false,
    post: false,
    postComment: false,
    commentComment: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // 초기 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;
      
      try {
        setInitialLoading(true);
        const response = await notificationService.getNotificationSettings(user.id);
        setSettings(response);
      } catch (error) {
        console.error('Failed to load notification settings:', error);
        toast({
          title: "설정 로드 실패",
          description: "알림 설정을 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    loadSettings();
  }, [user?.id, toast]);

  // 공통 업데이트 핸들러
  const handleUpdate = async (
    updateFn: () => Promise<NotificationSettingsResponse>,
    successMessage: string
  ) => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await updateFn();
      setSettings(response);
      toast({
        title: "설정 변경됨",
        description: successMessage,
      });
    } catch (error) {
      console.error('Failed to update notification setting:', error);
      toast({
        title: "설정 저장 실패",
        description: "알림 설정을 저장하는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 개별 설정 업데이트 핸들러들
  const handleEmailChange = async (enabled: boolean) => {
    await handleUpdate(
      () => notificationService.updateEmailNotification(user!.id, enabled),
      `이메일 알림이 ${enabled ? '활성화' : '비활성화'}되었습니다.`
    );
  };

  const handleDiscordChange = async (enabled: boolean) => {
    await handleUpdate(
      () => notificationService.updateDiscordNotification(user!.id, enabled),
      `디스코드 알림이 ${enabled ? '활성화' : '비활성화'}되었습니다.`
    );
  };

  const handlePostChange = async (enabled: boolean) => {
    await handleUpdate(
      () => notificationService.updatePostNotification(user!.id, enabled),
      `포스트 알림이 ${enabled ? '활성화' : '비활성화'}되었습니다.`
    );
  };

  const handlePostCommentChange = async (enabled: boolean) => {
    await handleUpdate(
      () => notificationService.updateCommentNotification(user!.id, enabled),
      `포스트 댓글 알림이 ${enabled ? '활성화' : '비활성화'}되었습니다.`
    );
  };

  const handleCommentCommentChange = async (enabled: boolean) => {
    await handleUpdate(
      () => notificationService.updateCommentCommentNotification(user!.id, enabled),
      `댓글 답글 알림이 ${enabled ? '활성화' : '비활성화'}되었습니다.`
    );
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <BasicNotificationSettings
        email={settings.email}
        discord={settings.discord}
        onEmailChange={handleEmailChange}
        onDiscordChange={handleDiscordChange}
        loading={loading}
      />
      
      <PostNotificationSettings
        post={settings.post}
        postComment={settings.postComment}
        commentComment={settings.commentComment}
        onPostChange={handlePostChange}
        onPostCommentChange={handlePostCommentChange}
        onCommentCommentChange={handleCommentCommentChange}
        loading={loading}
      />
    </div>
  );
};
