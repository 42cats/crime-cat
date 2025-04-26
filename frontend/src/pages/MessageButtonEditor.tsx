import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button as UIButton } from "@/components/ui/button";
import { Group } from "@/components/group";
import { Plus, Save } from "lucide-react";
import { GroupData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fetchGroupsFromServer, saveData } from "@/api/messageButtonService";
import { useLocation, useParams } from "react-router-dom";

/**
 * 임시 저장 지연 시간(ms)
 */
const AUTO_SAVE_DELAY = 5000;

const MessageButtonEditor: React.FC = () => {
    const location = useLocation();
    const params = useParams();
    const state = location.state as { guildId?: string; guildName?: string } | null;

    // ✅ guildId, guildName 가져오기
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

    // ✅ 세션스토리지 동기화
    useEffect(() => {
        if (guildId) sessionStorage.setItem("guildId", guildId);
        if (guildName) sessionStorage.setItem("guildName", guildName);
    }, [guildId, guildName]);

    const [groups, setGroups] = useState<GroupData[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const saveTimeout = useRef<NodeJS.Timeout | null>(null);

    // ✅ 잘못된 접근 방어
    if (!guildId) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-red-500 text-xl font-semibold">
                    길드 정보를 찾을 수 없습니다. 다시 시도해주세요.
                </p>
            </div>
        );
    }

    /**
     * 최초 로딩 시 서버에서 그룹 목록을 받아옴
     */
    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const serverGroups = await fetchGroupsFromServer(guildId);
                if (!mounted) return;
                setGroups(
                    serverGroups.length > 0
                        ? serverGroups
                        : [initializeDefaultGroup(0, guildId)]
                );
            } catch {
                if (mounted) setGroups([initializeDefaultGroup(0, guildId)]);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [guildId]);

    /**
     * 그룹 데이터 변경 감지 → 5초 뒤 자동 저장
     */
    useEffect(() => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(() => {
            handleSave();
        }, AUTO_SAVE_DELAY);

        return () => {
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
        };
    }, [groups]);

    /**
     * 수동·자동 호출 가능한 저장 로직
     */
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
        } catch {
            toast.error("저장 중 오류 발생");
        } finally {
            setIsSaving(false);
        }
    }, [groups, guildId, isSaving]);

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

    /* ------------------------------------------------------------------ */
    /* ------------------------------- UI ------------------------------- */
    /* ------------------------------------------------------------------ */

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
                            guildId={guildId}
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
                                setGroups((prev) => [
                                    ...prev,
                                    initializeNewGroup(),
                                ])
                            }
                            className="w-full flex items-center gap-2 text-sm text-foreground dark:text-foreground hover:bg-muted/50 dark:hover:bg-muted px-3 py-2 rounded border border-dashed border-border transition-colors"
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
