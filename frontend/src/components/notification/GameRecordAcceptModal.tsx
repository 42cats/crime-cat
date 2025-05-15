import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { GameRecordAcceptDto } from '@/api/notificationService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, CheckCircle, User, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z.object({
  isWin: z.boolean({
    required_error: '승리 여부를 선택해주세요.',
  }),
  gameDate: z.date({
    required_error: '게임 날짜를 선택해주세요.',
  }),
  gameTime: z.string({
    required_error: '게임 시간을 선택해주세요.',
  }),
  characterName: z.string()
    .min(1, '캐릭터명을 입력해주세요.')
    .max(50, '캐릭터명은 50자를 초과할 수 없습니다.'),
  ownerMemo: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface GameRecordAcceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GameRecordAcceptDto) => void;
  notificationId: string;
}

export const GameRecordAcceptModal: React.FC<GameRecordAcceptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  notificationId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // 디버깅을 위한 로깅
  useEffect(() => {
    console.log('🚀 GameRecordAcceptModal rendered, isOpen:', isOpen);
  }, [isOpen]);
  
  useEffect(() => {
    console.log('🚀 Modal is closing, onClose called');
  }, []);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gameDate: new Date(),
      gameTime: '18:00',
    },
  });
  
  const isWin = watch('isWin');
  const gameDate = watch('gameDate');
  const gameTime = watch('gameTime');
  
  const onSubmitForm = async (data: FormData) => {
    setIsLoading(true);
    try {
      // 날짜와 시간을 조합하여 ISO 문자열 생성
      const [hours, minutes] = data.gameTime.split(':');
      const gameDateTime = new Date(data.gameDate);
      gameDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const submitData: GameRecordAcceptDto = {
        isWin: data.isWin,
        gameDate: gameDateTime.toISOString(),
        characterName: data.characterName,
        ownerMemo: data.ownerMemo || undefined,
      };
      
      onSubmit(submitData);
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 시간 옵션 생성
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeStr);
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log('🔥 Dialog onOpenChange called:', { 
        open, 
        currentIsOpen: isOpen,
        timestamp: new Date().toISOString()
      });
      if (!open) {
        onClose();
      }
    }}>
      <div onClick={(e) => e.stopPropagation()}>
        <DialogContent 
          className="sm:max-w-md" 
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            console.log('🔍 DialogContent clicked:', e.target);
            e.stopPropagation();
          }}
          onPointerDown={(e) => {
            console.log('🔍 DialogContent pointerDown:', e.target);
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            console.log('🔍 DialogContent mouseDown:', e.target);
            e.stopPropagation();
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              게임 기록 승인
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
            {/* 승리 여부 */}
            <div className="space-y-2">
              <Label>승리 여부 *</Label>
              <RadioGroup
                value={isWin?.toString()}
                onValueChange={(value) => setValue('isWin', value === 'true')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="win" />
                  <Label htmlFor="win" className="flex items-center gap-2 cursor-pointer">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    승리
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="lose" />
                  <Label htmlFor="lose" className="flex items-center gap-2 cursor-pointer">
                    <XCircle className="w-4 h-4 text-red-600" />
                    패배
                  </Label>
                </div>
              </RadioGroup>
              {errors.isWin && (
                <p className="text-sm text-destructive">{errors.isWin.message}</p>
              )}
            </div>
          
            {/* 게임 날짜 */}
            <div className="space-y-2">
              <Label>게임 날짜 *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !gameDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {gameDate ? format(gameDate, 'PPP', { locale: ko }) : '날짜를 선택하세요'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" style={{ zIndex: 10000 }}>
                  <Calendar
                    mode="single"
                    selected={gameDate}
                    onSelect={(date) => date && setValue('gameDate', date)}
                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                    initialFocus
                    locale={ko}
                  />
                </PopoverContent>
              </Popover>
              {errors.gameDate && (
                <p className="text-sm text-destructive">{errors.gameDate.message}</p>
              )}
            </div>
            
            {/* 게임 시간 */}
            <div className="space-y-2">
              <Label>게임 시간 *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-between text-left font-normal",
                      !gameTime && "text-muted-foreground"
                    )}
                  >
                    <span>{gameTime || "시간을 선택하세요"}</span>
                    <Clock className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" style={{ zIndex: 10000 }}>
                  <div className="grid grid-cols-2 gap-1 max-h-60 overflow-y-auto">
                    {timeOptions.map((time) => (
                      <Button
                        key={time}
                        variant={gameTime === time ? "default" : "ghost"}
                        className="justify-start h-8 text-sm"
                        onClick={() => {
                          console.log('🕰️ Time selected:', time);
                          setValue('gameTime', time);
                        }}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {errors.gameTime && (
                <p className="text-sm text-destructive">{errors.gameTime.message}</p>
              )}
            </div>
            
            {/* 캐릭터명 */}
            <div className="space-y-2">
              <Label htmlFor="characterName">캐릭터명 *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="characterName"
                  {...register('characterName')}
                  placeholder="사용하신 캐릭터명을 입력하세요"
                  className="pl-10"
                />
              </div>
              {errors.characterName && (
                <p className="text-sm text-destructive">{errors.characterName.message}</p>
              )}
            </div>
            
            {/* 오너 메모 */}
            <div className="space-y-2">
              <Label htmlFor="ownerMemo">오너 메모 (선택)</Label>
              <Textarea
                id="ownerMemo"
                {...register('ownerMemo')}
                placeholder="게임에 대한 메모를 남기세요..."
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '처리 중...' : '승인'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </div>
    </Dialog>
  );
};
