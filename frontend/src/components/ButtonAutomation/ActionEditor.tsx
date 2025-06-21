import React, { useState, useEffect } from 'react';
import { Card, Select, Input, InputNumber, Button, Space, Row, Col, Typography, Divider, Switch, Form, message } from 'antd';
import { DeleteOutlined, PlusOutlined, DragOutlined } from '@ant-design/icons';
import { ActionConfig, ActionType } from '../../types/buttonAutomation';
import { DISCORD_LIMITS, validateActionCount, isValidDiscordId } from '../../utils/validation';
import { MusicParameterEditor } from './ActionParameters/MusicParameterEditor';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 액션 타입 정의
export const ACTION_TYPES = {
  // 역할 관리
  add_role: {
    label: '역할 추가',
    icon: '👥',
    description: '사용자에게 역할을 추가합니다',
    parameters: ['roleId'],
    requiredPermissions: ['MANAGE_ROLES']
  },
  remove_role: {
    label: '역할 제거',
    icon: '👤',
    description: '사용자의 역할을 제거합니다',
    parameters: ['roleId'],
    requiredPermissions: ['MANAGE_ROLES']
  },
  toggle_role: {
    label: '역할 토글',
    icon: '🔄',
    description: '역할이 있으면 제거, 없으면 추가합니다',
    parameters: ['roleId'],
    requiredPermissions: ['MANAGE_ROLES']
  },
  
  // 닉네임 관리
  change_nickname: {
    label: '닉네임 변경',
    icon: '✏️',
    description: '사용자의 닉네임을 변경합니다',
    parameters: ['nickname'],
    requiredPermissions: ['MANAGE_NICKNAMES']
  },
  reset_nickname: {
    label: '닉네임 초기화',
    icon: '🔄',
    description: '사용자의 닉네임을 원래대로 복원합니다',
    parameters: [],
    requiredPermissions: ['MANAGE_NICKNAMES']
  },
  
  // 메시지 관리
  send_message: {
    label: '메시지 전송',
    icon: '💬',
    description: '지정된 채널에 메시지를 전송합니다',
    parameters: ['channelId', 'message'],
    requiredPermissions: ['SEND_MESSAGES']
  },
  send_dm: {
    label: 'DM 전송',
    icon: '📨',
    description: '사용자에게 개인 메시지를 전송합니다',
    parameters: ['message'],
    requiredPermissions: []
  },
  
  // 음성 채널 관리
  move_voice_channel: {
    label: '음성 채널 이동',
    icon: '🎵',
    description: '사용자를 다른 음성 채널로 이동시킵니다',
    parameters: ['channelId'],
    requiredPermissions: ['MOVE_MEMBERS']
  },
  disconnect_voice: {
    label: '음성 채널 연결 해제',
    icon: '🔇',
    description: '사용자를 음성 채널에서 연결 해제합니다',
    parameters: [],
    requiredPermissions: ['MOVE_MEMBERS']
  },
  
  // 채널 관리
  set_slowmode: {
    label: '슬로우모드 설정',
    icon: '⏰',
    description: '채널의 슬로우모드를 설정합니다',
    parameters: ['channelId', 'seconds'],
    requiredPermissions: ['MANAGE_CHANNELS']
  },
  
  // 음악 관리
  play_music: {
    label: '음악 재생',
    icon: '🎵',
    description: '선택한 음악을 재생합니다',
    parameters: ['source', 'trackId', 'trackTitle', 'duration', 'stopBehavior', 'volume'],
    requiredPermissions: ['CONNECT', 'SPEAK'],
    category: 'music'
  },
  stop_music: {
    label: '음악 정지',
    icon: '⏹️',
    description: '현재 재생 중인 음악을 정지합니다',
    parameters: [],
    requiredPermissions: ['CONNECT', 'SPEAK'],
    category: 'music'
  },
  pause_music: {
    label: '음악 일시정지/재개',
    icon: '⏸️',
    description: '현재 재생 중인 음악을 일시정지하거나 재개합니다',
    parameters: [],
    requiredPermissions: ['CONNECT', 'SPEAK'],
    category: 'music'
  }
} as const;

interface ActionEditorProps {
  actions: ActionConfig[];
  onChange: (actions: ActionConfig[]) => void;
  maxActions?: number;
  guildId?: string;
  userId?: string;
}

export const ActionEditor: React.FC<ActionEditorProps> = ({
  actions,
  onChange,
  maxActions = DISCORD_LIMITS.MAX_ACTIONS_PER_BUTTON,
  guildId,
  userId
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // 액션 추가
  const addAction = () => {
    if (actions.length >= maxActions) {
      message.warning(`최대 ${maxActions}개의 액션만 추가할 수 있습니다.`);
      return;
    }

    const newAction: ActionConfig = {
      type: 'add_role',
      target: 'executor',
      parameters: {},
      delay: 0,
      result: {
        message: '',
        visibility: 'private'
      }
    };

    onChange([...actions, newAction]);
  };

  // 액션 제거
  const removeAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    onChange(newActions);
  };

  // 액션 업데이트
  const updateAction = (index: number, updates: Partial<ActionConfig>) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    onChange(newActions);
  };

  // 액션 파라미터 업데이트
  const updateActionParameter = (index: number, paramKey: string, value: any) => {
    const newActions = [...actions];
    newActions[index] = {
      ...newActions[index],
      parameters: {
        ...newActions[index].parameters,
        [paramKey]: value
      }
    };
    onChange(newActions);
  };

  // 액션 순서 변경 (드래그 앤 드롭)
  const moveAction = (fromIndex: number, toIndex: number) => {
    const newActions = [...actions];
    const movedAction = newActions.splice(fromIndex, 1)[0];
    newActions.splice(toIndex, 0, movedAction);
    onChange(newActions);
  };

  // 드래그 이벤트 핸들러
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveAction(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  // 액션 타입별 파라미터 렌더링
  const renderActionParameters = (action: ActionConfig, index: number) => {
    const actionType = ACTION_TYPES[action.type as keyof typeof ACTION_TYPES];
    if (!actionType) return null;

    // 음악 액션인 경우 전용 에디터 사용
    if (actionType.category === 'music') {
      return (
        <div style={{ marginTop: 16 }}>
          <MusicParameterEditor
            action={action}
            onChange={(parameters) => {
              const newActions = [...actions];
              newActions[index] = { ...action, parameters };
              onChange(newActions);
            }}
            guildId={guildId}
            userId={userId}
          />
        </div>
      );
    }

    // 기존 액션들의 파라미터 렌더링
    return (
      <div style={{ marginTop: 16 }}>
        {actionType.parameters.includes('roleId') && (
          <Form.Item label="역할 ID" style={{ marginBottom: 12 }}>
            <Input
              value={action.parameters.roleId || ''}
              onChange={(e) => updateActionParameter(index, 'roleId', e.target.value)}
              placeholder="123456789012345678"
              status={action.parameters.roleId && !isValidDiscordId(action.parameters.roleId) ? 'error' : ''}
            />
            {action.parameters.roleId && !isValidDiscordId(action.parameters.roleId) && (
              <Text type="danger" style={{ fontSize: 12 }}>올바른 역할 ID를 입력해주세요</Text>
            )}
          </Form.Item>
        )}

        {actionType.parameters.includes('channelId') && (
          <Form.Item label="채널 ID" style={{ marginBottom: 12 }}>
            <Input
              value={action.parameters.channelId || ''}
              onChange={(e) => updateActionParameter(index, 'channelId', e.target.value)}
              placeholder="123456789012345678"
              status={action.parameters.channelId && !isValidDiscordId(action.parameters.channelId) ? 'error' : ''}
            />
            {action.parameters.channelId && !isValidDiscordId(action.parameters.channelId) && (
              <Text type="danger" style={{ fontSize: 12 }}>올바른 채널 ID를 입력해주세요</Text>
            )}
          </Form.Item>
        )}

        {actionType.parameters.includes('nickname') && (
          <Form.Item label="새 닉네임" style={{ marginBottom: 12 }}>
            <Input
              value={action.parameters.nickname || ''}
              onChange={(e) => updateActionParameter(index, 'nickname', e.target.value)}
              placeholder="🎮 {username}"
              maxLength={32}
              showCount
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {'{username}'}을 사용하면 사용자 이름으로 치환됩니다
            </Text>
          </Form.Item>
        )}

        {actionType.parameters.includes('message') && (
          <Form.Item label="메시지 내용" style={{ marginBottom: 12 }}>
            <TextArea
              value={action.parameters.message || ''}
              onChange={(e) => updateActionParameter(index, 'message', e.target.value)}
              placeholder="안녕하세요, {user}님!"
              rows={3}
              maxLength={2000}
              showCount
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {'{user}'}, {'{username}'}, {'{guild}'} 등의 변수를 사용할 수 있습니다
            </Text>
          </Form.Item>
        )}

        {actionType.parameters.includes('seconds') && (
          <Form.Item label="시간 (초)" style={{ marginBottom: 12 }}>
            <InputNumber
              value={action.parameters.seconds || 0}
              onChange={(value) => updateActionParameter(index, 'seconds', value || 0)}
              min={0}
              max={21600} // 6시간
              style={{ width: '100%' }}
            />
          </Form.Item>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>액션 설정</Title>
        <Text type="secondary">
          {actions.length} / {maxActions}개
        </Text>
      </div>

      {actions.map((action, index) => {
        const actionType = ACTION_TYPES[action.type as keyof typeof ACTION_TYPES];
        
        return (
          <Card
            key={index}
            size="small"
            style={{ 
              marginBottom: 16,
              cursor: 'move',
              opacity: draggedIndex === index ? 0.5 : 1
            }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DragOutlined style={{ cursor: 'grab' }} />
                <span>{actionType?.icon}</span>
                <span>액션 {index + 1}: {actionType?.label}</span>
              </div>
            }
            extra={
              actions.length > 1 && (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeAction(index)}
                />
              )
            }
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="액션 타입" style={{ marginBottom: 12 }}>
                  <Select
                    value={action.type}
                    onChange={(value) => updateAction(index, { type: value, parameters: {} })}
                    style={{ width: '100%' }}
                  >
                    {Object.entries(ACTION_TYPES).map(([key, config]) => (
                      <Option key={key} value={key}>
                        <Space>
                          <span>{config.icon}</span>
                          <span>{config.label}</span>
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col span={8}>
                <Form.Item label="대상" style={{ marginBottom: 12 }}>
                  <Select
                    value={action.target}
                    onChange={(value) => updateAction(index, { target: value })}
                    style={{ width: '100%' }}
                  >
                    <Option value="executor">버튼을 누른 사람</Option>
                    <Option value="all">모든 사람</Option>
                    <Option value="specific">특정 사용자</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item label="지연 시간 (초)" style={{ marginBottom: 12 }}>
                  <InputNumber
                    value={action.delay || 0}
                    onChange={(value) => updateAction(index, { delay: value || 0 })}
                    min={0}
                    max={3600}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {actionType && (
              <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {actionType.description}
                </Text>
              </div>
            )}

            {renderActionParameters(action, index)}

            <Divider style={{ margin: '16px 0' }} />

            {/* 결과 설정 */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="결과 메시지 표시" style={{ marginBottom: 12 }}>
                  <Select
                    value={action.result?.visibility || 'private'}
                    onChange={(value) => updateAction(index, { 
                      result: { ...action.result, visibility: value }
                    })}
                    style={{ width: '100%' }}
                  >
                    <Option value="none">표시 안함</Option>
                    <Option value="private">개인에게만</Option>
                    <Option value="public">채널에 공개</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label="결과 메시지" style={{ marginBottom: 12 }}>
                  <Input
                    value={action.result?.message || ''}
                    onChange={(e) => updateAction(index, { 
                      result: { ...action.result, message: e.target.value }
                    })}
                    placeholder="완료되었습니다!"
                    maxLength={200}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        );
      })}

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={addAction}
        disabled={actions.length >= maxActions}
        style={{ width: '100%' }}
      >
        액션 추가 {actions.length >= maxActions && '(최대 도달)'}
      </Button>
    </div>
  );
};