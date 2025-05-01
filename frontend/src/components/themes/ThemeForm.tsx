import React, { useState, useContext } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { useFormValidator } from "@/hooks/useFormValidator";

interface ThemeFormProps {
  mode: "create" | "edit";
  title: string;
  initialData?: Partial<any>;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

const initialExtraFieldsMap = {
  CRIMESCENE: { makerTeamsId: "", makerTeamsName: "", guildSnowflake: "", guildName: "", extra: { characters: [] } },
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
    type: initialData.type || initialType || "CRIMESCENE",
    title: initialData.title || "",
    summary: initialData.summary || "",
    tags: initialData.tags || [],
    tagInput: "",
    playerMin: initialData.playerMin || "",
    playerMax: initialData.playerMax || "",
    playtimeMin: initialData.playtimeMin || "",
    playtimeMax: initialData.playtimeMax || "",
    price: initialData.price || "",
    difficulty: initialData.difficulty || 0,
    content: initialData.content || "",
    thumbnail: initialData.thumbnail || "",
    publicStatus: initialData.publicStatus ?? true,
  });

  const [extraFields, setExtraFields] = useState<any>(
    initialExtraFieldsMap[form.type as keyof typeof initialExtraFieldsMap] || {}
  );

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isTeamModalOpen, setTeamModalOpen] = useState(false);
  const [isGuildModalOpen, setGuildModalOpen] = useState(false);

  const { errors, validate, validateField } = useFormValidator((data: Record<string, any>) => {
    const newErrors: Record<string, string> = {};
    if (!data.title) newErrors.title = "제목은 필수입니다.";
    if (!data.summary) newErrors.summary = "설명은 필수입니다.";
    if (!data.tags || data.tags.length === 0) newErrors.tags = "태그를 하나 이상 입력해주세요.";
    if (!data.playerMin || data.playerMin <= 0) newErrors.playerMin = "최소 인원은 1명 이상이어야 합니다.";
    if (!data.playerMax || data.playerMax < data.playerMin) newErrors.playerMax = "최대 인원은 최소 인원보다 같거나 커야 합니다.";
    if (!data.playtimeMin || data.playtimeMin <= 0) newErrors.playtimeMin = "최소 시간은 1분 이상이어야 합니다.";
    if (!data.playtimeMax || data.playtimeMax < data.playtimeMin) newErrors.playtimeMax = "최대 시간은 최소 시간보다 같거나 커야 합니다.";
    if (!data.price || data.price < 0) newErrors.price = "가격은 0 이상이어야 합니다.";
    if (!data.difficulty || data.difficulty < 1) newErrors.difficulty = "난이도를 선택해주세요.";
    if (!data.content) newErrors.content = "본문 내용을 작성해주세요.";
    if (
      data.type === "CRIMESCENE" &&
      extraFields.makerMode === "team" &&
      (!extraFields.makerTeamsId || extraFields.makerTeamsId.trim() === "")
    ) {
      newErrors.makerTeamsId = "팀 선택이 필요합니다.";
    }
    return newErrors;
  });

  const addTagsFromInput = () => {
    const parts = form.tagInput.split(",").map((t) => t.trim()).filter((t) => t.length > 0 && !form.tags.includes(t));
    if (parts.length > 0) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, ...parts], tagInput: "" }));
    }
  };

  const handleSubmit = () => {
    const isValid = validate(form);
    if (!isValid) return;

    const { tagInput, ...data } = form;
    const formData = new FormData();

    if (thumbnailFile instanceof File) {
      formData.append("thumbnail", thumbnailFile);
    }

    const jsonData: any = {
      title: data.title,
      summary: data.summary,
      tags: data.tags,
      content: data.content,
      playerMin: Number(data.playerMin),
      playerMax: Number(data.playerMax),
      playtimeMin: Number(data.playtimeMin),
      playtimeMax: Number(data.playtimeMax),
      price: Number(data.price),
      difficulty: Number(data.difficulty),
      publicStatus: data.publicStatus,
      type: data.type,
    };

    if (data.type === "CRIMESCENE" && extraFields) {
      jsonData.makerTeamsId = extraFields.makerTeamsId || null;
      jsonData.guildSnowflake = extraFields.guildSnowflake || null;
      if (extraFields.extra) {
        jsonData.extra = extraFields.extra;
      }
    }

    formData.append("data", new Blob([JSON.stringify(jsonData)], { type: "application/json" }));
    onSubmit(formData);
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-6 py-20 space-y-6">
        <h1 className="text-3xl font-bold mb-8">{title}</h1>
  
        {/* 카테고리 드롭다운 */}
        <div>
          <Label className="font-bold mb-1 block">카테고리 *</Label>
          <select
            className="w-full border rounded p-2"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="CRIMESCENE">크라임씬</option>
            <option value="ESCAPE_ROOM">방탈출</option>
            <option value="MURDER_MYSTERY">머더미스터리</option>
            <option value="REALWORLD">리얼월드</option>
          </select>
          {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
        </div>
  
        {/* 공개 여부 토글 */}
        <div className="flex items-center gap-4">
          <Label className="font-bold mb-1">공개 여부 *</Label>
          <Switch
            checked={form.publicStatus}
            onCheckedChange={(v) => setForm((prev) => ({ ...prev, publicStatus: v }))}
          />
          <span>{form.publicStatus ? "공개" : "비공개"}</span>
        </div>
  
        {/* 제목 */}
        <div>
          <Label className="font-bold mb-1 block">제목 *</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            onBlur={() => validateField("title", form.title)}
            placeholder="테마 제목"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
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
          <Input
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            onBlur={() => validateField("summary", form.summary)}
            placeholder="간단한 테마 소개"
          />
          {errors.summary && <p className="text-red-500 text-sm mt-1">{errors.summary}</p>}
        </div>
  
        {/* 태그 입력 */}
        <div>
          <Label className="font-bold mb-1 block">태그 *</Label>
          <div className="flex gap-2 mt-1 mb-2 flex-wrap">
            {form.tags.map((tag) => (
              <Badge
                key={tag}
                className="cursor-pointer"
                onClick={() => setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))}
              >
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
          {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags}</p>}
        </div>
  
        {/* 인원/가격/시간/난이도 */}
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col w-24">
            <Label className="font-bold mb-1 block">최소 인원 *</Label>
            <Input
              type="number"
              value={form.playerMin}
              onChange={(e) => setForm({ ...form, playerMin: e.target.value })}
              onBlur={() => validateField("playerMin", form.playerMin)}
            />
            {errors.playerMin && <p className="text-red-500 text-sm mt-1">{errors.playerMin}</p>}
          </div>
          <div className="flex flex-col w-24">
            <Label className="font-bold mb-1 block">최대 인원 *</Label>
            <Input
              type="number"
              value={form.playerMax}
              onChange={(e) => setForm({ ...form, playerMax: e.target.value })}
              onBlur={() => validateField("playerMax", form.playerMax)}
            />
            {errors.playerMax && <p className="text-red-500 text-sm mt-1">{errors.playerMax}</p>}
          </div>
          <div className="flex flex-col w-28">
            <Label className="font-bold mb-1 block">최소 시간 *</Label>
            <Input
              type="number"
              value={form.playtimeMin}
              onChange={(e) => setForm({ ...form, playtimeMin: e.target.value })}
              onBlur={() => validateField("playtimeMin", form.playtimeMin)}
              placeholder="예: 60"
            />
            {errors.playtimeMin && <p className="text-red-500 text-sm mt-1">{errors.playtimeMin}</p>}
          </div>
          <div className="flex flex-col w-28">
            <Label className="font-bold mb-1 block">최대 시간 *</Label>
            <Input
              type="number"
              value={form.playtimeMax}
              onChange={(e) => setForm({ ...form, playtimeMax: e.target.value })}
              onBlur={() => validateField("playtimeMax", form.playtimeMax)}
              placeholder="예: 120"
            />
            {errors.playtimeMax && <p className="text-red-500 text-sm mt-1">{errors.playtimeMax}</p>}
          </div>
          <div className="flex flex-col w-28">
            <Label className="font-bold mb-1 block">가격 *</Label>
            <Input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              onBlur={() => validateField("price", form.price)}
              placeholder="₩"
            />
            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
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
            {errors.difficulty && <p className="text-red-500 text-sm mt-1">{errors.difficulty}</p>}
          </div>
        </div>
        {/* 타입별 추가필드 */}
        {form.type === "CRIMESCENE" && (
          <>
            <CrimeSceneFields
              extraFields={extraFields}
              setExtraFields={setExtraFields}
              onOpenTeamModal={() => setTeamModalOpen(true)}
              onOpenGuildModal={() => setGuildModalOpen(true)}
            />
            <TeamSelectModal
              open={isTeamModalOpen}
              onOpenChange={setTeamModalOpen}
              onSelect={(id, name) =>
                setExtraFields((prev) => ({
                  ...prev,
                  makerTeamsId: id,
                  makerTeamsName: name,
                }))
              }
            />
            <GuildSelectModal
              open={isGuildModalOpen}
              onOpenChange={setGuildModalOpen}
              onSelect={(id, name) =>
                setExtraFields((prev) => ({
                  ...prev,
                  guildSnowflake: id,
                  guildName: name,
                }))
              }
            />
            {errors.makerTeamsId && (
              <p className="text-red-500 text-sm mt-2">
                팀을 선택해주세요.
              </p>
            )}
          </>
        )}
        {form.type === "ESCAPE_ROOM" && (
          <EscapeRoomFields extraFields={extraFields} setExtraFields={setExtraFields} />
        )}
        {form.type === "MURDER_MYSTERY" && (
          <MurderMysteryFields extraFields={extraFields} setExtraFields={setExtraFields} />
        )}
        {form.type === "REALWORLD" && (
          <RealWorldFields extraFields={extraFields} setExtraFields={setExtraFields} />
        )}

        {/* 본문 */}
        <div>
          <Label className="font-bold mb-1 block">본문 내용 *</Label>
          <div data-color-mode={theme === "dark" ? "dark" : "light"}>
            <div className="border rounded-md overflow-hidden">
              <MDEditor
                value={form.content}
                onChange={(val) => setForm({ ...form, content: val || "" })}
                onBlur={() => validateField("content", form.content)}
                height={400}
                preview="edit"
                commands={[
                  {
                    name: "toggle-preview",
                    keyCommand: "toggle-preview",
                    icon: <WritePreviewToggle />,
                  },
                  ...commands.getCommands(),
                ]}
                extraCommands={[]}
              />
            </div>
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content}</p>
            )}
          </div>
        </div>

        {/* 제출 */}
        <div className="text-right">
          <Button onClick={handleSubmit} disabled={isLoading}>
            {mode === "edit" ? "수정" : "등록"}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
};

export default ThemeForm; 