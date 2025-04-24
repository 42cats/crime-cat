import React, { useContext, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import MDEditor, { commands, EditorContext } from '@uiw/react-md-editor';
import { useTheme } from '@/hooks/useTheme';
import { Command, CommandInput } from '@/lib/types';
import PageTransition from '@/components/PageTransition';

interface CommandFormProps {
  mode: 'create' | 'edit';
  title: string;
  initialData?: Partial<Command>;
  onSubmit: (data: CommandInput) => void;
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

const CommandForm: React.FC<CommandFormProps> = ({
  mode,
  title,
  initialData = {},
  onSubmit,
  isLoading = false,
}) => {
  const { theme } = useTheme();
  const [name, setName] = useState(initialData.name || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [usage, setUsage] = useState(initialData.usage || '');
  const [category, setCategory] = useState(initialData.category || '');
  const [requiredPermissions, setRequiredPermissions] = useState<string[]>(initialData.requiredPermissions || []);
  const [permInput, setPermInput] = useState('');
  const [content, setContent] = useState(initialData.content || '');
  const [isComposing, setIsComposing] = useState(false);

  const addPermission = () => {
    const perm = permInput.trim().replace(/,$/, '');
    if (perm && !requiredPermissions.includes(perm)) {
      setRequiredPermissions([...requiredPermissions, perm]);
    }
    setPermInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isComposing && (e.key === 'Enter' || e.key === ',')) {
      e.preventDefault();
      addPermission();
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isComposing && e.key === ',') {
      e.preventDefault();
      addPermission();
    }
  };

  const handleSubmit = () => {
    onSubmit({
      name,
      description,
      usage,
      category,
      requiredPermissions,
      content,
    });
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-6 py-20 space-y-6">
        <h1 className="text-3xl font-bold mb-8">{title}</h1>

        <div>
          <Label className="font-bold mb-1 block">커맨드 이름 *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <Label className="font-bold mb-1 block">설명 *</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div>
          <Label className="font-bold mb-1 block">사용법 *</Label>
          <Input value={usage} onChange={(e) => setUsage(e.target.value)} />
        </div>

        <div>
          <Label className="font-bold mb-1 block">카테고리 *</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>

        <div>
          <Label className="font-bold mb-1 block">필수 권한 *</Label>
          <div className="flex gap-2 mt-1 mb-2 flex-wrap">
            {requiredPermissions.map((perm) => (
              <Badge
                key={perm}
                className="cursor-pointer"
                onClick={() => setRequiredPermissions(requiredPermissions.filter((p) => p !== perm))}
              >
                {perm}
              </Badge>
            ))}
          </div>
          <Input
            value={permInput}
            onChange={(e) => setPermInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="Enter 또는 쉼표로 구분"
          />
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
            disabled={!name || !description || !usage || !category || !content || requiredPermissions.length === 0 || isLoading}
          >
            {mode === 'edit' ? '수정' : '등록'}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
};

export default CommandForm;