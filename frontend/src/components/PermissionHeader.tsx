import React from "react";
import { Crown, Coins, Timer } from "lucide-react";
import { PermissionWithStatus } from "@/api/permissionService";

interface PermissionHeaderProps {
    permission: PermissionWithStatus;
    isMobile?: boolean;
}

export const PermissionHeader: React.FC<PermissionHeaderProps> = ({
    permission,
    isMobile = false,
}) => (
    <div className="flex items-center gap-3">
        <div
            className={`p-2 rounded-lg ${
                permission.isOwned
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
            }`}
        >
            <Crown className="h-4 w-4" />
        </div>
        <div>
            <h3
                className={`${
                    isMobile ? "text-xl" : "text-base"
                } font-semibold ${isMobile ? "text-center" : ""}`}
            >
                {permission.permissionName}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs">
                <div className="flex items-center gap-1">
                    <Coins className="h-3 w-3 text-amber-600" />
                    <span className="font-semibold text-amber-600">
                        {permission.price}P
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Timer className="h-3 w-3 text-gray-600" />
                    <span>{permission.duration}일</span>
                </div>
            </div>
        </div>
    </div>
);
