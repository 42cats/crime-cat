import React, { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Hash, Volume2, Users } from "lucide-react";
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
import { Channel } from "@/lib/types";
import { useChannels } from "@/hooks/useChannels";

interface ChannelSelectProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

export function ChannelSelect({
    value,
    onChange,
    disabled,
    className,
}: ChannelSelectProps) {
    const { channels, isLoading } = useChannels();
    
    const [open, setOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<Channel>();
    const [searchQuery, setSearchQuery] = useState("");

    // 👑 초성검색 포함 매칭 함수
    const matches = (target: string, keyword: string) => {
        const t = target.toLowerCase();
        const k = keyword.toLowerCase();
        return (
            t.includes(k) ||
            Hangul.search(Hangul.d(target, true).join(""), k) >= 0
        );
    };

    // ✅ value 변경 시 selected 동기화
    useEffect(() => {
        if (!value || !channels.length) return;
        setSelectedChannel(channels.find((c) => c.id === value));
    }, [value, channels]);

    const handleSelect = (id: string) => {
        const ch = channels.find((c) => c.id === id);
        if (ch) {
            setSelectedChannel(ch);
            onChange(id);
            setOpen(false);
        }
    };

    // 채널 타입별 아이콘 (백엔드 이모지 우선 사용)
    const getChannelIcon = (channel?: Channel) => {
        if (channel?.emoji) {
            return <span className="text-sm mr-2">{channel.emoji}</span>;
        }
        
        const type = channel?.typeKey;
        switch (type) {
            case 'voice':
            case 'stage':
                return <Volume2 className="h-4 w-4 text-green-500 mr-2" />;
            case 'category':
                return <Users className="h-4 w-4 text-gray-500 mr-2" />;
            case 'announcement':
                return <Hash className="h-4 w-4 text-yellow-500 mr-2" />;
            case 'forum':
                return <Hash className="h-4 w-4 text-purple-500 mr-2" />;
            default:
                return <Hash className="h-4 w-4 text-blue-500 mr-2" />;
        }
    };

    // 검색 필터링
    const filtered = channels.filter((c) =>
        !searchQuery.trim() ? true : matches(c.name, searchQuery)
    );

    return (
        <Popover
            open={open}
            onOpenChange={(o) => {
                setOpen(o);
                if (o) setSearchQuery(""); // 열 때 검색어 초기화
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between text-left font-normal h-10",
                        !selectedChannel && "text-muted-foreground",
                        className
                    )}
                >
                    <div className="flex items-center">
                        {selectedChannel && getChannelIcon(selectedChannel)}
                        {selectedChannel
                            ? selectedChannel.name
                            : "채널을 선택하세요"}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            {open && (
                <PopoverContent className="w-full p-0" align="start">
                    <Command>
                        {/* 검색 입력창 */}
                        <div className="p-2 bg-white dark:bg-zinc-800 rounded-t-md shadow-sm">
                            <CommandInput
                                autoFocus
                                placeholder="채널 검색"
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && e.preventDefault()
                                }
                                className="w-full bg-white dark:bg-zinc-800 px-2 py-1 rounded-md"
                            />
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-6 bg-white dark:bg-zinc-800">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <CommandList className="bg-white dark:bg-zinc-800 rounded-b-md shadow-md">
                                <CommandEmpty>채널을 찾을 수 없음</CommandEmpty>
                                <CommandGroup className="max-h-60 overflow-y-auto">
                                    {filtered.map((ch) => (
                                        <CommandItem
                                            key={ch.id}
                                            value={ch.name}
                                            asChild
                                        >
                                            <button
                                                type="button"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleSelect(ch.id);
                                                }}
                                                className="w-full flex items-center"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        value === ch.id
                                                            ? "opacity-100"
                                                            : "opacity-0"
                                                    )}
                                                />
                                                {getChannelIcon(ch)}
                                                <div className="flex-1">
                                                    <div>{ch.name}</div>
                                                    {ch.displayName && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {ch.displayName}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        )}
                    </Command>
                </PopoverContent>
            )}
        </Popover>
    );
}
