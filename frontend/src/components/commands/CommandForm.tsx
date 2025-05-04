import React, { useContext, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import MDEditor, { commands, EditorContext } from "@uiw/react-md-editor";
import { useTheme } from "@/hooks/useTheme";
import { Command, CommandInput } from "@/lib/types";
import PageTransition from "@/components/PageTransition";
import { useFormValidator } from "@/hooks/useFormValidator";
import { useToast } from "@/hooks/useToast";

interface CommandFormProps {
  mode: "create" | "edit";
  title: string;
  initialData?: Partial<Command>;
  onSubmit: (data: CommandInput) => void;
  isLoading?: boolean;
}

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

const CommandForm: React.FC<CommandFormProps> = ({
  mode,
  title,
  initialData = {},
  onSubmit,
  isLoading = false,
}) => {
  const { theme } = useTheme();
  const { toast } = useToast();

  const [form, setForm] = useState<CommandInput>({
    name: initialData.name || "",
    description: initialData.description || "",
    usageExample: initialData.usageExample || "",
    category: initialData.category || "",
    requiredPermissions: initialData.requiredPermissions || [],
    content: initialData.content || "",
  });

  const [permInput, setPermInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const { errors, validateField, validateWithErrors } = useFormValidator<CommandInput>((data) => {
    const newErrors: Record<string, string> = {};
    if (!data.name) newErrors.name = "이름을 입력해주세요.";
    if (!data.description) newErrors.description = "설명을 입력해주세요.";
    if (!data.usageExample) newErrors.usageExample = "사용법을 입력해주세요.";
    if (!data.category) newErrors.category = "카테고리를 입력해주세요.";
    if (!data.content) newErrors.content = "본문 내용을 입력해주세요.";
    if (!data.requiredPermissions.length) newErrors.requiredPermissions = "권한을 최소 한 개 이상 입력해주세요.";
    return newErrors;
  });

  const handleAddPermission = () => {
    const value = permInput.trim().replace(/,$/, "");
    if (value && !form.requiredPermissions.includes(value)) {
      setForm((prev) => ({
        ...prev,
        requiredPermissions: [...prev.requiredPermissions, value],
      }));
    }
    setPermInput("");
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

    onSubmit(form);
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-6 py-20 space-y-6">
        <h1 className="text-3xl font-bold mb-8">{title}</h1>

        {/* 필드: 이름 */}
        <div>
          <Label className="font-bold mb-1 block">커맨드 이름 *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onBlur={() => validateField("name", form.name)}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        {/* 필드: 설명 */}
        <div>
          <Label className="font-bold mb-1 block">설명 *</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            onBlur={() => validateField("description", form.description)}
          />
          {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
        </div>

        {/* 필드: 사용 예시 */}
        <div>
          <Label className="font-bold mb-1 block">사용법 *</Label>
          <Input
            value={form.usageExample}
            onChange={(e) => setForm({ ...form, usageExample: e.target.value })}
            onBlur={() => validateField("usageExample", form.usageExample)}
          />
          {errors.usageExample && <p className="text-red-500 text-sm">{errors.usageExample}</p>}
        </div>

        {/* 필드: 카테고리 */}
        <div>
          <Label className="font-bold mb-1 block">카테고리 *</Label>
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            onBlur={() => validateField("category", form.category)}
          />
          {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
        </div>

        {/* 필드: 권한 */}
        <div>
          <Label className="font-bold mb-1 block">필수 권한 *</Label>
          <div className="flex gap-2 flex-wrap mt-1 mb-2">
            {form.requiredPermissions.map((perm) => (
              <Badge key={perm} onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  requiredPermissions: prev.requiredPermissions.filter((p) => p !== perm),
                }))
              } className="cursor-pointer">{perm}</Badge>
            ))}
          </div>
          <Input
            value={permInput}
            onChange={(e) => setPermInput(e.target.value)}
            onKeyDown={(e) => {
              if (!isComposing && (e.key === "Enter" || e.key === ",")) {
                e.preventDefault();
                handleAddPermission();
              }
            }}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="쉼표 또는 Enter로 구분"
            onBlur={() => validateField("requiredPermissions", form.requiredPermissions)}
          />
          {errors.requiredPermissions && <p className="text-red-500 text-sm">{errors.requiredPermissions}</p>}
        </div>

        {/* 필드: 본문 */}
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
                commands={[{ name: "toggle-preview", keyCommand: "toggle-preview", icon: <WritePreviewToggle /> }, ...commands.getCommands()]}
                extraCommands={[]}
              />
            </div>
          </div>
          {errors.content && <p className="text-red-500 text-sm">{errors.content}</p>}
        </div>

        <div className="text-right">
          <Button onClick={handleSubmit} disabled={isLoading}>
            {mode === "edit" ? "수정" : "등록"}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
};

export default CommandForm;