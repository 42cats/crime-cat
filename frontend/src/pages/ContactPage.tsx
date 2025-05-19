import React, { useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import ProfileDetailModal from "@/components/profile/ProfileDetailModal";
const ContactPage: React.FC = () => {
    const [showProfile, setShowProfile] = useState(false);
    return (
        <>
            <button onClick={() => setShowProfile(true)}>프로필 보기</button>

            <ProfileDetailModal
                userId="4742ca4d-07dd-4f6e-90dc-6c3a68d9481d"
                open={showProfile}
                onOpenChange={setShowProfile}
            />
        </>
    );
};

export default ContactPage;
