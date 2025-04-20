import React, { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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
import { fetchChannels } from "@/api/messageButtonService";
import { Channel } from "@/lib/types";
import { useParams } from "react-router-dom";

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
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<Channel>();
    const [initialized, setInitialized] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { guildId } = useParams<{ guildId: string }>();

    // 👑 초성검색 포함 매칭 함수
    const matches = (target: string, keyword: string) => {
        const t = target.toLowerCase();
        const k = keyword.toLowerCase();
        // 1) 완전 일치 포함
        if (t.includes(k)) return true;
        // 2) 초성 검색 지원
        //    Hangul.search 는 'ㄱㅇ' → '게임' 매칭 가능
        return Hangul.search(Hangul.d(target, true).join(""), k) >= 0;
    };

    // 1회 채널 로드 + 가나다·알파벳 정렬
    useEffect(() => {
        if (initialized) return;
        setIsLoading(true);
        fetchChannels(guildId)
            .then((fetched) => {
                const sorted = [...fetched].sort((a, b) =>
                    a.name.localeCompare(b.name, "ko-KR")
                );
                setChannels(sorted);
                if (value) {
                    setSelectedChannel(sorted.find((c) => c.id === value));
                }
            })
            .catch(console.error)
            .finally(() => {
                setInitialized(true);
                setIsLoading(false);
            });
    }, [guildId, initialized, value]);

    // value 변경 시 selected 동기화
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

    // 필터링
    const filtered = channels.filter((c) =>
        !searchQuery.trim() ? true : matches(c.name, searchQuery)
    );

    return (
        <Popover
            open={open}
            onOpenChange={(o) => {
                setOpen(o);
                if (o) setSearchQuery(""); // 열 때마다 검색 초기화
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
                    {selectedChannel
                        ? selectedChannel.name
                        : "채널을 선택하세요"}
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
                                                {ch.name}
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
