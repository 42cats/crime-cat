import React, { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button as UIButton } from "@/components/ui/button";
import { Group } from "@/components/group";
import { Plus, Save } from "lucide-react";
import { GroupData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fetchGroupsFromServer, saveData } from "@/api/messageButtonService";
import { useLocation } from "react-router-dom";

const AUTO_SAVE_DELAY = 5000;

const MessageButtonEditor: React.FC = () => {
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const location = useLocation();
    const guildNameRef = useRef<string>("");
    const guildIdRef = useRef<string>("");

    /** 초기 Guild 정보 세팅 */
    useEffect(() => {
        const savedGuildName = sessionStorage.getItem("guildName");
        const savedGuildId = sessionStorage.getItem("guildId");
        guildNameRef.current =
            location.state?.guildName || savedGuildName || "이름 없음";
        guildIdRef.current = location.state?.guildId || savedGuildId || "";
        sessionStorage.setItem("guildName", guildNameRef.current);
        sessionStorage.setItem("guildId", guildIdRef.current);
    }, [location.state]);

    const saveTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const serverGroups = await fetchGroupsFromServer(
                    guildIdRef.current
                );
                if (!mounted) return;
                setGroups(
                    serverGroups.length > 0
                        ? serverGroups
                        : [initializeDefaultGroup(0, guildIdRef.current)]
                );
            } catch {
                if (mounted)
                    setGroups([initializeDefaultGroup(0, guildIdRef.current)]);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            handleSave();
        }, AUTO_SAVE_DELAY);
        return () => {
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
        };
    }, [groups]);

    const handleSave = useCallback(async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const payload = groups.map((g, gi) => ({
                ...g,
                index: gi,
                buttons: g.buttons.map((b, bi) => ({
                    ...b,
                    index: bi,
                    groupId: g.id,
                    guildId: guildIdRef.current,
                    contents: b.contents.map((c, ci) => ({
                        ...c,
                        index: ci,
                        buttonId: b.id,
                    })),
                })),
            }));
            const ok = await saveData(guildIdRef.current, payload);
            toast[ok ? "success" : "error"](ok ? "저장 성공" : "저장 실패");
        } catch {
            toast.error("저장 중 오류 발생");
        } finally {
            setIsSaving(false);
        }
    }, [groups, isSaving]);

    const isDuplicateName = useCallback(
        (id: string, name: string) =>
            groups.some((g) => g.id !== id && g.name.trim() === name.trim()),
        [groups]
    );

    const handleGroupChange = useCallback(
        (groupId: string, updated: Partial<GroupData>) => {
            if (updated.name && isDuplicateName(groupId, updated.name)) {
                toast.error("같은 이름의 그룹이 이미 존재합니다.");
                return;
            }
            setGroups((prev) =>
                prev.map((g) => (g.id === groupId ? { ...g, ...updated } : g))
            );
        },
        [isDuplicateName]
    );

    const handleGroupRemove = useCallback((groupId: string) => {
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
    }, []);

    const initializeDefaultGroup = (
        order: number,
        guildId: string
    ): GroupData => {
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

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="container mx-auto py-12 px-4">
                <div className="bg-card p-8 rounded-lg shadow-lg mb-12">
                    <h1 className="text-3xl font-bold mb-2">
                        {guildNameRef.current} 서버 메시지 매크로 에디터
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

                <div className="space-y-6">
                    {groups.map((group, idx) => (
                        <Group
                            key={group.id}
                            data={group}
                            index={idx}
                            onChange={handleGroupChange}
                            onRemove={handleGroupRemove}
                            guildId={guildIdRef.current}
                            onDragStart={() => {}}
                            onDragEnd={() => {}}
                            onDragOver={() => {}}
                            onButtonDragStart={() => {}}
                            onButtonDragEnd={() => {}}
                            onButtonDragOver={() => {}}
                        />
                    ))}
                    <div className="flex justify-center mt-8">
                        <UIButton
                            onClick={() =>
                                setGroups((prev) => [
                                    ...prev,
                                    initializeDefaultGroup(
                                        prev.length,
                                        guildIdRef.current
                                    ),
                                ])
                            }
                            className="w-full flex items-center gap-2 text-sm text-foreground hover:bg-muted/50 px-3 py-2 rounded border border-dashed border-border transition-colors"
                        >
                            <Plus className="h-5 w-5" /> 그룹 추가
                        </UIButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageButtonEditor;
