import React from "react";
import type { SocialLinks } from "@/types/profile";

interface SocialLinksProps {
  socialLinks?: SocialLinks;
}

export const SocialLinksSection: React.FC<SocialLinksProps> = ({ socialLinks }) => {
  if (!socialLinks || Object.keys(socialLinks).length === 0) {
    return null;
  }

  const hasValidLinks = Object.values(socialLinks).some(link => link && link.trim() !== "");
  
  if (!hasValidLinks) {
    return null;
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground">소셜 링크</p>
      <ul className="mt-1 space-y-1 text-base">
        {socialLinks.instagram && (
          <li>Instagram: {socialLinks.instagram}</li>
        )}
        {socialLinks.x && (
          <li>X: {socialLinks.x}</li>
        )}
        {socialLinks.openkakao && (
          <li>Open Kakao: {socialLinks.openkakao}</li>
        )}
      </ul>
    </div>
  );
};
