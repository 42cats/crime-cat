import React, { useState } from 'react';
import { commandsService } from '@/api/commandsService';
import { useToast } from '@/components/ui/use-toast';
import { Button, Input } from '@/components/ui/button';

const CreateCommand: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      const userRole = 'user'; // 실제 사용자 역할을 가져와야 함
      await commandsService.createCommand({ name, description }, userRole);
      toast({ title: '커맨드가 성공적으로 생성되었습니다!' });
    } catch (error) {
      toast({ title: '커맨드 생성 오류', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div>
      <h1>커맨드 생성</h1>
      <Input 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="커맨드 이름" 
      />
      <Input 
        value={description} 
        onChange={(e) => setDescription(e.target.value)} 
        placeholder="설명" 
      />
      <Button onClick={handleSubmit}>생성</Button>
    </div>
  );
};

export default CreateCommand; 