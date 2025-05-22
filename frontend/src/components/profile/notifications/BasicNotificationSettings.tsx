import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageSquare } from "lucide-react";

interface BasicNotificationSettingsProps {
  email: boolean;
  discord: boolean;
  onEmailChange: (enabled: boolean) => Promise<void>;
  onDiscordChange: (enabled: boolean) => Promise<void>;
  loading?: boolean;
}

export const BasicNotificationSettings: React.FC<BasicNotificationSettingsProps> = ({
  email,
  discord,
  onEmailChange,
  onDiscordChange,
  loading = false,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          기본 알림 설정
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-notification" className="text-sm font-medium">
              이메일 알림
            </Label>
            <p className="text-sm text-muted-foreground">
              중요한 알림을 이메일로 받습니다
            </p>
          </div>
          <Switch
            id="email-notification"
            checked={email}
            onCheckedChange={onEmailChange}
            disabled={loading}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="discord-notification" className="text-sm font-medium">
              디스코드 알림
            </Label>
            <p className="text-sm text-muted-foreground">
              디스코드를 통해 알림을 받습니다
            </p>
          </div>
          <Switch
            id="discord-notification"
            checked={discord}
            onCheckedChange={onDiscordChange}
            disabled={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
};
