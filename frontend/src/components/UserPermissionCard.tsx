import React from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { motion } from "framer-motion";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { UTCToKST } from "@/lib/dateFormat";
interface UserGrantedPermissionDto {
    permissionId: string;
    permissionName: string;
    info?: string;
    expiredDate: string;
}

interface UserPermissionCardProps {
    permissions: UserGrantedPermissionDto[];
}

export const UserPermissionCard: React.FC<UserPermissionCardProps> = ({
    permissions,
}) => {
    if (!permissions || permissions.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-8">
                보유한 권한이 없습니다.
            </div>
        );
    }

    return (
        <section className="w-full">
            <h2 className="text-xl font-bold mb-6">🎖️ 보유한 권한</h2>

            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 },
                    },
                }}
            >
                {permissions.map((permission) => (
                    <motion.div
                        key={permission.permissionId}
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: {
                                opacity: 1,
                                y: 0,
                                transition: { duration: 0.4 },
                            },
                        }}
                    >
                        <Card className="glass p-4 hover:bg-slate-50/5 transition-colors">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg truncate">
                                    {permission.permissionName}
                                </CardTitle>
                                {permission.info && (
                                    <CardDescription className="text-muted-foreground text-xs mt-1 line-clamp-2">
                                        {permission.info}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="text-muted-foreground text-xs mt-2">
                                <div>
                                    <span className="font-medium">만료일:</span>{" "}
                                    <UTCToKST date={permission.expiredDate} />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
};
