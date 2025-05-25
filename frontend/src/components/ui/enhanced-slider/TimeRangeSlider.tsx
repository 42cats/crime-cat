import * as React from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { RangeSlider } from "./RangeSlider";
import { Input } from "@/components/ui/input";

export interface TimeRangeSliderProps {
  min: number;
  max: number;
  value: [number | undefined, number | undefined];
  onValueChange: (value: [number | undefined, number | undefined]) => void;
  label?: string;
  className?: string;
}

// 분을 시간과 분으로 변환하는 함수
const formatMinutes = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}분`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
};

export const TimeRangeSlider: React.FC<TimeRangeSliderProps> = ({
  min,
  max,
  value,
  onValueChange,
  label = "클리어 시간",
  className,
}) => {
  const [localValue, setLocalValue] = React.useState<[number, number]>([
    value[0] ?? min,
    value[1] ?? max,
  ]);

  React.useEffect(() => {
    setLocalValue([value[0] ?? min, value[1] ?? max]);
  }, [value, min, max]);

  const handleSliderChange = (newValue: [number, number]) => {
    setLocalValue(newValue);
    onValueChange([
      newValue[0] === min ? undefined : newValue[0],
      newValue[1] === max ? undefined : newValue[1],
    ]);
  };

  const handleInputChange = (index: 0 | 1, inputValue: string) => {
    const numValue = inputValue ? Number(inputValue) : undefined;
    const newValue: [number | undefined, number | undefined] = [...value];
    newValue[index] = numValue;
    
    if (numValue !== undefined) {
      const clampedValue = Math.min(Math.max(numValue, min), max);
      const newLocalValue: [number, number] = [...localValue];
      newLocalValue[index] = clampedValue;
      setLocalValue(newLocalValue);
    }
    
    onValueChange(newValue);
  };

  // 시간 마커를 위한 커스텀 마크
  const timeMarks = [0, 30, 60, 90, 120, 180, 240, 300, 360, 420, 480, 540, 600].filter(
    mark => mark >= min && mark <= max
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>

      {/* Slider */}
      <div className="px-3">
        <RangeSlider
          min={min}
          max={max}
          step={10}
          value={localValue}
          onValueChange={handleSliderChange}
          showStars={false}
          showAllMarks={false}
          customMarks={timeMarks}
          formatValue={formatMinutes}
        />
      </div>

      {/* Input fields */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder={`최소 ${min}분`}
          value={value[0] ?? ""}
          onChange={(e) => handleInputChange(0, e.target.value)}
          className="w-28 text-center"
          min={min}
          max={max}
        />
        <span className="text-muted-foreground">~</span>
        <Input
          type="number"
          placeholder={`최대 ${max}분`}
          value={value[1] ?? ""}
          onChange={(e) => handleInputChange(1, e.target.value)}
          className="w-28 text-center"
          min={min}
          max={max}
        />
        <span className="text-xs text-muted-foreground ml-2">분</span>
      </div>

      {/* Quick select buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onValueChange([undefined, 30])}
          className={cn(
            "px-3 py-1 text-xs rounded-full border transition-colors",
            value[0] === undefined && value[1] === 30
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-muted border-border"
          )}
        >
          30분 이내
        </button>
        <button
          onClick={() => onValueChange([30, 60])}
          className={cn(
            "px-3 py-1 text-xs rounded-full border transition-colors",
            value[0] === 30 && value[1] === 60
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-muted border-border"
          )}
        >
          30분-1시간
        </button>
        <button
          onClick={() => onValueChange([60, 120])}
          className={cn(
            "px-3 py-1 text-xs rounded-full border transition-colors",
            value[0] === 60 && value[1] === 120
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-muted border-border"
          )}
        >
          1-2시간
        </button>
        <button
          onClick={() => onValueChange([120, 180])}
          className={cn(
            "px-3 py-1 text-xs rounded-full border transition-colors",
            value[0] === 120 && value[1] === 180
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-muted border-border"
          )}
        >
          2-3시간
        </button>
        <button
          onClick={() => onValueChange([180, undefined])}
          className={cn(
            "px-3 py-1 text-xs rounded-full border transition-colors",
            value[0] === 180 && value[1] === undefined
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-muted border-border"
          )}
        >
          3시간 이상
        </button>
      </div>
    </div>
  );
};
