import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NoticeForm from '@/components/notices/NoticeForm';
import { noticesService } from '@/api/content';
import { Notice, NoticeInput } from '@/lib/types';

const EditNotice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const initialNotice = (location.state as { notice: Notice })?.notice;

  const { data, isLoading } = useQuery({
    queryKey: ['notice', id],
    queryFn: () => id ? noticesService.getNoticeById(id) : Promise.reject('No ID'),
    enabled: !!id && !initialNotice,
    initialData: initialNotice,
  });

  const updateMutation = useMutation({
    mutationFn: (updated: NoticeInput) => noticesService.updateNotice(id!, updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      navigate(`/notices/${id}`);
    },
  });

  const handleSubmit = (data: NoticeInput) => {
    updateMutation.mutate(data);
  };

  if (!data) return null;

  return (
    <NoticeForm
      mode="edit"
      title="공지 수정"
      initialData={data}
      onSubmit={handleSubmit}
      isLoading={updateMutation.isPending}
    />
  );
};

export default EditNotice;