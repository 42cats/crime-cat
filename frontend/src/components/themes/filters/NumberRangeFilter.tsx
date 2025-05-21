import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NumberRangeFilterProps {
  label: string;
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  unit?: string;
}

const NumberRangeFilter: React.FC<NumberRangeFilterProps> = ({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minPlaceholder = "최소",
  maxPlaceholder = "최대",
  unit,
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Input
            type="number"
            value={minValue}
            onChange={(e) => onMinChange(e.target.value)}
            placeholder={minPlaceholder}
            className="h-10"
          />
          {unit && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
              {unit}
            </div>
          )}
        </div>
        <span className="text-muted-foreground">~</span>
        <div className="relative flex-1">
          <Input
            type="number"
            value={maxValue}
            onChange={(e) => onMaxChange(e.target.value)}
            placeholder={maxPlaceholder}
            className="h-10"
          />
          {unit && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
              {unit}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NumberRangeFilter;
