import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface NotificationSettingsProps {
  notifyByEmail: boolean;
  notifyByDiscord: boolean;
  setNotifyByEmail: (value: boolean) => void;
  setNotifyByDiscord: (value: boolean) => void;
  isDark: boolean;
}

/**
 * 알림 설정 관리 컴포넌트
 */
const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  notifyByEmail,
  notifyByDiscord,
  setNotifyByEmail,
  setNotifyByDiscord,
  isDark,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>알림 설정</CardTitle>
        <CardDescription>
          알림을 받을 방법을 선택하세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">이메일 알림</div>
              <div className="text-sm text-muted-foreground">중요한 업데이트를 이메일로 받습니다.</div>
            </div>
            <Switch
              checked={notifyByEmail}
              onCheckedChange={setNotifyByEmail}
              className={isDark ? "data-[state=checked]:bg-indigo-500" : ""}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">디스코드 알림</div>
              <div className="text-sm text-muted-foreground">디스코드를 통한 알림을 받습니다.</div>
            </div>
            <Switch
              checked={notifyByDiscord}
              onCheckedChange={setNotifyByDiscord}
              className={isDark ? "data-[state=checked]:bg-indigo-500" : ""}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
