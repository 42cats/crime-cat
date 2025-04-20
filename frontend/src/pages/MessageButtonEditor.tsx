import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button as UIButton } from "@/components/ui/button";
import { Group } from "@/components/group";
import { Plus, Save } from "lucide-react";
import { GroupData, DraggableItem, ItemPosition } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fetchGroupsFromServer, saveData } from "@/api/messageButtonService";
import { useParams, useLocation } from "react-router-dom";

const MessageButtonEditor = () => {
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const { guildId } = useParams<{ guildId: string }>();
    const location = useLocation();
    const guildName = location.state?.guildName ?? "이름 없음";

    useEffect(() => {
        (async () => {
            try {
                const serverGroups = await fetchGroupsFromServer(guildId);
                console.log("get save data ", serverGroups);
                setGroups(
                    serverGroups.length
                        ? serverGroups
                        : [initializeDefaultGroup()]
                );
            } catch {
                setGroups([initializeDefaultGroup()]);
            }
        })();
    }, [guildId]);

    const initializeDefaultGroup = (): GroupData => {
        const gid = uuidv4(),
            bid = uuidv4(),
            cid = uuidv4();
        return {
            id: gid,
            name: "예제그룹",
            index: groups.length,
            buttons: [
                {
                    id: bid,
                    name: "버튼예시",
                    index: 0,
                    contents: [
                        {
                            id: cid,
                            channelId: "none",
                            text: "여기에 메시지를 입력하세요",
                            index: 0,
                        },
                    ],
                },
            ],
        };
    };

    const initializeNewGroup = (): GroupData => ({
        id: uuidv4(),
        name: `예제그룹${groups.length + 1}`,
        index: groups.length,
        buttons: [],
    });

    const handleSave = async () => {
        setIsSaving(true);
        console.log("now data ", groups);
        try {
            const payload = groups.map((g, gi) => ({
                ...g,
                index: gi,
                buttons: g.buttons.map((b, bi) => ({
                    ...b,
                    index: bi,
                    groupId: g.id,
                    guildId: guildId ?? "",
                    contents: b.contents.map((c, ci) => ({
                        ...c,
                        index: ci,
                        buttonId: b.id,
                    })),
                })),
            }));
            const ok = await saveData(guildId ?? "", payload);
            toast[ok ? "success" : "error"](ok ? "저장 성공" : "저장 실패");
        } catch {
            toast.error("저장 중 오류 발생");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGroupChange = (
        groupId: string,
        updated: Partial<GroupData>
    ) => {
        if (updated.name) {
            const name = updated.name.trim();
            if (
                groups.some((g) => g.id !== groupId && g.name.trim() === name)
            ) {
                alert("같은 이름의 그룹이 이미 존재합니다.");
                return;
            }
        }
        setGroups((gs) =>
            gs.map((g) => (g.id === groupId ? { ...g, ...updated } : g))
        );
    };

    const handleGroupRemove = (groupId: string) =>
        setGroups((gs) => gs.filter((g) => g.id !== groupId));

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="container mx-auto py-12 px-4">
                {/* 헤더 카드 */}
                <div className="bg-card dark:bg-card p-8 rounded-lg shadow-lg mb-12">
                    <h1 className="text-3xl font-bold mb-2">
                        {guildName} 서버 메시지 매크로 에디터
                    </h1>
                    <p className="text-muted-foreground mb-4">
                        메시지를 버튼 하나로 쉽게 보낼 수 있도록 편집하세요.
                    </p>
                    <UIButton
                        onClick={handleSave}
                        disabled={isSaving}
                        className={cn(
                            "inline-flex items-center gap-2 px-6 py-2 font-medium",
                            "bg-primary text-primary-foreground hover:opacity-90",
                            isSaving && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Save className="h-5 w-5" />
                        {isSaving ? "저장 중…" : "저장하기"}
                    </UIButton>
                </div>

                {/* 그룹 리스트 */}
                <div className="space-y-6">
                    {groups.map((group, idx) => (
                        <Group
                            key={group.id}
                            data={group}
                            index={idx}
                            onChange={handleGroupChange}
                            onRemove={handleGroupRemove}
                            guildId={guildId ?? ""}
                            onDragStart={() => {}}
                            onDragEnd={() => {}}
                            onDragOver={() => {}}
                            onButtonDragStart={() => {}}
                            onButtonDragEnd={() => {}}
                            onButtonDragOver={() => {}}
                        />
                    ))}

                    {/* 그룹 추가 버튼 */}
                    <div className="flex justify-center mt-8">
                        <UIButton
                            onClick={() =>
                                setGroups((gs) => [...gs, initializeNewGroup()])
                            }
                            className="w-full flex items-center gap-2 text-sm 
             text-foreground dark:text-foreground 
             hover:bg-muted/50 dark:hover:bg-muted 
             px-3 py-2 rounded border border-dashed 
             border-border transition-colors"
                        >
                            <Plus className="h-5 w-5" />
                            그룹 추가
                        </UIButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageButtonEditor;
