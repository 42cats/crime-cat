import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  FolderPlus, 
  Trash2,
  Send,
  Plus
} from 'lucide-react';

// 타입 정의
type Content = {
  id: string;
  channelId: string;
  text: string;
};

type Group = {
  id: string;
  name: string;
  contents: Content[];
};

type MultiSelectMessageEditorProps = {
  guildId: string;
  guildName: string;
};

// 하드코딩된 채널 정보 (실제로는 API에서 가져와야 함)
const DEFAULT_CHANNELS = [
  { id: 'general', name: '일반' },
  { id: 'notice', name: '공지' },
  { id: 'free', name: '자유' },
  { id: 'game', name: '게임' },
  { id: 'music', name: '음악' }
];

const MultiSelectMessageEditor: React.FC<MultiSelectMessageEditorProps> = ({ 
  guildId, 
  guildName 
}) => {
  const [groups, setGroups] = useState<Group[]>([
    {
      id: '1',
      name: '예제 그룹',
      contents: [
        {
          id: 'content1',
          channelId: 'general',
          text: '첫 번째 메시지'
        }
      ]
    }
  ]);

  const [selectedItems, setSelectedItems] = useState<{[key: string]: boolean}>({});
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  useEffect(() => {
    console.log(`현재 선택된 길드: ${guildId} - ${guildName}`);
  }, [guildId, guildName]);

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedItems({});
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  const addGroup = () => {
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name: `새 그룹 ${groups.length + 1}`,
      contents: []
    };
    setGroups(prev => [...prev, newGroup]);
  };

  const updateGroupName = (groupId: string, newName: string) => {
    setGroups(prev => 
      prev.map(group => 
        group.id === groupId 
          ? { ...group, name: newName } 
          : group
      )
    );
  };

  const addContentToGroup = (groupId: string) => {
    const newContent: Content = {
      id: `content-${Date.now()}`,
      channelId: 'general', // 기본 채널
      text: ''
    };

    setGroups(prev => 
      prev.map(group => 
        group.id === groupId 
          ? { ...group, contents: [...group.contents, newContent] } 
          : group
      )
    );
  };

  const updateContent = (groupId: string, contentId: string, updates: Partial<Content>) => {
    setGroups(prev => 
      prev.map(group => 
        group.id === groupId 
          ? {
              ...group, 
              contents: group.contents.map(content => 
                content.id === contentId 
                  ? { ...content, ...updates } 
                  : content
              )
            }
          : group
      )
    );
  };

  const handleDelete = () => {
    const selectedContentIds = Object.keys(selectedItems).filter(id => selectedItems[id]);
    setGroups(prev => 
      prev.map(group => ({
        ...group,
        contents: group.contents.filter(content => !selectedItems[content.id])
      }))
    );
    setSelectedItems({});
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">{guildName} 메시지 에디터</h1>
        <Button 
          variant="outline"
          onClick={toggleMultiSelectMode}
          className="border-gray-300 hover:bg-gray-100"
        >
          {isMultiSelectMode ? '선택 취소' : '선택'}
        </Button>
      </div>

      {/* 멀티셀렉트 모드 액션 바 */}
      {isMultiSelectMode && selectedCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-50 px-4">
          <div className="bg-white shadow-lg rounded-lg p-4 flex justify-between items-center border border-gray-200">
            <span className="text-sm font-medium text-gray-700">{selectedCount}개 선택됨</span>
            <div className="flex space-x-2">
              <Button 
                variant="destructive"
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600"
              >
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 그룹 및 컨텐츠 리스트 */}
      <div className="space-y-6">
        {groups.map((group) => (
          <div 
            key={group.id} 
            className={`
              border rounded-lg bg-white shadow-sm transition-all duration-200
              ${isMultiSelectMode && selectedItems[group.id] 
                ? 'border-blue-300 ring-2 ring-blue-100' 
                : 'border-gray-200'
              }
            `}
          >
            {/* 그룹 헤더 */}
            <div className="flex items-center space-x-4 p-4 border-b border-gray-100">
              {isMultiSelectMode && (
                <Checkbox
                  checked={!!selectedItems[group.id]}
                  onCheckedChange={() => toggleItemSelection(group.id)}
                  className="mr-2"
                />
              )}
              <input
                type="text"
                value={group.name}
                onChange={(e) => updateGroupName(group.id, e.target.value)}
                className="text-lg font-semibold text-gray-800 w-full border-b border-transparent hover:border-gray-300 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* 컨텐츠 리스트 */}
            <div className="p-4 space-y-4">
              {group.contents.map((content) => (
                <div 
                  key={content.id} 
                  className={`
                    border rounded-lg p-4 transition-all duration-200 space-y-4
                    ${isMultiSelectMode && selectedItems[content.id] 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  {isMultiSelectMode && (
                    <Checkbox
                      checked={!!selectedItems[content.id]}
                      onCheckedChange={() => toggleItemSelection(content.id)}
                      className="mr-2"
                    />
                  )}
                  
                  {/* 채널 선택 */}
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      채널 선택
                    </label>
                    <Select
                      value={content.channelId}
                      onValueChange={(channelId) => 
                        updateContent(group.id, content.id, { channelId })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="채널 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_CHANNELS.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 메시지 입력 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      메시지 입력
                    </label>
                    <Textarea
                      placeholder="메시지를 입력하세요 (최대 2,000자)"
                      value={content.text}
                      onChange={(e) => 
                        updateContent(group.id, content.id, { text: e.target.value })
                      }
                      maxLength={2000}
                      className="w-full min-h-[200px] resize-y"
                    />
                    <div className="text-right text-xs text-gray-500 mt-1">
                      {content.text.length} / 2,000
                    </div>
                  </div>
                </div>
              ))}
              
              {/* 컨텐츠 추가 버튼 */}
              <Button 
                variant="outline"
                onClick={() => addContentToGroup(group.id)}
                className="w-full flex items-center justify-center gap-2 border-dashed border-gray-300 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">메시지 추가</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* 그룹 추가 버튼 */}
      <div className="mt-6 flex justify-center">
        <Button 
          variant="outline" 
          onClick={addGroup}
          className="w-full flex items-center justify-center gap-2 border-dashed border-gray-300 hover:bg-gray-50"
        >
          <FolderPlus className="h-5 w-5 text-gray-500" />
          <span className="text-gray-700">그룹 추가</span>
        </Button>
      </div>
    </div>
  );
};

export default MultiSelectMessageEditor;
