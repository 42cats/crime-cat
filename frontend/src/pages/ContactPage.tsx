import React, { useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import ProfileDetailModal from "@/components/profile/ProfileDetailModal";
const ContactPage: React.FC = () => {
    const [showProfile, setShowProfile] = useState(false);
    return (
        <>
            <button onClick={() => setShowProfile(true)}>프로필 보기</button>

            <ProfileDetailModal
                userId="a2a8bea5-c131-40ec-b970-4c1683dddea2"
                open={showProfile}
                onOpenChange={setShowProfile}
            />
        </>
    );
};

export default ContactPage;
