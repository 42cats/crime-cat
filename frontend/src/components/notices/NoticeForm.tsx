import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Notice, NoticeInput, NoticeType } from '@/lib/types';
import PageTransition from '@/components/PageTransition';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { MarkdownEditor } from '@/components/markdown';
import { useFormValidator } from '@/hooks/useFormValidator';
import { useToast } from '@/hooks/useToast';

interface NoticeFormProps {
  mode: 'create' | 'edit';
  title: string;
  initialData?: Partial<Notice>;
  onSubmit: (data: NoticeInput) => void;
  isLoading?: boolean;
}

const NoticeForm: React.FC<NoticeFormProps> = ({
  mode,
  title,
  initialData = {},
  onSubmit,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const [form, setForm] = useState<NoticeInput>({
    title: initialData.title || '',
    summary: initialData.summary || '',
    content: initialData.content || '',
    noticeType: initialData.noticeType || 'SYSTEM',
    isPinned: initialData.isPinned || false,
  });

  const { errors, validateWithErrors, validateField } = useFormValidator<NoticeInput>((data) => {
    const errs: Partial<Record<keyof NoticeInput, string>> = {};
    if (!data.title) errs.title = '공지 제목을 입력해주세요.';
    if (!data.summary) errs.summary = '요약을 입력해주세요.';
    if (!data.content) errs.content = '본문 내용을 입력해주세요.';
    if (!data.noticeType) errs.noticeType = '공지 유형을 선택해주세요.';
    return errs;
  });

  const handleSubmit = () => {
    const currentErrors = validateWithErrors(form);
    const errorMessages = Object.values(currentErrors);

    if (errorMessages.length > 0) {
      toast({
        title: '입력 오류',
        description: (
          <div>
            {errorMessages.map((msg, idx) => (
              <div key={idx}>{msg}</div>
            ))}
          </div>
        ),
        variant: 'destructive',
      });
      return;
    }

    onSubmit(form);
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-6 py-20 space-y-6">
        <h1 className="text-3xl font-bold mb-8">{title}</h1>

        {/* 공지 유형 */}
        <div>
          <Label className="font-bold mb-1 block">공지 유형 *</Label>
          <Select
            value={form.noticeType}
            onValueChange={(val: NoticeType) => {
              setForm((prev) => ({ ...prev, noticeType: val }));
              validateField('noticeType', val);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="공지 유형 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SYSTEM">시스템</SelectItem>
              <SelectItem value="EVENT">이벤트</SelectItem>
              <SelectItem value="UPDATE">업데이트</SelectItem>
            </SelectContent>
          </Select>
          {errors.noticeType && <p className="text-red-500 text-sm mt-1">{errors.noticeType}</p>}
        </div>

        {/* 상단 고정 */}
        <div className="flex items-center gap-2">
          <input
            id="pin"
            type="checkbox"
            checked={form.isPinned}
            onChange={(e) => setForm((prev) => ({ ...prev, isPinned: e.target.checked }))}
            className="w-4 h-4"
          />
          <Label htmlFor="pin">상단 고정</Label>
        </div>

        {/* 제목 */}
        <div>
          <Label className="font-bold mb-1 block">공지 제목 *</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            onBlur={() => validateField('title', form.title)}
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* 요약 */}
        <div>
          <Label className="font-bold mb-1 block">요약 *</Label>
          <Input
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            onBlur={() => validateField('summary', form.summary)}
          />
          {errors.summary && <p className="text-red-500 text-sm mt-1">{errors.summary}</p>}
        </div>

        {/* 본문 */}
        <div>
          <Label className="font-bold mb-1 block">본문 내용 *</Label>
          <MarkdownEditor
            value={form.content}
            onChange={(val) => setForm({ ...form, content: val || '' })}
            onBlur={() => validateField('content', form.content)}
            height={400}
          />
          {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
        </div>

        {/* 버튼 */}
        <div className="text-right">
          <Button onClick={handleSubmit} disabled={isLoading}>
            {mode === 'edit' ? '수정' : '등록'}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
};

export default NoticeForm;