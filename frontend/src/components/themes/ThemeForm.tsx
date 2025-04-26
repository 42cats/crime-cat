import React, { useState, useContext } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import MDEditor, { commands, EditorContext } from "@uiw/react-md-editor";
import { useTheme } from "@/hooks/useTheme";
import PageTransition from "@/components/PageTransition";
import { useLocation } from "react-router-dom";
import { Star } from "lucide-react";
import CrimeSceneFields from "@/components/themes/type/CrimeSceneFields";
import EscapeRoomFields from "@/components/themes/type/EscapeRoomFields";
import MurderMysteryFields from "@/components/themes/type/MurderMysteryFields";
import RealWorldFields from "@/components/themes/type/RealWorldFields";
import TeamSelectModal from "@/components/themes/modals/TeamSelectModal";
import GuildSelectModal from "@/components/themes/modals/GuildSelectModal";

interface ThemeFormProps {
  mode: "create" | "edit";
  title: string;
  initialData?: Partial<any>;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

const initialExtraFieldsMap = {
  CRIMESCENE: {
    makerTeamsId: "",
    makerTeamsName: "",
    guildSnowflake: "",
    guildName: "",
    extra: { characters: [] },
  },
  ESCAPE_ROOM: { extra: {} },
  MURDER_MYSTERY: { extra: {} },
  REALWORLD: { extra: {} },
};

const WritePreviewToggle = () => {
  const { preview, dispatch } = useContext(EditorContext);
  const base = "md-editor-toolbar-button h-[29px] px-2 text-sm font-bold rounded hover:bg-gray-100";
  const selected = "text-blue-600";
  const unselected = "text-gray-500";
  return (
    <div className="flex items-center">
      <button onClick={() => dispatch({ preview: "edit" })} className={`${base} ${preview === "edit" ? selected : unselected}`}>작성</button>
      <button onClick={() => dispatch({ preview: "preview" })} className={`${base} ${preview === "preview" ? selected : unselected}`}>미리보기</button>
    </div>
  );
};

const ThemeForm: React.FC<ThemeFormProps> = ({ mode, title, initialData = {}, onSubmit, isLoading = false }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const state = location.state as { category?: string };
  const initialType = (state?.category?.toUpperCase() ?? "") as keyof typeof initialExtraFieldsMap;

  const [form, setForm] = useState({
    type: initialData.type || initialType || "",
    title: initialData.title || "",
    summary: initialData.summary || "",
    tags: initialData.tags || [],
    tagInput: "",
    playersMin: initialData.playersMin || "",
    playersMax: initialData.playersMax || "",
    playtime: initialData.playtime || "",
    price: initialData.price || "",
    difficulty: initialData.difficulty || 0,
    content: initialData.content || "",
    thumbnail: initialData.thumbnail || "",
  });

  const [extraFields, setExtraFields] = useState<any>(
    initialExtraFieldsMap[form.type as keyof typeof initialExtraFieldsMap] || {}
  );

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isTeamModalOpen, setTeamModalOpen] = useState(false);
  const [isGuildModalOpen, setGuildModalOpen] = useState(false);

  const addTagsFromInput = () => {
    const parts = form.tagInput.split(",").map((t) => t.trim()).filter((t) => t.length > 0 && !form.tags.includes(t));
    if (parts.length > 0) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, ...parts], tagInput: "" }));
    }
  };

  const handleSubmit = () => {
    const { tagInput, ...data } = form;
    const formData = new FormData();


    if (thumbnailFile instanceof File) {
      formData.append("thumbnail", thumbnailFile);
    }

    const jsonData = {
      title: data.title,
      summary: data.summary,
      tags: data.tags,
      content: data.content,
      playersMin: Number(data.playersMin),
      playersMax: Number(data.playersMax),
      playtime: Number(data.playtime),
      price: Number(data.price),
      difficulty: Number(data.difficulty),
      publicStatus: true,
      type: data.type,
    };

    if (data.type === "CRIMESCENE" && extraFields) {
      jsonData["makerTeamsId"] = extraFields.makerTeamsId || null;
      jsonData["guildSnowflake"] = extraFields.guildSnowflake || null;
      if (extraFields.extra) {
        jsonData["extra"] = extraFields.extra;
      }
    }
    
    formData.append("data", JSON.stringify(jsonData));

    onSubmit(formData);
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-6 py-20 space-y-6">
        <h1 className="text-3xl font-bold mb-8">{title}</h1>

        {/* 카테고리 */}
        <div>
          <Label className="font-bold mb-1 block">카테고리</Label>
          <Input value={form.type} readOnly disabled />
        </div>

        {/* 제목 */}
        <div>
          <Label className="font-bold mb-1 block">제목 *</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="테마 제목" required />
        </div>

        {/* 썸네일 */}
        <div>
          <Label className="font-bold mb-1 block">썸네일 *</Label>
          {form.thumbnail && (
            <div className="mb-2 flex justify-center">
              <div className="w-full max-w-sm h-48 rounded overflow-hidden border border-muted bg-muted/20">
                <img src={form.thumbnail} alt="썸네일 미리보기" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setThumbnailFile(file);
                const url = URL.createObjectURL(file);
                setForm((prev) => ({ ...prev, thumbnail: url }));
              }
            }}
          />
        </div>

        {/* 설명 */}
        <div>
          <Label className="font-bold mb-1 block">설명 *</Label>
          <Input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="간단한 테마 소개" required />
        </div>

        {/* 태그 */}
        <div>
          <Label className="font-bold mb-1 block">태그 *</Label>
          <div className="flex gap-2 mt-1 mb-2 flex-wrap">
            {form.tags.map((tag) => (
              <Badge key={tag} className="cursor-pointer" onClick={() => setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))}>
                #{tag}
              </Badge>
            ))}
          </div>
          <Input
            value={form.tagInput}
            onChange={(e) => setForm({ ...form, tagInput: e.target.value })}
            onKeyDown={(e) => {
              if (!isComposing && (e.key === "Enter" || e.key === ",")) {
                e.preventDefault();
                addTagsFromInput();
              }
            }}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="쉼표 또는 Enter로 구분"
          />
        </div>

        {/* 인원, 가격, 플레이타임, 난이도 */}
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col w-24">
            <Label className="font-bold mb-1 block">최소 인원 *</Label>
            <Input type="number" value={form.playersMin} onChange={(e) => setForm({ ...form, playersMin: e.target.value })} required />
          </div>
          <div className="flex flex-col w-24">
            <Label className="font-bold mb-1 block">최대 인원 *</Label>
            <Input type="number" value={form.playersMax} onChange={(e) => setForm({ ...form, playersMax: e.target.value })} required />
          </div>
          <div className="flex flex-col w-28">
            <Label className="font-bold mb-1 block">가격 *</Label>
            <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="₩" required />
          </div>
          <div className="flex flex-col w-32">
            <Label className="font-bold mb-1 block">시간 (분) *</Label>
            <Input type="number" value={form.playtime} onChange={(e) => setForm({ ...form, playtime: e.target.value })} placeholder="예: 90" required />
          </div>
          <div className="flex flex-col w-32">
            <Label className="font-bold mb-1 block">난이도 *</Label>
            <div className="flex gap-1 cursor-pointer w-fit" onMouseLeave={() => setHovered(null)}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Star
                  key={value}
                  className={`w-6 h-6 transition-colors ${(hovered ?? form.difficulty) >= value ? "text-yellow-400" : "text-muted-foreground"}`}
                  onMouseEnter={() => setHovered(value)}
                  onClick={() => setForm({ ...form, difficulty: value })}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 타입별 추가 필드 */}
        {form.type === "CRIMESCENE" && (
          <>
            <CrimeSceneFields
              extraFields={extraFields}
              setExtraFields={setExtraFields}
              onOpenTeamModal={() => setTeamModalOpen(true)}
              onOpenGuildModal={() => setGuildModalOpen(true)}
            />
            <TeamSelectModal open={isTeamModalOpen} onOpenChange={setTeamModalOpen} onSelect={(id, name) => setExtraFields(prev => ({ ...prev, makerTeamsId: id, makerTeamsName: name }))} />
            <GuildSelectModal open={isGuildModalOpen} onOpenChange={setGuildModalOpen} onSelect={(id, name) => setExtraFields(prev => ({ ...prev, guildSnowflake: id, guildName: name }))} />
          </>
        )}
        {form.type === "ESCAPEROOM" && <EscapeRoomFields extraFields={extraFields} setExtraFields={setExtraFields} />}
        {form.type === "MURDERMYSTERY" && <MurderMysteryFields extraFields={extraFields} setExtraFields={setExtraFields} />}
        {form.type === "REALWORLD" && <RealWorldFields extraFields={extraFields} setExtraFields={setExtraFields} />}

        {/* 본문 에디터 */}
        <div>
          <Label className="font-bold mb-1 block">본문 내용 *</Label>
          <div data-color-mode={theme === "dark" ? "dark" : "light"}>
            <div className="border rounded-md overflow-hidden">
              <MDEditor
                value={form.content}
                onChange={(val) => setForm({ ...form, content: val || "" })}
                height={400}
                preview="edit"
                commands={[{ name: "toggle-preview", keyCommand: "toggle-preview", icon: <WritePreviewToggle /> }, ...commands.getCommands()]}
                extraCommands={[]}
              />
            </div>
          </div>
        </div>

        {/* 제출 */}
        <div className="text-right">
          <Button
            onClick={handleSubmit}
            disabled={
              !form.title ||
              !form.tags.length ||
              !form.playersMin ||
              !form.playersMax ||
              !form.playtime ||
              !form.price ||
              !form.difficulty ||
              !form.content ||
              !form.thumbnail ||
              (form.type === "CRIMESCENE" && (!extraFields?.makerTeamsId || !extraFields?.guildSnowflake)) ||
              isLoading
            }
          >
            {mode === "edit" ? "수정" : "등록"}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
};

export default ThemeForm;