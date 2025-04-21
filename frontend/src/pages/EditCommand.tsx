import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { commandsService } from '@/api/commandsService';
import CommandForm from '@/components/CommandForm';
import { Command } from '@/lib/types';

const EditCommand: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [command, setCommand] = useState<Command | null>(null);

  useEffect(() => {
    const fetchCommand = async () => {
      const cmd = await commandsService.getCommandById(id!);
      if (cmd) setCommand(cmd);
      else navigate('/commands');
    };
    fetchCommand();
  }, [id, navigate]);

  const handleUpdate = async (updatedData: Omit<Command, 'id' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'>) => {
    if (!id) return;
    try {
      await commandsService.updateCommand(id, updatedData);
      navigate('/commands');
    } catch (err) {
      console.error('명령어 수정 실패:', err);
    }
  };

  return (
    command ? (
      <CommandForm
        mode='edit'
        title='커맨드 수정'
        initialData={command}
        onSubmit={handleUpdate}
      />
    ) : null
  );
};

export default EditCommand;