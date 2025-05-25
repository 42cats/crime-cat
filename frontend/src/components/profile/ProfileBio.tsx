import React from 'react';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface ProfileBioProps {
  bio: string | null;
}

const ProfileBio: React.FC<ProfileBioProps> = ({ bio }) => {
  return (
    <div className="bg-white p-3 md:p-4 rounded-md">
      <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-gray-700">자기소개</h2>
      <div className="text-gray-700 leading-relaxed">
        {bio ? (
          <MarkdownRenderer content={bio} />
        ) : (
          <p className="text-gray-400 italic">자기소개가 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default ProfileBio;
