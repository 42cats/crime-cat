import React from 'react';
import { MessageSquare } from 'lucide-react';

interface ContentTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  minHeight?: string;
}

const ContentTextArea: React.FC<ContentTextAreaProps> = ({
  value,
  onChange,
  placeholder = "무슨 일이 일어나고 있나요?",
  maxLength = 500,
  minHeight = "120px"
}) => {
  // 입력 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  // 글자 수 색상 결정
  const getCharCountColor = () => {
    const ratio = value.length / maxLength;
    if (ratio >= 0.9) return 'text-destructive';
    if (ratio >= 0.8) return 'text-yellow-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center">
        <MessageSquare className="h-4 w-4 mr-1" />
        내용
      </label>
      
      <div className="relative">
        <textarea
          className="w-full p-3 rounded-md border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          style={{ minHeight }}
          rows={4}
        />
        
        {/* 글자 수 표시 */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          <span className={`text-xs ${getCharCountColor()}`}>
            {value.length}/{maxLength}
          </span>
        </div>
      </div>
      
      {/* 도움말 텍스트 */}
      <p className="text-xs text-muted-foreground">
        여러분의 생각을 자유롭게 표현해보세요.
      </p>
    </div>
  );
};

export default ContentTextArea;