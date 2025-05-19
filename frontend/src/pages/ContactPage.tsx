import React, { useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import ProfileDetailModal from "@/components/profile/ProfileDetailModal";
const ContactPage: React.FC = () => {
    const [showProfile, setShowProfile] = useState(false);
    return (
        <>
            <button onClick={() => setShowProfile(true)}>프로필 보기</button>

            <ProfileDetailModal
                userId="c64cf981-e549-4498-bff4-3d1743ec3062"
                open={showProfile}
                onOpenChange={setShowProfile}
            />
        </>
    );
};

export default ContactPage;
