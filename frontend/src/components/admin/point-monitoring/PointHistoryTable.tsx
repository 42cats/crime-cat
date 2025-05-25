import React, { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight, Search, User } from "lucide-react";
import { AdminPointHistory, PointHistoryFilterParams } from "@/api/admin";
import { PageResponse, TransactionType } from "@/types/pointHistory";
import { UserPointModal } from "./UserPointModal";
import { cn } from "@/lib/utils";

interface PointHistoryTableProps {
    data?: PageResponse<AdminPointHistory>;
    isLoading: boolean;
    filters: PointHistoryFilterParams;
    onFilterChange: (filters: Partial<PointHistoryFilterParams>) => void;
    onPageChange: (page: number) => void;
}

const transactionTypeMap: Record<TransactionType, { label: string; color: string }> = {
    CHARGE: { label: "충전", color: "bg-blue-500" },
    USE: { label: "사용", color: "bg-red-500" },
    GIFT: { label: "선물", color: "bg-purple-500" },
    RECEIVE: { label: "받기", color: "bg-green-500" },
    REFUND: { label: "환불", color: "bg-yellow-500" },
    EXPIRE: { label: "만료", color: "bg-gray-500" },
    COUPON: { label: "쿠폰", color: "bg-indigo-500" },
    DAILY: { label: "출석", color: "bg-teal-500" },
    THEME_REWARD: { label: "테마보상", color: "bg-pink-500" },
};

export const PointHistoryTable: React.FC<PointHistoryTableProps> = ({
    data,
    isLoading,
    filters,
    onFilterChange,
    onPageChange,
}) => {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<{
        from: Date | undefined;
        to: Date | undefined;
    }>({
        from: undefined,
        to: undefined,
    });

    const handleDateRangeChange = () => {
        if (dateRange.from && dateRange.to) {
            onFilterChange({
                startDate: dateRange.from.toISOString(),
                endDate: dateRange.to.toISOString(),
            });
        }
    };

    const clearFilters = () => {
        onFilterChange({
            type: undefined,
            userId: undefined,
            startDate: undefined,
            endDate: undefined,
            minAmount: undefined,
            maxAmount: undefined,
        });
        setDateRange({ from: undefined, to: undefined });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>포인트 거래 내역</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* 필터 영역 */}
                    <div className="space-y-4 mb-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {/* 거래 타입 필터 */}
                            <div className="space-y-2">
                                <Label>거래 타입</Label>
                                <Select
                                    value={filters.type || "all"}
                                    onValueChange={(value) =>
                                        onFilterChange({
                                            type: value === "all" ? undefined : (value as TransactionType),
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="전체" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">전체</SelectItem>
                                        {Object.entries(transactionTypeMap).map(([key, value]) => (
                                            <SelectItem key={key} value={key}>
                                                {value.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 날짜 범위 필터 */}
                            <div className="space-y-2">
                                <Label>기간</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !dateRange.from && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange.from ? (
                                                dateRange.to ? (
                                                    <>
                                                        {format(dateRange.from, "yyyy-MM-dd")} -{" "}
                                                        {format(dateRange.to, "yyyy-MM-dd")}
                                                    </>
                                                ) : (
                                                    format(dateRange.from, "yyyy-MM-dd")
                                                )
                                            ) : (
                                                "날짜 선택"
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={dateRange.from}
                                            selected={dateRange}
                                            onSelect={setDateRange}
                                            numberOfMonths={2}
                                            locale={ko}
                                        />
                                        <div className="p-3 border-t">
                                            <Button
                                                size="sm"
                                                onClick={handleDateRangeChange}
                                                disabled={!dateRange.from || !dateRange.to}
                                            >
                                                적용
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* 금액 범위 필터 */}
                            <div className="space-y-2">
                                <Label>최소 금액</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={filters.minAmount || ""}
                                    onChange={(e) =>
                                        onFilterChange({
                                            minAmount: e.target.value ? parseInt(e.target.value) : undefined,
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>최대 금액</Label>
                                <Input
                                    type="number"
                                    placeholder="999999"
                                    value={filters.maxAmount || ""}
                                    onChange={(e) =>
                                        onFilterChange({
                                            maxAmount: e.target.value ? parseInt(e.target.value) : undefined,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button variant="outline" onClick={clearFilters}>
                                필터 초기화
                            </Button>
                        </div>
                    </div>

                    {/* 테이블 */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>사용자</TableHead>
                                    <TableHead>거래 타입</TableHead>
                                    <TableHead className="text-right">금액</TableHead>
                                    <TableHead className="text-right">잔액</TableHead>
                                    <TableHead>관련 사용자</TableHead>
                                    <TableHead>메모</TableHead>
                                    <TableHead>거래 시간</TableHead>
                                    <TableHead className="text-center">액션</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 10 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <Skeleton className="h-8 w-24" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-6 w-16" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-6 w-20" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-6 w-20" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-6 w-24" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-6 w-32" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-6 w-28" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-8 w-20" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : data?.content.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <p className="text-muted-foreground">
                                                조건에 맞는 거래 내역이 없습니다.
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data?.content.map((history) => (
                                        <TableRow key={history.id}>
                                            <TableCell>
                                                <div className="font-medium">{history.userNickname}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {history.userId.substring(0, 8)}...
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={cn(
                                                        "text-white",
                                                        transactionTypeMap[history.type].color
                                                    )}
                                                >
                                                    {transactionTypeMap[history.type].label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {history.amount.toLocaleString()}P
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {history.balanceAfter.toLocaleString()}P
                                            </TableCell>
                                            <TableCell>
                                                {history.relatedNickname || "-"}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {history.memo || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {format(
                                                    new Date(history.usedAt),
                                                    "yyyy-MM-dd HH:mm",
                                                    { locale: ko }
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedUserId(history.userId)}
                                                >
                                                    <User className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* 페이지네이션 */}
                    {data && data.totalPages > 0 && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                총 {data.totalElements.toLocaleString()}개 중{" "}
                                {data.pageable.offset + 1} -{" "}
                                {Math.min(
                                    data.pageable.offset + data.pageable.pageSize,
                                    data.totalElements
                                )}
                                개 표시
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPageChange(filters.page! - 1)}
                                    disabled={data.first}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    이전
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                                        const pageNumber = Math.max(
                                            0,
                                            Math.min(
                                                data.pageable.pageNumber - 2 + i,
                                                data.totalPages - 1
                                            )
                                        );
                                        return (
                                            <Button
                                                key={pageNumber}
                                                variant={
                                                    pageNumber === data.pageable.pageNumber
                                                        ? "default"
                                                        : "outline"
                                                }
                                                size="sm"
                                                onClick={() => onPageChange(pageNumber)}
                                            >
                                                {pageNumber + 1}
                                            </Button>
                                        );
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPageChange(filters.page! + 1)}
                                    disabled={data.last}
                                >
                                    다음
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 사용자 상세 모달 */}
            {selectedUserId && (
                <UserPointModal
                    userId={selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                />
            )}
        </>
    );
};
