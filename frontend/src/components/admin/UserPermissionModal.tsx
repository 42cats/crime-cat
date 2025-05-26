import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Loader2,
    Shield,
    UserX,
    Plus,
    Trash2,
    Edit,
    RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { userManagementApi } from "@/api/admin/userManagement";
import { permissionManagementService } from "@/api/admin/permissionManagement";
import type { Permission } from "@/api/admin/permissionManagement";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UserPermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userNickname: string;
}

interface UserPermission {
    permissionId: string;
    permissionName: string;
    expiredDate: string;
    info?: string;
}

const UserPermissionModal: React.FC<UserPermissionModalProps> = ({
    isOpen,
    onClose,
    userId,
    userNickname,
}) => {
    const [selectedPermission, setSelectedPermission] = useState<string>("");
    const [customExpiry, setCustomExpiry] = useState<string>("");
    const [activeTab, setActiveTab] = useState<string>("manage");
    const queryClient = useQueryClient();

    // 사용자 권한 조회
    const { data: userPermissions, isLoading: isLoadingUserPermissions } =
        useQuery({
            queryKey: ["userPermissions", userId],
            queryFn: () => userManagementApi.getUserPermissions(userId),
            enabled: isOpen && !!userId,
        });

    // 전체 권한 목록 조회
    const { data: allPermissions, isLoading: isLoadingAllPermissions } =
        useQuery({
            queryKey: ["allPermissions"],
            queryFn: () => permissionManagementService.getAllPermissions(),
            enabled: isOpen,
        });

    // 권한 부여
    const grantPermissionMutation = useMutation({
        mutationFn: ({
            permissionName,
            expiresAt,
        }: {
            permissionName: string;
            expiresAt?: string;
        }) =>
            userManagementApi.grantPermission(
                userId,
                permissionName,
                expiresAt
            ),
        onSuccess: () => {
            toast.success("권한이 성공적으로 부여되었습니다.");
            queryClient.invalidateQueries({
                queryKey: ["userPermissions", userId],
            });
            setSelectedPermission("");
            setCustomExpiry("");
        },
        onError: () => {
            toast.error("권한 부여에 실패했습니다.");
        },
    });

    // 권한 해제
    const revokePermissionMutation = useMutation({
        mutationFn: (permissionName: string) =>
            userManagementApi.revokePermission(userId, permissionName),
        onSuccess: () => {
            toast.success("권한이 성공적으로 해제되었습니다.");
            queryClient.invalidateQueries({
                queryKey: ["userPermissions", userId],
            });
        },
        onError: () => {
            toast.error("권한 해제에 실패했습니다.");
        },
    });

    const handleGrantPermission = () => {
        if (!selectedPermission) {
            toast.error("권한을 선택해주세요.");
            return;
        }

        grantPermissionMutation.mutate({
            permissionName: selectedPermission,
            expiresAt: customExpiry || undefined,
        });
    };

    const availablePermissions =
        allPermissions?.permissions.filter(
            (permission) =>
                !userPermissions?.some(
                    (up: UserPermission) =>
                        up.permissionName === permission.name
                )
        ) || [];

    const isLoading = isLoadingUserPermissions || isLoadingAllPermissions;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        권한 관리 - {userNickname}
                    </DialogTitle>
                </DialogHeader>

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="flex-1 overflow-hidden flex flex-col"
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manage">
                            사용자 권한 관리
                        </TabsTrigger>
                        <TabsTrigger value="crud">권한 CRUD</TabsTrigger>
                    </TabsList>

                    <TabsContent
                        value="manage"
                        className="flex-1 overflow-auto space-y-4"
                    >
                        {isLoading ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* 현재 권한 목록 */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            현재 보유 권한
                                        </CardTitle>
                                        <CardDescription>
                                            사용자가 현재 보유한 권한
                                            목록입니다.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {userPermissions?.length > 0 ? (
                                            <div className="space-y-2">
                                                {userPermissions.map(
                                                    (
                                                        permission: UserPermission
                                                    ) => (
                                                        <div
                                                            key={
                                                                permission.permissionId
                                                            }
                                                            className="flex items-center justify-between p-3 border rounded-lg"
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <Badge variant="outline">
                                                                    {
                                                                        permission.permissionName
                                                                    }
                                                                </Badge>
                                                                <span className="text-sm text-muted-foreground">
                                                                    만료:{" "}
                                                                    {format(
                                                                        new Date(
                                                                            permission.expiredDate
                                                                        ),
                                                                        "yyyy년 MM월 dd일",
                                                                        {
                                                                            locale: ko,
                                                                        }
                                                                    )}
                                                                </span>
                                                                {permission.info && (
                                                                    <span className="text-sm text-muted-foreground">
                                                                        (
                                                                        {
                                                                            permission.info
                                                                        }
                                                                        )
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    revokePermissionMutation.mutate(
                                                                        permission.permissionName
                                                                    )
                                                                }
                                                                disabled={
                                                                    revokePermissionMutation.isPending
                                                                }
                                                            >
                                                                {revokePermissionMutation.isPending ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <UserX className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-center text-muted-foreground py-4">
                                                보유한 권한이 없습니다.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* 권한 부여 */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            권한 부여
                                        </CardTitle>
                                        <CardDescription>
                                            사용자에게 새로운 권한을 부여합니다.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="permission">
                                                권한 선택
                                            </Label>
                                            <Select
                                                value={selectedPermission}
                                                onValueChange={
                                                    setSelectedPermission
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="부여할 권한을 선택하세요" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availablePermissions.map(
                                                        (permission) => (
                                                            <SelectItem
                                                                key={
                                                                    permission.id
                                                                }
                                                                value={
                                                                    permission.name
                                                                }
                                                            >
                                                                {
                                                                    permission.name
                                                                }{" "}
                                                                -{" "}
                                                                {
                                                                    permission.price
                                                                }
                                                                P (기본{" "}
                                                                {
                                                                    permission.duration
                                                                }
                                                                일)
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="expiry">
                                                만료일 (선택사항)
                                            </Label>
                                            <Input
                                                id="expiry"
                                                type="datetime-local"
                                                value={customExpiry}
                                                onChange={(e) =>
                                                    setCustomExpiry(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="지정하지 않으면 기본 기간이 적용됩니다"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                비워두면 권한의 기본 기간이
                                                적용됩니다.
                                            </p>
                                        </div>

                                        <Button
                                            onClick={handleGrantPermission}
                                            disabled={
                                                !selectedPermission ||
                                                grantPermissionMutation.isPending
                                            }
                                            className="w-full"
                                        >
                                            {grantPermissionMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Plus className="h-4 w-4 mr-2" />
                                            )}
                                            권한 부여
                                        </Button>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="crud" className="flex-1 overflow-auto">
                        <PermissionCrudTab />
                    </TabsContent>
                </Tabs>

                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={onClose}>
                        닫기
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// 권한 CRUD 탭 컴포넌트
const PermissionCrudTab: React.FC = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [editingPermission, setEditingPermission] =
        useState<Permission | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        duration: "28",
        info: "",
    });
    const queryClient = useQueryClient();

    const { data: allPermissions, isLoading } = useQuery({
        queryKey: ["allPermissions"],
        queryFn: () => permissionManagementService.getAllPermissions(),
    });

    const createMutation = useMutation({
        mutationFn: permissionManagementService.createPermission,
        onSuccess: () => {
            toast.success("권한이 생성되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["allPermissions"] });
            setIsCreating(false);
            resetForm();
        },
        onError: () => {
            toast.error("권한 생성에 실패했습니다.");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ name, data }: { name: string; data: any }) =>
            permissionManagementService.updatePermission(name, data),
        onSuccess: () => {
            toast.success("권한이 수정되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["allPermissions"] });
            setEditingPermission(null);
            resetForm();
        },
        onError: () => {
            toast.error("권한 수정에 실패했습니다.");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: permissionManagementService.deletePermission,
        onSuccess: () => {
            toast.success("권한이 삭제되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["allPermissions"] });
        },
        onError: () => {
            toast.error("권한 삭제에 실패했습니다.");
        },
    });

    const resetForm = () => {
        setFormData({
            name: "",
            price: "",
            duration: "28",
            info: "",
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const data = {
            name: formData.name,
            price: parseInt(formData.price),
            duration: parseInt(formData.duration),
            info: formData.info || undefined,
        };

        if (editingPermission) {
            updateMutation.mutate({
                name: editingPermission.name,
                data: {
                    name:
                        formData.name !== editingPermission.name
                            ? formData.name
                            : undefined,
                    price: parseInt(formData.price),
                    duration: parseInt(formData.duration),
                },
            });
        } else {
            createMutation.mutate(data);
        }
    };

    const startEdit = (permission: Permission) => {
        setEditingPermission(permission);
        setFormData({
            name: permission.name,
            price: permission.price.toString(),
            duration: permission.duration.toString(),
            info: permission.info || "",
        });
        setIsCreating(true);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 권한 목록 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                        권한 목록
                        <Button
                            size="sm"
                            onClick={() => {
                                setIsCreating(true);
                                setEditingPermission(null);
                                resetForm();
                            }}
                        >
                            <Plus className="h-4 w-4 mr-1" />새 권한
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {allPermissions?.permissions.map((permission) => (
                            <div
                                key={permission.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div>
                                    <div className="font-medium">
                                        {permission.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {permission.price}P •{" "}
                                        {permission.duration}일
                                        {permission.info &&
                                            ` • ${permission.info}`}
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => startEdit(permission)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                            if (
                                                confirm(
                                                    `"${permission.name}" 권한을 삭제하시겠습니까?`
                                                )
                                            ) {
                                                deleteMutation.mutate(
                                                    permission.name
                                                );
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* 권한 생성/수정 폼 */}
            {isCreating && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            {editingPermission ? "권한 수정" : "새 권한 생성"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">권한명 *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            name: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="price">가격 (포인트) *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    value={formData.price}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            price: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="duration">기간 (일) *</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    min="1"
                                    value={formData.duration}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            duration: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="info">설명</Label>
                                <Input
                                    id="info"
                                    value={formData.info}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            info: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    type="submit"
                                    disabled={
                                        createMutation.isPending ||
                                        updateMutation.isPending
                                    }
                                >
                                    {createMutation.isPending ||
                                    updateMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : editingPermission ? (
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                    ) : (
                                        <Plus className="h-4 w-4 mr-2" />
                                    )}
                                    {editingPermission ? "수정" : "생성"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsCreating(false);
                                        setEditingPermission(null);
                                        resetForm();
                                    }}
                                >
                                    취소
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default UserPermissionModal;
