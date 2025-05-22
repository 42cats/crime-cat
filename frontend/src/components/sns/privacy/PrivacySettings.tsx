import React from 'react';
import { Lock, Users, Globe } from 'lucide-react';
import { Label } from '@/components/ui/label';

export interface PrivacySettings {
    isPrivate: boolean;
    isFollowersOnly: boolean;
}

interface PrivacySettingsProps {
    value: PrivacySettings;
    onChange: (settings: PrivacySettings) => void;
    className?: string;
}

const PrivacySettingsComponent: React.FC<PrivacySettingsProps> = ({
    value,
    onChange,
    className = ''
}) => {
    const handleVisibilityChange = (newValue: string) => {
        switch (newValue) {
            case 'public':
                onChange({ isPrivate: false, isFollowersOnly: false });
                break;
            case 'followers':
                onChange({ isPrivate: false, isFollowersOnly: true });
                break;
            case 'private':
                onChange({ isPrivate: true, isFollowersOnly: false });
                break;
        }
    };

    const getCurrentValue = () => {
        if (value.isPrivate) return 'private';
        if (value.isFollowersOnly) return 'followers';
        return 'public';
    };

    const currentValue = getCurrentValue();

    return (
        <div className={`space-y-3 ${className}`}>
            <Label className="text-sm font-medium">공개 설정</Label>
            <div className="space-y-2">
                {/* 전체 공개 */}
                <label className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                    <input
                        type="radio"
                        name="privacy"
                        value="public"
                        checked={currentValue === 'public'}
                        onChange={(e) => handleVisibilityChange(e.target.value)}
                        className="w-4 h-4 text-primary"
                    />
                    <Globe className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                        <div className="font-medium">전체 공개</div>
                        <div className="text-sm text-muted-foreground">
                            모든 사용자가 볼 수 있습니다
                        </div>
                    </div>
                </label>

                {/* 팔로워만 */}
                <label className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                    <input
                        type="radio"
                        name="privacy"
                        value="followers"
                        checked={currentValue === 'followers'}
                        onChange={(e) => handleVisibilityChange(e.target.value)}
                        className="w-4 h-4 text-primary"
                    />
                    <Users className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                        <div className="font-medium">팔로워만</div>
                        <div className="text-sm text-muted-foreground">
                            나를 팔로우하는 사용자만 볼 수 있습니다
                        </div>
                    </div>
                </label>

                {/* 비공개 */}
                <label className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                    <input
                        type="radio"
                        name="privacy"
                        value="private"
                        checked={currentValue === 'private'}
                        onChange={(e) => handleVisibilityChange(e.target.value)}
                        className="w-4 h-4 text-primary"
                    />
                    <Lock className="h-5 w-5 text-red-500" />
                    <div className="flex-1">
                        <div className="font-medium">비공개</div>
                        <div className="text-sm text-muted-foreground">
                            나만 볼 수 있습니다
                        </div>
                    </div>
                </label>
            </div>
        </div>
    );
};

export default PrivacySettingsComponent;
