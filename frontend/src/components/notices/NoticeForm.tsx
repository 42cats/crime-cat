import React, { useContext, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Notice, NoticeInput, NoticeType } from '@/lib/types';
import PageTransition from '@/components/PageTransition';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import MDEditor, { commands, EditorContext } from '@uiw/react-md-editor';
import { useTheme } from '@/hooks/useTheme';

interface NoticeFormProps {
  mode: 'create' | 'edit';
  title: string;
  initialData?: Partial<Notice>;
  onSubmit: (data: NoticeInput) => void;
  isLoading?: boolean;
}

const WritePreviewToggle = () => {
  const { preview, dispatch } = useContext(EditorContext);
  const base = 'md-editor-toolbar-button h-[29px] px-2 text-sm font-bold rounded hover:bg-gray-100';
  const selected = 'text-blue-600';
  const unselected = 'text-gray-500';
  return (
    <div className="flex items-center">
      <button onClick={() => dispatch({ preview: 'edit' })} className={`${base} ${preview === 'edit' ? selected : unselected}`}>작성</button>
      <button onClick={() => dispatch({ preview: 'preview' })} className={`${base} ${preview === 'preview' ? selected : unselected}`}>미리보기</button>
    </div>
  );
};

const NoticeForm: React.FC<NoticeFormProps> = ({
  mode,
  title,
  initialData = {},
  onSubmit,
  isLoading = false,
}) => {
  const { theme } = useTheme();
  const [noticeType, setNoticeType] = useState<NoticeType>(initialData.noticeType || 'SYSTEM');
  const [noticeTitle, setNoticeTitle] = useState(initialData.title || '');
  const [summary, setSummary] = useState(initialData.summary || '');
  const [content, setContent] = useState(initialData.content || '');
  const [isPinned, setIsPinned] = useState(initialData.isPinned || false);

  const handleSubmit = () => {
    onSubmit({
      title: noticeTitle,
      summary,
      content,
      noticeType,
      isPinned,
    });
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-6 py-20 space-y-6">
        <h1 className="text-3xl font-bold mb-8">{title}</h1>
        <div>
          <Label className="font-bold mb-1 block">공지 유형 *</Label>
          <Select value={noticeType} onValueChange={(val: NoticeType) => setNoticeType(val)}>
            <SelectTrigger>
              <SelectValue placeholder="공지 유형 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SYSTEM">시스템</SelectItem>
              <SelectItem value="EVENT">이벤트</SelectItem>
              <SelectItem value="UPDATE">업데이트</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="pin"
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="pin">상단 고정</Label>
        </div>

        <div>
          <Label className="font-bold mb-1 block">공지 제목 *</Label>
          <Input value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} required />
        </div>

        <div>
          <Label className="font-bold mb-1 block">요약 *</Label>
          <Input value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>

        <div>
          <Label className="font-bold mb-1 block">본문 내용 *</Label>
          <div data-color-mode={theme === 'dark' ? 'dark' : 'light'}>
            <div className="border rounded-md overflow-hidden">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || '')}
                height={400}
                preview="edit"
                commands={[
                  {
                    name: 'toggle-preview',
                    keyCommand: 'toggle-preview',
                    icon: <WritePreviewToggle />,
                  },
                  ...commands.getCommands(),
                ]}
                extraCommands={[]}
              />
            </div>
          </div>
        </div>

        <div className="text-right">
          <Button
            onClick={handleSubmit}
            disabled={!noticeTitle || !noticeType || !summary || !content || isLoading}
          >
            {mode === 'edit' ? '수정' : '등록'}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
};

export default NoticeForm;
