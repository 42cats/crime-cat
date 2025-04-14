
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Content } from '@/components/content';
import { Button as UIButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ButtonData, ContentData, DraggableItem, ItemPosition } from '@/lib/types';
import { ChevronDown, ChevronUp, GripVertical, Plus, Edit, CheckCircle2, X } from 'lucide-react';
import { Draggable } from '@/components/draggable';
import { fetchChannelById } from '@/api/messageButtonService';

interface ButtonProps {
  data: ButtonData;
  groupId: string;
  index: number;
  onChange: (buttonId: string, updatedData: Partial<ButtonData>) => void;
  onRemove: (buttonId: string) => void;
  onDragStart: (item: DraggableItem) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, item: DraggableItem) => void;
  draggedItem?: DraggableItem | null;
  dropIndicator?: ItemPosition | null;
  guildId: string
}

export function Button({
  data,
  groupId,
  index,
  onChange,
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOver,
  draggedItem,
  dropIndicator,
  guildId
}: ButtonProps) {
  const buttonStyles = {
    container: "bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-all duration-200",
    expanded: "shadow-elevated dark:shadow-black/20",
    collapsed: "shadow-subtle dark:shadow-none hover:shadow-depth dark:hover:shadow-md",
    header: "p-4 cursor-pointer flex items-center gap-3 transition-colors",
    headerExpanded: "border-b border-zinc-200 dark:border-zinc-700",
    headerEditing: "bg-messagehub-highlight dark:bg-zinc-700",
    grip: "cursor-grab touch-none",
    gripIcon: "h-5 w-5 text-zinc-400 dark:text-zinc-400",
    title: "font-medium text-base text-zinc-900 dark:text-white",
    summary: "text-sm text-zinc-500 dark:text-zinc-400 truncate-2-lines mt-1",
    buttonIcon: "h-8 w-8 text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700",
    chevron: "h-5 w-5 text-zinc-500 dark:text-zinc-400",
    content: "p-4 space-y-4 animate-slide-up",
    addButton: "w-full mt-4 border-dashed flex items-center gap-2 border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200",
    addIcon: "h-4 w-4",
    removeButton: "text-destructive hover:bg-destructive/10 hover:text-destructive",
    dropTarget: "ring-2 ring-messagehub-accent ring-opacity-70",
    dragging: "opacity-50",
    badge: "text-sm font-medium text-white dark:text-white bg-messagehub-accent dark:bg-messagehub-accent/80 rounded-full px-2 py-0.5"
  };
  

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [buttonName, setButtonName] = useState(data.name);
  const [channelNames, setChannelNames] = useState<Record<string, string>>({});
  const [isComposing, setIsComposing] = useState(false);
  const [error, setError] = useState("");

  const handleButtonNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;

    // IME 입력 중에는 검사하지 않음
    if (isComposing) {
      setButtonName(inputVal);
      return;
    }

    // ✅ 영어, 숫자, 한글(완성형), 언더바(_) 허용 + 길이 제한 10자
    const sanitized = inputVal.replace(/[^a-zA-Z0-9ㄱ-ㅎ가-힣ㅏ-ㅣ_]/g, "").slice(0, 10);

    if (sanitized !== inputVal) {
      setError("공백, 특수문자는 사용할 수 없습니다. (최대 10자)");
    } else {
      setError("");
    }

    setButtonName(sanitized);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    handleButtonNameInput(e as unknown as React.ChangeEvent<HTMLInputElement>);
  };

  useEffect(() => {
    const loadChannelNames = async () => {
      const uniqueChannelIds = [...new Set((data.contents ?? []).map(content => content.channelId ?? ""))];
  
      for (const channelId of uniqueChannelIds) {
        if (!channelId || channelNames[channelId]) continue;
  
        try {
          const channelNamesList = await fetchChannelById(guildId, channelId); // ✅ guildId 전달
          if (channelNamesList.length > 0) {
            setChannelNames(prev => ({
              ...prev,
              [channelId]: channelNamesList[0]
            }));
          }
        } catch (error) {
          console.error('Error loading channel:', error);
        }
      }
    };
  
    loadChannelNames();
  }, [data.contents]);
  
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (isEditing) {
      setIsEditing(false);
    }
  };
  
  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };
  
  const saveEditing = () => {
    onChange(data.id, { name: buttonName });
    setIsEditing(false);
  };
  
  const cancelEditing = () => {
    setButtonName(data.name);
    setIsEditing(false);
  };
  
  const handleContentChange = (contentId: string, updatedContent: Partial<ContentData>) => {
    const updatedContents = data.contents.map(content => 
      content.id === contentId ? { ...content, ...updatedContent } : content
    );
    onChange(data.id, { contents: updatedContents });
  };
  
  const addContent = () => {
    const newContent: ContentData = {
      id: uuidv4(),
      channelId: '',
      text: '',
      index: data.contents.length,
      buttonId: data.id
    };
    
    onChange(data.id, { 
      contents: [...data.contents, newContent]
    });
  };
  
  const removeContent = (contentId: string) => {
    const updatedContents = data.contents.filter(content => content.id !== contentId);
    onChange(data.id, { contents: updatedContents });
  };
  
  const draggableItem: DraggableItem = {
    id: data.id,
    type: 'button',
    index,
    parentId: groupId
  };
  
  const isDragged = draggedItem && draggedItem.id === data.id;
  
  const isDropTarget = !isDragged && 
    dropIndicator && 
    draggedItem && 
    draggedItem.type === 'button' && 
    dropIndicator.newParentId === groupId && 
    (dropIndicator.newIndex === index || dropIndicator.newIndex === index + 1);
  
const getSummary = () => {
  if (!data.contents.length) return "컨텐츠 없음";

  const MAX_CONTENTS = 3; // 최대 표시할 콘텐츠 개수
  const MAX_TEXT_LENGTH = 20; // 최대 텍스트 길이 제한

  return data.contents
    .slice(0, MAX_CONTENTS) // 앞의 몇 개만 표시
    .map((content) => {
      const channelName = channelNames[content.channelId] || "알 수 없음";
      const text = content.text?.trim() || "내용 없음";

      // 텍스트가 너무 길면 줄이기
      const truncatedText = text.length > MAX_TEXT_LENGTH 
        ? text.slice(0, MAX_TEXT_LENGTH) + "..." 
        : text;

      return `${channelName} : ${truncatedText}`;
    })
    .join(" | "); // 구분자 추가
};

    
  
  return (
    <Draggable
      item={draggableItem}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      className="mb-3 last:mb-0"
    >
      <div 
        className={cn(
          buttonStyles.container,
          isExpanded ? buttonStyles.expanded : buttonStyles.collapsed,
          isDropTarget && buttonStyles.dropTarget,
          isDragged && buttonStyles.dragging
        )}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div 
          className={cn(
            buttonStyles.header,
            isExpanded ? buttonStyles.headerExpanded : "",
            isEditing ? buttonStyles.headerEditing : ""
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (!isEditing) toggleExpand();
          }}
        >
          <div 
            className={buttonStyles.grip}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className={buttonStyles.gripIcon} />
          </div>
          
          {isEditing ? (
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Input
                  value={buttonName}
                  onChange={handleButtonNameInput}
                  onCompositionStart={() => setIsComposing(true)}  // 한글 입력 시작 감지
                  onCompositionEnd={handleCompositionEnd}          // 한글 입력 완료 감지
                  className={cn("h-8", error && "border border-red-500")}
                />
                <UIButton
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    saveEditing();
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </UIButton>
                <UIButton
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelEditing();
                  }}
                >
                  <X className="h-4 w-4" />
                </UIButton>
              </div>
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
            </div>
          )  : (
            <>
            <div className="flex-1">
            <h3 className={buttonStyles.title}>{data.name}</h3>
            <p className={buttonStyles.summary}>
              {getSummary()}
            </p>
          </div>
          <span className={buttonStyles.badge}>
            {data.contents.length} 개 콘텐츠
          </span>
              <UIButton
                variant="ghost"
                size="icon"
                className={buttonStyles.buttonIcon}
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing(e);
                }}
                aria-label="Edit button name"
              >
                <Edit className="h-4 w-4" />
              </UIButton>
            </>
          )}
          
          <UIButton
            variant="ghost"
            size="icon"
            className={buttonStyles.buttonIcon}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
            aria-label={isExpanded ? "Collapse button" : "Expand button"}
          >
            {isExpanded ? (
              <ChevronUp className={buttonStyles.chevron} />
            ) : (
              <ChevronDown className={buttonStyles.chevron} />
            )}
          </UIButton>
        </div>
        
        {isExpanded && (
          <div className={buttonStyles.content}>
            {data.contents.map((content, idx) => (
              <Content
                key={content.id}
                data={content}
                onChange={handleContentChange}
                onRemove={() => removeContent(content.id)}
                canRemove={data.contents.length > 1}
              />
            ))}
            
            <UIButton
              variant="outline"
              className={buttonStyles.addButton}
              onClick={addContent}
            >
              <Plus className={buttonStyles.addIcon} />
              <span>메시지 추가</span>
            </UIButton>
            
            <div className="flex justify-end pt-2">
              <UIButton
                variant="outline"
                className={buttonStyles.removeButton}
                onClick={() => onRemove(data.id)}
              >
                버튼 제거
              </UIButton>
            </div>
          </div>
        )}
      </div>
    </Draggable>
  );
}
