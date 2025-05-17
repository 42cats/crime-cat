import React from 'react';
import { BoardType } from '@/lib/types/board';
import BoardPostDetail from './BoardPostDetail';

const QuestionPostDetail: React.FC = () => {
  return <BoardPostDetail boardType={BoardType.QUESTION} />;
};

export default QuestionPostDetail;
