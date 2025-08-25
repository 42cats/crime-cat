import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Settings, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { CalendarResponse, CalendarCreateRequest, CalendarUpdateRequest, ColorPalette } from '@/types/calendar';
import { getCalendarColor, CALENDAR_COLORS } from '@/utils/calendarColors';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CalendarManagementProps {
  calendars: CalendarResponse[];
  onAddCalendar: (request: CalendarCreateRequest) => Promise<void>;
  onUpdateCalendar: (id: string, request: CalendarUpdateRequest) => Promise<void>;
  onDeleteCalendar: (id: string) => Promise<void>;
  onSyncCalendar: (id: string) => Promise<void>;
  onSyncAllCalendars: () => Promise<void>;
  isLoading?: boolean;
}

/**
 * 다중 캘린더 관리 컴포넌트
 * - 캘린더 목록 표시 및 관리
 * - 색상 선택 및 활성화 토글
 * - 동기화 상태 표시
 */
const CalendarManagement: React.FC<CalendarManagementProps> = ({
  calendars,
  onAddCalendar,
  onUpdateCalendar,
  onDeleteCalendar,
  onSyncCalendar,
  onSyncAllCalendars,
  isLoading = false
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<CalendarResponse | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const handleAddCalendar = async (formData: FormData) => {
    const icalUrl = formData.get('icalUrl') as string;
    const displayName = formData.get('displayName') as string;

    if (!icalUrl.trim()) {
      toast({ title: "오류", description: "iCalendar URL을 입력해주세요.", variant: "destructive" });
      return;
    }

    if (!icalUrl.match(/^https?:\/\/.+/)) {
      toast({ title: "오류", description: "올바른 URL 형식이 아닙니다.", variant: "destructive" });
      return;
    }

    try {
      await onAddCalendar({ icalUrl, displayName: displayName.trim() || undefined });
      setIsAddDialogOpen(false);
      toast({ title: "성공", description: "캘린더가 추가되었습니다." });
    } catch (error) {
      toast({ 
        title: "오류", 
        description: "캘린더 추가에 실패했습니다.", 
        variant: "destructive" 
      });
    }
  };

  const handleUpdateCalendar = async (id: string, updates: CalendarUpdateRequest) => {
    try {
      await onUpdateCalendar(id, updates);
      setEditingCalendar(null);
      toast({ title: "성공", description: "캘린더가 수정되었습니다." });
    } catch (error) {
      toast({ 
        title: "오류", 
        description: "캘린더 수정에 실패했습니다.", 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteCalendar = async (id: string) => {
    if (!confirm('이 캘린더를 삭제하시겠습니까?')) return;
    
    try {
      await onDeleteCalendar(id);
      toast({ title: "성공", description: "캘린더가 삭제되었습니다." });
    } catch (error) {
      toast({ 
        title: "오류", 
        description: "캘린더 삭제에 실패했습니다.", 
        variant: "destructive" 
      });
    }
  };

  const handleSyncCalendar = async (id: string) => {
    setSyncingId(id);
    try {
      await onSyncCalendar(id);
      toast({ title: "성공", description: "캘린더가 동기화되었습니다." });
    } catch (error) {
      toast({ 
        title: "오류", 
        description: "동기화에 실패했습니다.", 
        variant: "destructive" 
      });
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncAll = async () => {
    try {
      await onSyncAllCalendars();
      toast({ title: "성공", description: "모든 캘린더가 동기화되었습니다." });
    } catch (error) {
      toast({ 
        title: "오류", 
        description: "일괄 동기화에 실패했습니다.", 
        variant: "destructive" 
      });
    }
  };

  const getSyncStatusBadge = (status: CalendarResponse['syncStatus']) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge variant="default" className="bg-green-100 text-green-700">동기화 완료</Badge>;
      case 'ERROR':
        return <Badge variant="destructive">동기화 실패</Badge>;
      case 'PENDING':
        return <Badge variant="outline">대기 중</Badge>;
    }
  };

  const formatSyncTime = (date?: Date) => {
    if (!date) return '동기화 안됨';
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">캘린더 관리</h2>
          <p className="text-gray-600">
            Google, Apple, Outlook 등의 외부 캘린더를 연동하여 관리하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSyncAll}
            disabled={isLoading || calendars.length === 0}
            size={isMobile ? "sm" : "default"}
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            {!isMobile && "전체 동기화"}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size={isMobile ? "sm" : "default"}>
                <Plus className="w-4 h-4" />
                {!isMobile && "캘린더 추가"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 캘린더 추가</DialogTitle>
              </DialogHeader>
              <form action={handleAddCalendar} className="space-y-4">
                <div>
                  <Label htmlFor="icalUrl">iCalendar URL *</Label>
                  <Input
                    id="icalUrl"
                    name="icalUrl"
                    placeholder="https://calendar.google.com/calendar/ical/..."
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Google Calendar, Apple Calendar, Outlook의 공개 iCal URL을 입력하세요
                  </p>
                </div>
                <div>
                  <Label htmlFor="displayName">표시 이름</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    placeholder="내 구글 캘린더"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    비워두면 캘린더 이름을 자동으로 추출합니다
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    취소
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    추가
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 캘린더 목록 */}
      <div className="space-y-3">
        {calendars.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                등록된 캘린더가 없습니다
              </h3>
              <p className="text-gray-500 text-center mb-4">
                외부 캘린더를 추가하여 일정을 통합 관리해보세요
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                첫 캘린더 추가하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[60vh]">
            <div className="space-y-3">
              {calendars.map((calendar) => (
                <CalendarItem
                  key={calendar.id}
                  calendar={calendar}
                  onUpdate={handleUpdateCalendar}
                  onDelete={handleDeleteCalendar}
                  onSync={handleSyncCalendar}
                  isLoading={isLoading}
                  isSyncing={syncingId === calendar.id}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

interface CalendarItemProps {
  calendar: CalendarResponse;
  onUpdate: (id: string, request: CalendarUpdateRequest) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSync: (id: string) => Promise<void>;
  isLoading: boolean;
  isSyncing: boolean;
  isMobile: boolean;
}

const CalendarItem: React.FC<CalendarItemProps> = ({
  calendar,
  onUpdate,
  onDelete,
  onSync,
  isLoading,
  isSyncing,
  isMobile
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: calendar.displayName || '',
    colorIndex: calendar.colorIndex
  });

  const colorInfo = getCalendarColor(calendar.colorIndex);

  const handleSave = async () => {
    await onUpdate(calendar.id, {
      displayName: editForm.displayName.trim() || undefined,
      colorIndex: editForm.colorIndex
    });
    setIsEditing(false);
  };

  const handleToggleActive = async () => {
    await onUpdate(calendar.id, { isActive: !calendar.isActive });
  };

  const getSyncStatusBadge = () => {
    switch (calendar.syncStatus) {
      case 'SUCCESS':
        return <Badge variant="default" className="bg-green-100 text-green-700 text-xs">완료</Badge>;
      case 'ERROR':
        return <Badge variant="destructive" className="text-xs">실패</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="text-xs">대기중</Badge>;
    }
  };

  const formatSyncTime = () => {
    if (!calendar.lastSyncedAt) return '동기화 안됨';
    return formatDistanceToNow(new Date(calendar.lastSyncedAt), { 
      addSuffix: true, 
      locale: ko 
    });
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      !calendar.isActive && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* 드래그 핸들 (추후 정렬 기능용) */}
          <div className="cursor-grab text-gray-400 hover:text-gray-600">
            <GripVertical className="w-4 h-4" />
          </div>

          {/* 색상 점 */}
          <div 
            className="w-6 h-6 rounded-full cursor-pointer border-2 border-gray-200 hover:scale-110 transition-transform"
            style={{ backgroundColor: colorInfo.hex }}
            title={`색상: ${colorInfo.name}`}
          />

          {/* 캘린더 정보 */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="캘린더 이름"
                  className="text-sm"
                />
                <div className="flex gap-1 flex-wrap">
                  {CALENDAR_COLORS.map((color, index) => (
                    <button
                      key={index}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-all",
                        editForm.colorIndex === index 
                          ? "border-gray-600 scale-110" 
                          : "border-gray-200 hover:scale-105"
                      )}
                      style={{ backgroundColor: color.hex }}
                      onClick={() => setEditForm(prev => ({ ...prev, colorIndex: index }))}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="font-medium text-sm truncate">
                  {calendar.displayName || calendar.calendarName || '이름 없음'}
                </div>
                <div className="text-xs text-gray-500 truncate" title={calendar.icalUrl}>
                  {calendar.icalUrl}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {getSyncStatusBadge()}
                  <span className="text-xs text-gray-400">
                    {formatSyncTime()}
                  </span>
                  {calendar.syncStatus === 'ERROR' && calendar.syncErrorMessage && (
                    <span 
                      className="text-xs text-red-500 truncate cursor-help" 
                      title={calendar.syncErrorMessage}
                    >
                      오류: {calendar.syncErrorMessage}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 제어 버튼 */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  취소
                </Button>
                <Button size="sm" onClick={handleSave}>
                  저장
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Switch
                  checked={calendar.isActive}
                  onCheckedChange={handleToggleActive}
                  disabled={isLoading}
                  className="scale-75"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSync(calendar.id)}
                  disabled={isLoading || isSyncing}
                  title="동기화"
                >
                  <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  title="설정"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(calendar.id)}
                  disabled={isLoading}
                  title="삭제"
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarManagement;