import React from 'react';
import { useNavigate } from 'react-router-dom';
import CommandForm from '@/components/CommandForm';
import { commandsService } from '@/api/commandsService';
import { Command } from '@/lib/types';

const CreateCommand: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = async (data: Omit<Command, 'id' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'>) => {
    try {
      await commandsService.createCommand(data);
      navigate('/commands');
    } catch (err) {
      console.error('명령어 생성 실패:', err);
    }
  };

  return (
    <CommandForm
      mode='create'
      title='새 명령어 작성'
      onSubmit={handleSubmit}
    />
  );
};

export default CreateCommand;