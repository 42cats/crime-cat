import React, { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Shield, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

interface RoleSelectProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
    guildId: string;
}

export function RoleSelect({
    value,
    onChange,
    disabled,
    className,
    guildId,
}: RoleSelectProps) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role>();
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

    // 선택된 역할 찾기
    useEffect(() => {
        if (value === "ALL") {
            setSelectedRole({ id: "ALL", name: "모든 사용자" });
        } else if (value && roles.length > 0) {
            const role = roles.find(r => r.id === value);
            setSelectedRole(role);
        } else {
            setSelectedRole(undefined);
        }
    }, [value, roles]);

    // 검색 필터링된 역할 목록
    const filteredRoles = searchQuery
        ? roles.filter(role => matches(role.name, searchQuery))
        : roles;

    // 역할 색상을 HEX로 변환
    const getRoleColor = (color?: number) => {
        if (!color || color === 0) return undefined;
        return `#${color.toString(16).padStart(6, '0')}`;
    };

    const handleSelect = (roleId: string) => {
        onChange(roleId);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between text-left font-normal",
                        !selectedRole && "text-muted-foreground",
                        className
                    )}
                    disabled={disabled || isLoading}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                        ) : selectedRole?.id === "ALL" ? (
                            <Users className="h-4 w-4 shrink-0" />
                        ) : (
                            <Shield 
                                className="h-4 w-4 shrink-0"
                                style={{ 
                                    color: getRoleColor(selectedRole?.color) || undefined 
                                }}
                            />
                        )}
                        <span className="truncate">
                            {selectedRole ? selectedRole.name : "역할을 선택하세요"}
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
                                value="ALL"
                                onSelect={() => handleSelect("ALL")}
                                className="cursor-pointer"
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === "ALL" ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>모든 사용자</span>
                            </CommandItem>
                            
                            {/* 역할 목록 */}
                            {filteredRoles.map((role) => (
                                <CommandItem
                                    key={role.id}
                                    value={role.id}
                                    onSelect={() => handleSelect(role.id)}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === role.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <Shield 
                                        className="mr-2 h-4 w-4" 
                                        style={{ 
                                            color: getRoleColor(role.color) || '#64748b' 
                                        }}
                                    />
                                    <span className="truncate">{role.name}</span>
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
    );
}