import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button as UIButton } from "@/components/ui/button";
import { SortableGroup } from "@/components/message-editor/SortableGroup";
import { Plus, Save, FolderPlus, AlertCircle } from "lucide-react";
import { GroupData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchGroupsFromServer, saveData } from "@/api/messageButtonService";
import { useLocation, useParams } from "react-router-dom";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { ChannelProvider } from "@/contexts/ChannelContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * 임시 저장 지연 시간(ms)
 */
const AUTO_SAVE_DELAY = 5000;

const MessageButtonEditor: React.FC = () => {
    const location = useLocation();
    const params = useParams();
    const state = location.state as { guildId?: string; guildName?: string } | null;

    // guildId, guildName 가져오기
    const guildId = useMemo(() => {
        return (
            params.guildId ||
            state?.guildId ||
            sessionStorage.getItem("guildId") ||
            ""
        );
    }, [params.guildId, state]);

    const guildName = useMemo(() => {
        return (
            state?.guildName ||
            sessionStorage.getItem("guildName") ||
            ""
        );
    }, [state]);

    // 세션스토리지 동기화
    useEffect(() => {
        if (guildId) sessionStorage.setItem("guildId", guildId);
        if (guildName) sessionStorage.setItem("guildName", guildName);
    }, [guildId, guildName]);

    const [groups, setGroups] = useState<GroupData[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const saveTimeout = useRef<NodeJS.Timeout | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 잘못된 접근 방어
    if (!guildId) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-red-500 text-xl font-semibold">
                    길드 정보를 찾을 수 없습니다. 다시 시도해주세요.
                </p>
            </div>
        );
    }

    // 최초 로딩 시 서버에서 그룹 목록을 받아옴
    useEffect(() => {
        let mounted = true;
        setIsLoading(true);

        const loadInitialData = async () => {
            try {
                // 그룹 정보 가져오기
                const serverGroups = await fetchGroupsFromServer(guildId);
                
                if (!mounted) return;
                
                setGroups(
                    serverGroups.length > 0
                        ? serverGroups
                        : [initializeDefaultGroup(0, guildId)]
                );
            } catch (error) {
                console.error("데이터 로드 실패", error);
                if (mounted) {
                    setGroups([initializeDefaultGroup(0, guildId)]);
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        loadInitialData();

        return () => {
            mounted = false;
        };
    }, [guildId]);

    // 그룹 데이터 변경 감지 → 5초 뒤 자동 저장
    useEffect(() => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        
        if (groups.length > 0) {
            saveTimeout.current = setTimeout(() => {
                handleSave();
            }, AUTO_SAVE_DELAY);
        }

        return () => {
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
        };
    }, [groups]);

    // 수동·자동 호출 가능한 저장 로직
    const handleSave = useCallback(async () => {
        if (isSaving) return;

        // 중복 그룹 이름 검사
        const duplicateGroupNames = [];
        const groupNameMap = {};
        
        for (const group of groups) {
            const normalizedName = group.name.trim().toLowerCase();
            if (groupNameMap[normalizedName]) {
                duplicateGroupNames.push(group.name);
            } else {
                groupNameMap[normalizedName] = true;
            }
        }
        
        if (duplicateGroupNames.length > 0) {
            toast.error(`중복된 그룹 이름이 있습니다: ${duplicateGroupNames.join(', ')}`);
            return;
        }

        // 각 그룹 내에서 버튼 이름 중복 검사
        const groupsWithDuplicateButtons = [];
        
        for (const group of groups) {
            const buttonNameMap = {};
            const duplicateButtonNames = [];
            
            for (const button of group.buttons) {
                const normalizedButtonName = button.name.trim().toLowerCase();
                if (buttonNameMap[normalizedButtonName]) {
                    duplicateButtonNames.push(button.name);
                } else {
                    buttonNameMap[normalizedButtonName] = true;
                }
            }
            
            if (duplicateButtonNames.length > 0) {
                groupsWithDuplicateButtons.push({
                    groupName: group.name,
                    buttonNames: duplicateButtonNames
                });
            }
        }
        
        if (groupsWithDuplicateButtons.length > 0) {
            const errorMessages = groupsWithDuplicateButtons.map(item => 
                `그룹 "${item.groupName}"에 중복된 버튼 이름이 있습니다: ${item.buttonNames.join(', ')}`
            );
            toast.error(errorMessages.join('\n'));
            return;
        }

        setIsSaving(true);
        try {
            const payload = groups.map((g, gi) => ({
                ...g,
                index: gi,
                buttons: g.buttons.map((b, bi) => ({
                    ...b,
                    index: bi,
                    groupId: g.id,
                    guildId,
                    contents: b.contents.map((c, ci) => ({
                        ...c,
                        index: ci,
                        buttonId: b.id,
                    })),
                })),
            }));

            const ok = await saveData(guildId, payload);
            toast[ok ? "success" : "error"](ok ? "저장 성공" : "저장 실패");
        } catch (error) {
            console.error("저장 오류:", error);
            toast.error("저장 중 오류 발생");
        } finally {
            setIsSaving(false);
        }
    }, [groups, guildId, isSaving]);

    const isDuplicateName = useCallback(
        (id: string, name: string) =>
            groups.some((g) => g.id !== id && g.name.trim().toLowerCase() === name.trim().toLowerCase()),
        [groups]
    );
    
    // 그룹 내 버튼 이름 중복 검사 함수
    const isButtonNameDuplicate = useCallback(
        (groupId: string, buttonId: string, buttonName: string) => {
            const group = groups.find(g => g.id === groupId);
            if (!group) return false;
            
            return group.buttons.some(b => 
                b.id !== buttonId && 
                b.name.trim().toLowerCase() === buttonName.trim().toLowerCase()
            );
        },
        [groups]
    );

    const handleGroupChange = useCallback(
        (groupId: string, updated: Partial<GroupData>) => {
            if (updated.name && isDuplicateName(groupId, updated.name)) {
                toast.error("같은 이름의 그룹이 이미 존재합니다.");
                return false;
            }
            
            // 버튼 추가 시 최대 버튼 개수(25개) 제한 확인
            if (updated.buttons) {
                const group = groups.find(g => g.id === groupId);
                if (group && updated.buttons.length > 25) {
                    toast.error("디스코드 제한으로 인해 한 그룹당 최대 25개의 버튼만 추가할 수 있습니다.");
                    return false;
                }
            }
            
            setGroups((prev) =>
                prev.map((g) => (g.id === groupId ? { ...g, ...updated } : g))
            );
            return true;
        },
        [isDuplicateName, groups]
    );

    const handleGroupRemove = useCallback((groupId: string) => {
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
    }, []);

    const initializeDefaultGroup = (order: number, guildId: string): GroupData => {
        const groupId = uuidv4();
        const buttonId = uuidv4();
        const contentId = uuidv4();

        return {
            id: groupId,
            name: "예제그룹",
            index: order,
            buttons: [
                {
                    id: buttonId,
                    name: "버튼예시",
                    index: 0,
                    groupId,
                    guildId,
                    contents: [
                        {
                            id: contentId,
                            channelId: "none",
                            text: "여기에 메시지를 입력하세요",
                            index: 0,
                            buttonId,
                        },
                    ],
                },
            ],
        };
    };

    const initializeNewGroup = useCallback(
        (): GroupData => ({
            id: uuidv4(),
            name: `예제그룹${groups.length + 1}`,
            index: groups.length,
            buttons: [],
        }),
        [groups.length]
    );
    
    const addButtonToGroup = useCallback(
        (groupId: string) => {
            // 그룹 찾기
            const group = groups.find(g => g.id === groupId);
            if (!group) return;
            
            // 최대 버튼 개수(25개) 제한 확인
            if (group.buttons.length >= 25) {
                toast.error("디스코드 제한으로 인해 한 그룹당 최대 25개의 버튼만 추가할 수 있습니다.");
                return;
            }
            
            const newButtonId = uuidv4();
            const contentId = uuidv4();
            
            // 새 버튼 이름 생성 (중복 방지)
            let baseName = "새버튼";
            let newButtonName = baseName;
            let counter = 1;
            
            // 이미 같은 이름의 버튼이 있는지 확인하고 번호 붙이기
            while (isButtonNameDuplicate(groupId, newButtonId, newButtonName)) {
                newButtonName = `${baseName}${counter}`;
                counter++;
            }

            const newButton = {
                id: newButtonId,
                name: newButtonName,
                index: 0,
                groupId,
                guildId,
                contents: [
                    {
                        id: contentId,
                        channelId: "none",
                        text: "",
                        index: 0,
                        buttonId: newButtonId,
                    },
                ],
            };

            setGroups(prev => 
                prev.map(group => {
                    if (group.id === groupId) {
                        return {
                            ...group,
                            buttons: [...group.buttons, newButton],
                        };
                    }
                    return group;
                })
            );
        },
        [guildId, groups, isButtonNameDuplicate]
    );
    
    // 그룹 순서 변경
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (active.id !== over.id) {
            setGroups((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                
                return arrayMove(items, oldIndex, newIndex).map((item, index) => ({
                    ...item,
                    index
                }));
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">데이터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <ChannelProvider guildId={guildId}>
            <div className="min-h-screen bg-background text-foreground">
                <div className="container mx-auto py-12 px-4">
                    {/* 헤더 카드 */}
                    <Card className="mb-12">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold">
                                {guildName} 서버 메시지 매크로 에디터
                            </CardTitle>
                            <CardDescription>
                                메시지를 버튼 하나로 쉽게 보낼 수 있도록 편집하세요.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-between">
                            <UIButton
                                onClick={() => {
                                    setGroups((prev) => [
                                        ...prev,
                                        initializeNewGroup(),
                                    ]);
                                }}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <FolderPlus className="h-5 w-5" />
                                그룹 추가
                            </UIButton>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <UIButton
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className={cn(
                                                "inline-flex items-center gap-2 px-6 py-2 font-medium",
                                                isSaving && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <Save className="h-5 w-5" />
                                            {isSaving ? "저장 중…" : "저장하기"}
                                        </UIButton>
                                    </TooltipTrigger>
                                    <TooltipContent>모든 변경사항을 저장합니다</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </CardFooter>
                    </Card>

                    {/* 그룹 리스트 */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                    >
                        <SortableContext
                            items={groups.map(group => group.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-6">
                                {groups.map((group, idx) => (
                                    <SortableGroup
                                        key={group.id}
                                        group={group}
                                        index={idx}
                                        onChange={handleGroupChange}
                                        onRemove={handleGroupRemove}
                                        onButtonAdd={addButtonToGroup}
                                        isButtonNameDuplicate={isButtonNameDuplicate}
                                    />
                                ))}
                                
                                {/* 그룹 추가 버튼 */}
                                <div className="flex justify-center mt-8">
                                    <UIButton
                                        onClick={() => {
                                            setGroups((prev) => [
                                                ...prev,
                                                initializeNewGroup(),
                                            ]);
                                        }}
                                        className="w-full flex items-center gap-2 text-sm hover:bg-muted/50 px-3 py-2 rounded border border-dashed border-border transition-colors"
                                        variant="outline"
                                    >
                                        <Plus className="h-5 w-5" /> 그룹 추가
                                    </UIButton>
                                </div>
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </div>
        </ChannelProvider>
    );
};

export default MessageButtonEditor;
