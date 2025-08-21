import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Link, Save, ExternalLink, Settings, CalendarDays } from 'lucide-react';
import { scheduleService } from '@/api/schedule';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import PersonalCalendar from '@/components/schedule/PersonalCalendar';

/**
 * 개인 캘린더 관리 대시보드
 * - iCalendar URL 등록/수정
 * - 캘린더 동기화 관리
 * - 개인 가용시간 설정
 */
const ScheduleDashboard: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [icalUrl, setIcalUrl] = useState('');

  // 캘린더 URL 저장 Mutation
  const saveCalendarMutation = useMutation({
    mutationFn: (url: string) => scheduleService.saveUserCalendar({ icalUrl: url }),
    onSuccess: () => {
      toast({
        title: '캘린더 연동 완료! 🎉',
        description: 'iCalendar가 성공적으로 연동되었습니다.',
      });
      setIcalUrl('');
      queryClient.invalidateQueries({ queryKey: ['schedule', 'user-calendar'] });
    },
    onError: (error: any) => {
      toast({
        title: '연동 실패',
        description: error?.response?.data?.message || '캘린더 연동 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>로그인이 필요합니다</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              개인 캘린더 관리 기능을 사용하려면 로그인해주세요.
            </p>
            <Button onClick={() => navigate('/login')}>
              로그인하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaveCalendar = () => {
    if (!icalUrl.trim()) {
      toast({
        title: 'URL을 입력해주세요',
        description: 'iCalendar URL을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (!icalUrl.includes('http')) {
      toast({
        title: '올바른 URL을 입력해주세요',
        description: 'http:// 또는 https://로 시작하는 URL을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    saveCalendarMutation.mutate(icalUrl);
  };

  const handleViewAllEvents = () => {
    navigate('/schedule');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">개인 캘린더 관리</h1>
          <p className="text-muted-foreground mt-1">
            외부 캘린더를 연동하고 가용시간을 관리하세요
          </p>
        </div>
        
        <Button onClick={handleViewAllEvents} variant="outline" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          전체 일정 보기
        </Button>
      </div>

      {/* 탭 메뉴 */}
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            내 캘린더
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            설정
          </TabsTrigger>
        </TabsList>

        {/* 캘린더 탭 */}
        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 개인 캘린더 - 메인 영역 */}
            <div className="lg:col-span-2">
              <PersonalCalendar 
                allowBlocking={true}
                showBlockedDates={true}
                onDateSelect={(date) => {
                  console.log('Selected date:', date);
                }}
              />
            </div>
            
            {/* 사이드바 - 안내 및 통계 */}
            <div className="space-y-4">
              {/* 캘린더 연동 혜택 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🎯 기능 소개</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">⏰ 자동 가용시간 계산</h4>
                    <p className="text-xs text-muted-foreground">
                      기존 일정과 겹치지 않는 시간을 자동으로 찾아드립니다.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">🚫 날짜 비활성화</h4>
                    <p className="text-xs text-muted-foreground">
                      클릭하거나 드래그하여 특정 날짜를 추천에서 제외할 수 있습니다.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">📊 시각적 표시</h4>
                    <p className="text-xs text-muted-foreground">
                      3가지 색상으로 날짜 상태를 구분하여 표시합니다.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">🎯 최적 추천</h4>
                    <p className="text-xs text-muted-foreground">
                      모든 참여자의 가용시간을 고려한 최적의 시간을 추천합니다.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 빠른 액션 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">⚡ 빠른 액션</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => navigate('/schedule/create')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    새 일정 만들기
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => navigate('/schedule')}
                  >
                    <CalendarDays className="w-4 h-4 mr-2" />
                    모든 일정 보기
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 설정 탭 */}
        <TabsContent value="settings" className="space-y-6">
          {/* iCalendar URL 등록 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5" />
                iCalendar 연동
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ical-url">iCalendar URL (.ics)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="ical-url"
                    type="url"
                    placeholder="https://calendar.google.com/calendar/ical/..."
                    value={icalUrl}
                    onChange={(e) => setIcalUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSaveCalendar}
                    disabled={saveCalendarMutation.status === 'pending'}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saveCalendarMutation.status === 'pending' ? '저장 중...' : '저장'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Google Calendar, Outlook, Apple Calendar 등의 iCalendar URL을 입력하세요.
                </p>
              </div>

              {/* 캘린더 URL 가이드 */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">📖 캘린더 URL 찾는 방법</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Google Calendar:</strong>
                    <ol className="list-decimal list-inside ml-2 space-y-1">
                      <li>Google Calendar 접속</li>
                      <li>내 캘린더 → 설정 및 공유</li>
                      <li>"비공개 주소"에서 iCal 형식 URL 복사</li>
                    </ol>
                  </div>
                  <div>
                    <strong>Outlook:</strong>
                    <ol className="list-decimal list-inside ml-2 space-y-1">
                      <li>Outlook.com → 설정 → 캘린더 보기</li>
                      <li>"공유 캘린더" → ICS 링크 복사</li>
                    </ol>
                  </div>
                  <div>
                    <strong>Apple Calendar:</strong>
                    <ol className="list-decimal list-inside ml-2 space-y-1">
                      <li>iCloud.com → 캘린더</li>
                      <li>캘린더 이름 옆 공유 아이콘 클릭</li>
                      <li>"공용 캘린더" → URL 복사</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 개인정보 보호 안내 */}
          <Card>
            <CardHeader>
              <CardTitle>🛡️ 개인정보 보호</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>• 캘린더 URL은 암호화되어 안전하게 저장됩니다.</p>
                <p>• 일정 제목이나 내용은 저장하지 않고, 시간 정보만 활용합니다.</p>
                <p>• 언제든지 연동을 해제할 수 있습니다.</p>
                <p>• 개인 일정 정보는 다른 사용자에게 공개되지 않습니다.</p>
              </div>
            </CardContent>
          </Card>

          {/* 고급 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>⚙️ 고급 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">동기화 설정</h4>
                <p className="text-xs text-muted-foreground">
                  캘린더 데이터는 매시간 자동으로 동기화됩니다.
                </p>
                <Button variant="outline" size="sm">
                  지금 동기화
                </Button>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">알림 설정</h4>
                <p className="text-xs text-muted-foreground">
                  새로운 추천 시간이 있을 때 알림을 받을 수 있습니다.
                </p>
                <Button variant="outline" size="sm" disabled>
                  알림 설정 (곧 제공 예정)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScheduleDashboard;