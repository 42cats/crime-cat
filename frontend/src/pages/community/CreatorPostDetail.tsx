import React from 'react';
import { BoardType } from '@/lib/types/board';
import BoardPostDetail from './BoardPostDetail';

const CreatorPostDetail: React.FC = () => {
  return <BoardPostDetail boardType={BoardType.CREATOR} />;
};

export default CreatorPostDetail;
