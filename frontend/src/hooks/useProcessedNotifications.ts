import { useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { processedNotificationIdsState } from '@/atoms/notification';

/**
 * 이미 처리된 알림 ID를 관리하는 훅
 * 컴포넌트 리렌더링이나 페이지 이동 시에도 처리 상태를 유지
 */
export const useProcessedNotifications = () => {
  const [processedIds, setProcessedIds] = useRecoilState(processedNotificationIdsState);
  
  /**
   * 알림을 처리됨으로 표시
   */
  const markAsProcessed = useCallback((id: string) => {
    setProcessedIds(prev => {
      // Set은 불변 객체이므로 새 Set 생성
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  }, [setProcessedIds]);
  
  /**
   * 알림이 처리됨 상태인지 확인
   * 서버 상태 또는 로컬 상태 모두 확인
   */
  const isProcessed = useCallback((id: string, serverStatus?: string) => {
    return processedIds.has(id) || serverStatus === 'PROCESSED';
  }, [processedIds]);
  
  return { processedIds, markAsProcessed, isProcessed };
};
