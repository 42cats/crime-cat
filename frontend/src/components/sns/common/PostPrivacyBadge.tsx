import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Lock, Users } from 'lucide-react';

interface PostPrivacyBadgeProps {
    isPrivate: boolean;
    isFollowersOnly: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const PostPrivacyBadge: React.FC<PostPrivacyBadgeProps> = ({
    isPrivate,
    isFollowersOnly,
    size = 'sm',
    className = ''
}) => {
    if (!isPrivate && !isFollowersOnly) return null;

    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
    const textSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base';

    return (
        <div className={`flex gap-1 ${className}`}>
            {isPrivate && (
                <Badge 
                    variant="secondary" 
                    className={`${textSize} flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200`}
                >
                    <Lock className={iconSize} />
                    비밀글
                </Badge>
            )}
            {isFollowersOnly && (
                <Badge 
                    variant="secondary" 
                    className={`${textSize} flex items-center gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200`}
                >
                    <Users className={iconSize} />
                    팔로워 전용
                </Badge>
            )}
        </div>
    );
};

export default PostPrivacyBadge;
