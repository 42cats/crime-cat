import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { BoardType } from '@/lib/types/board';

interface BoardHeaderProps {
  title: string;
  description: string;
  boardType: BoardType;
}

const BoardHeader: React.FC<BoardHeaderProps> = ({ 
  title, 
  description,
  boardType
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const handleWritePost = () => {
    if (!isAuthenticated) {
      // 로그인이 필요한 경우 로그인 페이지로 이동
      navigate('/login', { state: { from: location } });
      return;
    }
    
    // 글쓰기 페이지로 이동
    navigate(`/community/${boardType.toLowerCase()}/new`);
  };
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button onClick={handleWritePost}>
          글쓰기
        </Button>
      </div>
    </div>
  );
};

export default BoardHeader;
