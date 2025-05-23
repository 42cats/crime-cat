import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { commandsService } from '@/api/content';
import CommandForm from '@/components/commands/CommandForm';
import { Command, CommandInput } from '@/lib/types';

const EditCommand: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [command, setCommand] = useState<Command | null>(
    (location.state as { command?: Command })?.command || null
  );

  useEffect(() => {
    if (!command && id) {
      const fetchCommand = async () => {
        const cmd = await commandsService.getCommandById(id);
        if (cmd) setCommand(cmd);
        else navigate('/commands');
      };
      fetchCommand();
    }
  }, [id, command, navigate]);

  const handleUpdate = async (updatedData: CommandInput) => {
    if (!id) return;
    try {
      await commandsService.updateCommand(id, updatedData);
      navigate(`/commands/${id}`);
    } catch (err) {
      console.error('명령어 수정 실패:', err);
    }
  };

  return command ? (
    <CommandForm
      mode="edit"
      title="커맨드 수정"
      initialData={command}
      onSubmit={handleUpdate}
    />
  ) : null;
};

export default EditCommand;