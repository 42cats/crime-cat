import { NavigateFunction } from 'react-router-dom';
import { Notification, NotificationType } from '@/types/notification';

/**
 * 알림 타입별 라우팅 처리 유틸리티
 */
export const handleNotificationRouting = {
  /**
   * 알림 클릭 시 적절한 페이지로 이동
   */
  navigate: (notification: Notification, navigate: NavigateFunction) => {
    switch (notification.type) {
      case NotificationType.SYSTEM_NOTICE:
        // 시스템 알림은 현재 페이지에서 읽음 처리만
        // 별도 페이지 이동 없음
        break;
        
      case NotificationType.GAME_RECORD_REQUEST:
        // 게임 기록 요청은 현재 페이지에서 처리
        // 별도 페이지 이동 없음
        break;
        
      case NotificationType.COMMENT_ALERT:
        // 댓글 알림의 경우 해당 게시물로 이동
        const postId = notification.metadata?.postId;
        const commentId = notification.metadata?.commentId;
        if (postId) {
          navigate(`/posts/${postId}${commentId ? `#comment-${commentId}` : ''}`);
        }
        break;
        
      case NotificationType.FRIEND_REQUEST:
        // 친구 요청은 프로필 페이지로 이동
        const friendId = notification.senderId;
        if (friendId) {
          navigate(`/profile/${friendId}`);
        }
        break;
      
      case NotificationType.NEW_THEME:
        // 새 테마 알림의 경우 테마 상세 페이지로 이동
        const themeId = notification.metadata?.themeId;
        const category = notification.metadata?.category;
        if (themeId && category) {
          navigate(`/themes/${category}/${themeId}`);
        }
        break;
        
      case NotificationType.GAME_NOTICE:
        // 게임 알림의 경우 해당 게임 페이지로 이동
        const gameId = notification.metadata?.gameId;
        if (gameId) {
          navigate(`/games/${gameId}`);
        }
        break;
        
      default:
        // 기본적으로는 알림 리스트 페이지로 이동
        navigate('/dashboard/notifications');
        break;
    }
  },
  
  /**
   * 드롭다운에서 알림 클릭 시 처리
   */
  navigateFromDropdown: (
    notification: Notification, 
    navigate: NavigateFunction,
    onClose: () => void
  ) => {
    // 드롭다운 닫기
    onClose();
    
    // 라우팅 처리
    handleNotificationRouting.navigate(notification, navigate);
  }
};
