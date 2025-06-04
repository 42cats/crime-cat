import React, { useState } from "react";
import { ContentData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button as UIButton } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChannelSelect } from "@/components/ui/channel-select";
import { RoleSelect } from "@/components/ui/role-select";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ContentListProps {
  contents: ContentData[];
  onChange: (contentId: string, updatedData: Partial<ContentData>) => void;
  onRemove: (contentId: string) => void;
  onAdd: () => void;
  guildId: string;
}

export function ContentList({ 
  contents, 
  onChange, 
  onRemove, 
  onAdd,
  guildId 
}: ContentListProps) {
  const [selectedContents, setSelectedContents] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  
  // 콘텐츠 선택 토글
  const toggleContentSelection = (contentId: string) => {
    setSelectedContents(prev => {
      if (prev.includes(contentId)) {
        return prev.filter(id => id !== contentId);
      } else {
        return [...prev, contentId];
      }
    });
  };
  
  // 전체 선택/해제 토글
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedContents([]);
    } else {
      setSelectedContents(contents.map(content => content.id));
    }
    setIsAllSelected(!isAllSelected);
  };
  
  // 선택된 콘텐츠 일괄 삭제
  const removeSelectedContents = () => {
    if (selectedContents.length === 0) return;
    
    // 콘텐츠가 최소 1개는 남아있어야 함
    if (contents.length - selectedContents.length < 1) {
      toast.error("최소 1개의 콘텐츠는 남겨두어야 합니다.");
      return;
    }
    
    const confirmDelete = window.confirm(`선택한 ${selectedContents.length}개의 콘텐츠를 삭제하시겠습니까?`);
    if (confirmDelete) {
      selectedContents.forEach(contentId => {
        onRemove(contentId);
      });
      setSelectedContents([]);
      toast.success(`${selectedContents.length}개의 콘텐츠가 삭제되었습니다.`);
    }
  };
  
  // 선택된 콘텐츠 채널 일괄 변경
  const changeSelectedContentsChannel = (channelId: string) => {
    if (selectedContents.length === 0) return;
    
    // 변경된 콘텐츠 기준으로 updatedContents를 생성하지 않고
    // 기존 콘텐츠를 복사한 후 선택된 것만 채널 변경
    const updatedContents = contents.map(content => {
      if (selectedContents.includes(content.id)) {
        return { ...content, channelId };
      }
      return content;
    });
    
    // 선택된 각 콘텐츠마다 onChange를 호출하는 대신 
    // 버튼에 전체 콘텐츠 리스트를 적용
    // 이렇게 하면 선택한 콘텐츠에 대한 변경사항이 한번에 반영됨
    const buttonId = contents[0]?.buttonId;
    if (buttonId) {
      const event = new CustomEvent('update-contents', {
        detail: { buttonId, contents: updatedContents }
      });
      document.dispatchEvent(event);
    }
    
    toast.success(`${selectedContents.length}개 콘텐츠의 채널이 변경되었습니다.`);
    
    // Dialog 닫기
    const closeEvent = new CustomEvent('close-dialog');
    document.dispatchEvent(closeEvent);
  };
  
  return (
    <div>
      {selectedContents.length > 0 && (
        <div className="flex items-center justify-between mb-3 p-2 bg-muted rounded-md">
          <div className="flex items-center gap-2">
            <Checkbox 
              id="select-all" 
              checked={isAllSelected} 
              onCheckedChange={toggleSelectAll} 
            />
            <Label htmlFor="select-all" className="text-sm">
              {selectedContents.length}개 선택됨
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <UIButton size="sm" variant="outline">
                  채널 변경
                </UIButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>채널 일괄 변경</DialogTitle>
                  <DialogDescription>
                    선택한 {selectedContents.length}개 콘텐츠의 채널을 변경합니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <ChannelSelect
                    value=""
                    onChange={changeSelectedContentsChannel}
                  />
                </div>
              </DialogContent>
            </Dialog>
            
            <UIButton 
              size="sm" 
              variant="outline" 
              className="text-destructive hover:bg-destructive/10"
              onClick={removeSelectedContents}
            >
              <Trash2 className="h-4 w-4 mr-1" /> 삭제
            </UIButton>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {contents.map((content) => (
          <div 
            key={content.id}
            className={cn(
              "border rounded-md p-3 bg-card",
              selectedContents.includes(content.id) && "ring-2 ring-primary"
            )}
          >
            <div className="flex items-start gap-2">
              <Checkbox
                id={`content-${content.id}`}
                checked={selectedContents.includes(content.id)}
                onCheckedChange={() => toggleContentSelection(content.id)}
                className="mt-1"
              />
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`channel-${content.id}`} className="mb-1 block text-sm font-medium">
                      출력 채널
                    </Label>
                    <ChannelSelect
                      id={`channel-${content.id}`}
                      value={content.channelId}
                      onChange={(channelId) => onChange(content.id, { channelId })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`role-${content.id}`} className="mb-1 block text-sm font-medium">
                      권한 역할
                    </Label>
                    <RoleSelect
                      id={`role-${content.id}`}
                      value={content.roleId || "ALL"}
                      onChange={(roleId) => onChange(content.id, { roleId })}
                      guildId={guildId}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor={`text-${content.id}`} className="text-sm font-medium">
                      메시지
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {content.text.length}/2000
                    </span>
                  </div>
                  <Textarea
                    id={`text-${content.id}`}
                    value={content.text}
                    onChange={(e) => onChange(content.id, { text: e.target.value })}
                    placeholder="여기에 출력할 메시지를 입력하세요."
                    className="min-h-[120px] resize-none"
                    maxLength={2000}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <UIButton
        variant="outline"
        onClick={onAdd}
        className="w-full mt-3 border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" /> 콘텐츠 추가
      </UIButton>
    </div>
  );
}