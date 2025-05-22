import React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit3, Trash2 } from "lucide-react";

interface PostActionsProps {
    postId: string;
    onEdit: () => void;
    onDelete: () => void;
    className?: string;
}

const PostActions: React.FC<PostActionsProps> = ({
    postId,
    onEdit,
    onDelete,
    className = "",
}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${className}`}
                >
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                    <Edit3 className="h-4 w-4 mr-2" />
                    수정
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={onDelete}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default PostActions;
