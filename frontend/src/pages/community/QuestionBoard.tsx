import React from 'react';
import { BoardType } from '@/lib/types/board';
import BoardList from './BoardList';

const QuestionBoard: React.FC = () => {
  return <BoardList boardType={BoardType.QUESTION} />;
};

export default QuestionBoard;
