import React, { useContext } from "react";
import { EditorContext } from "@uiw/react-md-editor";

/**
 * Markdown 에디터의 작성/미리보기 토글 버튼 컴포넌트
 */
const WritePreviewToggle: React.FC = () => {
  const { preview, dispatch } = useContext(EditorContext);
  const base = "md-editor-toolbar-button h-[29px] px-2 text-sm font-bold rounded hover:bg-gray-100";
  const selected = "text-blue-600";
  const unselected = "text-gray-500";
  
  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => dispatch({ preview: "edit" })}
        className={`${base} ${preview === "edit" ? selected : unselected}`}
      >
        작성
      </button>
      <button
        type="button"
        onClick={() => dispatch({ preview: "preview" })}
        className={`${base} ${preview === "preview" ? selected : unselected}`}
      >
        미리보기
      </button>
    </div>
  );
};

export default WritePreviewToggle;