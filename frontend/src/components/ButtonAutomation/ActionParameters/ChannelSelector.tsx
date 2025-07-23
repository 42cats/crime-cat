import React, { useState, useEffect } from 'react';
import { Select, Input, Space, Typography, Spin, message, Tag } from 'antd';
import { SearchOutlined, HashtagOutlined, VolumeUpOutlined, MessageOutlined, TeamOutlined } from '@ant-design/icons';
import { isValidDiscordId } from '../../../utils/validation';
import { apiClient } from '../../../lib/api';

const { Option } = Select;
const { Text } = Typography;

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'category' | 'announcement' | 'stage' | 'special';
  typeKey?: string;
  position: number;
  parentId?: string;
  displayName?: string;
  emoji?: string;
}

interface ChannelSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  guildId?: string;
  channelTypes?: Channel['type'][];
}

// 특수 채널 옵션
const SPECIAL_CHANNELS = [
  {
    id: 'ROLE_CHANNEL',
    name: '역할별 채널 (자동 생성)',
    type: 'special',
    icon: <TeamOutlined />,
    color: '#f39c12',
    description: '사용자의 역할에 따라 자동으로 채널을 생성하여 전송'
  }
];

// Discord 채널 타입 매핑 (Discord API 타입 번호 → 문자열)
const DISCORD_CHANNEL_TYPES: { [key: number]: 'text' | 'voice' | 'category' | 'announcement' | 'stage' } = {
  0: 'text',        // GUILD_TEXT
  2: 'voice',       // GUILD_VOICE
  4: 'category',    // GUILD_CATEGORY
  5: 'announcement', // GUILD_ANNOUNCEMENT
  13: 'stage'       // GUILD_STAGE_VOICE
};

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
  },
  special: {
    icon: <TeamOutlined />,
    label: '특수',
    color: '#f39c12'
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

  // 채널 목록 로드 (실제 Discord API 연동)
  const loadChannels = async () => {
    if (!guildId) {
      return;
    }
    
    setLoading(true);
    try {
      // 실제 Discord API 연동
      const response = await apiClient.get<any[]>(`/auth/guilds/channels/${guildId}`);
      
      // API 응답을 Channel 인터페이스에 맞게 변환
      const apiChannels: Channel[] = response.map((apiChannel: any) => ({
        id: apiChannel.id,
        name: apiChannel.name,
        type: DISCORD_CHANNEL_TYPES[apiChannel.type] || 'text',
        typeKey: apiChannel.typeKey,
        position: apiChannel.position || 0,
        parentId: apiChannel.parentId,
        displayName: apiChannel.displayName,
        emoji: apiChannel.emoji
      }));
      
      let filteredChannels = apiChannels;
      
      // 채널 타입 필터링
      if (channelTypes && channelTypes.length > 0) {
        filteredChannels = apiChannels.filter(channel => 
          channelTypes.includes(channel.type)
        );
      }
      
      const sortedChannels = filteredChannels.sort((a, b) => a.position - b.position);
      setChannels(sortedChannels);
    } catch (error) {
      console.error('[ChannelSelector] 채널 로드 실패:', error);
      message.error('채널 목록을 불러오는데 실패했습니다.');
      setChannels([]);
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
      notFoundContent={loading ? <Spin size="small" /> : '옵션이 없습니다'}
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
      {/* 특수 채널 옵션들 - 직접 하드코딩 테스트 */}
      <Option key="ROLE_CHANNEL" value="ROLE_CHANNEL">
        <Space align="center">
          <span style={{ color: '#f39c12' }}>
            <TeamOutlined />
          </span>
          <span style={{ fontWeight: 'bold' }}>역할별 채널 (자동 생성)</span>
          <Tag color="#f39c12" size="small">
            특수
          </Tag>
        </Space>
      </Option>

      {/* 구분선 (특수 채널이 있고 일반 채널도 있을 때) */}
      {filteredChannels.length > 0 && (
        <Option disabled value="divider" style={{ borderTop: '1px solid #f0f0f0', margin: '4px 0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>일반 채널</Text>
        </Option>
      )}

      {/* 일반 채널들 */}
      {filteredChannels.map((channel, index) => {
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