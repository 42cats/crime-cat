import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export interface RangeSliderProps {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  label?: string;
  showStars?: boolean;
  className?: string;
  showAllMarks?: boolean;
  customMarks?: number[];
  formatValue?: (value: number) => string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  step,
  value,
  onValueChange,
  label,
  showStars = false,
  className,
  showAllMarks = true,
  customMarks,
  formatValue,
}) => {
  const percentage = {
    min: ((value[0] - min) / (max - min)) * 100,
    max: ((value[1] - min) / (max - min)) * 100,
  };

  const displayValue = (val: number) => {
    if (formatValue) return formatValue(val);
    return val.toString();
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm text-muted-foreground">
            {displayValue(value[0])} - {displayValue(value[1])}
          </span>
        </div>
      )}
      
      <div className="relative pt-6 pb-4">
        {/* Value labels on thumbs */}
        <div
          className="absolute -top-1 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md whitespace-nowrap"
          style={{ left: `${percentage.min}%` }}
        >
          {showStars ? (
            <div className="flex items-center gap-0.5">
              {value[0]} <Star className="w-3 h-3 fill-current" />
            </div>
          ) : (
            displayValue(value[0])
          )}
        </div>
        <div
          className="absolute -top-1 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md whitespace-nowrap"
          style={{ left: `${percentage.max}%` }}
        >
          {showStars ? (
            <div className="flex items-center gap-0.5">
              {value[1]} <Star className="w-3 h-3 fill-current" />
            </div>
          ) : (
            displayValue(value[1])
          )}
        </div>

        <SliderPrimitive.Root
          className="relative flex w-full touch-none select-none items-center"
          value={value}
          onValueChange={onValueChange}
          min={min}
          max={max}
          step={step}
        >
          <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
            <SliderPrimitive.Range className="absolute h-full bg-primary" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background shadow-md ring-offset-background transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background shadow-md ring-offset-background transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
        </SliderPrimitive.Root>

        {/* Scale marks */}
        <div className="absolute w-full flex justify-between -bottom-1">
          {(customMarks || (showAllMarks ? Array.from({ length: max - min + 1 }, (_, i) => min + i) : [min, max])).map((val) => (
            <div
              key={val}
              className="flex flex-col items-center"
              style={{ position: 'absolute', left: `${((val - min) / (max - min)) * 100}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-0.5 h-2 bg-muted-foreground/30" />
              <span className="text-xs text-muted-foreground mt-1">
                {showStars ? (
                  <div className="flex items-center gap-0.5">
                    {val}
                    <Star className="w-2.5 h-2.5" />
                  </div>
                ) : (
                  displayValue(val)
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
