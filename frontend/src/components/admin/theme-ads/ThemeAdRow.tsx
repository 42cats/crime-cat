import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeAdvertisement } from "@/api/admin/themeAdsService";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { MoreHorizontal, Edit, Trash2, GripVertical, Calendar } from "lucide-react";

interface ThemeAdRowProps {
    advertisement: ThemeAdvertisement;
    onEdit: (ad: ThemeAdvertisement) => void;
    onDelete: (id: string) => void;
    getAdStatus: (ad: ThemeAdvertisement) => "active" | "scheduled" | "expired" | "all";
    getStatusBadge: (status: string) => React.ReactNode;
    getThemeTypeBadge: (type: string) => React.ReactNode;
    isDragging: boolean;
}

const ThemeAdRow: React.FC<ThemeAdRowProps> = ({
    advertisement,
    onEdit,
    onDelete,
    getAdStatus,
    getStatusBadge,
    getThemeTypeBadge,
    isDragging,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isRowDragging,
    } = useSortable({ id: advertisement.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isRowDragging ? 0.5 : 1,
    };

    const formatDate = (date: string) => {
        return format(new Date(date), "MM월 dd일 HH:mm", { locale: ko });
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className={`${isRowDragging ? "bg-muted" : ""} ${
                isDragging ? "hover:bg-muted" : ""
            }`}
        >
            <TableCell>
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1"
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
            </TableCell>
            <TableCell>
                <div>
                    <p className="font-medium">
                        {advertisement.theme?.title || "테마 정보 없음"}
                    </p>
                    {advertisement.theme?.author && (
                        <p className="text-sm text-muted-foreground">
                            제작: {advertisement.theme.author}
                        </p>
                    )}
                </div>
            </TableCell>
            <TableCell>{getThemeTypeBadge(advertisement.themeType)}</TableCell>
            <TableCell>{getStatusBadge(getAdStatus(advertisement))}</TableCell>
            <TableCell>
                <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        <span>시작: {formatDate(advertisement.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>종료: {formatDate(advertisement.endDate)}</span>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <span className="font-mono text-sm">{advertisement.displayOrder}</span>
            </TableCell>
            <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(advertisement)}>
                            <Edit className="mr-2 h-4 w-4" />
                            수정
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onDelete(advertisement.id)}
                            className="text-red-600"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            삭제
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
};

export default ThemeAdRow;
