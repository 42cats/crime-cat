import React, { useState } from 'react';
import { Button, Tag, Space, Popover, Typography } from 'antd';
import { SmileOutlined, CloseOutlined } from '@ant-design/icons';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const { Text } = Typography;

interface EmojiPickerProps {
  value?: string[];
  onChange: (emojis: string[]) => void;
  maxCount?: number;
  placeholder?: string;
  disabled?: boolean;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  value = [],
  onChange,
  maxCount = 10,
  placeholder = "이모지를 선택하세요",
  disabled = false
}) => {
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleEmojiSelect = (emoji: any) => {
    if (value.length < maxCount && !value.includes(emoji.native)) {
      onChange([...value, emoji.native]);
    }
    setPickerVisible(false);
  };

  const handleRemoveEmoji = (index: number) => {
    const newEmojis = value.filter((_, i) => i !== index);
    onChange(newEmojis);
  };

  const pickerContent = (
    <div style={{ width: 350 }}>
      <Picker 
        data={data}
        onEmojiSelect={handleEmojiSelect}
        theme="light"
        set="native"
        previewPosition="none"
        skinTonePosition="none"
      />
    </div>
  );

  return (
    <div>
      {/* 선택된 이모지 표시 */}
      {value.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <Space size={[4, 4]} wrap>
            {value.map((emoji, index) => (
              <Tag
                key={index}
                closable={!disabled}
                onClose={() => handleRemoveEmoji(index)}
                closeIcon={<CloseOutlined />}
                style={{
                  fontSize: '14px',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
              >
                {emoji}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {/* 이모지 선택 버튼 */}
      <Popover
        content={pickerContent}
        trigger="click"
        placement="bottomLeft"
        open={pickerVisible}
        onOpenChange={setPickerVisible}
        overlayStyle={{ zIndex: 1050 }}
      >
        <Button
          icon={<SmileOutlined />}
          disabled={disabled || value.length >= maxCount}
          style={{ width: '100%' }}
        >
          {value.length === 0 ? placeholder : `이모지 추가 (${value.length}/${maxCount})`}
        </Button>
      </Popover>

      {/* 도움말 텍스트 */}
      {maxCount > 1 && (
        <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
          최대 {maxCount}개까지 선택할 수 있습니다.
          {value.length > 0 && ` 현재 ${value.length}개 선택됨.`}
        </Text>
      )}
    </div>
  );
};