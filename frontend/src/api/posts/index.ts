// 이 파일은 하위 호환성을 위해 유지됩니다.
// 새로운 코드에서는 @/api/posts/postService를 사용해주세요.

export * from "@/api/posts/postService";
export * from "@/api/posts/commentService";

// 기존 import 경로도 지원
export { postService as userPostService } from "@/api/posts/postService";
export { postCommentService as userPostCommentService } from "@/api/posts/commentService";
