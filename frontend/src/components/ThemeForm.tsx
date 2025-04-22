import React, { useState, useContext } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import MDEditor, { commands, EditorContext } from '@uiw/react-md-editor';
import { useTheme } from '@/hooks/useTheme';
import { Star } from 'lucide-react';
import PageTransition from '@/components/PageTransition';

interface ThemeFormProps {
  mode: 'create' | 'edit';
  title: string;
  initialData?: Partial<any>;
  extraFields: any;
  setExtraFields: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (data: any) => void;
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

const ThemeForm: React.FC<ThemeFormProps> = ({
  mode,
  title,
  initialData = {},
  extraFields,
  setExtraFields,
  onSubmit,
  isLoading = false
}) => {
  const { theme } = useTheme();
  const [form, setForm] = useState({
    title: initialData.title || '',
    tags: initialData.tags || [],
    tagInput: '',
    characters: initialData.characters || [],
    characterInput: '',
    players: initialData.players || '',
    duration: initialData.duration || '',
    price: initialData.price || '',
    difficulty: initialData.difficulty || 0,
    description: initialData.description || '',
    server: initialData.server || '',
    content: initialData.content || ''
  });
  const [hovered, setHovered] = useState<number | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  const addItemsFromInput = (input: string, key: 'tags' | 'characters') => {
    const parts = input.split(',').map((t) => t.trim()).filter((t) => t.length > 0 && !form[key].includes(t));
    if (parts.length > 0) setForm({ ...form, [key]: [...form[key], ...parts], [`${key}Input`]: '' });
  };

  const handleSubmit = () => {
    const { tagInput, characterInput, ...rest } = form;
    onSubmit({ ...rest, extraFields });
  };

  return (
    <PageTransition>
    <div className="max-w-3xl mx-auto px-6 py-20 space-y-6">
      <h1 className="text-3xl font-bold mb-8">{title}</h1>

      <div>
        <Label className="font-bold mb-1 block">제목 *</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="테마 이름" required />
      </div>

      <div>
        <Label className="font-bold mb-1 block">태그 *</Label>
        <div className="flex gap-2 mt-1 mb-2 flex-wrap">
          {form.tags.map(tag => (
            <Badge key={tag} className="cursor-pointer" onClick={() => setForm({ ...form, tags: form.tags.filter(t => t !== tag) })}>#{tag}</Badge>
          ))}
        </div>
        <Input
          value={form.tagInput}
          onChange={(e) => setForm({ ...form, tagInput: e.target.value })}
          onKeyDown={(e) => {
            if (!isComposing && e.key === 'Enter') {
              e.preventDefault();
              addItemsFromInput(form.tagInput, 'tags');
            }
          }}
          onKeyUp={(e) => {
            if (!isComposing && e.key === ',') {
              e.preventDefault();
              addItemsFromInput(form.tagInput, 'tags');
            }
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="#추리, #공포 입력 후 쉼표 또는 Enter"
        />
      </div>

      <div>
        <Label className="font-bold mb-1 block">등장 캐릭터</Label>
        <div className="flex gap-2 mt-1 mb-2 flex-wrap">
          {form.characters.map(char => (
            <Badge key={char} className="cursor-pointer" onClick={() => setForm({ ...form, characters: form.characters.filter(c => c !== char) })}>{char}</Badge>
          ))}
        </div>
        <Input
          value={form.characterInput}
          onChange={(e) => setForm({ ...form, characterInput: e.target.value })}
          onKeyDown={(e) => {
            if (!isComposing && e.key === 'Enter') {
              e.preventDefault();
              addItemsFromInput(form.characterInput, 'characters');
            }
          }}
          onKeyUp={(e) => {
            if (!isComposing && e.key === ',') {
              e.preventDefault();
              addItemsFromInput(form.characterInput, 'characters');
            }
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="쉼표 또는 Enter로 구분"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Label className="font-bold mb-1 block">플레이어 수 *</Label>
          <Input value={form.players} onChange={(e) => setForm({ ...form, players: e.target.value })} placeholder="예: 3~4명" required />
        </div>
        <div className="flex-1">
          <Label className="font-bold mb-1 block">예상 소요 시간 *</Label>
          <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="예: 2시간 30분" required />
        </div>
      </div>

      <div>
        <Label className="font-bold mb-1 block">가격 *</Label>
        <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="숫자만 입력" required />
      </div>

      <div>
        <Label className="font-bold mb-1 block">난이도 *</Label>
        <div className="flex gap-1 cursor-pointer w-fit" onMouseLeave={() => setHovered(null)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={value}
              className={`w-6 h-6 transition-colors ${
                (hovered ?? form.difficulty) >= value ? 'text-yellow-400' : 'text-muted-foreground'
              }`}
              onMouseEnter={() => setHovered(value)}
              onMouseDown={() => setForm({ ...form, difficulty: value })}
            />
          ))}
        </div>
      </div>

      <div>
        <Label className="font-bold mb-1 block">간략 설명</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="게시글 요약 (선택)" />
      </div>

      <div>
        <Label className="font-bold mb-1 block">디스코드 서버</Label>
        <Input value={form.server} onChange={(e) => setForm({ ...form, server: e.target.value })} placeholder="소속 서버 (선택)" />
      </div>

      <div>
        <Label className="font-bold mb-1 block">본문 내용 *</Label>
        <div data-color-mode={theme === 'dark' ? 'dark' : 'light'}>
          <div className="border rounded-md overflow-hidden">
            <MDEditor
              value={form.content}
              onChange={(val) => setForm({ ...form, content: val || '' })}
              height={400}
              preview="edit"
              commands={[{ name: 'toggle-preview', keyCommand: 'toggle-preview', icon: <WritePreviewToggle /> }, ...commands.getCommands()]}
              extraCommands={[]}
            />
          </div>
        </div>
      </div>

      <div className="text-right">
        <Button
          onClick={handleSubmit}
          disabled={!form.title || !form.tags.length || !form.players || !form.duration || !form.price || !form.difficulty || !form.content || isLoading}
        >
          {mode === 'edit' ? '수정' : '등록'}
        </Button>
      </div>
    </div>
    </PageTransition>
  );
};

export default ThemeForm;