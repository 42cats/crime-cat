import React from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserGrantedPermissionDto {
    permissionId: string;
    permissionName: string;
    expiredDate: string;
}

interface Props {
    permissions: UserGrantedPermissionDto[];
}

export const UserPermissionCard: React.FC<Props> = ({ permissions }) => {
    return (
        <Card className="w-full max-w-2xl space-y-6">
            <CardHeader>
                <CardTitle>🛡️ 내 권한</CardTitle>
                <CardDescription>보유 중인 권한 목록입니다.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {permissions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {permissions.map((permission) => (
                            <div
                                key={permission.permissionId}
                                className="space-y-1"
                            >
                                <div className="flex items-center gap-2">
                                    <Badge>{permission.permissionName}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    만료일:{" "}
                                    {new Date(
                                        permission.expiredDate
                                    ).toLocaleString("ko-KR", {
                                        year: "numeric",
                                        month: "2-digit",
                                        day: "2-digit",
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">
                        보유 중인 권한이 없습니다.
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
