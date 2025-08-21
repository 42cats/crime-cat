import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Link, Save, ExternalLink, Settings, CalendarDays, Sparkles, Clock, Target } from 'lucide-react';
import { scheduleService } from '@/api/schedule';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/use-mobile';
import PersonalCalendar from '@/components/schedule/PersonalCalendar';
import { cn } from '@/lib/utils';

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
  const isMobile = useIsMobile();
  
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
    <div className={cn(
      "container mx-auto space-y-4 sm:space-y-6",
      isMobile ? "p-4" : "p-6"
    )}>
      {/* 헤더 */}
      <div className={cn(
        "flex flex-col gap-4",
        !isMobile && "flex-row items-center justify-between"
      )}>
        <div className="space-y-1">
          <h1 className={cn(
            "font-bold text-foreground",
            isMobile ? "text-2xl" : "text-3xl"
          )}>
            <span className="flex items-center gap-2">
              <Sparkles className={cn(
                "text-primary",
                isMobile ? "w-6 h-6" : "w-8 h-8"
              )} />
              개인 캘린더
            </span>
          </h1>
          <p className={cn(
            "text-muted-foreground",
            isMobile ? "text-sm" : "text-base"
          )}>
            {isMobile 
              ? "외부 캘린더 연동 및 가용시간 관리"
              : "외부 캘린더를 연동하고 가용시간을 관리하세요"
            }
          </p>
        </div>
        
        <Button 
          onClick={handleViewAllEvents} 
          variant="outline" 
          className={cn(
            "flex items-center gap-2",
            isMobile && "w-full justify-center"
          )}
        >
          <Calendar className="w-4 h-4" />
          {isMobile ? "일정 보기" : "전체 일정 보기"}
        </Button>
      </div>

      {/* 탭 메뉴 */}
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className={cn(
          "grid w-full grid-cols-2",
          isMobile && "h-auto"
        )}>
          <TabsTrigger 
            value="calendar" 
            className={cn(
              "flex items-center gap-2",
              isMobile ? "flex-col py-3 px-2" : "flex-row"
            )}
          >
            <CalendarDays className="w-4 h-4" />
            <span className={isMobile ? "text-xs" : "text-sm"}>
              {isMobile ? "캘린더" : "내 캘린더"}
            </span>
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className={cn(
              "flex items-center gap-2",
              isMobile ? "flex-col py-3 px-2" : "flex-row"
            )}
          >
            <Settings className="w-4 h-4" />
            <span className={isMobile ? "text-xs" : "text-sm"}>
              설정
            </span>
          </TabsTrigger>
        </TabsList>

        {/* 캘린더 탭 */}
        <TabsContent value="calendar" className={cn(
          "space-y-4",
          !isMobile && "space-y-6"
        )}>
          <div className={cn(
            "grid gap-4",
            isMobile 
              ? "grid-cols-1" 
              : "grid-cols-1 lg:grid-cols-3 gap-6"
          )}>
            {/* 개인 캘린더 - 메인 영역 */}
            <div className={cn(
              isMobile ? "order-2" : "lg:col-span-2"
            )}>
              <PersonalCalendar 
                allowBlocking={true}
                showBlockedDates={true}
                onDateSelect={(date) => {
                  console.log('Selected date:', date);
                }}
                className="w-full"
              />
            </div>
            
            {/* 사이드바 - 안내 및 통계 */}
            <div className={cn(
              "space-y-4",
              isMobile && "order-1"
            )}>
              {/* 기능 소개 카드 - 반응형 */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className={isMobile ? "pb-3" : "pb-4"}>
                  <CardTitle className={cn(
                    "flex items-center gap-2",
                    isMobile ? "text-base" : "text-lg"
                  )}>
                    <Target className="w-5 h-5 text-primary" />
                    핵심 기능
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn(
                  "grid gap-3",
                  isMobile ? "grid-cols-1" : "grid-cols-1"
                )}>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                    <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <h4 className={cn(
                        "font-semibold text-foreground",
                        isMobile ? "text-xs" : "text-sm"
                      )}>
                        자동 가용시간 계산
                      </h4>
                      <p className={cn(
                        "text-muted-foreground leading-relaxed",
                        isMobile ? "text-xs" : "text-xs"
                      )}>
                        기존 일정과 겹치지 않는 최적 시간을 자동으로 찾아드립니다.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                    <Sparkles className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <h4 className={cn(
                        "font-semibold text-foreground",
                        isMobile ? "text-xs" : "text-sm"
                      )}>
                        시각적 일정 관리
                      </h4>
                      <p className={cn(
                        "text-muted-foreground leading-relaxed",
                        isMobile ? "text-xs" : "text-xs"
                      )}>
                        5가지 색상으로 날짜 상태를 직관적으로 구분 표시합니다.
                      </p>
                    </div>
                  </div>
                  
                  {!isMobile && (
                    <>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                        <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm text-foreground">
                            스마트 날짜 차단
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            클릭/드래그로 특정 날짜를 추천에서 간편하게 제외할 수 있습니다.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                        <Calendar className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm text-foreground">
                            외부 캘린더 연동
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Google, Outlook, Apple 캘린더와 실시간 동기화 지원.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* 빠른 액션 */}
              <Card>
                <CardHeader className={isMobile ? "pb-3" : "pb-4"}>
                  <CardTitle className={cn(
                    "flex items-center gap-2",
                    isMobile ? "text-base" : "text-lg"
                  )}>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    빠른 액션
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn(
                  "grid gap-2",
                  isMobile ? "grid-cols-1" : "grid-cols-1"
                )}>
                  <Button 
                    variant="outline" 
                    size={isMobile ? "sm" : "default"}
                    className={cn(
                      "w-full justify-start transition-all duration-200",
                      "hover:bg-primary/5 hover:border-primary/30 hover:shadow-md"
                    )}
                    onClick={() => navigate('/schedule/create')}
                  >
                    <Calendar className="w-4 h-4 mr-2 text-primary" />
                    <span className={isMobile ? "text-sm" : "text-base"}>
                      새 일정 만들기
                    </span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size={isMobile ? "sm" : "default"}
                    className={cn(
                      "w-full justify-start transition-all duration-200",
                      "hover:bg-primary/5 hover:border-primary/30 hover:shadow-md"
                    )}
                    onClick={() => navigate('/schedule')}
                  >
                    <CalendarDays className="w-4 h-4 mr-2 text-emerald-500" />
                    <span className={isMobile ? "text-sm" : "text-base"}>
                      {isMobile ? "일정 보기" : "모든 일정 보기"}
                    </span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 설정 탭 */}
        <TabsContent value="settings" className={cn(
          "space-y-4",
          !isMobile && "space-y-6"
        )}>
          {/* iCalendar URL 등록 */}
          <Card className="border-emerald-200/50 bg-gradient-to-br from-emerald-50/50 to-transparent">
            <CardHeader className={isMobile ? "pb-3" : "pb-4"}>
              <CardTitle className={cn(
                "flex items-center gap-2",
                isMobile ? "text-base" : "text-lg"
              )}>
                <Link className="w-5 h-5 text-emerald-600" />
                iCalendar 연동
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label 
                  htmlFor="ical-url" 
                  className={cn(
                    "text-foreground font-medium",
                    isMobile ? "text-sm" : "text-base"
                  )}
                >
                  iCalendar URL (.ics)
                </Label>
                <div className={cn(
                  "flex gap-2",
                  isMobile && "flex-col space-y-2"
                )}>
                  <Input
                    id="ical-url"
                    type="url"
                    placeholder={isMobile 
                      ? "https://calendar.google.com/..."
                      : "https://calendar.google.com/calendar/ical/..."
                    }
                    value={icalUrl}
                    onChange={(e) => setIcalUrl(e.target.value)}
                    className={cn(
                      "transition-all duration-200 focus:ring-2 focus:ring-emerald-500/20",
                      isMobile ? "w-full" : "flex-1"
                    )}
                  />
                  <Button 
                    onClick={handleSaveCalendar}
                    disabled={saveCalendarMutation.status === 'pending'}
                    className={cn(
                      "flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 transition-all duration-200",
                      isMobile && "w-full justify-center"
                    )}
                    size={isMobile ? "default" : "default"}
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {saveCalendarMutation.status === 'pending' 
                        ? (isMobile ? '저장 중...' : '저장 중...')
                        : (isMobile ? '연동하기' : '저장')
                      }
                    </span>
                  </Button>
                </div>
                <p className={cn(
                  "text-muted-foreground",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  {isMobile 
                    ? "Google, Outlook, Apple 캘린더 등의 URL을 입력하세요."
                    : "Google Calendar, Outlook, Apple Calendar 등의 iCalendar URL을 입력하세요."
                  }
                </p>
              </div>

              {/* 캘린더 URL 가이드 */}
              <div className={cn(
                "bg-muted/30 rounded-lg border",
                isMobile ? "p-3" : "p-4"
              )}>
                <h4 className={cn(
                  "font-semibold mb-3 flex items-center gap-2",
                  isMobile ? "text-sm" : "text-base"
                )}>
                  <ExternalLink className="w-4 h-4 text-blue-500" />
                  캘린더 URL 찾는 방법
                </h4>
                <div className={cn(
                  "grid gap-3",
                  isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"
                )}>
                  <div className="space-y-2">
                    <strong className={cn(
                      "text-foreground block",
                      isMobile ? "text-xs" : "text-sm"
                    )}>
                      🟦 Google Calendar
                    </strong>
                    <ol className={cn(
                      "list-decimal list-inside space-y-1 text-muted-foreground",
                      isMobile ? "text-xs ml-2" : "text-sm ml-3"
                    )}>
                      <li>캘린더 접속</li>
                      <li>설정 및 공유</li>
                      <li>비공개 주소 → iCal URL 복사</li>
                    </ol>
                  </div>
                  
                  {!isMobile && (
                    <>
                      <div className="space-y-2">
                        <strong className="text-sm text-foreground block">
                          🟨 Outlook
                        </strong>
                        <ol className="list-decimal list-inside ml-3 space-y-1 text-sm text-muted-foreground">
                          <li>Outlook.com → 설정</li>
                          <li>캘린더 보기</li>
                          <li>공유 캘린더 → ICS 링크</li>
                        </ol>
                      </div>
                      <div className="space-y-2">
                        <strong className="text-sm text-foreground block">
                          🟪 Apple Calendar
                        </strong>
                        <ol className="list-decimal list-inside ml-3 space-y-1 text-sm text-muted-foreground">
                          <li>iCloud.com → 캘린더</li>
                          <li>공유 아이콘 클릭</li>
                          <li>공용 캘린더 URL 복사</li>
                        </ol>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 개인정보 보호 안내 */}
          <Card className="border-amber-200/50 bg-gradient-to-br from-amber-50/30 to-transparent">
            <CardHeader className={isMobile ? "pb-3" : "pb-4"}>
              <CardTitle className={cn(
                "flex items-center gap-2",
                isMobile ? "text-base" : "text-lg"
              )}>
                <div className="w-5 h-5 text-amber-600">🛡️</div>
                개인정보 보호
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "grid gap-2",
                isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2",
                isMobile ? "text-xs" : "text-sm"
              )}>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                  <p className="text-muted-foreground">
                    캘린더 URL 암호화 저장
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                  <p className="text-muted-foreground">
                    시간 정보만 활용 (제목/내용 미저장)
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                  <p className="text-muted-foreground">
                    언제든지 연동 해제 가능
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                  <p className="text-muted-foreground">
                    개인 정보 비공개 보장
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 고급 설정 */}
          <Card className="border-slate-200/50">
            <CardHeader className={isMobile ? "pb-3" : "pb-4"}>
              <CardTitle className={cn(
                "flex items-center gap-2",
                isMobile ? "text-base" : "text-lg"
              )}>
                <Settings className="w-5 h-5 text-slate-600" />
                고급 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={cn(
                "grid gap-4",
                isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
              )}>
                <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                  <div className="space-y-1">
                    <h4 className={cn(
                      "font-semibold text-foreground flex items-center gap-2",
                      isMobile ? "text-sm" : "text-sm"
                    )}>
                      <Clock className="w-4 h-4 text-blue-500" />
                      동기화 설정
                    </h4>
                    <p className={cn(
                      "text-muted-foreground",
                      isMobile ? "text-xs" : "text-xs"
                    )}>
                      캘린더 데이터는 매시간 자동 동기화됩니다.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size={isMobile ? "sm" : "sm"}
                    className="w-full"
                  >
                    지금 동기화
                  </Button>
                </div>
                
                <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                  <div className="space-y-1">
                    <h4 className={cn(
                      "font-semibold text-foreground flex items-center gap-2",
                      isMobile ? "text-sm" : "text-sm"
                    )}>
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      알림 설정
                    </h4>
                    <p className={cn(
                      "text-muted-foreground",
                      isMobile ? "text-xs" : "text-xs"
                    )}>
                      새로운 추천 시간 알림을 받을 수 있습니다.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size={isMobile ? "sm" : "sm"}
                    disabled
                    className="w-full"
                  >
                    {isMobile ? "곧 제공" : "알림 설정 (곧 제공 예정)"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScheduleDashboard;