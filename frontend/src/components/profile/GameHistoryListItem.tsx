import React from "react";
import { useNavigate } from "react-router-dom";

interface GameHistoryListItemProps {
    themeId: string;
    themeName: string;
    thumbnailUrl?: string;
    playDate: string;
    gameType: 'crimescene' | 'escape-room';
    successStatus?: 'SUCCESS' | 'FAIL' | 'PARTIAL' | boolean;
    className?: string;
}

const GameHistoryListItem: React.FC<GameHistoryListItemProps> = ({
    themeId,
    themeName,
    thumbnailUrl,
    playDate,
    gameType,
    successStatus,
    className = "",
}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (gameType === 'crimescene') {
            navigate(`/themes/crimescene/${themeId}`);
        } else {
            navigate(`/themes/escape-room/${themeId}`);
        }
    };

    // 성공 상태 표시
    const getStatusDisplay = () => {
        if (successStatus === undefined || successStatus === null) return null;
        
        if (typeof successStatus === 'boolean') {
            // 크라임씬의 경우 boolean (isWin)
            return (
                <span className={`text-xs px-2 py-1 rounded-full ${
                    successStatus 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                }`}>
                    {successStatus ? '승리' : '패배'}
                </span>
            );
        } else {
            // 방탈출의 경우 SUCCESS/FAIL/PARTIAL
            const statusConfig = {
                'SUCCESS': { bg: 'bg-green-100', text: 'text-green-600', label: '성공' },
                'FAIL': { bg: 'bg-red-100', text: 'text-red-600', label: '실패' },
                'PARTIAL': { bg: 'bg-yellow-100', text: 'text-yellow-600', label: '부분성공' },
            };
            
            const config = statusConfig[successStatus];
            if (!config) return null;
            
            return (
                <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.text}`}>
                    {config.label}
                </span>
            );
        }
    };

    // 날짜 포맷팅
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div 
            className={`flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${className}`}
            onClick={handleClick}
        >
            <div className="flex items-center gap-3 flex-1">
                {/* 썸네일 이미지 */}
                <div className="w-12 h-12 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                    {thumbnailUrl ? (
                        <img
                            src={thumbnailUrl}
                            alt={`${themeName} 썸네일`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-lg font-bold text-gray-400">
                                {themeName[0]?.toUpperCase() || "?"}
                            </span>
                        </div>
                    )}
                </div>

                {/* 테마 정보 */}
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{themeName}</p>
                    <p className="text-sm text-gray-500">{formatDate(playDate)}</p>
                </div>
            </div>

            {/* 성공 상태 */}
            <div className="flex-shrink-0">
                {getStatusDisplay()}
            </div>
        </div>
    );
};

export default GameHistoryListItem;