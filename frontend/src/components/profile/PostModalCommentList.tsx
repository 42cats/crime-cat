import React from "react";
import { PostCommentList } from "../post-comments";
import { UserPostDto } from "@/api/sns/post";

interface PostModalCommentListProps {
    postId: string;
    postAuthorId: string;
    currentUserId?: string;
    onLoginRequired: () => void;
}

const PostModalCommentList: React.FC<PostModalCommentListProps> = (props) => {
    // 기존 컴포넌트를 대체하여 새 컴포넌트를 사용합니다
    return <PostCommentList {...props} />;
};

export default PostModalCommentList;
