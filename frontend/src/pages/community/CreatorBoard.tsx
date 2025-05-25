import React from 'react';
import { BoardType } from '@/lib/types/board';
import BoardList from './BoardList';

const CreatorBoard: React.FC = () => {
  return <BoardList boardType={BoardType.CREATOR} />;
};

export default CreatorBoard;
