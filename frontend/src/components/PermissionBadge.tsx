import React from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { getBadgeClasses } from "./utils/permissionCardUtils";

interface PermissionBadgeProps {
    urgency: "critical" | "warning" | "normal";
    isMobile?: boolean;
}

export const PermissionBadge: React.FC<PermissionBadgeProps> = ({
    urgency,
    isMobile,
}) => (
    <div className={`absolute top-3 right-${isMobile ? 3 : 7} z-10`}>
        <Badge className={getBadgeClasses(urgency)}>
            <Sparkles className="w-3 h-3 mr-1" />
            보유 중
        </Badge>
    </div>
);
