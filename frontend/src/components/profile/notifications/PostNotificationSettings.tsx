import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, MessageSquare, Reply } from "lucide-react";

interface PostNotificationSettingsProps {
  post: boolean;
  postComment: boolean;
  commentComment: boolean;
  onPostChange: (enabled: boolean) => Promise<void>;
  onPostCommentChange: (enabled: boolean) => Promise<void>;
  onCommentCommentChange: (enabled: boolean) => Promise<void>;
  loading?: boolean;
}

export const PostNotificationSettings: React.FC<PostNotificationSettingsProps> = ({
  post,
  postComment,
  commentComment,
  onPostChange,
  onPostCommentChange,
  onCommentCommentChange,
  loading = false,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          포스트 알림 설정
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="post-notification" className="text-sm font-medium">
              새 포스트 알림
            </Label>
            <p className="text-sm text-muted-foreground">
              새로운 포스트가 등록될 때 알림을 받습니다
            </p>
          </div>
          <Switch
            id="post-notification"
            checked={post}
            onCheckedChange={onPostChange}
            disabled={loading}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <div>
              <Label htmlFor="post-comment-notification" className="text-sm font-medium">
                포스트 댓글 알림
              </Label>
              <p className="text-sm text-muted-foreground">
                내 포스트에 댓글이 달릴 때 알림을 받습니다
              </p>
            </div>
          </div>
          <Switch
            id="post-comment-notification"
            checked={postComment}
            onCheckedChange={onPostCommentChange}
            disabled={loading}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 flex items-center gap-2">
            <Reply className="w-4 h-4" />
            <div>
              <Label htmlFor="comment-comment-notification" className="text-sm font-medium">
                댓글 답글 알림
              </Label>
              <p className="text-sm text-muted-foreground">
                내 댓글에 답글이 달릴 때 알림을 받습니다
              </p>
            </div>
          </div>
          <Switch
            id="comment-comment-notification"
            checked={commentComment}
            onCheckedChange={onCommentCommentChange}
            disabled={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
};
