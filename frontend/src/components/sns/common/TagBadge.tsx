import React from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface TagBadgeProps {
    tags: string[];
    className?: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const TagBadge: React.FC<TagBadgeProps> = ({ 
    tags, 
    className = "", 
    variant = "secondary" 
}) => {
    const navigate = useNavigate();

    const handleTagClick = (tag: string) => {
        navigate(`/sns/explore?search=${encodeURIComponent(`#${tag}`)}`);
    };

    if (!tags || tags.length === 0) {
        return null;
    }

    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {tags.map((tag, index) => (
                <Badge
                    key={index}
                    variant={variant}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => handleTagClick(tag)}
                >
                    #{tag}
                </Badge>
            ))}
        </div>
    );
};

export default TagBadge;
