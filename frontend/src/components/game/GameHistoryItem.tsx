import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { UTCToKST } from '@/lib/dateFormat';
import { ChevronRight } from 'lucide-react';
import { UserGameHistoryDto } from '@/pages/UserGameHistoryPage';

interface GameHistoryItemProps {
  history: UserGameHistoryDto;
  onEdit: (history: UserGameHistoryDto) => void;
  isMobile?: boolean;
}

const GameHistoryItem: React.FC<GameHistoryItemProps> = ({ 
  history, 
  onEdit,
  isMobile = false 
}) => {
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div className="font-medium text-base">
            {history.guildName}
          </div>
          <div>
            {history.win ? (
              <span className="inline-flex items-center justify-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full dark:bg-green-900/30 dark:text-green-400">
                승리
              </span>
            ) : (
              <span className="inline-flex items-center justify-center px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full dark:bg-red-900/30 dark:text-red-400">
                패배
              </span>
            )}
          </div>
        </div>
        <div className="text-sm space-y-2 mt-1 text-muted-foreground">
          <div className="flex justify-between">
            <span className="font-medium text-foreground">캐릭터</span>
            <span>{history.characterName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-foreground">테마</span>
            <div>
              {history.themeId ? (
                <span
                  onClick={() => navigate(`/themes/crimescene/${history.themeId}`)}
                  className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 px-2 py-1 text-xs font-medium rounded-md cursor-pointer transition dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  role="button"
                  aria-label={`${history.themeName} 테마 보기`}
                >
                  {history.themeName}
                  <ChevronRight className="w-3 h-3" />
                </span>
              ) : (
                <span className="text-muted-foreground">(미등록)</span>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-foreground">메모</span>
            <span className="text-right max-w-[65%] truncate" title={history.memo || "-"}>{history.memo || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-foreground">날짜</span>
            <span><UTCToKST date={history.createdAt} /></span>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="self-end mt-2"
          onClick={() => onEdit(history)}
        >
          수정
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center px-4 py-3 hover:bg-muted/20 transition-colors">
      <div className="flex-shrink-0 w-36 font-medium truncate" title={history.guildName}>
        {history.guildName}
      </div>
      <div className="flex-shrink-0 w-28 truncate" title={history.characterName}>
        {history.characterName}
      </div>
      <div className="flex-shrink-0 w-12 text-center">
        {history.win ? (
          <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-800 rounded-full dark:bg-green-900/30 dark:text-green-400">✓</span>
        ) : (
          <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-800 rounded-full dark:bg-red-900/30 dark:text-red-400">✗</span>
        )}
      </div>
      <div className="flex-shrink-0 w-40">
        {history.themeId ? (
          <span
            onClick={() => navigate(`/themes/crimescene/${history.themeId}`)}
            className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 px-2 py-1 text-xs font-medium rounded-md cursor-pointer transition dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
            role="button"
            aria-label={`${history.themeName} 테마 보기`}
          >
            {history.themeName}
            <ChevronRight className="w-3 h-3" />
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">(미등록)</span>
        )}
      </div>
      <div className="flex-grow truncate px-2" title={history.memo || "-"}>
        {history.memo || "-"}
      </div>
      <div className="flex-shrink-0 w-36 text-muted-foreground text-sm">
        <UTCToKST date={history.createdAt} />
      </div>
      <div className="flex-shrink-0 w-16 text-right">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(history)}
        >
          수정
        </Button>
      </div>
    </div>
  );
};

export default GameHistoryItem;