// 이 파일은 하위 호환성을 위해 유지됩니다.
// 새로운 코드에서는 @/api/sns/post를 사용해주세요.

export * from '../sns/post/postService';
export * from '../sns/post/commentService';

// 기존 import 경로도 지원
export { postService as userPostService } from '../sns/post/postService';
export { postCommentService as userPostCommentService } from '../sns/post/commentService';
