import React, { useState, useEffect } from "react";
import { ContentList } from "./ContentList";
import { useSortable } from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";
import { ButtonData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button as UIButton } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  MoveVertical,
  MoreHorizontal,
  Plus,
  Check,
  X,
  Settings
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChannelSelect } from "@/components/ui/channel-select";

interface SortableButtonProps {
  button: ButtonData;
  onChange: (buttonId: string, updatedData: Partial<ButtonData>) => void;
  onRemove: (buttonId: string) => void;
  isButtonNameDuplicate?: (groupId: string, buttonId: string, name: string) => boolean;
}

export function SortableButton({ 
  button, 
  onChange, 
  onRemove, 
  isButtonNameDuplicate 
}: SortableButtonProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: button.id,
  });
  
  const style = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
    zIndex: isDragging ? 10 : 1,
  };
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [buttonName, setButtonName] = useState(button.name);
  
  // 콘텐츠 일괄 업데이트 이벤트 리스너
  useEffect(() => {
    const handleContentUpdate = (event: CustomEvent) => {
      const { buttonId, contents } = event.detail;
      if (buttonId === button.id) {
        onChange(button.id, { contents });
      }
    };

    document.addEventListener('update-contents', handleContentUpdate as EventListener);
    return () => {
      document.removeEventListener('update-contents', handleContentUpdate as EventListener);
    };
  }, [button.id, onChange]);
  
  const [error, setError] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  
  const handleNameChange = (e) => {
    const inputVal = e.target.value;

    // IME 입력 중에는 검사하지 않음
    if (isComposing) {
      setButtonName(inputVal);
      return;
    }

    // 영어, 숫자, 한글(완성형), 언더바(_) 허용 + 길이 제한 10자
    const sanitized = inputVal
      .replace(/[^a-zA-Z0-9ㄱ-ㆎ가-힣_\s]/g, "")
      .slice(0, 10);

    if (sanitized !== inputVal) {
      setError("특수문자는 사용할 수 없습니다. (최대 10자)");
    } else {
      setError("");
    }

    setButtonName(sanitized);
  };
  
  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = (e) => {
    setIsComposing(false);
    handleNameChange(e);
  };
  
  const saveButtonName = () => {
    if (error) {
      toast.error("유효한 버튼 이름을 입력해주세요");
      return;
    }
    
    if (buttonName.trim() === "") {
      toast.error("버튼 이름은 공백일 수 없습니다");
      return;
    }
    
    // 같은 그룹 내 버튼 이름 중복 검사
    if (isButtonNameDuplicate && button.groupId && isButtonNameDuplicate(button.groupId, button.id, buttonName)) {
      toast.error("같은 그룹 내에 이미 동일한 이름의 버튼이 존재합니다");
      return;
    }
    
    onChange(button.id, { name: buttonName });
    setIsEditing(false);
  };
  
  // 콘텐츠 변경 핸들러
  const handleContentChange = (contentId, updatedData) => {
    const updatedContents = button.contents.map(content =>
      content.id === contentId ? { ...content, ...updatedData } : content
    );
    onChange(button.id, { contents: updatedContents });
  };
  
  // 콘텐츠 추가 핸들러
  const addContent = () => {
    const newContent = {
      id: uuidv4(),
      channelId: "none",
      text: "",
      index: button.contents.length,
      buttonId: button.id,
    };
    
    onChange(button.id, {
      contents: [...button.contents, newContent],
    });
  };
  
  // 콘텐츠 삭제 핸들러
  const removeContent = (contentId) => {
    const updatedContents = button.contents.filter(content => content.id !== contentId);
    onChange(button.id, { contents: updatedContents });
  };
  
  // 채널 일괄 변경 핸들러
  const handleBulkChannelChange = (channelId) => {
    const updatedContents = button.contents.map(content => ({
      ...content,
      channelId
    }));
    onChange(button.id, { contents: updatedContents });
    toast.success("모든 콘텐츠의 채널이 변경되었습니다.");
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-md bg-card overflow-hidden transition-shadow",
        isDragging ? "shadow-lg ring-2 ring-primary/50" : ""
      )}
    >
      <div className="flex items-center p-3 gap-2 border-b bg-card">
        <div {...attributes} {...listeners} className="cursor-grab touch-none px-1">
          <MoveVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <div className="flex-1 flex flex-col gap-2">
              <Input
                value={buttonName}
                onChange={handleNameChange}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                className={cn(
                  "h-9",
                  error && "border-destructive focus-visible:ring-destructive"
                )}
                autoFocus
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
            <UIButton
              size="icon"
              variant="ghost"
              onClick={saveButtonName}
              className="h-8 w-8 text-green-600 hover:text-green-700"
            >
              <Check className="h-4 w-4" />
            </UIButton>
            <UIButton
              size="icon"
              variant="ghost"
              onClick={() => {
                setButtonName(button.name);
                setIsEditing(false);
              }}
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </UIButton>
          </div>
        ) : (
          <>
            <div className="flex-1">
              <div className="font-medium flex items-center">
                {button.name}
                <span className="ml-2 text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  {button.contents.length}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <UIButton
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsEditing(true)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </UIButton>
                  </TooltipTrigger>
                  <TooltipContent>이름 편집</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Dialog>
                <DialogTrigger asChild>
                  <UIButton
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                  >
                    <Settings className="h-4 w-4" />
                  </UIButton>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>버튼 설정</DialogTitle>
                    <DialogDescription>
                      모든 콘텐츠에 일괄 적용할 설정을 선택하세요
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>모든 콘텐츠 채널 변경</Label>
                      <ChannelSelect
                        value=""
                        onChange={handleBulkChannelChange}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <UIButton
                      variant="outline"
                      onClick={() => {
                        // Dialog 닫기
                        const closeEvent = new CustomEvent('close-dialog');
                        document.dispatchEvent(closeEvent);
                      }}
                    >
                      닫기
                    </UIButton>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <UIButton size="icon" variant="ghost" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </UIButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={addContent}>
                    <Plus className="h-4 w-4 mr-2" />
                    콘텐츠 추가
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRemove(button.id)}>
                    <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                    <span className="text-destructive">버튼 삭제</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <UIButton
                size="icon"
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </UIButton>
            </div>
          </>
        )}
      </div>
      
      {isExpanded && (
        <div className="p-3 space-y-3 bg-background/50">
          <ContentList
            contents={button.contents}
            onChange={handleContentChange}
            onRemove={removeContent}
            onAdd={addContent}
          />
        </div>
      )}
    </div>
  );
}