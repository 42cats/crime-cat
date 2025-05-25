export interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorProfileImage: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  isSpoiler: boolean;
  likes: number;
  isLikedByCurrentUser: boolean;
  isOwnComment: boolean;
  isDeleted: boolean;
  replies: Comment[];
}

export interface CommentRequest {
  content: string;
  parentId?: string;
  isSpoiler: boolean;
}

export interface CommentPage {
  content: Comment[];
  totalElements: number;
  totalPages: number;
  last: boolean;
  number: number;
  size: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}
