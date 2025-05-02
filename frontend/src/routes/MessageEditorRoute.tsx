import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import MultiSelectMessageEditor from '@/pages/MultiSelectMessageEditor';

const MessageEditorRoute: React.FC = () => {
  const location = useLocation();
  const { guildId, guildName } = location.state || {};

  // guildId가 없으면 리다이렉트
  if (!guildId) {
    return <Navigate to="/dashboard/guilds" replace />;
  }

  return (
    <MultiSelectMessageEditor 
      guildId={guildId} 
      guildName={guildName} 
    />
  );
};

export default MessageEditorRoute;
