import React, { useState, useContext, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import MDEditor, { commands, EditorContext } from "@uiw/react-md-editor";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { X } from "lucide-react";

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
  const { toast } = useToast();

  const [form, setForm] = useState({
    type: initialData.type || initialType || "CRIMESCENE",
    title: initialData.title || "",
    summary: initialData.summary || "",
    tags: initialData.tags || [],
    tagInput: "",
    playerMin: initialData.playersMin || "",
    playerMax: initialData.playersMax || "",
    playtimeMin: initialData.playTimeMin || "",
    playtimeMax: initialData.playTimeMax || "",
    price: initialData.price || "",
    difficulty: initialData.difficulty || 0,
    content: initialData.content || "",
    thumbnail: initialData.thumbnail || "",
    publicStatus: initialData.publicStatus ?? true,
    recommendationEnabled: initialData.recommendationEnabled ?? true,
    commentEnabled: initialData.commentEnabled ?? true,
  });

  const initialExtraFields = React.useMemo(() => {
    if (mode === "edit" && initialData && initialData.type === "CRIMESCENE") {
      return {
        makerMode: initialData.team ? "team" : "personal",
        makerTeamsId: initialData.team?.id || "",
        makerTeamsName: initialData.team?.name || "",
        guildSnowflake: initialData.guild?.snowflake || "",
        guildName: initialData.guild?.name || "",
        extra: initialData.extra || { characters: [] },
      };
    }
    return initialExtraFieldsMap[initialType] || {};
  }, []);

  const [extraFields, setExtraFields] = useState<any>(initialExtraFields);

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isTeamModalOpen, setTeamModalOpen] = useState(false);
  const [isGuildModalOpen, setGuildModalOpen] = useState(false);

  const didMountRef = useRef(false);

  React.useEffect(() => {
    if (didMountRef.current) {
      setExtraFields(initialExtraFieldsMap[form.type as keyof typeof initialExtraFieldsMap]);
    } else {
      didMountRef.current = true;
    }
  }, [form.type]);
  const { errors, validateField, validateWithErrors } = useFormValidator((data: Record<string, any>) => {
    const newErrors: Record<string, string> = {};
    if (!data.title || data.title.trim() == "") newErrors.title = "제목은 필수입니다.";
    if (!data.summary || data.summary.trim() == "") newErrors.summary = "설명은 필수입니다.";
    if (!data.tags || data.tags.length === 0) newErrors.tags = "태그를 하나 이상 입력해주세요.";
    if (!data.playerMin || Number(data.playerMin) <= 0) newErrors.playerMin = "최소 인원은 1명 이상이어야 합니다.";
    if (!data.playerMax || Number(data.playerMax) < Number(data.playerMin)) newErrors.playerMax = "최대 인원은 최소 인원보다 같거나 커야 합니다.";
    if (!data.playtimeMin || Number(data.playtimeMin) <= 0) newErrors.playtimeMin = "최소 시간은 1분 이상이어야 합니다.";
    if (!data.playtimeMax || Number(data.playtimeMax) < Number(data.playtimeMin)) newErrors.playtimeMax = "최대 시간은 최소 시간보다 같거나 커야 합니다.";
    if (!data.price || Number(data.price) < 0) newErrors.price = "가격은 0 이상이어야 합니다.";
    if (!data.difficulty || Number(data.difficulty) < 1) newErrors.difficulty = "난이도를 선택해주세요.";
    if (!data.content || data.content.trim() == "") newErrors.content = "본문 내용을 작성해주세요.";
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
    const currentErrors = validateWithErrors(form);
    const errorMessages = Object.values(currentErrors);
    
    if (errorMessages.length > 0) {
      toast({
        title: "입력 오류",
        description: (
          <div>
            {errorMessages.map((msg, idx) => (
              <div key={idx}>{msg}</div>
            ))}
          </div>
        ),
        variant: "destructive",
      });
      return;
    }

    const { tagInput, ...data } = form;
    const formData = new FormData();

    if (thumbnailFile instanceof File) {
      formData.append("thumbnail", thumbnailFile);
    }

    const jsonData: any = {
      title: data.title.trim(),
      summary: data.summary.trim(),
      tags: data.tags,
      content: data.content.trim(),
      playerMin: Number(data.playerMin),
      playerMax: Number(data.playerMax),
      playtimeMin: Number(data.playtimeMin),
      playtimeMax: Number(data.playtimeMax),
      price: Number(data.price),
      difficulty: Number(data.difficulty),
      publicStatus: data.publicStatus,
      recommendationEnabled: data.recommendationEnabled,
      commentEnabled: data.commentEnabled,
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

  const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

  const isValidImageFile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(img.src); // 메모리 해제
        resolve(true);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(false);
      };
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFileInput = () => {
    fileInputRef.current!.value = "";
    setForm((prev) => ({ ...prev, thumbnail: "" }));
    setThumbnailFile(undefined);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      toast({
        title: "파일 크기 초과",
        description: "2MB 이하의 이미지만 업로드할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    const isImage = await isValidImageFile(file);
    if (!isImage) {
      toast({
        title: "유효하지 않은 이미지입니다",
        description: "정상적인 이미지 파일만 업로드 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    const previewURL = URL.createObjectURL(file);
    setThumbnailFile(file);
    setForm((prev) => ({ ...prev, thumbnail: previewURL }));
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-6 py-20 space-y-6">
        <h1 className="text-3xl font-bold mb-8">{title}</h1>
  
        {/* 카테고리 드롭다운 */}
        <div>
          <Label className="font-bold mb-1 block">카테고리 *</Label>
          <Select
            value={form.type}
            onValueChange={(val) => setForm({ ...form, type: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="타입을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CRIMESCENE">크라임씬</SelectItem>
              <SelectItem value="ESCAPE_ROOM">방탈출</SelectItem>
              <SelectItem value="MURDER_MYSTERY">머더미스터리</SelectItem>
              <SelectItem value="REALWORLD">리얼월드</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
        </div>
  
        {/* 공개 / 추천 / 댓글 여부 설정 */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Label className="font-bold mb-1">공개</Label>
            <Switch
              checked={form.publicStatus}
              onCheckedChange={(v) => setForm((prev) => ({ ...prev, publicStatus: v }))}
            />
            <span className="text-sm text-muted-foreground">{form.publicStatus ? "공개" : "비공개"}</span>
          </div>

          <div className="flex items-center gap-2">
            <Label className="font-bold mb-1">추천 허용</Label>
            <Switch
              checked={form.recommendationEnabled}
              onCheckedChange={(v) => setForm((prev) => ({ ...prev, recommendationEnabled: v }))}
            />
            <span className="text-sm text-muted-foreground">
              {form.recommendationEnabled ? "허용" : "차단"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Label className="font-bold mb-1">댓글 허용</Label>
            <Switch
              checked={form.commentEnabled}
              onCheckedChange={(v) => setForm((prev) => ({ ...prev, commentEnabled: v }))}
            />
            <span className="text-sm text-muted-foreground">
              {form.commentEnabled ? "허용" : "차단"}
            </span>
          </div>
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
          <Label className="font-bold mb-1 block">썸네일</Label>
          {form.thumbnail && (
            <div className="mb-2 flex justify-center relative">
      <div className="w-full max-w-sm h-48 rounded overflow-hidden border border-muted bg-muted/20 relative">
        <img
          src={form.thumbnail}
          alt="썸네일 미리보기"
          className="w-full h-full object-cover"
        />
        <button
          type="button"
          onClick={resetFileInput}
          className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 shadow transition-colors"
        >
          <X className="w-4 h-4 text-gray-700" />
        </button>
      </div>
            </div>
          )}
          <Input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
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