import React, { useId, useState } from 'react';
import { ChannelSelect } from '@/components/ui/channel-select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ContentData } from '@/lib/types';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentProps {
  data: ContentData;
  onChange: (contentId: string, updatedData: Partial<ContentData>) => void;
  onRemove: () => void;
  canRemove: boolean;
  className?: string;
}

const MAX_CHARS = 2000;

export function Content({ data, onChange, onRemove, canRemove, className }: ContentProps) {
  const [isFocused, setIsFocused] = useState(false);
  const contentId = useId();
  const channelLabelId = useId();
  const textareaId = useId();
  
  const handleChannelChange = (channelId: string) => {
    onChange(data.id, { channelId });
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= MAX_CHARS) {
      onChange(data.id, { text });
    }
  };
  
  const contentStyles = {
    container: "p-4 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-all duration-200",
    focused: "ring-2 ring-messagehub-accent/40 dark:ring-messagehub-accent/60",
    header: "flex items-center justify-between mb-3",
    badge: "text-xs font-medium text-white bg-messagehub-accent dark:bg-messagehub-accent px-2 py-1 rounded-full",
    removeButton: "text-zinc-500 dark:text-zinc-400 hover:text-destructive transition-colors ml-auto rounded-full p-1 hover:bg-destructive/10",
    fieldContainer: "space-y-4",
    label: "mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-300",
    counter: "text-xs font-medium",
    counterWarning: "text-destructive",
    counterNormal: "text-zinc-500 dark:text-zinc-400",
    textarea: "resize-none min-h-[120px] w-full rounded-md border bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-messagehub-accent",
    textareaError: "border-destructive ring-destructive focus-visible:ring-destructive"
  };
  
  
  return (
    <div 
      className={cn(
        contentStyles.container,
        isFocused && contentStyles.focused,
        className
      )}
    >
      <div className={contentStyles.header}>
        <div className="flex items-center">
          <span className={contentStyles.badge}>
            출력내용
          </span>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className={contentStyles.removeButton}
            aria-label="Remove content"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <div className={contentStyles.fieldContainer}>
        <div>
          <Label htmlFor={channelLabelId} className={contentStyles.label}>
            출력 채널
          </Label>
          <ChannelSelect
            value={data.channelId ?? ""}
            onChange={handleChannelChange}
            className="w-full"
          />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <Label htmlFor={textareaId} className={contentStyles.label}>
              메시지
            </Label>
            <span className={cn(
              contentStyles.counter,
              data.text.length > MAX_CHARS * 0.9 ? contentStyles.counterWarning : contentStyles.counterNormal
            )}>
              {data.text.length}/{MAX_CHARS}
            </span>
          </div>
          <Textarea
            id={textareaId}
            value={data.text}
            onChange={handleTextChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="여기에 출력할 메시지를 입력하세요."
            className={cn(
              contentStyles.textarea,
              data.text.length > MAX_CHARS && contentStyles.textareaError
            )}
            maxLength={MAX_CHARS}
          />
        </div>
      </div>
    </div>
  );
}
