import React, { useState } from 'react';
import { Card, Select, Input, InputNumber, Button, Space, Typography, Switch, Form, Row, Col, Tag, message } from 'antd';
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { ConditionConfig } from '../../types/buttonAutomation';
import { isValidDiscordId } from '../../utils/validation';

const { Title, Text } = Typography;
const { Option } = Select;

// 조건 타입 정의
export const CONDITION_TYPES = {
  role_required: {
    label: '필수 역할',
    description: '사용자가 이 역할들 중 하나 이상을 가져야 합니다',
    icon: '✅',
    type: 'array'
  },
  role_denied: {
    label: '차단 역할',
    description: '사용자가 이 역할들을 가지고 있으면 사용할 수 없습니다',
    icon: '❌',
    type: 'array'
  },
  channel_required: {
    label: '특정 채널에서만',
    description: '지정된 채널에서만 버튼을 사용할 수 있습니다',
    icon: '📍',
    type: 'single'
  },
  cooldown: {
    label: '쿨다운',
    description: '버튼 사용 후 재사용까지의 대기시간',
    icon: '⏰',
    type: 'number'
  },
  user_limit: {
    label: '사용 제한',
    description: '사용자당 사용 횟수 제한',
    icon: '🔢',
    type: 'number'
  },
  time_window: {
    label: '시간 제한',
    description: '특정 시간대에만 사용 가능',
    icon: '🕐',
    type: 'time'
  }
} as const;

interface ConditionEditorProps {
  conditions: ConditionConfig;
  onChange: (conditions: ConditionConfig) => void;
}

export const ConditionEditor: React.FC<ConditionEditorProps> = ({
  conditions,
  onChange
}) => {
  const [newRoleId, setNewRoleId] = useState('');
  const [newDeniedRoleId, setNewDeniedRoleId] = useState('');

  // 조건 업데이트 헬퍼
  const updateCondition = (key: keyof ConditionConfig, value: any) => {
    onChange({
      ...conditions,
      [key]: value
    });
  };

  // 필수 역할 추가
  const addRequiredRole = () => {
    if (!newRoleId.trim()) {
      message.warning('역할 ID를 입력해주세요.');
      return;
    }
    
    if (!isValidDiscordId(newRoleId)) {
      message.error('올바른 역할 ID를 입력해주세요.');
      return;
    }

    const currentRoles = conditions.requiredRoles || [];
    if (currentRoles.includes(newRoleId)) {
      message.warning('이미 추가된 역할입니다.');
      return;
    }

    updateCondition('requiredRoles', [...currentRoles, newRoleId]);
    setNewRoleId('');
  };

  // 필수 역할 제거
  const removeRequiredRole = (roleId: string) => {
    const currentRoles = conditions.requiredRoles || [];
    updateCondition('requiredRoles', currentRoles.filter(id => id !== roleId));
  };

  // 차단 역할 추가
  const addDeniedRole = () => {
    if (!newDeniedRoleId.trim()) {
      message.warning('역할 ID를 입력해주세요.');
      return;
    }
    
    if (!isValidDiscordId(newDeniedRoleId)) {
      message.error('올바른 역할 ID를 입력해주세요.');
      return;
    }

    const currentRoles = conditions.deniedRoles || [];
    if (currentRoles.includes(newDeniedRoleId)) {
      message.warning('이미 추가된 역할입니다.');
      return;
    }

    updateCondition('deniedRoles', [...currentRoles, newDeniedRoleId]);
    setNewDeniedRoleId('');
  };

  // 차단 역할 제거
  const removeDeniedRole = (roleId: string) => {
    const currentRoles = conditions.deniedRoles || [];
    updateCondition('deniedRoles', currentRoles.filter(id => id !== roleId));
  };

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
          
          <Row gutter={8} style={{ marginBottom: 8 }}>
            <Col flex="auto">
              <Input
                value={newRoleId}
                onChange={(e) => setNewRoleId(e.target.value)}
                placeholder="역할 ID 입력 (예: 123456789012345678)"
                onPressEnter={addRequiredRole}
              />
            </Col>
            <Col>
              <Button type="primary" icon={<PlusOutlined />} onClick={addRequiredRole}>
                추가
              </Button>
            </Col>
          </Row>
          
          <div style={{ minHeight: 32 }}>
            {(conditions.requiredRoles || []).map(roleId => (
              <Tag
                key={roleId}
                closable
                onClose={() => removeRequiredRole(roleId)}
                style={{ marginBottom: 4 }}
              >
                {roleId}
              </Tag>
            ))}
            {(!conditions.requiredRoles || conditions.requiredRoles.length === 0) && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                필수 역할이 설정되지 않으면 모든 사용자가 버튼을 사용할 수 있습니다
              </Text>
            )}
          </div>
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
          
          <Row gutter={8} style={{ marginBottom: 8 }}>
            <Col flex="auto">
              <Input
                value={newDeniedRoleId}
                onChange={(e) => setNewDeniedRoleId(e.target.value)}
                placeholder="역할 ID 입력 (예: 123456789012345678)"
                onPressEnter={addDeniedRole}
              />
            </Col>
            <Col>
              <Button type="primary" icon={<PlusOutlined />} onClick={addDeniedRole}>
                추가
              </Button>
            </Col>
          </Row>
          
          <div style={{ minHeight: 32 }}>
            {(conditions.deniedRoles || []).map(roleId => (
              <Tag
                key={roleId}
                color="red"
                closable
                onClose={() => removeDeniedRole(roleId)}
                style={{ marginBottom: 4 }}
              >
                {roleId}
              </Tag>
            ))}
            {(!conditions.deniedRoles || conditions.deniedRoles.length === 0) && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                차단 역할이 설정되지 않았습니다
              </Text>
            )}
          </div>
        </div>

        {/* 채널 제한 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <Title level={5} style={{ margin: 0, marginRight: 8 }}>
              📍 채널 제한
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              특정 채널에서만 버튼을 사용할 수 있도록 제한
            </Text>
          </div>
          
          <Input
            value={conditions.requiredChannel || ''}
            onChange={(e) => updateCondition('requiredChannel', e.target.value || null)}
            placeholder="채널 ID 입력 (비워두면 모든 채널에서 사용 가능)"
            status={conditions.requiredChannel && !isValidDiscordId(conditions.requiredChannel) ? 'error' : ''}
          />
          {conditions.requiredChannel && !isValidDiscordId(conditions.requiredChannel) && (
            <Text type="danger" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              올바른 채널 ID를 입력해주세요
            </Text>
          )}
        </div>

        {/* 쿨다운 설정 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <Title level={5} style={{ margin: 0, marginRight: 8 }}>
              ⏰ 쿨다운
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              버튼 사용 후 재사용까지의 대기시간 (초)
            </Text>
          </div>
          
          <Row gutter={16}>
            <Col span={12}>
              <InputNumber
                value={conditions.cooldown || 0}
                onChange={(value) => updateCondition('cooldown', value || 0)}
                min={0}
                max={86400} // 24시간
                style={{ width: '100%' }}
                placeholder="0"
                addonAfter="초"
              />
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12, lineHeight: '32px' }}>
                0으로 설정하면 쿨다운이 적용되지 않습니다
              </Text>
            </Col>
          </Row>
        </div>

        {/* 사용자별 사용 제한 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <Title level={5} style={{ margin: 0, marginRight: 8 }}>
              🔢 사용 제한
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              사용자당 버튼 사용 횟수 제한
            </Text>
          </div>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="1회만 사용" style={{ marginBottom: 0 }}>
                <Switch
                  checked={conditions.oncePerUser || false}
                  onChange={(checked) => updateCondition('oncePerUser', checked)}
                />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Text type="secondary" style={{ fontSize: 12, lineHeight: '32px' }}>
                활성화하면 각 사용자는 이 버튼을 한 번만 사용할 수 있습니다
              </Text>
            </Col>
          </Row>
        </div>

        {/* 시간 제한 (향후 확장용) */}
        <div style={{ opacity: 0.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <Title level={5} style={{ margin: 0, marginRight: 8 }}>
              🕐 시간 제한 <Tag color="blue" style={{ fontSize: 10 }}>향후 지원</Tag>
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              특정 시간대에만 버튼을 사용할 수 있도록 제한
            </Text>
          </div>
          
          <Row gutter={16}>
            <Col span={12}>
              <Input placeholder="시작 시간 (예: 09:00)" disabled />
            </Col>
            <Col span={12}>
              <Input placeholder="종료 시간 (예: 18:00)" disabled />
            </Col>
          </Row>
        </div>

        {/* 조건 요약 */}
        <Card size="small" style={{ backgroundColor: '#f8f9fa' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            <Text strong>설정된 조건 요약</Text>
          </div>
          
          <div style={{ fontSize: 12, lineHeight: 1.8 }}>
            {(conditions.requiredRoles && conditions.requiredRoles.length > 0) && (
              <div>✅ 필수 역할: {conditions.requiredRoles.length}개 설정됨</div>
            )}
            {(conditions.deniedRoles && conditions.deniedRoles.length > 0) && (
              <div>❌ 차단 역할: {conditions.deniedRoles.length}개 설정됨</div>
            )}
            {conditions.requiredChannel && (
              <div>📍 채널 제한: 특정 채널에서만 사용 가능</div>
            )}
            {conditions.cooldown && conditions.cooldown > 0 && (
              <div>⏰ 쿨다운: {conditions.cooldown}초</div>
            )}
            {conditions.oncePerUser && (
              <div>🔢 사용자당 1회만 사용 가능</div>
            )}
            
            {!conditions.requiredRoles?.length && 
             !conditions.deniedRoles?.length && 
             !conditions.requiredChannel && 
             !conditions.cooldown && 
             !conditions.oncePerUser && (
              <Text type="secondary">설정된 조건이 없습니다. 모든 사용자가 제한 없이 버튼을 사용할 수 있습니다.</Text>
            )}
          </div>
        </Card>
      </Space>
    </Card>
  );
};