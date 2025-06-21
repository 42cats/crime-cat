import React, { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Shield, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Hangul from "hangul-js";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface Role {
    id: string;
    name: string;
    color?: number;
    position?: number;
    mentionable?: boolean;
    managed?: boolean;
}

interface MultiRoleSelectProps {
    value: string[];
    onChange: (value: string[]) => void;
    guildId: string;
    placeholder?: string;
    maxSelections?: number;
    disabled?: boolean;
    className?: string;
}

export function MultiRoleSelect({
    value,
    onChange,
    guildId,
    placeholder = "역할을 선택하세요",
    maxSelections = 10,
    disabled,
    className,
}: MultiRoleSelectProps) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // 초성검색 포함 매칭 함수
    const matches = (target: string, keyword: string) => {
        const t = target.toLowerCase();
        const k = keyword.toLowerCase();
        return (
            t.includes(k) ||
            Hangul.search(Hangul.d(target, true).join(""), k) >= 0
        );
    };

    // Discord 역할 목록 조회
    useEffect(() => {
        if (!guildId) return;

        const fetchRoles = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/v1/discord/guilds/${guildId}/roles`);
                if (response.ok) {
                    const rolesData = await response.json();
                    // 위치(position) 기준으로 정렬 (높은 순서부터)
                    const sortedRoles = rolesData.sort((a: Role, b: Role) => 
                        (b.position || 0) - (a.position || 0)
                    );
                    setRoles(sortedRoles);
                } else {
                    console.error('역할 목록 조회 실패:', response.status);
                }
            } catch (error) {
                console.error('역할 목록 조회 에러:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRoles();
    }, [guildId]);

    // 검색 필터링된 역할 목록
    const filteredRoles = searchQuery
        ? roles.filter(role => matches(role.name, searchQuery))
        : roles;

    // 역할 색상을 HEX로 변환
    const getRoleColor = (color?: number) => {
        if (!color || color === 0) return undefined;
        return `#${color.toString(16).padStart(6, '0')}`;
    };

    // 선택된 역할 정보 가져오기
    const selectedRoles = roles.filter(role => value.includes(role.id));
    const hasAllUsers = value.includes("ALL");

    // 역할 선택/해제 토글
    const handleToggle = (roleId: string) => {
        const newValue = value.includes(roleId)
            ? value.filter(id => id !== roleId)
            : [...value, roleId];
        
        // 최대 선택 개수 제한
        if (newValue.length <= maxSelections) {
            onChange(newValue);
        }
    };

    // 선택된 항목 제거
    const handleRemove = (roleId: string) => {
        onChange(value.filter(id => id !== roleId));
    };

    return (
        <div className={cn("w-full", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between text-left font-normal"
                        disabled={disabled || isLoading}
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                            ) : (
                                <Shield className="h-4 w-4 shrink-0" />
                            )}
                            <span className="truncate">
                                {value.length > 0 
                                    ? `${value.length}개 역할 선택됨`
                                    : placeholder
                                }
                            </span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                
                <PopoverContent className="w-full p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder="역할 검색..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                        <CommandList>
                            <CommandEmpty>
                                {isLoading ? "역할 목록을 불러오는 중..." : "해당하는 역할이 없습니다."}
                            </CommandEmpty>
                            <CommandGroup>
                                {/* 모든 사용자 옵션 */}
                                <CommandItem
                                    onSelect={() => handleToggle("ALL")}
                                    className="cursor-pointer"
                                >
                                    <Checkbox 
                                        checked={hasAllUsers}
                                        className="mr-2"
                                    />
                                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>모든 사용자</span>
                                </CommandItem>
                                
                                {/* 역할 목록 */}
                                {filteredRoles.map((role) => (
                                    <CommandItem
                                        key={role.id}
                                        onSelect={() => handleToggle(role.id)}
                                        className="cursor-pointer"
                                    >
                                        <Checkbox 
                                            checked={value.includes(role.id)}
                                            className="mr-2"
                                        />
                                        <Shield 
                                            className="mr-2 h-4 w-4" 
                                            style={{ 
                                                color: getRoleColor(role.color) || '#64748b' 
                                            }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{role.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                위치: {role.position || 0}
                                            </div>
                                        </div>
                                        {role.managed && (
                                            <span className="ml-auto text-xs text-muted-foreground">
                                                봇
                                            </span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* 선택된 역할 표시 */}
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {hasAllUsers && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>모든 사용자</span>
                            <X 
                                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                onClick={() => handleRemove("ALL")}
                            />
                        </Badge>
                    )}
                    {selectedRoles.map((role) => (
                        <Badge key={role.id} variant="secondary" className="flex items-center gap-1">
                            <Shield 
                                className="h-3 w-3" 
                                style={{ color: getRoleColor(role.color) }}
                            />
                            <span className="truncate max-w-32">{role.name}</span>
                            <X 
                                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                onClick={() => handleRemove(role.id)}
                            />
                        </Badge>
                    ))}
                </div>
            )}

            {/* 선택 제한 안내 */}
            {value.length >= maxSelections && (
                <div className="text-xs text-muted-foreground mt-1">
                    최대 {maxSelections}개까지 선택할 수 있습니다.
                </div>
            )}
        </div>
    );
}