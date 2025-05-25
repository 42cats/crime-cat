import React, { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeAdvertisement } from "@/api/admin/themeAdsService";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { MoreHorizontal, Edit, Trash2, GripVertical, Calendar, Clock } from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { themeAdsService } from "@/api/admin/themeAdsService";
import { toast } from "sonner";
import ThemeAdRow from "./ThemeAdRow";

interface ThemeAdsTableProps {
    advertisements: ThemeAdvertisement[];
    isLoading: boolean;
    onEdit: (ad: ThemeAdvertisement) => void;
    onDelete: (id: string) => void;
    getAdStatus: (ad: ThemeAdvertisement) => "active" | "scheduled" | "expired" | "all";
}

const ThemeAdsTable: React.FC<ThemeAdsTableProps> = ({
    advertisements,
    isLoading,
    onEdit,
    onDelete,
    getAdStatus,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const queryClient = useQueryClient();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 순서 변경 mutation
    const reorderMutation = useMutation({
        mutationFn: themeAdsService.reorderAdvertisements,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-theme-ads"] });
            toast.success("광고 순서가 변경되었습니다.");
        },
        onError: () => {
            toast.error("순서 변경에 실패했습니다.");
        },
    });

    const handleDragEnd = async (event: DragEndEvent) => {
        setIsDragging(false);
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = advertisements.findIndex((ad) => ad.id === active.id);
            const newIndex = advertisements.findIndex((ad) => ad.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                // 새로운 순서 계산
                const reorderedAds = [...advertisements];
                const [movedItem] = reorderedAds.splice(oldIndex, 1);
                reorderedAds.splice(newIndex, 0, movedItem);

                // displayOrder 업데이트
                const updates = reorderedAds.map((ad, index) => ({
                    id: ad.id,
                    displayOrder: index + 1,
                }));

                await reorderMutation.mutateAsync(updates);
            }
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge variant="default" className="bg-green-600">활성</Badge>;
            case "scheduled":
                return <Badge variant="secondary" className="bg-blue-600">예정</Badge>;
            case "expired":
                return <Badge variant="outline" className="text-gray-600">종료</Badge>;
            default:
                return null;
        }
    };

    const getThemeTypeBadge = (type: string) => {
        const typeLabels: Record<string, string> = {
            CRIMESCENE: "크라임씬",
            ESCAPE_ROOM: "방탈출",
            MURDER_MYSTERY: "머더미스터리",
            REALWORLD: "리얼월드",
        };
        return (
            <Badge variant="outline" className="font-normal">
                {typeLabels[type] || type}
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        );
    }

    if (advertisements.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">등록된 광고가 없습니다.</p>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
        >
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>테마</TableHead>
                            <TableHead>타입</TableHead>
                            <TableHead>상태</TableHead>
                            <TableHead>기간</TableHead>
                            <TableHead>순서</TableHead>
                            <TableHead className="text-right">작업</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <SortableContext
                            items={advertisements.map(ad => ad.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {advertisements.map((ad) => (
                                <ThemeAdRow
                                    key={ad.id}
                                    advertisement={ad}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    getAdStatus={getAdStatus}
                                    getStatusBadge={getStatusBadge}
                                    getThemeTypeBadge={getThemeTypeBadge}
                                    isDragging={isDragging}
                                />
                            ))}
                        </SortableContext>
                    </TableBody>
                </Table>
            </div>
        </DndContext>
    );
};

export default ThemeAdsTable;
