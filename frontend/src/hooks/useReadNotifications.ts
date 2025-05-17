import { useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { readNotificationIdsState } from '@/atoms/notification';

/**
 * 읽음 처리된 알림 ID를 관리하는 훅
 * 알림이 어디서 읽혔는지와 상관없이 일관된 읽음 상태를 유지
 */
export const useReadNotifications = () => {
  const [readIds, setReadIds] = useRecoilState(readNotificationIdsState);
  
  /**
   * 알림을 읽음으로 표시
   */
  const markAsRead = useCallback((id: string) => {
    setReadIds(prev => {
      // Set은 불변 객체이므로 새 Set 생성
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  }, [setReadIds]);
  
  /**
   * 알림이 읽음 상태인지 확인 (강화 버전)
   * 서버 상태 또는 로컬 상태 모두 확인
   * 서버 status 문자열 및 boolean 형식 모두 처리
   */
  const isRead = useCallback((id: string, serverStatus?: string | boolean) => {
    // 서버 상태가 boolean으로 제공된 경우 (read 필드일 가능성)
    if (typeof serverStatus === 'boolean') {
      return readIds.has(id) || serverStatus === true;
    }
    
    // 서버 상태가 문자열로 제공된 경우 (status 필드일 가능성)
    return readIds.has(id) || serverStatus === 'READ' || serverStatus === 'PROCESSED';
  }, [readIds]);
  
  /**
   * 여러 알림을 한 번에 읽음으로 표시
   */
  const markMultipleAsRead = useCallback((ids: string[]) => {
    setReadIds(prev => {
      const newSet = new Set(prev);
      ids.forEach(id => newSet.add(id));
      return newSet;
    });
  }, [setReadIds]);
  
  return { readIds, markAsRead, isRead, markMultipleAsRead };
};
