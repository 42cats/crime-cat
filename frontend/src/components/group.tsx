import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/button";
import { Button as UIButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    GroupData,
    ButtonData,
    DraggableItem,
    ItemPosition,
} from "@/lib/types";
import {
    ChevronDown,
    ChevronUp,
    Plus,
    Edit,
    GripHorizontal,
    CheckCircle2,
    X,
    Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Draggable } from "@/components/draggable";

interface GroupProps {
    data: GroupData;
    index: number;
    onChange: (groupId: string, updatedData: Partial<GroupData>) => void;
    onRemove: (groupId: string) => void;
    onDragStart: (item: DraggableItem) => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent, item: DraggableItem) => void;
    onButtonDragStart: (item: DraggableItem) => void;
    onButtonDragEnd: () => void;
    onButtonDragOver: (e: React.DragEvent, item: DraggableItem) => void;
    draggedItem?: DraggableItem | null;
    dropIndicator?: ItemPosition | null;
    guildId: string;
}

export function Group({
    data,
    index,
    onChange,
    onRemove,
    onDragStart,
    onDragEnd,
    onDragOver,
    onButtonDragStart,
    onButtonDragEnd,
    onButtonDragOver,
    draggedItem,
    dropIndicator,
    guildId,
}: GroupProps) {
    const groupStyles = {
        container:
            "rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-sm transition-all duration-200",
        header: "p-4 cursor-pointer transition-colors",
        headerBorder: "border-b border-zinc-200 dark:border-zinc-700",
        headerEditing: "bg-messagehub-highlight dark:bg-zinc-800",
        grip: "cursor-grab touch-none",
        gripIcon: "h-5 w-5 text-zinc-400 dark:text-zinc-500",
        title: "text-lg font-semibold text-zinc-900 dark:text-white flex-1",
        badge: "text-xs font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded-full",
        button: "h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded",
        icon: "h-4 w-4",
        chevron: "h-5 w-5 text-zinc-500 dark:text-zinc-300",
        content: "p-4 space-y-4",
        emptyState:
            "text-center text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 p-6 rounded",
        addButton:
            "w-full flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2 rounded border border-dashed border-zinc-300 dark:border-zinc-600 transition-colors",
        addIcon: "h-4 w-4",
        removeButton:
            "text-destructive hover:text-white bg-transparent hover:bg-destructive/70 rounded px-3 py-1 text-sm transition-all",
        dropIndicator:
            "h-1 bg-messagehub-accent rounded-full my-2 animate-pulse-subtle",
        groupDropTarget:
            "before:absolute before:inset-x-0 before:top-0 before:h-2 before:bg-messagehub-accent before:rounded-t-xl before:animate-pulse-subtle",
        messageDropTarget: "ring-2 ring-messagehub-accent ring-opacity-50",
    };

    const [isEditing, setIsEditing] = useState(false);
    const [groupName, setGroupName] = useState(data.name);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [error, setError] = useState("");
    const [isComposing, setIsComposing] = useState(false);

    const handleGroupNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputVal = e.target.value;

        if (isComposing) {
            setGroupName(inputVal);
            return;
        }

        const sanitized = inputVal
            .replace(/[^a-zA-Z0-9ㄱ-ㅎ가-힣ㅏ-ㅣ_]/g, "")
            .slice(0, 10);

        if (sanitized !== inputVal) {
            setError("공백, 특수문자는 사용할 수 없습니다. (최대 10자)");
        } else {
            setError("");
        }

        setGroupName(sanitized);
    };

    const handleCompositionStart = () => setIsComposing(true);
    const handleCompositionEnd = (
        e: React.CompositionEvent<HTMLInputElement>
    ) => {
        setIsComposing(false);
        handleGroupNameInput(
            e as unknown as React.ChangeEvent<HTMLInputElement>
        );
    };

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
        if (isEditing) {
            setIsEditing(false);
        }
    };

    const startEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    const saveEditing = () => {
        onChange(data.id, { name: groupName });
        setIsEditing(false);
    };

    const cancelEditing = () => {
        setGroupName(data.name);
        setIsEditing(false);
    };

    const handleButtonChange = (
        buttonId: string,
        updatedButton: Partial<ButtonData>
    ) => {
        // 이름을 바꾸려는 경우에만 중복 체크
        if (updatedButton.name) {
            const isDuplicate = data.buttons.some(
                (b) =>
                    b.id !== buttonId &&
                    b.name.trim() === updatedButton.name!.trim()
            );
            if (isDuplicate) {
                toast.error("같은 이름의 버튼이 이미 존재합니다."); // 중복 경고
                return; // 변경 취소
            }
        }

        // 중복이 아니면 정상 반영
        const updatedButtons = data.buttons.map((button) =>
            button.id === buttonId ? { ...button, ...updatedButton } : button
        );
        onChange(data.id, { buttons: updatedButtons });
    };

    const addButton = () => {
        const newButtonId = uuidv4();
        const contentId = uuidv4();

        const newButton: ButtonData = {
            id: newButtonId,
            name: `새버튼${data.buttons.length + 1}`,
            index: data.buttons.length,
            groupId: data.id, // ✅ groupId 추가
            guildId: guildId, // ✅ guildId 추가
            contents: [
                {
                    id: contentId,
                    channelId: "none",
                    text: "",
                    index: 0,
                },
            ],
        };

        onChange(data.id, {
            buttons: [...data.buttons, newButton],
        });
    };

    const removeButton = (buttonId: string) => {
        const updatedButtons = data.buttons.filter(
            (button) => button.id !== buttonId
        );
        onChange(data.id, { buttons: updatedButtons });
    };

    const draggableItem: DraggableItem = {
        id: data.id,
        type: "group",
        index,
    };

    const isGroupDropTarget =
        dropIndicator &&
        draggedItem &&
        draggedItem.type === "group" &&
        dropIndicator.id !== data.id &&
        dropIndicator.type === "group" &&
        dropIndicator.newIndex === index;

    const isButtonDropTarget =
        dropIndicator &&
        draggedItem &&
        draggedItem.type === "button" &&
        dropIndicator.newParentId === data.id &&
        !data.buttons.some((b) => b.id === draggedItem.id);

    return (
        <Draggable
            item={draggableItem}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            className="mb-6 last:mb-0"
        >
            <div
                className={cn(
                    groupStyles.container,
                    isGroupDropTarget && groupStyles.groupDropTarget,
                    isButtonDropTarget &&
                        draggedItem?.parentId !== data.id &&
                        groupStyles.messageDropTarget
                )}
            >
                <div
                    className={cn(
                        groupStyles.header,
                        isCollapsed ? "" : groupStyles.headerBorder,
                        isEditing ? groupStyles.headerEditing : ""
                    )}
                    onClick={isEditing ? undefined : toggleCollapse}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className={groupStyles.grip}
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <GripHorizontal className={groupStyles.gripIcon} />
                        </div>

                        {isEditing ? (
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={groupName}
                                        onChange={handleGroupNameInput}
                                        onCompositionStart={
                                            handleCompositionStart
                                        }
                                        onCompositionEnd={handleCompositionEnd}
                                        className={cn(
                                            "h-9",
                                            error && "border border-red-500"
                                        )}
                                    />
                                    <UIButton
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            saveEditing();
                                        }}
                                    >
                                        <CheckCircle2
                                            className={groupStyles.icon}
                                        />
                                    </UIButton>
                                    <UIButton
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            cancelEditing();
                                        }}
                                    >
                                        <X className={groupStyles.icon} />
                                    </UIButton>
                                </div>
                                {error && (
                                    <p className="text-red-500 text-sm">
                                        {error}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <>
                                <h2 className={groupStyles.title}>
                                    {data.name}
                                </h2>
                                <span className={groupStyles.badge}>
                                    {data.buttons.length} 개 버튼
                                </span>
                                <UIButton
                                    variant="ghost"
                                    size="icon"
                                    className={groupStyles.button}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        startEditing(e);
                                    }}
                                    aria-label="Edit group name"
                                >
                                    <Edit className={groupStyles.icon} />
                                </UIButton>
                                {/* 그룹 제거 (10%) */}
                                <UIButton
                                    variant="ghost"
                                    size="icon"
                                    className={cn(groupStyles.removeButton)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove(data.id);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </UIButton>
                            </>
                        )}

                        <UIButton
                            variant="ghost"
                            size="icon"
                            className={groupStyles.button}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleCollapse();
                            }}
                            aria-label={
                                isCollapsed ? "Expand group" : "Collapse group"
                            }
                        >
                            {isCollapsed ? (
                                <ChevronDown className={groupStyles.chevron} />
                            ) : (
                                <ChevronUp className={groupStyles.chevron} />
                            )}
                        </UIButton>
                    </div>
                </div>

                {!isCollapsed && (
                    <div
                        className={groupStyles.content}
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        {data.buttons.length > 0 ? (
                            <div className="space-y-3">
                                {data.buttons.map((button, buttonIndex) => {
                                    const isDropBeforeTarget =
                                        dropIndicator &&
                                        draggedItem &&
                                        draggedItem.type === "button" &&
                                        draggedItem.id !== button.id &&
                                        dropIndicator.newParentId === data.id &&
                                        dropIndicator.newIndex === buttonIndex;

                                    const isDropAfterTarget =
                                        buttonIndex ===
                                            data.buttons.length - 1 &&
                                        dropIndicator &&
                                        draggedItem &&
                                        draggedItem.type === "button" &&
                                        dropIndicator.newParentId === data.id &&
                                        dropIndicator.newIndex ===
                                            data.buttons.length;

                                    return (
                                        <div key={button.id}>
                                            {isDropBeforeTarget && (
                                                <div
                                                    className={
                                                        groupStyles.dropIndicator
                                                    }
                                                ></div>
                                            )}
                                            <Button
                                                data={button}
                                                groupId={data.id}
                                                index={buttonIndex}
                                                onChange={handleButtonChange}
                                                onRemove={removeButton}
                                                onDragStart={onButtonDragStart}
                                                onDragEnd={onButtonDragEnd}
                                                onDragOver={onButtonDragOver}
                                                draggedItem={draggedItem}
                                                dropIndicator={dropIndicator}
                                                guildId={guildId}
                                            />
                                            {isDropAfterTarget && (
                                                <div
                                                    className={
                                                        groupStyles.dropIndicator
                                                    }
                                                ></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={groupStyles.emptyState}>
                                <p>그룹에 버튼이 없습니다</p>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            {/* 버튼 추가 (90%) */}
                            <UIButton
                                className={cn(groupStyles.addButton)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addButton();
                                }}
                                variant="outline"
                            >
                                <Plus className={groupStyles.addIcon} />
                                <span>버튼 추가</span>
                            </UIButton>
                        </div>
                    </div>
                )}
            </div>
        </Draggable>
    );
}
