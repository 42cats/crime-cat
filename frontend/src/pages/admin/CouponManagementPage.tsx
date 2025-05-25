import React, { useState, useEffect } from "react";
import { couponManagementApi } from "@/api/admin/couponManagement";
import { useToast } from "@/hooks/useToast";
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
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Gift,
    Plus,
    Search,
    Users,
    DollarSign,
    Clock,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Types
interface AdminCouponResponse {
    id: string;
    code?: string;
    value: number;
    point?: number;
    duration?: number;
    count?: number;
    used: boolean;
    status: string;
    userName?: string;
    usedAt?: string;
    createdAt: string;
    expiredAt?: string;
    expired?: string;
}

interface CouponStatsResponse {
    totalCoupons: number;
    usedCoupons: number;
    unusedCoupons: number;
    expiredCoupons: number;
    usageRate: number;
    expiredRate: number;
    totalPointsIssued: number;
    totalPointsUsed: number;
}

interface CouponCreateRequest {
    value: number;
    duration: number;
    count: number;
}

const CouponManagementPage: React.FC = () => {
    const { toast } = useToast();
    const [coupons, setCoupons] = useState<AdminCouponResponse[]>([]);
    const [stats, setStats] = useState<CouponStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchCode, setSearchCode] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CouponCreateRequest>({
        value: 100,
        duration: 30,
        count: 1,
    });
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const loadCoupons = async () => {
        try {
            setLoading(true);
            const response = await couponManagementApi.getCoupons({
                page: currentPage,
                size: 20,
                code: searchCode || undefined,
                status: statusFilter === "ALL" ? undefined : statusFilter,
            });
            setCoupons(response.content);
            setTotalPages(response.totalPages);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "쿠폰 목록 로딩 실패",
                description: "쿠폰 목록을 불러오는데 실패했습니다.",
            });
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await couponManagementApi.getCouponStats();
            setStats(response);
        } catch (error) {
            console.error("Failed to load coupon stats:", error);
        }
    };

    useEffect(() => {
        loadCoupons();
        loadStats();
    }, [currentPage, statusFilter]);

    // 1분마다 자동 새로고침 (남은 시간 업데이트용)
    useEffect(() => {
        const interval = setInterval(() => {
            // 강제로 컴포넌트 리렌더링을 위해 refreshTrigger 업데이트
            setRefreshTrigger(prev => prev + 1);
        }, 60000); // 1분마다

        return () => clearInterval(interval);
    }, []);

    const handleSearch = () => {
        setCurrentPage(0);
        loadCoupons();
    };

    const handleCreateCoupon = async () => {
        try {
            await couponManagementApi.createCoupon(createForm);
            toast({
                title: "쿠폰 생성 완료",
                description: `${createForm.count}개의 쿠폰이 생성되었습니다.`,
            });
            setCreateModalOpen(false);
            setCreateForm({ value: 100, duration: 30, count: 1 });
            loadCoupons();
            loadStats();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "쿠폰 생성 실패",
                description: "쿠폰 생성에 실패했습니다.",
            });
        }
    };

    const getStatusBadge = (status: string, used: boolean) => {
        if (used) {
            return (
                <Badge variant="secondary">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    사용됨
                </Badge>
            );
        }

        switch (status) {
            case "ACTIVE":
                return (
                    <Badge variant="default">
                        <Clock className="w-3 h-3 mr-1" />
                        활성
                    </Badge>
                );
            case "EXPIRED":
                return (
                    <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        만료
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "-";
        
        // ISO 문자열이나 타임스탬프를 Date 객체로 변환
        const date = new Date(dateString);
        
        // 유효한 날짜인지 확인
        if (isNaN(date.getTime())) {
            return "유효하지 않은 날짜";
        }
        
        return date.toLocaleString("ko-KR", {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getTimeRemaining = (expiredAt: string | undefined) => {
        if (!expiredAt) return "-";
        
        const expiredDate = new Date(expiredAt);
        if (isNaN(expiredDate.getTime())) return "-";
        
        const now = new Date();
        const diffMs = expiredDate.getTime() - now.getTime();
        
        if (diffMs <= 0) {
            return <span className="text-red-500 font-medium">만료됨</span>;
        }
        
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffDays > 0) {
            return <span className="text-green-500 font-medium">{diffDays}일 남음</span>;
        } else if (diffHours > 0) {
            return <span className="text-yellow-500 font-medium">{diffHours}시간 남음</span>;
        } else if (diffMinutes > 0) {
            return <span className="text-orange-500 font-medium">{diffMinutes}분 남음</span>;
        } else {
            return <span className="text-red-500 font-medium">곧 만료</span>;
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Gift className="w-8 h-8" />
                    쿠폰 관리
                </h1>
                <Dialog
                    open={createModalOpen}
                    onOpenChange={setCreateModalOpen}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            쿠폰 생성
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>새 쿠폰 생성</DialogTitle>
                            <DialogDescription>
                                새로운 쿠폰을 생성합니다. 설정한 개수만큼 쿠폰이
                                생성됩니다.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="value">포인트 값</Label>
                                <Input
                                    id="value"
                                    type="number"
                                    min="1"
                                    value={createForm.value}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            value:
                                                parseInt(e.target.value) || 0,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="duration">유효기간 (일)</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    min="1"
                                    value={createForm.duration}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            duration:
                                                parseInt(e.target.value) || 0,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="count">생성 개수</Label>
                                <Input
                                    id="count"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={createForm.count}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            count:
                                                parseInt(e.target.value) || 0,
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setCreateModalOpen(false)}
                            >
                                취소
                            </Button>
                            <Button onClick={handleCreateCoupon}>생성</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* 통계 카드 */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                전체 쿠폰
                            </CardTitle>
                            <Gift className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.totalCoupons || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                사용된 쿠폰
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.usedCoupons || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                총 포인트 값
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(
                                    stats.totalPointsIssued || 0
                                ).toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                사용률
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {Math.round(stats.usageRate || 0)}%
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* 검색 및 필터 */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="쿠폰 코드 검색..."
                                    value={searchCode}
                                    onChange={(e) =>
                                        setSearchCode(e.target.value)
                                    }
                                    onKeyPress={(e) =>
                                        e.key === "Enter" && handleSearch()
                                    }
                                />
                                <Button onClick={handleSearch}>
                                    <Search className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">전체 상태</SelectItem>
                                <SelectItem value="ACTIVE">활성</SelectItem>
                                <SelectItem value="USED">사용됨</SelectItem>
                                <SelectItem value="EXPIRED">만료됨</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* 쿠폰 테이블 */}
            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="text-center py-8">로딩 중...</div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>쿠폰 코드</TableHead>
                                        <TableHead>포인트 값</TableHead>
                                        <TableHead>상태</TableHead>
                                        <TableHead>사용자</TableHead>
                                        <TableHead>사용일시</TableHead>
                                        <TableHead>생성일시</TableHead>
                                        <TableHead>만료일시</TableHead>
                                        <TableHead>남은 시간</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {coupons.map((coupon) => (
                                        <TableRow key={coupon.id}>
                                            <TableCell className="font-mono text-sm">
                                                {coupon.code || coupon.id}
                                            </TableCell>
                                            <TableCell>
                                                {(
                                                    coupon.value || 0
                                                ).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(
                                                    coupon.status,
                                                    coupon.used
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {coupon.userName || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {coupon.usedAt
                                                    ? formatDate(coupon.usedAt)
                                                    : "-"}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(coupon.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(coupon.expiredAt || coupon.expired)}
                                            </TableCell>
                                            <TableCell>
                                                {coupon.used ? 
                                                    <span className="text-gray-500">사용됨</span> : 
                                                    getTimeRemaining(coupon.expiredAt || coupon.expired)
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* 페이지네이션 */}
                            {totalPages > 1 && (
                                <div className="flex justify-center mt-6">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() =>
                                                        setCurrentPage(
                                                            Math.max(
                                                                0,
                                                                currentPage - 1
                                                            )
                                                        )
                                                    }
                                                    className={
                                                        currentPage === 0
                                                            ? "pointer-events-none opacity-50"
                                                            : ""
                                                    }
                                                />
                                            </PaginationItem>
                                            {Array.from(
                                                {
                                                    length: Math.min(
                                                        5,
                                                        totalPages
                                                    ),
                                                },
                                                (_, i) => {
                                                    const pageNum =
                                                        i +
                                                        Math.max(
                                                            0,
                                                            currentPage - 2
                                                        );
                                                    if (pageNum >= totalPages)
                                                        return null;
                                                    return (
                                                        <PaginationItem
                                                            key={pageNum}
                                                        >
                                                            <PaginationLink
                                                                onClick={() =>
                                                                    setCurrentPage(
                                                                        pageNum
                                                                    )
                                                                }
                                                                isActive={
                                                                    pageNum ===
                                                                    currentPage
                                                                }
                                                            >
                                                                {pageNum + 1}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    );
                                                }
                                            )}
                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() =>
                                                        setCurrentPage(
                                                            Math.min(
                                                                totalPages - 1,
                                                                currentPage + 1
                                                            )
                                                        )
                                                    }
                                                    className={
                                                        currentPage ===
                                                        totalPages - 1
                                                            ? "pointer-events-none opacity-50"
                                                            : ""
                                                    }
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default CouponManagementPage;
