import React, { useState } from 'react';
import { Card, Select, Input, InputNumber, Button, Space, Typography, Switch, Form, Row, Col, Tag, message } from 'antd';
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { ConditionConfig } from '../../types/buttonAutomation';
import { isValidDiscordId } from '../../utils/validation';
import { MultiRoleSelect } from '../ui/multi-role-select';
import { MultiChannelSelect } from '../ui/multi-channel-select';
import { ChannelProvider } from '../../contexts/ChannelContext';
import { CONDITION_TYPES } from '../../constants/conditionTypes';

const { Title, Text } = Typography;
const { Option } = Select;


interface ConditionEditorProps {
  conditions: ConditionConfig;
  onChange: (conditions: ConditionConfig) => void;
  guildId: string;
}

export const ConditionEditor: React.FC<ConditionEditorProps> = ({
  conditions,
  onChange,
  guildId
}) => {
  // 조건 업데이트 헬퍼
  const updateCondition = (key: keyof ConditionConfig, value: any) => {
    onChange({
      ...conditions,
      [key]: value
    });
  };

  // Channel Context Provider로 감싸서 렌더링
  return (
    <ChannelProvider guildId={guildId}>
      <ConditionEditorContent 
        conditions={conditions}
        updateCondition={updateCondition}
        guildId={guildId}
      />
    </ChannelProvider>
  );
};

// 실제 조건 편집기 내용
interface ConditionEditorContentProps {
  conditions: ConditionConfig;
  updateCondition: (key: keyof ConditionConfig, value: any) => void;
  guildId: string;
}

const ConditionEditorContent: React.FC<ConditionEditorContentProps> = ({
  conditions,
  updateCondition,
  guildId
}) => {
  // Legacy 지원을 위한 상태 (필요시)
  const [newChannelId, setNewChannelId] = useState('');

  return (
    <Card title="실행 조건 설정" size="small">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        
        {/* 필수 역할 조건 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <Title level={5} style={{ margin: 0, marginRight: 8 }}>
              ✅ 필수 역할
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              이 역할들 중 하나 이상을 가진 사용자만 버튼을 사용할 수 있습니다
            </Text>
          </div>
          
          <MultiRoleSelect 
            value={conditions.requiredRoles || []}
            onChange={(roles) => updateCondition('requiredRoles', roles)}
            guildId={guildId}
            placeholder="필수 역할 선택..."
            maxSelections={10}
          />
          
          {(!conditions.requiredRoles || conditions.requiredRoles.length === 0) && (
            <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
              필수 역할이 설정되지 않으면 모든 사용자가 버튼을 사용할 수 있습니다
            </Text>
          )}
        </div>

        {/* 차단 역할 조건 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <Title level={5} style={{ margin: 0, marginRight: 8 }}>
              ❌ 차단 역할
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              이 역할을 가진 사용자는 버튼을 사용할 수 없습니다
            </Text>
          </div>
          
          <MultiRoleSelect 
            value={conditions.deniedRoles || []}
            onChange={(roles) => updateCondition('deniedRoles', roles)}
            guildId={guildId}
            placeholder="차단 역할 선택..."
            maxSelections={10}
          />
          
          {(!conditions.deniedRoles || conditions.deniedRoles.length === 0) && (
            <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
              차단할 역할이 없으면 모든 사용자가 버튼을 사용할 수 있습니다
            </Text>
          )}
        </div>

        {/* 특정 채널 조건 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <Title level={5} style={{ margin: 0, marginRight: 8 }}>
              📍 특정 채널에서만
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              지정된 채널에서만 버튼을 사용할 수 있습니다
            </Text>
          </div>
          
          <MultiChannelSelect 
            value={conditions.requiredChannels || []}
            onChange={(channels) => updateCondition('requiredChannels', channels)}
            placeholder="허용 채널 선택..."
            maxSelections={5}
            channelTypes={['text', 'announcement']} // 텍스트 채널만
          />
          
          {(!conditions.requiredChannels || conditions.requiredChannels.length === 0) && (
            <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
              채널을 지정하지 않으면 모든 채널에서 사용할 수 있습니다
            </Text>
          )}
        </div>

        {/* 쿨다운 조건 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <Title level={5} style={{ margin: 0, marginRight: 8 }}>
              ⏰ 쿨다운
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              버튼 사용 후 재사용까지의 대기시간 (초)
            </Text>
          </div>
          
          <Row gutter={8} align="middle">
            <Col flex="auto">
              <InputNumber
                min={0}
                max={3600}
                value={conditions.cooldownSeconds}
                onChange={(value) => updateCondition('cooldownSeconds', value)}
                placeholder="0"
                style={{ width: '100%' }}
                addonAfter="초"
              />
            </Col>
            <Col>
              <Switch
                checked={Boolean(conditions.cooldownSeconds && conditions.cooldownSeconds > 0)}
                onChange={(checked) => updateCondition('cooldownSeconds', checked ? 60 : 0)}
                checkedChildren="ON"
                unCheckedChildren="OFF"
              />
            </Col>
          </Row>
          
          {conditions.cooldownSeconds && conditions.cooldownSeconds > 0 && (
            <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
              사용자는 {conditions.cooldownSeconds}초 후에 다시 버튼을 사용할 수 있습니다
            </Text>
          )}
        </div>

        {/* 사용자별 제한 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <Title level={5} style={{ margin: 0, marginRight: 8 }}>
              👤 사용자별 제한
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              한 번만 사용할 수 있도록 제한
            </Text>
          </div>
          
          <Switch
            checked={Boolean(conditions.oncePerUser)}
            onChange={(checked) => updateCondition('oncePerUser', checked)}
            checkedChildren="한 번만 사용"
            unCheckedChildren="무제한 사용"
          />
          
          {conditions.oncePerUser && (
            <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
              각 사용자는 이 버튼을 한 번만 사용할 수 있습니다
            </Text>
          )}
        </div>

      </Space>
    </Card>
  );
};