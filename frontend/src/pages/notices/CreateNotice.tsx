import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import NoticeForm from '@/components/notices/NoticeForm';
import { noticesService } from '@/api/content';
import { NoticeInput } from '@/lib/types';

const CreateNotice: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: noticesService.createNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      navigate('/notices');
    },
  });

  const handleSubmit = (data: NoticeInput) => {
    createMutation.mutate(data);
  };

  return (
    <NoticeForm
      mode="create"
      title="새 공지 작성"
      onSubmit={handleSubmit}
      isLoading={createMutation.isPending}
    />
  );
};

export default CreateNotice;