import React, { useState, useEffect } from 'react';
import { Select, Input, Space, Typography, Spin, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { isValidDiscordId } from '../../../utils/validation';

const { Option } = Select;
const { Text } = Typography;

interface Role {
  id: string;
  name: string;
  color: string;
  position: number;
}

interface RoleSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  guildId?: string;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  value,
  onChange,
  placeholder = "역할을 선택하거나 ID를 입력하세요",
  guildId
}) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [inputMode, setInputMode] = useState(false);

  // 역할 목록 로드 (실제 구현에서는 Discord API 연동)
  const loadRoles = async () => {
    if (!guildId) return;
    
    setLoading(true);
    try {
      // TODO: 실제 Discord API 연동
      // const response = await discordApi.getGuildRoles(guildId);
      
      // 임시 더미 데이터
      const dummyRoles: Role[] = [
        { id: '123456789012345678', name: '@everyone', color: '#99aab5', position: 0 },
        { id: '234567890123456789', name: '관리자', color: '#e74c3c', position: 10 },
        { id: '345678901234567890', name: '모더레이터', color: '#3498db', position: 5 },
        { id: '456789012345678901', name: '멤버', color: '#2ecc71', position: 1 },
        { id: '567890123456789012', name: 'VIP', color: '#f39c12', position: 3 },
      ];
      
      setRoles(dummyRoles.sort((a, b) => b.position - a.position));
    } catch (error) {
      console.error('Failed to load roles:', error);
      message.error('역할 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, [guildId]);

  // 검색 필터링
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    role.id.includes(searchValue)
  );

  // 역할 선택 핸들러
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

  // 역할 색상을 HEX로 변환
  const formatRoleColor = (color: string) => {
    if (color.startsWith('#')) return color;
    return `#${parseInt(color).toString(16).padStart(6, '0')}`;
  };

  if (inputMode) {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          placeholder="역할 ID를 직접 입력하세요 (예: 123456789012345678)"
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
      {filteredRoles.map(role => (
        <Option key={role.id} value={role.id}>
          <Space align="center">
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: formatRoleColor(role.color),
                border: '1px solid #d9d9d9'
              }}
            />
            <span>{role.name}</span>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {role.id}
            </Text>
          </Space>
        </Option>
      ))}
      
      {filteredRoles.length === 0 && searchValue && (
        <Option disabled value="">
          <Text type="secondary">검색 결과가 없습니다</Text>
        </Option>
      )}
    </Select>
  );
};