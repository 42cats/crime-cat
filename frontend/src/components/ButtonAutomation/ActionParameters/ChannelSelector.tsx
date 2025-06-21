import React, { useState, useEffect } from 'react';
import { Select, Input, Space, Typography, Spin, message, Tag } from 'antd';
import { SearchOutlined, HashtagOutlined, VolumeUpOutlined, MessageOutlined } from '@ant-design/icons';
import { isValidDiscordId } from '../../../utils/validation';

const { Option } = Select;
const { Text } = Typography;

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'category' | 'announcement' | 'stage';
  position: number;
  parent?: string;
}

interface ChannelSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  guildId?: string;
  channelTypes?: Channel['type'][];
}

// 채널 타입별 아이콘 및 설명
const CHANNEL_TYPE_CONFIG = {
  text: {
    icon: <HashtagOutlined />,
    label: '텍스트',
    color: '#5865f2'
  },
  voice: {
    icon: <VolumeUpOutlined />,
    label: '음성',
    color: '#57f287'
  },
  announcement: {
    icon: <MessageOutlined />,
    label: '공지',
    color: '#fee75c'
  },
  stage: {
    icon: <VolumeUpOutlined />,
    label: '스테이지',
    color: '#eb459e'
  },
  category: {
    icon: <MessageOutlined />,
    label: '카테고리',
    color: '#99aab5'
  }
};

export const ChannelSelector: React.FC<ChannelSelectorProps> = ({
  value,
  onChange,
  placeholder = "채널을 선택하거나 ID를 입력하세요",
  guildId,
  channelTypes
}) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [inputMode, setInputMode] = useState(false);

  // 채널 목록 로드 (실제 구현에서는 Discord API 연동)
  const loadChannels = async () => {
    if (!guildId) return;
    
    setLoading(true);
    try {
      // TODO: 실제 Discord API 연동
      // const response = await discordApi.getGuildChannels(guildId);
      
      // 임시 더미 데이터
      const dummyChannels: Channel[] = [
        { id: '123456789012345678', name: '일반', type: 'text', position: 0 },
        { id: '234567890123456789', name: '공지사항', type: 'announcement', position: 1 },
        { id: '345678901234567890', name: '게임-토크', type: 'text', position: 2 },
        { id: '456789012345678901', name: '음성채널', type: 'voice', position: 3 },
        { id: '567890123456789012', name: '스테이지', type: 'stage', position: 4 },
        { id: '678901234567890123', name: '자유수다', type: 'text', position: 5 },
        { id: '789012345678901234', name: '로비', type: 'voice', position: 6 },
      ];
      
      let filteredChannels = dummyChannels;
      
      // 채널 타입 필터링
      if (channelTypes && channelTypes.length > 0) {
        filteredChannels = dummyChannels.filter(channel => 
          channelTypes.includes(channel.type)
        );
      }
      
      setChannels(filteredChannels.sort((a, b) => a.position - b.position));
    } catch (error) {
      console.error('Failed to load channels:', error);
      message.error('채널 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, [guildId, channelTypes]);

  // 검색 필터링
  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    channel.id.includes(searchValue)
  );

  // 채널 선택 핸들러
  const handleSelect = (selectedValue: string) => {
    if (selectedValue === 'manual_input') {
      setInputMode(true);
      return;
    }
    
    onChange?.(selectedValue);
    setInputMode(false);
  };

  // 수동 입력 핸들러
  const handleManualInput = (inputValue: string) => {
    if (isValidDiscordId(inputValue)) {
      onChange?.(inputValue);
      setInputMode(false);
    }
  };

  if (inputMode) {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          placeholder="채널 ID를 직접 입력하세요 (예: 123456789012345678)"
          onPressEnter={(e) => handleManualInput(e.currentTarget.value)}
          onBlur={(e) => {
            if (e.target.value) {
              handleManualInput(e.target.value);
            } else {
              setInputMode(false);
            }
          }}
          autoFocus
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          Enter를 누르거나 다른 곳을 클릭하여 확정하세요
        </Text>
      </Space>
    );
  }

  return (
    <Select
      value={value}
      onChange={handleSelect}
      placeholder={placeholder}
      style={{ width: '100%' }}
      showSearch
      searchValue={searchValue}
      onSearch={setSearchValue}
      filterOption={false}
      loading={loading}
      dropdownRender={(menu) => (
        <div>
          {menu}
          <div style={{ padding: 8, borderTop: '1px solid #f0f0f0' }}>
            <Select.Option value="manual_input">
              <Space>
                <SearchOutlined />
                <span>직접 ID 입력...</span>
              </Space>
            </Select.Option>
          </div>
        </div>
      )}
    >
      {filteredChannels.map(channel => {
        const typeConfig = CHANNEL_TYPE_CONFIG[channel.type];
        
        return (
          <Option key={channel.id} value={channel.id}>
            <Space align="center">
              <span style={{ color: typeConfig.color }}>
                {typeConfig.icon}
              </span>
              <span>{channel.name}</span>
              <Tag color={typeConfig.color} size="small">
                {typeConfig.label}
              </Tag>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {channel.id}
              </Text>
            </Space>
          </Option>
        );
      })}
      
      {filteredChannels.length === 0 && searchValue && (
        <Option disabled value="">
          <Text type="secondary">검색 결과가 없습니다</Text>
        </Option>
      )}
      
      {filteredChannels.length === 0 && !searchValue && channelTypes && (
        <Option disabled value="">
          <Text type="secondary">
            {channelTypes.map(type => CHANNEL_TYPE_CONFIG[type].label).join(', ')} 채널이 없습니다
          </Text>
        </Option>
      )}
    </Select>
  );
};