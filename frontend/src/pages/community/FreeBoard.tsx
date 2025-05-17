import React from 'react';
import { BoardType } from '@/lib/types/board';
import BoardList from './BoardList';

const FreeBoard: React.FC = () => {
  return <BoardList boardType={BoardType.FREE} />;
};

export default FreeBoard;
