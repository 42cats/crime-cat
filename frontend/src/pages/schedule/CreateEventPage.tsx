import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Clock, 
  FileText, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  CheckCircle,
  Save,
  Send
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/useToast';

// 유효성 검사 스키마
const eventFormSchema = z.object({
  title: z.string()
    .min(2, '제목은 최소 2자 이상이어야 합니다')
    .max(100, '제목은 100자 이하여야 합니다'),
  description: z.string()
    .max(1000, '설명은 1000자 이하여야 합니다')
    .optional(),
  category: z.string().min(1, '카테고리를 선택해주세요'),
  maxParticipants: z.coerce.number()
    .min(1, '최소 1명 이상이어야 합니다')
    .max(100, '최대 100명까지 설정 가능합니다')
    .optional(),
  minParticipants: z.coerce.number()
    .min(1, '최소 1명 이상이어야 합니다')
    .max(100, '최대 100명까지 설정 가능합니다')
    .default(1),
  eventType: z.enum(['FIXED', 'FLEXIBLE']),
  // 비밀 일정 관련 필드
  isSecret: z.boolean().default(false),
  secretPassword: z.string().optional(),
  passwordHint: z.string()
    .max(500, '힌트는 500자 이하여야 합니다')
    .optional(),
}).refine((data) => {
  // 비밀 일정인 경우 비밀번호 필수
  if (data.isSecret && (!data.secretPassword || data.secretPassword.length < 4)) {
    return false;
  }
  // 최소 참여자 수가 최대 참여자 수보다 많으면 안됨
  if (data.maxParticipants && data.minParticipants > data.maxParticipants) {
    return false;
  }
  return true;
}, {
  message: "입력 정보를 확인해주세요.",
  path: ["root"]
});

type EventFormData = z.infer<typeof eventFormSchema>;

/**
 * 일정 생성 페이지
 * - 기본 일정 및 비밀 일정 생성 지원
 * - 실시간 유효성 검사
 * - 비밀번호 복잡도 체크
 * - 반응형 디자인
 */
const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    valid: boolean;
    message: string;
  }>({ valid: false, message: '' });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      eventType: 'FIXED',
      minParticipants: 1,
      isSecret: false,
    },
    mode: 'onChange'
  });

  const watchedFields = watch();
  const isSecret = watchedFields.isSecret;
  const secretPassword = watchedFields.secretPassword;

  // 비밀번호 복잡도 실시간 검증
  useEffect(() => {
    const validatePassword = async () => {
      if (!isSecret || !secretPassword) {
        setPasswordStrength({ valid: false, message: '' });
        return;
      }

      try {
        const response = await fetch('/api/v1/secret-schedule/validate-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password: secretPassword }),
        });

        if (response.ok) {
          const result = await response.json();
          setPasswordStrength({
            valid: result.valid,
            message: result.message,
          });
        }
      } catch (error) {
        console.error('비밀번호 검증 실패:', error);
      }
    };

    const debounceTimer = setTimeout(validatePassword, 300);
    return () => clearTimeout(debounceTimer);
  }, [secretPassword, isSecret]);

  const handleGoBack = () => {
    navigate('/dashboard/schedule');
  };

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);

    try {
      // 비밀 일정인 경우 추가 검증
      if (data.isSecret) {
        if (!data.secretPassword || data.secretPassword.length < 4) {
          toast({
            title: "비밀번호 오류",
            description: "비밀 일정에는 4자 이상의 비밀번호가 필요합니다.",
            variant: "destructive"
          });
          return;
        }

        if (!passwordStrength.valid) {
          toast({
            title: "비밀번호 오류", 
            description: passwordStrength.message,
            variant: "destructive"
          });
          return;
        }
      }

      const response = await fetch('/api/v1/schedule/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          // 비밀번호는 서버에서 해시화됨
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "일정 생성 완료",
          description: `${data.isSecret ? '비밀 ' : ''}일정이 성공적으로 생성되었습니다.`,
        });

        // 생성된 일정으로 이동
        navigate(`/dashboard/schedule/event/${result.id}`);
      } else {
        const error = await response.json();
        toast({
          title: "생성 실패",
          description: error.message || "일정 생성 중 오류가 발생했습니다.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('일정 생성 실패:', error);
      toast({
        title: "네트워크 오류",
        description: "서버와의 연결에 문제가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { value: 'meeting', label: '회의' },
    { value: 'event', label: '이벤트' },
    { value: 'workshop', label: '워크샵' },
    { value: 'social', label: '친목 모임' },
    { value: 'study', label: '스터디' },
    { value: 'project', label: '프로젝트' },
    { value: 'other', label: '기타' },
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={handleGoBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
        <div className="flex-1">
          <h1 className={`font-bold ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            새 일정 만들기
          </h1>
          <p className="text-muted-foreground mt-1">
            커뮤니티 일정을 생성하고 참여자를 모집하세요
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 기본 정보 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title">일정 제목 *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="일정 제목을 입력하세요"
                error={errors.title?.message}
              />
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="일정에 대한 상세한 설명을 입력하세요"
                rows={4}
                className="resize-none"
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* 카테고리 */}
            <div className="space-y-2">
              <Label>카테고리 *</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>

            {/* 일정 유형 */}
            <div className="space-y-2">
              <Label>일정 유형</Label>
              <Controller
                name="eventType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">확정 일정 (고정 시간)</SelectItem>
                      <SelectItem value="FLEXIBLE">협의 일정 (시간 조율)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* 참여자 설정 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              참여자 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 최소 참여자 */}
              <div className="space-y-2">
                <Label htmlFor="minParticipants">최소 참여자 수 *</Label>
                <Input
                  id="minParticipants"
                  type="number"
                  min={1}
                  max={100}
                  {...register('minParticipants')}
                  placeholder="1"
                />
                {errors.minParticipants && (
                  <p className="text-sm text-destructive">{errors.minParticipants.message}</p>
                )}
              </div>

              {/* 최대 참여자 */}
              <div className="space-y-2">
                <Label htmlFor="maxParticipants">최대 참여자 수</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min={1}
                  max={100}
                  {...register('maxParticipants')}
                  placeholder="제한 없음"
                />
                {errors.maxParticipants && (
                  <p className="text-sm text-destructive">{errors.maxParticipants.message}</p>
                )}
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>• 최소 참여자 수에 도달하면 일정을 확정할 수 있습니다</p>
              <p>• 최대 참여자 수를 설정하지 않으면 무제한으로 참여 가능합니다</p>
            </div>
          </CardContent>
        </Card>

        {/* 비밀 일정 섹션 */}
        <Card className={`transition-all duration-300 ${
          isSecret ? 'border-amber-300 bg-amber-50/30' : ''
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                비밀 일정 설정
              </div>
              <Controller
                name="isSecret"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="isSecret" className="text-sm font-normal">
                      비밀 일정 만들기
                    </Label>
                    <Switch
                      id="isSecret"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
            </CardTitle>
          </CardHeader>
          
          {isSecret && (
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  비밀 일정은 비밀번호를 아는 사람만 상세 정보를 볼 수 있습니다. 
                  모든 접근 시도는 보안을 위해 기록됩니다.
                </AlertDescription>
              </Alert>

              {/* 비밀번호 */}
              <div className="space-y-2">
                <Label htmlFor="secretPassword">비밀번호 *</Label>
                <div className="relative">
                  <Input
                    id="secretPassword"
                    type={showPassword ? 'text' : 'password'}
                    {...register('secretPassword')}
                    placeholder="4-50자 사이의 비밀번호를 입력하세요"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                
                {secretPassword && passwordStrength.message && (
                  <div className="flex items-center gap-2">
                    {passwordStrength.valid ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    <p className={`text-xs ${
                      passwordStrength.valid ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {passwordStrength.message}
                    </p>
                  </div>
                )}
              </div>

              {/* 비밀번호 힌트 */}
              <div className="space-y-2">
                <Label htmlFor="passwordHint">비밀번호 힌트 (선택사항)</Label>
                <Textarea
                  id="passwordHint"
                  {...register('passwordHint')}
                  placeholder="다른 사람들이 비밀번호를 추측하는데 도움이 될 힌트를 입력하세요"
                  rows={3}
                  className="resize-none"
                />
                {errors.passwordHint && (
                  <p className="text-sm text-destructive">{errors.passwordHint.message}</p>
                )}
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>💡 <strong>비밀 일정 활용 팁:</strong></p>
                <p>• 팀 내부 회의나 민감한 내용의 일정에 활용하세요</p>
                <p>• 힌트를 제공하면 참여자들이 비밀번호를 더 쉽게 찾을 수 있습니다</p>
                <p>• 비밀번호는 안전하게 암호화되어 저장됩니다</p>
              </div>
            </CardContent>
          )}
        </Card>

        <Separator />

        {/* 버튼 섹션 */}
        <div className="flex gap-4 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleGoBack}
            className="flex-1 sm:flex-none"
          >
            취소
          </Button>
          
          <Button 
            type="submit"
            disabled={isSubmitting || !isValid}
            className="flex-1 sm:flex-none"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>생성 중...</span>
              </div>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {isSecret ? '비밀 일정 생성' : '일정 생성'}
              </>
            )}
          </Button>
        </div>

        {/* 미리보기 */}
        {watchedFields.title && (
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {isSecret ? (
                    <Lock className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Calendar className="w-4 h-4 text-primary" />
                  )}
                  <span className="font-medium">
                    {isSecret ? '🔒 ' : ''}{watchedFields.title}
                  </span>
                  {isSecret && (
                    <Badge variant="outline" className="bg-amber-100 text-amber-700">
                      비밀 일정
                    </Badge>
                  )}
                </div>
                
                {watchedFields.description && (
                  <p className="text-sm text-muted-foreground">
                    {watchedFields.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {watchedFields.category && (
                    <span>카테고리: {categories.find(c => c.value === watchedFields.category)?.label}</span>
                  )}
                  <span>
                    참여자: {watchedFields.minParticipants}명
                    {watchedFields.maxParticipants && ` ~ ${watchedFields.maxParticipants}명`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
};

export default CreateEventPage;