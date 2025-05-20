import { CommentList } from './comments';

interface ModalCommentListProps {
    gameThemeId: string;
    currentUserId?: string;
    hasPlayedGame: boolean;
    onLoginRequired: () => void;
}

export function ModalCommentList(props: ModalCommentListProps) {
    // 기존 컴포넌트를 대체하여 새 컴포넌트를 사용합니다
    return <CommentList {...props} />;
}