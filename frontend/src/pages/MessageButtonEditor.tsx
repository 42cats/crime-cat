import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button as UIButton } from '@/components/ui/button';
import { Group } from '@/components/group';
import { Plus, Save } from 'lucide-react';
import { GroupData, ButtonData, DraggableItem, ItemPosition } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { fetchGroupsFromServer, saveData } from '@/api/messageButtonService';
import { useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

const pageStyles = {
  container: "min-h-screen bg-white dark:bg-zinc-900", // 밝은 배경, 다크모드 대응
  content: "container max-w-4xl mx-auto py-12 px-4 animate-reveal",
  header: "mb-10 text-center",
  title: "text-3xl font-bold mb-2 text-messagehub-accent dark:text-white", // 다크모드에서 밝게
  subtitle: "text-content-subtle dark:text-zinc-400",
  groupContainer: "space-y-6 stagger-children",
  addButtonContainer: "mt-8 flex justify-center",
  emptyState: "py-10",
  addButton: "flex items-center gap-2 px-6 py-5 shadow-depth hover:shadow-hover transition-all bg-white dark:bg-zinc-800 border dark:border-zinc-700 text-black dark:text-white"
};
const defaultGroup: GroupData = {
  id: uuidv4(),
  name: '예제그룹',
  index: 0,
  buttons: [
    {
      id: uuidv4(),
      name: '버튼예시',
      index: 0,
      groupId: '',
      guildId: '',
      contents: [
        {
          id: uuidv4(),
          channelId: "",
          text: "여기에 채널에 보낼 메시지를 입력하세요",
          index: 0,
          buttonId: ''
        }
      ]
    }
  ]
};

const messageButtonEditor = () => {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [draggedItem, setDraggedItem] = useState<DraggableItem | null>(null);
  const [dropIndicator, setDropIndicator] = useState<ItemPosition | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { guildId } = useParams<{ guildId: string }>(); // 타입 안전하게
  const location = useLocation();
  const guildName = location.state?.guildName ?? '이름 없음';


  useEffect(() => {
    async function loadData() {
      try {
        const serverGroups = await fetchGroupsFromServer(guildId);
        if (serverGroups && serverGroups.length > 0) {
          const processedGroups = serverGroups.map((group, groupIndex) => {
            group.index = groupIndex;
            const updatedButtons = group.buttons.map((button, buttonIndex) => {
              button.index = buttonIndex;
              button.groupId = group.id;
              const updatedContents = button.contents.map((content, contentIndex) => {
                content.index = contentIndex;
                content.buttonId = button.id;
                return content;
              });
              return { ...button, contents: updatedContents };
            });
            return { ...group, buttons: updatedButtons };
          });
          setGroups(processedGroups);
        } else {
          const initialGroup = { 
            ...defaultGroup,
            buttons: defaultGroup.buttons.map(btn => {
              const buttonWithGroupId = { ...btn, groupId: defaultGroup.id };
              const contentsWithBtnId = buttonWithGroupId.contents.map(cont => ({
                ...cont,
                buttonId: buttonWithGroupId.id
              }));
              return { ...buttonWithGroupId, contents: contentsWithBtnId };
            })
          };
          setGroups([initialGroup]);
        }
      } catch (error) {
        console.error("Failed to load groups:", error);
        const fallbackGroup = { 
          ...defaultGroup,
          buttons: defaultGroup.buttons.map(btn => {
            const buttonWithGroupId = { ...btn, groupId: defaultGroup.id };
            const contentsWithBtnId = buttonWithGroupId.contents.map(cont => ({
              ...cont,
              buttonId: buttonWithGroupId.id
            }));
            return { ...buttonWithGroupId, contents: contentsWithBtnId };
          })
        };
        setGroups([fallbackGroup]);
      }
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedGroups = groups.map((group, groupIndex) => {
        group.index = groupIndex;
        const updatedButtons = group.buttons.map((button, buttonIndex) => {
          button.index = buttonIndex;
          button.groupId = group.id;
          const updatedContents = button.contents.map((content, contentIndex) => {
            content.index = contentIndex;
            content.buttonId = button.id;
            return content;
          });
          return { ...button, contents: updatedContents };
        });
        return { ...group, buttons: updatedButtons };
      });
      const success = await saveData(guildId,updatedGroups);
      if (success) {
        toast.success('데이터가 성공적으로 저장되었습니다');
      } else {
        toast.error('데이터 저장 중 오류가 발생했습니다');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('데이터 저장 중 오류가 발생했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGroupChange = (groupId: string, updatedData: Partial<GroupData>) => {
    setGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === groupId ? { ...group, ...updatedData } : group
      )
    );
  };
  
  const addGroup = () => {
    const newGroup: GroupData = {
      id: uuidv4(),
      name: `Group ${groups.length + 1}`,
      buttons: [],
      index: groups.length
    };
    
    setGroups([...groups, newGroup]);
    toast.success('새 그룹추가');
  };
  
  const removeGroup = (groupId: string) => {
    setGroups(prevGroups => prevGroups.filter(group => group.id !== groupId));
    toast.success('그룹 제거');
  };
  
  const moveButton = (buttonId: string, sourceGroupId: string, targetGroupId: string, targetIndex: number) => {
    setGroups(prevGroups => {
      const sourceGroup = prevGroups.find(g => g.id === sourceGroupId);
      if (!sourceGroup) return prevGroups;
      
      const buttonToMove = sourceGroup.buttons.find(b => b.id === buttonId);
      if (!buttonToMove) return prevGroups;
      
      return prevGroups.map(group => {
        if (group.id === sourceGroupId) {
          return {
            ...group,
            buttons: group.buttons.filter(b => b.id !== buttonId)
          };
        }
        
        if (group.id === targetGroupId) {
          const newButtons = [...group.buttons];
          newButtons.splice(targetIndex, 0, buttonToMove);
          return {
            ...group,
            buttons: newButtons
          };
        }
        
        return group;
      });
    });
    
    toast.success('버튼 이동됨');
  };
  
  const reorderButtons = (groupId: string, buttons: ButtonData[]) => {
    setGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === groupId ? { ...group, buttons } : group
      )
    );
    toast.success('버튼 재정렬');
  };
  
  const handleDragStart = (item: DraggableItem) => {
    setDraggedItem(item);
  };
  
  const handleDragEnd = () => {
    if (draggedItem && dropIndicator) {
      if (draggedItem.type === 'group') {
        setGroups(prevGroups => {
          const newGroups = [...prevGroups];
          const [movedGroup] = newGroups.splice(draggedItem.index, 1);
          newGroups.splice(dropIndicator.newIndex, 0, movedGroup);
          return newGroups;
        });
        toast.success('그룹 재정렬');
      } else if (draggedItem.type === 'button' && draggedItem.parentId) {
        if (draggedItem.parentId === dropIndicator.newParentId) {
          const groupToUpdate = groups.find(g => g.id === draggedItem.parentId);
          if (groupToUpdate) {
            const newButtons = [...groupToUpdate.buttons];
            const [movedButton] = newButtons.splice(draggedItem.index, 1);
            newButtons.splice(dropIndicator.newIndex, 0, movedButton);
            reorderButtons(draggedItem.parentId, newButtons);
          }
        } else {
          moveButton(
            draggedItem.id,
            draggedItem.parentId,
            dropIndicator.newParentId || draggedItem.parentId,
            dropIndicator.newIndex
          );
        }
      }
    }
    
    setDraggedItem(null);
    setDropIndicator(null);
  };
  
  const handleGroupDragOver = (e: React.DragEvent, item: DraggableItem) => {
    if (!draggedItem || draggedItem.id === item.id) return;
    
    if (draggedItem.type === 'group' && item.type === 'group') {
      setDropIndicator({
        id: item.id,
        type: 'group',
        newIndex: item.index
      });
    } else if (draggedItem.type === 'button' && item.type === 'group') {
      setDropIndicator({
        id: draggedItem.id,
        type: 'button',
        newIndex: 0,
        newParentId: item.id
      });
    }
  };
  
  const handleButtonDragOver = (e: React.DragEvent, item: DraggableItem) => {
    if (!draggedItem || draggedItem.id === item.id) return;
    
    if (draggedItem.type === 'button' && item.type === 'button') {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const middle = rect.top + rect.height / 2;
      const mouseY = e.clientY;
      
      const newIndex = mouseY < middle ? item.index : item.index + 1;
      
      setDropIndicator({
        id: draggedItem.id,
        type: 'button',
        newIndex: newIndex,
        newParentId: item.parentId
      });
    }
  };
  
  return (
    <div className={pageStyles.container}>
      <div className={pageStyles.content}>
        <header className={pageStyles.header}>
          <h1 className={pageStyles.title}>{guildName}서버의 메시지 매크로 에디터</h1>
          <p className={pageStyles.subtitle}>
            메시지를 버튼하나로 쉽게 보낼수 있도록 해당 버튼과 보낼 내용을 이곳에서 편집하세요.
          </p>
          <p className={pageStyles.subtitle}>
            그룹의 이름은 공백이나 특수문자없이 입력하세요.
          </p>
          <div className="flex justify-end mt-4">
            <UIButton 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6"
            >
              <Save className="h-4 w-4" />
              {isSaving ? '저장 중...' : '저장하기'}
            </UIButton>
          </div>
        </header>
        
        <div className={pageStyles.groupContainer}>
          {groups.map((group, index) => (
            <Group
              key={group.id}
              data={group}
              index={index}
              onChange={handleGroupChange}
              onRemove={removeGroup}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleGroupDragOver}
              onButtonDragStart={handleDragStart}
              onButtonDragEnd={handleDragEnd}
              onButtonDragOver={handleButtonDragOver}
              draggedItem={draggedItem}
              dropIndicator={dropIndicator}
              guildId={guildId}
            />
          ))}
          
          <div className={cn(
            pageStyles.addButtonContainer,
            groups.length === 0 ? pageStyles.emptyState : ""
          )}>
            <UIButton 
              onClick={addGroup}
              className={pageStyles.addButton}
              size="lg"
            >
              <Plus className="h-5 w-5" />
              <span>그룹추가</span>
            </UIButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default messageButtonEditor;
