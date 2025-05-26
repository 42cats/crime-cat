import React, { useState, useEffect } from "react";
import { adminApi } from "@/api/admin";
import { UserRole } from "@/types/user";
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
import { ShieldCheck, AlertCircle, CheckCircle, Ban, Clock, Shield, Key } from "lucide-react";
import BlockUserModal from "@/components/admin/BlockUserModal";
import UserPermissionModal from "@/components/admin/UserPermissionModal";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const UserRoleManagementPage: React.FC = () => {
    const { toast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [blockModalOpen, setBlockModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [blockLoading, setBlockLoading] = useState(false);
    const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
    const [userToUnblock, setUserToUnblock] = useState<any>(null);
    const [permissionModalOpen, setPermissionModalOpen] = useState(false);
    const [selectedUserForPermission, setSelectedUserForPermission] = useState<any>(null);

    // 사용자 목록 가져오기
    const fetchUsers = async (page = 0) => {
        try {
            setLoading(true);
            const response = await adminApi.userManagement.getAllUsers({
                page,
                size: 10,
                sort: ["createdAt,desc"],
            });
            setUsers(response.content);
            setTotalPages(response.totalPages);
            setCurrentPage(response.number);
        } catch (error) {
            console.error("사용자 목록을 불러오는 중 오류가 발생했습니다:", error);
            toast({
                title: "오류",
                description: "사용자 목록을 불러오는 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // 사용자 역할 변경
    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        try {
            await adminApi.userManagement.changeUserRole(userId, newRole);
            toast({
                title: "성공",
                description: "사용자 역할이 변경되었습니다.",
            });
            fetchUsers(currentPage);
        } catch (error) {
            console.error("사용자 역할 변경 중 오류가 발생했습니다:", error);
            toast({
                title: "오류",
                description: "사용자 역할 변경 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    // 사용자 차단 모달 열기
    const handleBlockUser = (user: any) => {
        setSelectedUser(user);
        setBlockModalOpen(true);
    };

    // 사용자 차단 실행
    const handleConfirmBlock = async (reason: string, expiresAt?: string) => {
        if (!selectedUser) return;
        
        try {
            setBlockLoading(true);
            await adminApi.userManagement.blockUserWithReason(
                selectedUser.id,
                reason,
                expiresAt
            );
            toast({
                title: "성공",
                description: "사용자가 차단되었습니다.",
            });
            setBlockModalOpen(false);
            setSelectedUser(null);
            fetchUsers(currentPage);
        } catch (error) {
            console.error("사용자 차단 중 오류가 발생했습니다:", error);
            toast({
                title: "오류",
                description: "사용자 차단 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setBlockLoading(false);
        }
    };

    // 차단 해제 다이얼로그 열기
    const handleUnblockDialogOpen = (user: any) => {
        setUserToUnblock(user);
        setUnblockDialogOpen(true);
    };
    
    // 권한 관리 모달 열기
    const handleOpenPermissionModal = (user: any) => {
        setSelectedUserForPermission(user);
        setPermissionModalOpen(true);
    };
    
    // 사용자 차단 해제 확인
    const handleConfirmUnblock = async () => {
        if (!userToUnblock) return;
        
        try {
            await adminApi.userManagement.unblockUser(userToUnblock.id);
            toast({
                title: "성공",
                description: `${userToUnblock.nickname} 사용자의 차단이 해제되었습니다.`,
            });
            fetchUsers(currentPage);
            setUnblockDialogOpen(false);
            setUserToUnblock(null);
        } catch (error) {
            console.error("사용자 차단 해제 중 오류가 발생했습니다:", error);
            toast({
                title: "오류",
                description: "사용자 차단 해제 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    // 차단 정보 포매팅
    const formatBlockInfo = (user: any) => {
        if (!user.blocked) return null;
        
        const blockReason = user.blockReason || "사유 없음";
        const isExpired = user.blockExpiresAt && new Date(user.blockExpiresAt) < new Date();
        
        if (isExpired) {
            return {
                status: "만료",
                reason: blockReason,
                color: "text-yellow-600",
                icon: Clock
            };
        }
        
        if (user.blockExpiresAt) {
            const expiresAt = new Date(user.blockExpiresAt);
            return {
                status: `${expiresAt.toLocaleDateString()} 까지`,
                reason: blockReason,
                color: "text-orange-600",
                icon: Clock
            };
        }
        
        return {
            status: "영구 차단",
            reason: blockReason,
            color: "text-red-600",
            icon: Shield
        };
    };

    // 포인트 지급
    const handleAddPoints = async (userId: string, amount: number) => {
        try {
            await adminApi.userManagement.addUserPoints(userId, amount, "관리자 직접 지급");
            toast({
                title: "성공",
                description: `${amount} 포인트가 지급되었습니다.`,
            });
        } catch (error) {
            console.error("포인트 지급 중 오류가 발생했습니다:", error);
            toast({
                title: "오류",
                description: "포인트 지급 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        }
    };

    // 검색 처리
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // 실제 검색 구현 (백엔드 API가 검색을 지원해야 함)
        fetchUsers(0);
    };

    // 초기 데이터 로드
    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center">
                    <ShieldCheck className="mr-2 h-6 w-6 text-primary" />
                    사용자 권한 관리
                </h1>

                {/* 검색 폼 */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        type="text"
                        placeholder="닉네임 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64"
                    />
                    <Button type="submit">검색</Button>
                </form>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>이름</TableHead>
                                    <TableHead>이메일</TableHead>
                                    <TableHead>현재 역할</TableHead>
                                    <TableHead>역할 변경</TableHead>
                                    <TableHead className="w-80">차단 상태 및 관리</TableHead>
                                    <TableHead>포인트 지급</TableHead>
                                    <TableHead>가입일</TableHead>
                                    <TableHead>권한 관리</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            {user.nickname}
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                user.role === UserRole.ADMIN
                                                    ? "bg-primary/20 text-primary"
                                                    : user.role === UserRole.MANAGER
                                                    ? "bg-blue-500/20 text-blue-500"
                                                    : user.role === UserRole.CREATOR
                                                    ? "bg-purple-500/20 text-purple-500"
                                                    : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                            }`}>
                                                {user.role}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                onValueChange={(value) =>
                                                    handleRoleChange(
                                                        user.id,
                                                        value as UserRole
                                                    )
                                                }
                                                defaultValue={user.role}
                                            >
                                                <SelectTrigger className="w-32">
                                                    <SelectValue placeholder="역할 선택" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={UserRole.USER}>
                                                        {UserRole.USER}
                                                    </SelectItem>
                                                    <SelectItem value={UserRole.CREATOR}>
                                                        {UserRole.CREATOR}
                                                    </SelectItem>
                                                    <SelectItem value={UserRole.MANAGER}>
                                                        {UserRole.MANAGER}
                                                    </SelectItem>
                                                    <SelectItem value={UserRole.ADMIN}>
                                                        {UserRole.ADMIN}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-2">
                                                {user.blocked ? (
                                                    <>
                                                        {/* 차단 상태 정보 */}
                                                        <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-md border border-red-200 dark:border-red-800">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                {(() => {
                                                                    const blockInfo = formatBlockInfo(user);
                                                                    if (!blockInfo) return null;
                                                                    const IconComponent = blockInfo.icon;
                                                                    return (
                                                                        <div className={`flex items-center text-xs font-medium ${blockInfo.color}`}>
                                                                            <IconComponent className="h-3 w-3 mr-1" />
                                                                            <span>{blockInfo.status}</span>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                            {user.blockReason && (
                                                                <div className="text-xs text-gray-700 dark:text-gray-300 mb-2" title={user.blockReason}>
                                                                    <span className="font-medium">사유:</span> {user.blockReason.length > 30 ? user.blockReason.substring(0, 30) + '...' : user.blockReason}
                                                                </div>
                                                            )}
                                                            {user.blockedAt && (
                                                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                                                    <span className="font-medium">차단일:</span> {new Date(user.blockedAt).toLocaleDateString()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* 차단 해제 버튼 */}
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleUnblockDialogOpen(user)}
                                                                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                                차단 해제
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    alert(`차단 정보:\n\n사유: ${user.blockReason || '사유 없음'}\n차단일: ${user.blockedAt ? new Date(user.blockedAt).toLocaleString() : '정보 없음'}\n만료일: ${user.blockExpiresAt ? new Date(user.blockExpiresAt).toLocaleString() : '영구 차단'}`);
                                                                }}
                                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                                            >
                                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                                상세보기
                                                            </Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-md border">
                                                        <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-2 flex items-center">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            정상 상태
                                                        </div>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleBlockUser(user)}
                                                            className="w-full"
                                                        >
                                                            <Ban className="h-4 w-4 mr-1" />
                                                            차단하기
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAddPoints(user.id, 100)}
                                                >
                                                    +100
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAddPoints(user.id, 1000)}
                                                >
                                                    +1000
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleOpenPermissionModal(user)}
                                                className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400"
                                            >
                                                <Key className="h-4 w-4 mr-1" />
                                                권한 관리
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* 페이지네이션 */}
                    <Pagination className="mt-4">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => fetchUsers(currentPage - 1)}
                                    disabled={currentPage === 0}
                                />
                            </PaginationItem>
                            
                            {Array.from({ length: totalPages }).map((_, index) => (
                                <PaginationItem key={index}>
                                    <PaginationLink
                                        isActive={currentPage === index}
                                        onClick={() => fetchUsers(index)}
                                    >
                                        {index + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => fetchUsers(currentPage + 1)}
                                    disabled={currentPage === totalPages - 1}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </>
            )}
            
            <BlockUserModal
                isOpen={blockModalOpen}
                onClose={() => {
                    setBlockModalOpen(false);
                    setSelectedUser(null);
                }}
                onConfirm={handleConfirmBlock}
                userNickname={selectedUser?.nickname || ""}
                loading={blockLoading}
            />
            
            {/* 차단 해제 확인 다이얼로그 */}
            <AlertDialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center text-green-600">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            차단 해제 확인
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            {userToUnblock && (
                                <>
                                    <p>
                                        <strong>{userToUnblock.nickname}</strong> 사용자의 차단을 해제하시겠습니까?
                                    </p>
                                    {userToUnblock.blockReason && (
                                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                                            <p className="text-sm">
                                                <span className="font-medium">현재 차단 사유:</span> {userToUnblock.blockReason}
                                            </p>
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        차단 해제 후 해당 사용자는 즉시 서비스를 이용할 수 있습니다.
                                    </p>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setUnblockDialogOpen(false);
                            setUserToUnblock(null);
                        }}>
                            취소
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmUnblock}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            차단 해제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <UserPermissionModal
                isOpen={permissionModalOpen}
                onClose={() => {
                    setPermissionModalOpen(false);
                    setSelectedUserForPermission(null);
                }}
                userId={selectedUserForPermission?.id || ""}
                userNickname={selectedUserForPermission?.nickname || ""}
            />
        </div>
    );
};

export default UserRoleManagementPage;
