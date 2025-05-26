import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon, Search } from "lucide-react";
import ThemeSearchModal from "./ThemeSearchModal";
import { Theme } from "@/lib/types";
import { ThemeAdFormData } from "./ThemeAdModal";

interface ThemeAdFormProps {
    formData: ThemeAdFormData;
    setFormData: React.Dispatch<React.SetStateAction<ThemeAdFormData>>;
    isEditing: boolean;
}

const ThemeAdForm: React.FC<ThemeAdFormProps> = ({
    formData,
    setFormData,
    isEditing,
}) => {
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

    const handleThemeSelect = (theme: Theme) => {
        setFormData(prev => ({
            ...prev,
            theme,
            // 테마 타입 자동 설정 (필요시)
        }));
        setIsSearchModalOpen(false);
    };

    const handleDateChange = (field: "startDate" | "endDate", date: Date | undefined) => {
        if (date) {
            setFormData(prev => ({
                ...prev,
                [field]: date,
            }));
        }
    };

    const handleTimeChange = (field: "startDate" | "endDate", time: string) => {
        const [hours, minutes] = time.split(":").map(Number);
        const newDate = new Date(formData[field]);
        newDate.setHours(hours, minutes);
        setFormData(prev => ({
            ...prev,
            [field]: newDate,
        }));
    };

    const themeTypeLabels = {
        CRIMESCENE: "크라임씬",
        ESCAPE_ROOM: "방탈출",
        MURDER_MYSTERY: "머더미스터리",
        REALWORLD: "리얼월드",
    };

    return (
        <div className="space-y-6">
            {/* 테마 선택 */}
            <div className="space-y-2">
                <Label>테마 선택</Label>
                {isEditing ? (
                    <div className="p-4 border rounded-lg bg-muted">
                        <p className="font-medium">{formData.theme?.title || "테마 정보 없음"}</p>
                        {formData.theme?.author && (
                            <p className="text-sm text-muted-foreground">제작: {formData.theme.author}</p>
                        )}
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <div className="flex-1">
                            {formData.theme ? (
                                <div className="p-3 border rounded-lg">
                                    <p className="font-medium">{formData.theme.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        제작: {formData.theme.author}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-3 border rounded-lg text-muted-foreground">
                                    테마를 선택해주세요
                                </div>
                            )}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsSearchModalOpen(true)}
                            disabled={isEditing}
                        >
                            <Search className="h-4 w-4 mr-2" />
                            테마 검색
                        </Button>
                    </div>
                )}
            </div>

            {/* 테마 타입 */}
            <div className="space-y-2">
                <Label>테마 타입</Label>
                <RadioGroup
                    value={formData.themeType}
                    onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, themeType: value as ThemeType }))
                    }
                    disabled={isEditing}
                >
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(themeTypeLabels).map(([value, label]) => (
                            <div key={value} className="flex items-center space-x-2">
                                <RadioGroupItem value={value} id={value} />
                                <Label htmlFor={value} className="font-normal cursor-pointer">
                                    {label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </RadioGroup>
            </div>

            {/* 시작 날짜/시간 */}
            <div className="space-y-2">
                <Label>시작 일시</Label>
                <div className="flex gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "justify-start text-left font-normal flex-1",
                                    !formData.startDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.startDate
                                    ? format(formData.startDate, "yyyy년 MM월 dd일", { locale: ko })
                                    : "날짜 선택"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={formData.startDate}
                                onSelect={(date) => handleDateChange("startDate", date)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Input
                        type="time"
                        value={format(formData.startDate, "HH:mm")}
                        onChange={(e) => handleTimeChange("startDate", e.target.value)}
                        className="w-32"
                    />
                </div>
            </div>

            {/* 종료 날짜/시간 */}
            <div className="space-y-2">
                <Label>종료 일시</Label>
                <div className="flex gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "justify-start text-left font-normal flex-1",
                                    !formData.endDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.endDate
                                    ? format(formData.endDate, "yyyy년 MM월 dd일", { locale: ko })
                                    : "날짜 선택"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={formData.endDate}
                                onSelect={(date) => handleDateChange("endDate", date)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Input
                        type="time"
                        value={format(formData.endDate, "HH:mm")}
                        onChange={(e) => handleTimeChange("endDate", e.target.value)}
                        className="w-32"
                    />
                </div>
            </div>

            {/* 표시 순서 */}
            <div className="space-y-2">
                <Label htmlFor="displayOrder">표시 순서</Label>
                <Input
                    id="displayOrder"
                    type="number"
                    value={formData.displayOrder || ""}
                    onChange={(e) => 
                        setFormData(prev => ({ 
                            ...prev, 
                            displayOrder: e.target.value ? parseInt(e.target.value) : undefined 
                        }))
                    }
                    placeholder="자동 설정"
                />
                <p className="text-sm text-muted-foreground">
                    낮은 숫자가 먼저 표시됩니다. 비워두면 자동으로 설정됩니다.
                </p>
            </div>

            {/* 활성화 상태 (수정 시에만) */}
            {isEditing && (
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="isActive">광고 활성화</Label>
                        <p className="text-sm text-muted-foreground">
                            비활성화하면 기간과 관계없이 표시되지 않습니다.
                        </p>
                    </div>
                    <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => 
                            setFormData(prev => ({ ...prev, isActive: checked }))
                        }
                    />
                </div>
            )}

            {/* 테마 검색 모달 */}
            <ThemeSearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                onSelect={handleThemeSelect}
                selectedThemeType={formData.themeType}
            />
        </div>
    );
};

export default ThemeAdForm;
