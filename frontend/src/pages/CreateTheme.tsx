import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import PageTransition from '@/components/PageTransition';
import MDEditor, { commands, EditorContext } from '@uiw/react-md-editor';
import { useTheme } from 'next-themes';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import LocalSearchModal from '@/components/LocalSearchModal';
import { Place } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

const WritePreviewToggle = () => {
  const { preview, dispatch } = useContext(EditorContext);
  const base = 'md-editor-toolbar-button h-[29px] px-2 text-sm flex items-center font-bold rounded hover:bg-gray-100 leading-none box-border';
  const selected = 'text-blue-600';
  const unselected = 'text-gray-500';
  return (
    <div className="flex items-center">
      <button onClick={() => dispatch({ preview: 'edit' })} className={`${base} ${preview === 'edit' ? selected : unselected}`}>작성</button>
      <button onClick={() => dispatch({ preview: 'preview' })} className={`${base} ${preview === 'preview' ? selected : unselected}`}>미리보기</button>
    </div>
  );
};

const CreateTheme: React.FC = () => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [characters, setCharacters] = useState<string[]>([]);
  const [characterInput, setCharacterInput] = useState('');
  const [players, setPlayers] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [difficulty, setDifficulty] = useState('');
  const [description, setDescription] = useState('');
  const [server, setServer] = useState('');
  const [content, setContent] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [type, setType] = useState('');
  const [extraFields, setExtraFields] = useState<any>({});

  const { user, isAuthenticated, isLoading } = useAuth();

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const addItemsFromInput = (input: string, setItems: (items: string[]) => void, currentItems: string[]) => {
    const parts = input.split(',').map((t) => t.trim()).filter((t) => t.length > 0 && !currentItems.includes(t));
    if (parts.length > 0) setItems([...currentItems, ...parts]);
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value);
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isComposing && e.key === 'Enter') {
      e.preventDefault();
      addItemsFromInput(tagInput, setTags, tags);
      setTagInput('');
    }
  };
  const handleTagKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isComposing && e.key === ',') {
      e.preventDefault();
      addItemsFromInput(tagInput, setTags, tags);
      setTagInput('');
    }
  };

  const handleCharacterChange = (e: React.ChangeEvent<HTMLInputElement>) => setCharacterInput(e.target.value);
  const handleCharacterKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isComposing && e.key === 'Enter') {
      e.preventDefault();
      addItemsFromInput(characterInput, setCharacters, characters);
      setCharacterInput('');
    }
  };
  const handleCharacterKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isComposing && e.key === ',') {
      e.preventDefault();
      addItemsFromInput(characterInput, setCharacters, characters);
      setCharacterInput('');
    }
  };

  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => setIsComposing(false);

  const handleSubmit = async () => {
    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('tags', JSON.stringify(tags));
        formData.append('characters', JSON.stringify(characters));
        formData.append('players', players);
        formData.append('duration', duration);
        formData.append('price', price.toString());
        formData.append('difficulty', difficulty);
        formData.append('description', description);
        formData.append('server', server);
        formData.append('content', content);
        formData.append('type', type);
        formData.append('extraFields', JSON.stringify(extraFields));
        if (thumbnail) formData.append('thumbnail', thumbnail);
  
        const res = await fetch('/api/themes', {
          method: 'POST',
          body: formData,
        });
  
        if (!res.ok) throw new Error('업로드 실패');
  
        console.log('✅ 제출됨:', { title, tags, characters, players, duration, price, difficulty, description, server, content, type, extraFields });
        navigate('/themes');
      } catch (err) {
        console.error('테마 저장 실패:', err);
      }
  };

  return (
    <PageTransition>
      <div className="container mx-auto px-6 py-20 max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold mb-8">새 테마 만들기</h1>

        <div>
          <Label className="font-bold">썸네일 이미지</Label>
          {thumbnailPreview && (
            <img src={thumbnailPreview} alt="썸네일 미리보기" className="w-40 h-40 object-cover rounded mb-2" />
          )}
          <Input type="file" accept="image/*" onChange={handleThumbnailChange} />
        </div>

        <div>
          <Label className="font-bold mb-1 block">제목 *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="테마 이름" required />
        </div>

        <div>
          <Label className="font-bold mb-1 block">태그 *</Label>
          <div className="flex gap-2 mt-1 mb-2 flex-wrap">
            {tags.map(tag => (
              <Badge key={tag} variant="default" className="cursor-pointer" onClick={() => setTags(tags.filter(t => t !== tag))}>#{tag}</Badge>
            ))}
          </div>
          <Input value={tagInput} onChange={handleTagChange} onKeyDown={handleTagKeyDown} onKeyUp={handleTagKeyUp} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} placeholder="#추리, #공포 입력 후 쉼표 또는 Enter" />
        </div>

        <div>
          <Label className="font-bold mb-1 block">등장 캐릭터</Label>
          <div className="flex gap-2 mt-1 mb-2 flex-wrap">
            {characters.map(char => (
              <Badge key={char} variant="secondary" className="cursor-pointer" onClick={() => setCharacters(characters.filter(c => c !== char))}>{char}</Badge>
            ))}
          </div>
          <Input value={characterInput} onChange={handleCharacterChange} onKeyDown={handleCharacterKeyDown} onKeyUp={handleCharacterKeyUp} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} placeholder="쉼표 또는 Enter로 구분" />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <Label className="font-bold mb-1 block">플레이어 수 *</Label>
            <Input value={players} onChange={(e) => setPlayers(e.target.value)} placeholder="예: 3~4명" required />
          </div>
          <div className="flex-1">
            <Label className="font-bold mb-1 block">예상 소요 시간 *</Label>
            <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="예: 2시간 30분" required />
          </div>
        </div>

        <div>
          <Label className="font-bold mb-1 block">가격 *</Label>
          <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="숫자만 입력" required />
        </div>

        <div>
          <Label className="font-bold mb-1 block">난이도 *</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger><SelectValue placeholder="난이도 선택" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EASY">EASY</SelectItem>
              <SelectItem value="MEDIUM">MEDIUM</SelectItem>
              <SelectItem value="HARD">HARD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div><Label className="font-bold mb-1 block">간략 설명</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="게시글 요약 (선택)" /></div>
        <div><Label className="font-bold mb-1 block">디스코드 서버</Label><Input value={server} onChange={(e) => setServer(e.target.value)} placeholder="소속 서버 (선택)" /></div>

        <div><Label className="font-bold mb-1 block">게임 유형 *</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="유형 선택" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ESCAPE_ROOM">ESCAPE_ROOM</SelectItem>
              <SelectItem value="MURDER_MYSTERY">MURDER_MYSTERY</SelectItem>
              <SelectItem value="CRIMESCENE">CRIMESCENE</SelectItem>
              <SelectItem value="REALWORLD">REALWORLD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {type === 'ESCAPE_ROOM' && (
          <div className="space-y-2">
            <Label className="font-bold">장소 검색</Label>
            <LocalSearchModal
              onSelect={(place: Place) => {
                setExtraFields((prev) => ({
                  ...prev,
                  store_name: place.title,
                  address: place.address,
                  lat: place.lat,
                  lng: place.lng,
                }));
              }}
            />
            <div className="grid gap-2 mt-2">
              <div>
                <Label className="text-sm text-muted-foreground">장소 *</Label>
                <Input readOnly value={extraFields.store_name || ''} placeholder="선택된 장소" />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">주소 *</Label>
                <Input readOnly value={extraFields.address || ''} placeholder="선택된 주소" />
              </div>
            </div>
          </div>
        )}

        {type === 'MURDER_MYSTERY' && (
          <Input placeholder="구매처 링크" value={extraFields.purchase_link || ''} onChange={(e) => setExtraFields({ ...extraFields, purchase_link: e.target.value })} />
        )}

        {type === 'CRIMESCENE' && (
          <Input placeholder="제작자" value={extraFields.maker || ''} onChange={(e) => setExtraFields({ ...extraFields, maker: e.target.value })} />
        )}

        {type === 'REALWORLD' && (
          <>
            <Input placeholder="플레이 링크" value={extraFields.theme_link || ''} onChange={(e) => setExtraFields({ ...extraFields, theme_link: e.target.value })} />
            <Select value={extraFields.mode || ''} onValueChange={(val) => setExtraFields({ ...extraFields, mode: val })}>
              <SelectTrigger><SelectValue placeholder="온라인/오프라인" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ONLINE">ONLINE</SelectItem>
                <SelectItem value="OFFLINE">OFFLINE</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}

        <div><Label className="font-bold mb-1 block">본문 내용 *</Label>
          <div data-color-mode={resolvedTheme === 'dark' ? 'dark' : 'light'}>
            <div className="border rounded-md overflow-hidden">
              <MDEditor value={content} onChange={(val) => setContent(val || '')} height={400} preview="edit" hideToolbar={false} className="w-md-editor" commands={[{ name: 'toggle-preview', keyCommand: 'toggle-preview', icon: <WritePreviewToggle /> }, ...commands.getCommands()]} extraCommands={[]} />
            </div>
          </div>
        </div>

        <div className="text-right">
          <Button onClick={handleSubmit} disabled={!title || !tags.length || !players || !duration || !price || !difficulty || !content}>저장</Button>
        </div>
      </div>
    </PageTransition>
  );
};

export default CreateTheme;
