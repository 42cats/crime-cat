import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GameRecordDeclineDto } from '@/api/notificationService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { XCircle, AlertTriangle } from 'lucide-react';

const DEFAULT_DECLINE_MESSAGE = "길드 오너가 기록을 거절하였습니다";

const schema = z.object({
  declineMessage: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface GameRecordDeclineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GameRecordDeclineDto) => void;
  notificationId: string;
}

export const GameRecordDeclineModal: React.FC<GameRecordDeclineModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  notificationId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  
  const onSubmitForm = async (data: FormData) => {
    setIsLoading(true);
    try {
      // 입력값이 없거나 빈 문자열이면 기본 메시지 사용
      const finalMessage = data.declineMessage?.trim() || DEFAULT_DECLINE_MESSAGE;
      
      const submitData: GameRecordDeclineDto = {
        declineMessage: finalMessage,
      };
      
      onSubmit(submitData);
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <DialogContent 
          className="sm:max-w-md" 
          style={{ zIndex: 9999 }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              게임 기록 거절
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
            {/* 경고 메시지 */}
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">
                  이 작업은 되돌릴 수 없습니다. 거절하시면 요청자에게 알림이 전송됩니다.
                </p>
              </div>
            </div>
            
            {/* 거절 사유 */}
            <div className="space-y-2">
              <Label htmlFor="declineMessage">거절 사유</Label>
              <Textarea
                id="declineMessage"
                {...register('declineMessage')}
                placeholder={DEFAULT_DECLINE_MESSAGE}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                입력하지 않으면 기본 메시지가 전송됩니다.
              </p>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button 
                type="submit" 
                variant="destructive" 
                disabled={isLoading}
              >
                {isLoading ? '처리 중...' : '거절'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </div>
    </Dialog>
  );
};
