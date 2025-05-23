import React from "react";
import MDEditor, { commands } from "@uiw/react-md-editor";
import { useTheme } from "@/hooks/useTheme";
import { Label } from "@/components/ui/label";
import WritePreviewToggle from "./WritePreviewToggle";
import { videoCommand } from "./VideoCommand";

interface MarkdownEditorProps {
  /** 에디터 내용 */
  value: string;
  /** 에디터 내용 변경 핸들러 */
  onChange: (value?: string) => void;
  /** 에디터 blur 이벤트 핸들러 */
  onBlur?: () => void;
  /** 에디터 높이 */
  height?: number;
  /** 추가 명령어 (선택 사항) */
  extraCommands?: any[];
  /** 추가 CSS 클래스명 */
  className?: string;
  /** 미리보기 모드 */
  preview?: "edit" | "preview" | "live";
  /** placeholder 텍스트 */
  placeholder?: string;
  /** 드래그바 표시 여부 */
  visibledragbar?: boolean;
  /** textarea의 id 속성 */
  textareaId?: string;
  /** 라벨 텍스트 (있는 경우 라벨 표시) */
  label?: string;
  /** 에러 메시지 (있는 경우 에러 표시) */
  error?: string;
}

/**
 * 공통 Markdown 에디터 컴포넌트
 * 
 * 기능:
 * - Markdown 에디팅
 * - 작성/미리보기 토글
 * - 동영상 삽입 (YouTube, Vimeo)
 * - 테마 연동 (dark/light)
 */
const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onBlur,
  height = 400,
  extraCommands = [],
  className = "",
  preview = "edit",
  placeholder,
  visibledragbar = false,
  textareaId,
  label,
  error,
}) => {
  const { theme } = useTheme();

  // MDEditor에 전달할 props에서 커스텀 prop 제외
  const mdEditorProps = {
    value,
    onChange,
    onBlur,
    height,
    preview,
    placeholder,
    visibledragbar: visibledragbar ? "true" : "false",
    commands: [
      {
        name: "toggle-preview",
        keyCommand: "toggle-preview",
        icon: <WritePreviewToggle />,
      },
      videoCommand,
      ...commands.getCommands(),
    ],
    extraCommands,
    ...(textareaId && { textareaProps: { id: textareaId } })
  };

  return (
    <div>
      {label && (
        <Label className="font-bold mb-1 block">{label}</Label>
      )}
      <div data-color-mode={theme === "dark" ? "dark" : "light"}>
        <div className={`border rounded-md overflow-hidden ${className}`}>
          <MDEditor {...mdEditorProps} />
        </div>
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default MarkdownEditor;