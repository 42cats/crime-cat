import React, { useState } from "react";
import { Check, ChevronsUpDown, Hash, Users, X, Volume2 } from "lucide-react";
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
import { Channel } from "@/lib/types";
import { useChannels } from "@/hooks/useChannels";

interface MultiChannelSelectProps {
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    maxSelections?: number;
    disabled?: boolean;
    className?: string;
    channelTypes?: string[]; // 필터링할 채널 타입
}

export function MultiChannelSelect({
    value,
    onChange,
    placeholder = "채널을 선택하세요",
    maxSelections = 10,
    disabled,
    className,
    channelTypes,
}: MultiChannelSelectProps) {
    const { channels, isLoading } = useChannels();
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

    // 채널 타입에 따른 필터링
    const getFilteredChannels = () => {
        let filtered = channels;
        
        // 채널 타입 필터링
        if (channelTypes && channelTypes.length > 0) {
            filtered = channels.filter(channel => 
                channelTypes.includes(channel.type || 'text')
            );
        }
        
        // 검색 필터링
        if (searchQuery) {
            filtered = filtered.filter(channel => 
                matches(channel.name, searchQuery)
            );
        }
        
        return filtered;
    };

    const filteredChannels = getFilteredChannels();

    // 채널 타입별 아이콘 (백엔드 이모지 우선 사용)
    const getChannelIcon = (channel?: Channel) => {
        if (channel?.emoji) {
            return <span className="text-sm">{channel.emoji}</span>;
        }
        
        const type = channel?.typeKey;
        switch (type) {
            case 'voice':
            case 'stage':
                return <Volume2 className="h-4 w-4 text-green-500" />;
            case 'category':
                return <Users className="h-4 w-4 text-gray-500" />;
            case 'announcement':
                return <Hash className="h-4 w-4 text-yellow-500" />;
            case 'forum':
                return <Hash className="h-4 w-4 text-purple-500" />;
            default:
                return <Hash className="h-4 w-4 text-blue-500" />;
        }
    };

    // 선택된 채널 정보 가져오기
    const selectedChannels = channels.filter(channel => value.includes(channel.id));

    // 채널 선택/해제 토글
    const handleToggle = (channelId: string) => {
        const newValue = value.includes(channelId)
            ? value.filter(id => id !== channelId)
            : [...value, channelId];
        
        // 최대 선택 개수 제한
        if (newValue.length <= maxSelections) {
            onChange(newValue);
        }
    };

    // 선택된 항목 제거
    const handleRemove = (channelId: string) => {
        onChange(value.filter(id => id !== channelId));
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
                            {selectedChannels.length > 0 ? getChannelIcon(selectedChannels[0]) : <Hash className="h-4 w-4" />}
                            <span className="truncate">
                                {value.length > 0 
                                    ? `${value.length}개 채널 선택됨`
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
                            placeholder="채널 검색..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                        <CommandList>
                            <CommandEmpty>
                                {isLoading ? "채널 목록을 불러오는 중..." : "해당하는 채널이 없습니다."}
                            </CommandEmpty>
                            <CommandGroup>
                                {filteredChannels.map((channel) => (
                                    <CommandItem
                                        key={channel.id}
                                        onSelect={() => handleToggle(channel.id)}
                                        className="cursor-pointer"
                                    >
                                        <Checkbox 
                                            checked={value.includes(channel.id)}
                                            className="mr-2"
                                        />
                                        <div className="mr-2 text-muted-foreground">
                                            {getChannelIcon(channel)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{channel.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {channel.displayName || channel.typeKey || '채널'}
                                            </div>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* 선택된 채널 표시 */}
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {selectedChannels.map((channel) => (
                        <Badge key={channel.id} variant="secondary" className="flex items-center gap-1">
                            <div className="text-muted-foreground">
                                {getChannelIcon(channel)}
                            </div>
                            <span className="truncate max-w-32">{channel.name}</span>
                            <X 
                                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                onClick={() => handleRemove(channel.id)}
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

            {/* 채널 타입 필터 안내 */}
            {channelTypes && channelTypes.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                    {channelTypes.includes('text') && '텍스트 '}
                    {channelTypes.includes('voice') && '음성 '}
                    {channelTypes.includes('category') && '카테고리 '}
                    채널만 표시됩니다.
                </div>
            )}
        </div>
    );
}