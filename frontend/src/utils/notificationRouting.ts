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
    // 디버깅: 라우팅 처리 시작
    console.log("🚀 [DEBUG] Starting notification routing:");
    console.log("  - Type:", notification.type);
    console.log("  - Raw Metadata:", notification.metadata);
    console.log("  - Full notification:", notification);
    
    // 메타데이터 파싱 처리
    let parsedMetadata: any = {};
    if (notification.metadata) {
      try {
        if (typeof notification.metadata === 'string') {
          parsedMetadata = JSON.parse(notification.metadata);
          console.log("  ✅ Parsed metadata:", parsedMetadata);
        } else {
          parsedMetadata = notification.metadata;
        }
      } catch (error) {
        console.error("  ❌ Failed to parse metadata:", error);
        parsedMetadata = {};
      }
    } else {
      console.warn("⚠️ [WARNING] No metadata found in notification. Using fallback routing.");
    }
    
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
        
      case NotificationType.USER_POST_NEW:
        // linkUrl 우선 사용, 없으면 기존 로직
        const newPostLinkUrl = parsedMetadata?.linkUrl;
        const newPostId = parsedMetadata?.postId;
        console.log("📝 [DEBUG] USER_POST_NEW routing:");
        console.log("  - linkUrl:", newPostLinkUrl);
        console.log("  - postId:", newPostId);
        if (newPostLinkUrl) {
          console.log("  ✅ Navigating to linkUrl:", newPostLinkUrl);
          navigate(newPostLinkUrl);
        } else if (newPostId) {
          const fallbackUrl = `/sns/post/${newPostId}`;
          console.log("  ✅ Navigating to fallback URL:", fallbackUrl);
          navigate(fallbackUrl);
        } else {
          console.log("  ❌ No routing data available");
        }
        break;
        
      case NotificationType.USER_POST_COMMENT:
        // linkUrl 우선 사용, 댓글 해시 추가
        const commentLinkUrl = parsedMetadata?.linkUrl;
        const postWithCommentId = parsedMetadata?.postId;
        const newCommentId = parsedMetadata?.commentId;
        console.log("💬 [DEBUG] USER_POST_COMMENT routing:");
        console.log("  - linkUrl:", commentLinkUrl);
        console.log("  - postId:", postWithCommentId);
        console.log("  - commentId:", newCommentId);
        if (commentLinkUrl) {
          const commentHash = newCommentId ? `#comment-${newCommentId}` : '';
          const finalUrl = `${commentLinkUrl}${commentHash}`;
          console.log("  ✅ Navigating to linkUrl with hash:", finalUrl);
          navigate(finalUrl);
        } else if (postWithCommentId) {
          const fallbackUrl = `/sns/post/${postWithCommentId}${newCommentId ? `#comment-${newCommentId}` : ''}`;
          console.log("  ✅ Navigating to fallback URL:", fallbackUrl);
          navigate(fallbackUrl);
        } else {
          console.log("  ❌ No routing data available - redirecting to SNS feed");
          // 메타데이터가 없는 경우 대시보드로 이동
          navigate('/dashboard');
        }
        break;
        
      case NotificationType.USER_POST_COMMENT_REPLY:
        // linkUrl 우선 사용, 답글 해시 추가
        const replyLinkUrl = parsedMetadata?.linkUrl;
        const postWithReplyId = parsedMetadata?.postId;
        const replyCommentId = parsedMetadata?.replyId || parsedMetadata?.commentId;
        const parentCommentId = parsedMetadata?.parentCommentId;
        console.log("💭 [DEBUG] USER_POST_COMMENT_REPLY routing:");
        console.log("  - linkUrl:", replyLinkUrl);
        console.log("  - postId:", postWithReplyId);
        console.log("  - replyId:", parsedMetadata?.replyId);
        console.log("  - commentId:", parsedMetadata?.commentId);
        console.log("  - parentCommentId:", parentCommentId);
        if (replyLinkUrl) {
          const hash = replyCommentId ? `#comment-${replyCommentId}` : 
                      parentCommentId ? `#comment-${parentCommentId}` : '';
          const finalUrl = `${replyLinkUrl}${hash}`;
          console.log("  ✅ Navigating to linkUrl with hash:", finalUrl);
          navigate(finalUrl);
        } else if (postWithReplyId) {
          const hash = replyCommentId ? `#comment-${replyCommentId}` : 
                      parentCommentId ? `#comment-${parentCommentId}` : '';
          const fallbackUrl = `/sns/post/${postWithReplyId}${hash}`;
          console.log("  ✅ Navigating to fallback URL:", fallbackUrl);
          navigate(fallbackUrl);
        } else {
          console.log("  ❌ No routing data available");
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
