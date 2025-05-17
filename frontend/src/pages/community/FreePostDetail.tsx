import React from 'react';
import { BoardType } from '@/lib/types/board';
import BoardPostDetail from './BoardPostDetail';

const FreePostDetail: React.FC = () => {
  return <BoardPostDetail boardType={BoardType.FREE} />;
};

export default FreePostDetail;
