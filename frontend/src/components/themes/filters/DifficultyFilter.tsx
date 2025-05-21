import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";

interface DifficultyFilterProps {
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}

const DifficultyFilter: React.FC<DifficultyFilterProps> = ({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}) => {
  const [minStar, setMinStar] = useState<number>(minValue ? parseInt(minValue) : 0);
  const [maxStar, setMaxStar] = useState<number>(maxValue ? parseInt(maxValue) : 0);

  useEffect(() => {
    setMinStar(minValue ? parseInt(minValue) : 0);
  }, [minValue]);

  useEffect(() => {
    setMaxStar(maxValue ? parseInt(maxValue) : 0);
  }, [maxValue]);

  const handleMinStarClick = (value: number) => {
    const newValue = minStar === value ? 0 : value;
    setMinStar(newValue);
    onMinChange(newValue === 0 ? "" : newValue.toString());
    
    // 최소값이 최대값보다 크면 최대값도 조정
    if (newValue > maxStar && maxStar !== 0) {
      setMaxStar(newValue);
      onMaxChange(newValue.toString());
    }
  };

  const handleMaxStarClick = (value: number) => {
    const newValue = maxStar === value ? 0 : value;
    setMaxStar(newValue);
    onMaxChange(newValue === 0 ? "" : newValue.toString());
    
    // 최대값이 최소값보다 작으면 최소값도 조정
    if (newValue < minStar && newValue !== 0) {
      setMinStar(newValue);
      onMinChange(newValue.toString());
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">난이도</Label>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <span className="text-sm w-20 text-muted-foreground">최소 난이도:</span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={`min-${value}`}
                type="button"
                onClick={() => handleMinStarClick(value)}
                className="p-1 focus:outline-none"
              >
                <Star
                  className={`h-6 w-6 ${
                    value <= minStar
                      ? "text-yellow-500 fill-current"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center">
          <span className="text-sm w-20 text-muted-foreground">최대 난이도:</span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={`max-${value}`}
                type="button"
                onClick={() => handleMaxStarClick(value)}
                className="p-1 focus:outline-none"
              >
                <Star
                  className={`h-6 w-6 ${
                    value <= maxStar
                      ? "text-yellow-500 fill-current"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DifficultyFilter;
