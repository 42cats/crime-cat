import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { fetchChannels } from '@/api/messageButtonService';
import { Channel } from '@/lib/types';

interface ChannelSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ChannelSelect({ value, onChange, disabled, className }: ChannelSelectProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | undefined>();
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  console.log("🔄 ChannelSelect Component Rendered");
  console.log("🔎 Initial State -> value:", value);
  
  // Load channels only once when component mounts
  useEffect(() => {
    console.log("📡 useEffect -> Fetching Channels... (initialLoadDone:", initialLoadDone, ")");
    
    const loadChannels = async () => {
      if (!initialLoadDone) {
        setIsLoading(true);
        try {
          const fetchedChannels = await fetchChannels();
          console.log("✅ Channels Fetched:", fetchedChannels);

          // Ensure fetchedChannels is always an array
          const channelsArray = Array.isArray(fetchedChannels) ? fetchedChannels : [];
          setChannels(channelsArray);
          console.log("📌 Channels Set:", channelsArray);

          // Set selected channel if value exists
          if (value) {
            const selected = channelsArray.find(channel => channel.id === value);
            console.log("🎯 Selected Channel Found:", selected);
            setSelectedChannel(selected);
          }
          
          setInitialLoadDone(true);
        } catch (error) {
          console.error("❌ Error loading channels:", error);
          setChannels([]); // Return empty array on error
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadChannels();
  }, [value, initialLoadDone]);

  // Update selected channel when value changes
  useEffect(() => {
    console.log("🔄 useEffect -> Value or Channels Updated", { value, channels });

    if (channels.length > 0 && value) {
      const selected = channels.find(channel => channel.id === value);
      console.log("🎯 Updating Selected Channel:", selected);
      setSelectedChannel(selected);
    }
  }, [value, channels]);

  const handleSelect = (channelId: string) => {
    console.log("🎯 handleSelect Triggered -> Selected Channel ID:", channelId);
    
    const channel = channels.find(ch => ch.id === channelId);
    if (channel) {
      console.log("✅ Channel Found:", channel);
      setSelectedChannel(channel);
      onChange(channel.id);
      setOpen(false);
    } else {
      console.warn("⚠️ Selected channel not found!");
    }
  };

  console.log("channels = ", channels);
  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          {selectedChannel ? selectedChannel.name : "채널을 선택하세요"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
  
      {open && ( // ✅ 조건부 렌더링 시작
        <PopoverContent
          className="w-full p-0"
          align="start"
          onMouseDown={(e) => e.preventDefault()} // ✅ 외부 클릭 닫힘 방지
        >
          <Command>
            {/* 검색 입력 영역 */}
            <div className="p-2 bg-white dark:bg-zinc-800 rounded-t-md shadow-sm">
              <CommandInput
                className="w-full bg-white dark:bg-zinc-800 px-2 py-1 rounded-md"
                placeholder="채널 검색"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
              />
            </div>
  
            {/* 로딩 중 처리 */}
            {isLoading ? (
              <div className="flex items-center justify-center py-6 bg-white dark:bg-zinc-800">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <CommandList className="bg-white dark:bg-zinc-800 rounded-b-md shadow-md">
                <CommandEmpty>채널을 찾을 수 없음</CommandEmpty>
                <CommandGroup className="max-h-60 overflow-y-auto">
                  {(channels ?? []).map((channel) => (
                    <CommandItem key={channel.id} value={channel.id} asChild>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelect(channel.id);
                        }}
                        className="w-full flex items-center"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === channel.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {channel.name}
                      </button>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            )}
          </Command>
        </PopoverContent>
      )} {/* ✅ 조건부 렌더링 끝 */}
    </Popover>
  );
  
}
