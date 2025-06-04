import React, { useState, useCallback } from "react";
import { toast } from "sonner";
import { SortableButtonList } from "./SortableButtonList";
import { useSortable } from "@dnd-kit/sortable";
import { Button as UIButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GroupData } from "@/lib/types";
import { cn } from "@/lib/utils";
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
  AlertCircle
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SortableGroupProps {
  group: GroupData;
  index: number;
  guildId: string;
  onChange: (groupId: string, updatedData: Partial<GroupData>) => void;
  onRemove: (groupId: string) => void;
  onButtonAdd: (groupId: string) => void;
  isButtonNameDuplicate?: (groupId: string, buttonId: string, name: string) => boolean;
}

export function SortableGroup({
  group,
  index,
  guildId,
  onChange,
  onRemove,
  onButtonAdd,
  isButtonNameDuplicate
}: SortableGroupProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
  });

  const style = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(group.name);

  const [error, setError] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const handleNameChange = (e) => {
    const inputVal = e.target.value;
    
    // IME 입력 중에는 검사하지 않음
    if (isComposing) {
      setGroupName(inputVal);
      return;
    }
    
    // 영어, 숫자, 한글(완성형), 언더바(_) 허용 + 길이 제한 10자
    const sanitized = inputVal
      .replace(/[^a-zA-Z0-9ㄱ-ㆎ가-힣_\s]/g, "")
      .slice(0, 20);
    
    if (sanitized !== inputVal) {
      setError("특수문자는 사용할 수 없습니다. (최대 20자)");
    } else {
      setError("");
    }
    
    setGroupName(sanitized);
  };
  
  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = (e) => {
    setIsComposing(false);
    handleNameChange(e);
  };

  const saveGroupName = () => {
    if (error) {
      toast.error("유효한 그룹 이름을 입력해주세요");
      return;
    }
    
    if (groupName.trim() === "") {
      toast.error("그룹 이름은 공백일 수 없습니다");
      return;
    }
    
    onChange(group.id, { name: groupName });
    setIsEditing(false);
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "mb-4 transition-shadow border border-border bg-card",
        isDragging ? "shadow-lg ring-2 ring-primary ring-opacity-50" : ""
      )}
    >
      <CardHeader className="p-4 flex flex-row items-center space-y-0 gap-2 border-b">
        <div {...attributes} {...listeners} className="cursor-grab touch-none px-1">
          <MoveVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <div className="flex-1 flex flex-col gap-2">
              <Input
                value={groupName}
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <UIButton
                    size="icon"
                    variant="ghost"
                    onClick={saveGroupName}
                    className="h-8 w-8 text-green-600 hover:text-green-700"
                  >
                    <Check className="h-4 w-4" />
                  </UIButton>
                </TooltipTrigger>
                <TooltipContent>저장</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <UIButton
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setGroupName(group.name); 
                      setIsEditing(false);
                    }}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </UIButton>
                </TooltipTrigger>
                <TooltipContent>취소</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                {group.name}
                <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  {group.buttons.length}개 버튼
                </span>
              </CardTitle>
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <UIButton size="icon" variant="ghost" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </UIButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onButtonAdd(group.id)}>
                    <Plus className="h-4 w-4 mr-2" />
                    버튼 추가
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const confirmDelete = window.confirm(`"${group.name}" 그룹을 삭제하시겠습니까?`);
                    if (confirmDelete) onRemove(group.id);
                  }}>
                    <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                    <span className="text-destructive">그룹 삭제</span>
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
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-4 pt-4 space-y-3">
          {group.buttons.length > 0 ? (
            <>
              <SortableButtonList 
                buttons={group.buttons} 
                groupId={group.id}
                guildId={guildId}
                onChange={onChange}
                isButtonNameDuplicate={isButtonNameDuplicate}
              />
              
              {/* 버튼 추가 버튼 - 그룹 내 버튼 목록 하단에 배치 */}
              {group.buttons.length < 25 ? (
                <UIButton
                  variant="outline"
                  onClick={() => onButtonAdd(group.id)}
                  className="w-full mt-3 flex items-center justify-center gap-2 text-sm hover:bg-muted/50 px-3 py-2 rounded border border-dashed border-border transition-colors"
                >
                  <Plus className="h-4 w-4" /> 버튼 추가
                </UIButton>
              ) : (
                <div className="flex items-center justify-center p-2 mt-3 bg-orange-50 text-orange-700 border border-orange-200 rounded-md">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <p className="text-xs">디스코드 제한으로 버튼은 최대 25개까지만 추가할 수 있습니다</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 bg-muted/40 rounded-md">
              <p className="text-muted-foreground">그룹에 버튼이 없습니다</p>
              <UIButton
                variant="outline"
                onClick={() => onButtonAdd(group.id)}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" /> 버튼 추가
              </UIButton>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
