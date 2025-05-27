import React from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCircle, Camera, Loader2 } from "lucide-react";

interface ProfileAvatarProps {
    croppedImageUrl: string | null;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isLoading?: boolean;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
    croppedImageUrl,
    handleImageChange,
    isLoading = false,
}) => {
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className="absolute -top-16 ring-4 ring-background rounded-full"
        >
            <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-background">
                    <AvatarImage
                        src={
                            croppedImageUrl ||
                            "/content/image/default_profile_image.png"
                        }
                        alt="Profile"
                        className="object-cover"
                    />
                    <AvatarFallback>
                        <UserCircle className="w-full h-full" />
                    </AvatarFallback>
                </Avatar>
                <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full absolute bottom-0 right-0 shadow-md"
                    onClick={() =>
                        document.getElementById("profile-upload")?.click()
                    }
                    type="button"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Camera className="w-4 h-4" />
                    )}
                </Button>
                <Input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                />
            </div>
        </motion.div>
    );
};

export default ProfileAvatar;
