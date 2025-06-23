import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Switch, Button, Space, Card, Typography, Select, Row, Col, Divider, message, Tabs } from 'antd';
import { PlusOutlined, PlayCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { ButtonAutomation, ButtonConfig, ActionConfig, ConditionConfig, TriggerConfig } from '../../types/buttonAutomation';
import { ActionEditor } from './ActionEditor';
import { ConditionEditor } from './ConditionEditor';
import { TestRunner } from './TestRunner';
import { DISCORD_LIMITS } from '../../utils/validation';
import { useChannels } from '../../hooks/useChannels';

const { Title, Text } = Typography;
const { Option } = Select;

interface AdvancedButtonFormProps {
  button?: ButtonAutomation;
  groupId?: string;
  guildId: string;
  onSubmit: (data: ButtonFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export interface ButtonFormData {
  groupId?: string;
  buttonLabel: string;
  displayOrder?: number;
  config: string; // JSON string
  isActive?: boolean;
}

export const AdvancedButtonForm: React.FC<AdvancedButtonFormProps> = ({
  button,
  groupId,
  guildId,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('basic');
  const [showTestRunner, setShowTestRunner] = useState(false);
  
  // Discord 데이터 가져오기
  const { channels } = useChannels();
  const [roles, setRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // 역할 데이터 가져오기
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(`/api/v1/discord/guilds/${guildId}/roles`);
        if (response.ok) {
          const rolesData = await response.json();
          setRoles(rolesData);
        }
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      }
    };
    
    if (guildId) {
      fetchRoles();
    }
  }, [guildId]);
  
  // 버튼 설정 상태
  const [buttonConfig, setButtonConfig] = useState<ButtonConfig>({
    trigger: { type: 'everyone', roles: [], users: [] },
    conditions: {},
    actions: [{
      type: 'add_role',
      target: 'executor',
      parameters: {},
      delay: 0,
      result: { message: '', visibility: 'none' }
    }],
    buttonSettings: { style: 'primary', disableAfterUse: false },
    options: { oncePerUser: false, logEnabled: true }
  });

  // 기존 버튼 데이터 로드
  useEffect(() => {
    if (button) {
      let config: ButtonConfig;
      try {
        config = JSON.parse(button.config);
      } catch (error) {
        console.error('Failed to parse button config:', error);
        config = {
          trigger: { type: 'everyone', roles: [], users: [] },
          conditions: {},
          actions: [],
          buttonSettings: { style: 'primary', disableAfterUse: false },
          options: { oncePerUser: false, logEnabled: true }
        };
      }

      form.setFieldsValue({
        buttonLabel: button.buttonLabel,
        displayOrder: button.displayOrder,
        isActive: button.isActive,
      });

      setButtonConfig(config);
    } else if (groupId) {
      form.setFieldValue('groupId', groupId);
    }
  }, [button, groupId, form]);

  // 설정 업데이트 헬퍼
  const updateConfig = (updates: Partial<ButtonConfig>) => {
    setButtonConfig(prev => ({ ...prev, ...updates }));
  };

  // 폼 제출 처리
  const handleSubmit = async (values: any) => {
    try {
      const formData: ButtonFormData = {
        groupId: values.groupId || groupId,
        buttonLabel: values.buttonLabel,
        displayOrder: values.displayOrder,
        config: JSON.stringify(buttonConfig),
        isActive: values.isActive ?? true,
      };

      await onSubmit(formData);
      message.success(button ? '버튼이 수정되었습니다.' : '버튼이 생성되었습니다.');
    } catch (error) {
      console.error('Form submission error:', error);
      message.error('저장 중 오류가 발생했습니다.');
    }
  };

  // 액션 업데이트
  const handleActionsChange = (actions: ActionConfig[]) => {
    updateConfig({ actions });
  };

  // 조건 업데이트
  const handleConditionsChange = (conditions: ConditionConfig) => {
    updateConfig({ conditions });
  };

  // 트리거 업데이트
  const handleTriggerChange = (field: string, value: any) => {
    updateConfig({
      trigger: {
        ...buttonConfig.trigger,
        [field]: value
      }
    });
  };

  // 버튼 설정 업데이트
  const handleButtonSettingsChange = (field: string, value: any) => {
    updateConfig({
      buttonSettings: {
        ...buttonConfig.buttonSettings,
        [field]: value
      }
    });
  };

  // 옵션 업데이트
  const handleOptionsChange = (field: string, value: any) => {
    updateConfig({
      options: {
        ...buttonConfig.options,
        [field]: value
      }
    });
  };

  // 액션 표시명 가져오기
  const getActionDisplayName = (actionType: string) => {
    const actionNames: Record<string, string> = {
      'add_role': '역할 추가',
      'remove_role': '역할 제거',
      'toggle_role': '역할 토글',
      'change_nickname': '닉네임 변경',
      'reset_nickname': '닉네임 초기화',
      'send_message': '메시지 전송',
      'send_dm': 'DM 전송',
      'move_voice_channel': '음성 채널 이동',
      'disconnect_voice': '음성 연결 해제',
      'set_slowmode': '슬로우모드 설정',
      'play_music': '음악 재생',
      'stop_music': '음악 정지',
      'pause_music': '음악 일시정지/재개',
      'set_voice_mute': '마이크 음소거',
      'set_voice_deafen': '스피커 차단',
      'toggle_voice_mute': '마이크 토글',
      'toggle_voice_deafen': '스피커 토글',
      'set_priority_speaker': '우선 발언자 설정',
      'set_channel_permission': '채널 권한 설정',
      'remove_channel_permission': '채널 권한 제거',
      'override_channel_permission': '채널 권한 오버라이드',
      'reset_channel_permission': '채널 권한 초기화',
      'remove_timeout': '타임아웃 해제',
      'button_setting': '버튼 설정'
    };
    return actionNames[actionType] || actionType;
  };

  // 대상 표시명 가져오기
  const getTargetDisplayName = (action: ActionConfig) => {
    const { target } = action;
    
    if (target === 'executor') return '버튼을 누른 사람';
    if (target === 'admin') return '관리자';
    if (target === 'specific') {
      if (action.parameters?.userIds && action.parameters.userIds.length > 0) {
        const userCount = action.parameters.userIds.length;
        return `특정 사용자 ${userCount}명`;
      }
      return '특정 사용자';
    }
    if (target === 'role') {
      if (action.parameters?.roleIds && action.parameters.roleIds.length > 0) {
        const roleNames = action.parameters.roleIds.map((roleId: string) => {
          const role = roles.find(r => r.id === roleId);
          return role ? `"${role.name}"` : `역할(${roleId.slice(0, 8)}...)`;
        });
        
        if (roleNames.length === 1) {
          return `${roleNames[0]} 역할의 모든 사용자`;
        } else {
          return `${roleNames.join(', ')} 역할의 모든 사용자`;
        }
      }
      return '특정 역할의 모든 사용자';
    }
    
    return target;
  };

  return (
    <>
      <Card title={button ? '버튼 수정' : '새 버튼 생성'} style={{ maxWidth: 1000 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            isActive: true,
            displayOrder: 0,
          }}
        >
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={[
              {
                key: 'basic',
                label: '기본 설정',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {/* 기본 정보 */}
                    <div>
                      <Title level={5}>기본 정보</Title>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="buttonLabel"
                            label="버튼 텍스트"
                            rules={[
                              { required: true, message: '버튼 텍스트를 입력해주세요.' },
                              { max: 80, message: '버튼 텍스트는 80자 이하로 입력해주세요.' }
                            ]}
                          >
                            <Input placeholder="역할 받기" maxLength={80} showCount />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="displayOrder"
                            label="표시 순서"
                          >
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        name="isActive"
                        label="활성화"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </div>

                    {/* 버튼 스타일 */}
                    <div>
                      <Title level={5}>기본 버튼 설정</Title>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label="기본 버튼 색상">
                            <Select
                              value={buttonConfig.buttonSettings.style}
                              onChange={(value) => handleButtonSettingsChange('style', value)}
                            >
                              <Option value="primary">파란색 (Primary)</Option>
                              <Option value="secondary">회색 (Secondary)</Option>
                              <Option value="success">초록색 (Success)</Option>
                              <Option value="danger">빨간색 (Danger)</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="로그 기록">
                            <Switch
                              checked={buttonConfig.options.logEnabled}
                              onChange={(checked) => handleOptionsChange('logEnabled', checked)}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        💡 트리거 설정과 사용 후 동작은 액션 설정 탭에서 구성할 수 있습니다.
                      </Text>
                    </div>
                  </Space>
                )
              },
              {
                key: 'conditions',
                label: '실행 조건',
                children: (
                  <ConditionEditor
                    conditions={buttonConfig.conditions}
                    onChange={handleConditionsChange}
                    guildId={guildId}
                  />
                )
              },
              {
                key: 'actions',
                label: '액션 설정',
                children: (
                  <ActionEditor
                    actions={buttonConfig.actions}
                    onChange={handleActionsChange}
                    maxActions={DISCORD_LIMITS.MAX_ACTIONS_PER_BUTTON}
                    guildId={guildId}
                  />
                )
              },
              {
                key: 'preview',
                label: '미리보기',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {/* 액션 플로우 시각화 */}
                    <Card size="small" title="🎯 액션 플로우">
                      <div className="p-4">
                        {/* 트리거 단계 */}
                        <div className="flex items-center mb-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full font-semibold mr-3">
                            1
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">버튼 클릭</div>
                            <div className="text-sm text-gray-600">
                              📝 "{form.getFieldValue('buttonLabel') || '(버튼명 없음)'}" 버튼을 클릭
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              👥 {
                                buttonConfig.trigger.type === 'everyone' ? '모든 사람이 사용 가능' :
                                buttonConfig.trigger.type === 'role' ? '특정 역할만 사용 가능' :
                                buttonConfig.trigger.type === 'admin' ? '관리자만 사용 가능' : '트리거 설정되지 않음'
                              }
                            </div>
                          </div>
                        </div>

                        {/* 조건 확인 단계 */}
                        <div className="flex items-center mb-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-orange-100 text-orange-600 rounded-full font-semibold mr-3">
                            2
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">조건 확인</div>
                            <div className="text-sm text-gray-600">
                              {Object.keys(buttonConfig.conditions || {}).length > 0 ? (
                                <div className="space-y-1">
                                  {buttonConfig.conditions.requiredRoles?.length > 0 && (
                                    <div>✅ 필수 역할: {buttonConfig.conditions.requiredRoles.length}개</div>
                                  )}
                                  {buttonConfig.conditions.deniedRoles?.length > 0 && (
                                    <div>❌ 차단 역할: {buttonConfig.conditions.deniedRoles.length}개</div>
                                  )}
                                  {buttonConfig.conditions.requiredChannels?.length > 0 && (
                                    <div>📍 허용 채널: {buttonConfig.conditions.requiredChannels.length}개</div>
                                  )}
                                  {buttonConfig.conditions.cooldownSeconds && (
                                    <div>⏰ 쿨다운: {buttonConfig.conditions.cooldownSeconds}초</div>
                                  )}
                                  {buttonConfig.conditions.oncePerUser && (
                                    <div>👤 사용자당 1회 제한</div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-green-600">🎉 제한 없음 - 모든 조건 통과</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 액션 실행 단계들 */}
                        {buttonConfig.actions.map((action, index) => (
                          <div key={index} className="flex items-start mb-4">
                            <div className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-600 rounded-full font-semibold mr-3 mt-1">
                              {index + 3}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800">
                                액션 {index + 1}: {getActionDisplayName(action.type)}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                🎯 대상: {getTargetDisplayName(action)}
                              </div>
                              {action.delay > 0 && (
                                <div className="text-xs text-orange-500 mt-1">
                                  ⏱️ {action.delay}초 지연 후 실행
                                </div>
                              )}
                              {action.result?.message && (
                                <div className="text-xs text-blue-600 mt-1">
                                  💬 결과 메시지: "{action.result.message}"
                                  ({(() => {
                                    switch (action.result.visibility) {
                                      case 'ephemeral': return '개인에게만 (임시 메시지)';
                                      case 'private': return '개인 DM';
                                      case 'public': return '현재 채널';
                                      case 'current_channel': return '현재 채널';
                                      case 'specific_channel': return '특정 채널';
                                      case 'none': return '표시 안함';
                                      default: return '표시 안함';
                                    }
                                  })()})
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {buttonConfig.actions.length === 0 && (
                          <div className="flex items-center mb-4">
                            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 text-gray-400 rounded-full font-semibold mr-3">
                              3
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-400">액션 없음</div>
                              <div className="text-sm text-gray-400">
                                실행할 액션이 설정되지 않았습니다
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 완료 단계 */}
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-600 rounded-full font-semibold mr-3">
                            ✓
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">완료</div>
                            <div className="text-sm text-gray-600">
                              🎉 모든 액션이 성공적으로 실행되었습니다
                            </div>
                            {buttonConfig.buttonSettings?.disableAfterUse && (
                              <div className="text-xs text-red-500 mt-1">
                                🔒 버튼이 비활성화됩니다
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* 설정 요약 */}
                    <Card size="small" title="📋 설정 요약">
                      <div style={{ lineHeight: 2 }}>
                        <div><strong>버튼 라벨:</strong> {form.getFieldValue('buttonLabel') || '(설정되지 않음)'}</div>
                        <div><strong>트리거:</strong> {
                          buttonConfig.trigger.type === 'everyone' ? '모든 사람' :
                          buttonConfig.trigger.type === 'role' ? '특정 역할만' :
                          buttonConfig.trigger.type === 'admin' ? '관리자만' : '설정되지 않음'
                        }</div>
                        <div><strong>액션 수:</strong> {buttonConfig.actions.length}개</div>
                        <div><strong>조건:</strong> {
                          Object.keys(buttonConfig.conditions || {}).length > 0 
                            ? '설정됨' 
                            : '제한 없음'
                        }</div>
                        <div><strong>버튼 스타일:</strong> {
                          buttonConfig.buttonSettings?.style === 'primary' ? '파란색 (Primary)' :
                          buttonConfig.buttonSettings?.style === 'secondary' ? '회색 (Secondary)' :
                          buttonConfig.buttonSettings?.style === 'success' ? '초록색 (Success)' :
                          buttonConfig.buttonSettings?.style === 'danger' ? '빨간색 (Danger)' : '기본'
                        }</div>
                      </div>
                    </Card>

                    {/* JSON 설정 */}
                    <Card size="small" title="⚙️ JSON 설정">
                      <pre style={{ 
                        backgroundColor: '#f5f5f5', 
                        padding: 16, 
                        borderRadius: 4,
                        fontSize: 12,
                        maxHeight: 300,
                        overflow: 'auto'
                      }}>
                        {JSON.stringify(buttonConfig, null, 2)}
                      </pre>
                    </Card>
                  </Space>
                )
              }
            ]}
          />

          {/* 하단 버튼들 */}
          <Divider />
          <Row justify="space-between">
            <Col>
              <Space>
                <Button 
                  icon={<PlayCircleOutlined />}
                  onClick={() => setShowTestRunner(true)}
                  disabled={!form.getFieldValue('buttonLabel')}
                >
                  테스트 실행
                </Button>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button onClick={onCancel}>
                  취소
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {button ? '수정' : '생성'}
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 테스트 실행 모달 */}
      {showTestRunner && (
        <TestRunner
          button={{
            ...button,
            buttonLabel: form.getFieldValue('buttonLabel') || 'Test Button',
            config: JSON.stringify(buttonConfig)
          } as ButtonAutomation}
          visible={showTestRunner}
          onClose={() => setShowTestRunner(false)}
          roles={roles}
          channels={channels}
          users={users}
        />
      )}
    </>
  );
};