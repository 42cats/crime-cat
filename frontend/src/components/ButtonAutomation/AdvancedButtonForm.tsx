import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Switch, Button, Space, Card, Typography, Select, Row, Col, Divider, message, Tabs } from 'antd';
import { PlusOutlined, PlayCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { ButtonAutomation, ButtonConfig, ActionConfig, ConditionConfig, TriggerConfig } from '../../types/buttonAutomation';
import { ActionEditor } from './ActionEditor';
import { ConditionEditor } from './ConditionEditor';
import { TestRunner } from './TestRunner';
import { DISCORD_LIMITS } from '../../utils/validation';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface AdvancedButtonFormProps {
  button?: ButtonAutomation;
  groupId?: string;
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
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('basic');
  const [showTestRunner, setShowTestRunner] = useState(false);
  
  // 버튼 설정 상태
  const [buttonConfig, setButtonConfig] = useState<ButtonConfig>({
    trigger: { type: 'everyone', roles: [], users: [] },
    conditions: {},
    actions: [{
      type: 'add_role',
      target: 'executor',
      parameters: {},
      delay: 0,
      result: { message: '', visibility: 'private' }
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
                            <Input placeholder="역할 받기" />
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

                    {/* 트리거 설정 */}
                    <div>
                      <Title level={5}>트리거 설정</Title>
                      <Form.Item label="누가 버튼을 사용할 수 있나요?">
                        <Select
                          value={buttonConfig.trigger.type}
                          onChange={(value) => handleTriggerChange('type', value)}
                        >
                          <Option value="everyone">모든 사람</Option>
                          <Option value="role">특정 역할만</Option>
                          <Option value="admin">관리자만</Option>
                        </Select>
                      </Form.Item>
                    </div>

                    {/* 버튼 스타일 */}
                    <div>
                      <Title level={5}>버튼 스타일</Title>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item label="버튼 색상">
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
                        <Col span={8}>
                          <Form.Item label="사용 후 비활성화">
                            <Switch
                              checked={buttonConfig.buttonSettings.disableAfterUse}
                              onChange={(checked) => handleButtonSettingsChange('disableAfterUse', checked)}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item label="로그 기록">
                            <Switch
                              checked={buttonConfig.options.logEnabled}
                              onChange={(checked) => handleOptionsChange('logEnabled', checked)}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
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
                  />
                )
              },
              {
                key: 'preview',
                label: '미리보기',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <Card size="small" title="설정 요약">
                      <div style={{ lineHeight: 2 }}>
                        <div><strong>버튼 라벨:</strong> {form.getFieldValue('buttonLabel') || '(설정되지 않음)'}</div>
                        <div><strong>트리거:</strong> {
                          buttonConfig.trigger.type === 'everyone' ? '모든 사람' :
                          buttonConfig.trigger.type === 'role' ? '특정 역할만' :
                          buttonConfig.trigger.type === 'admin' ? '관리자만' : '설정되지 않음'
                        }</div>
                        <div><strong>액션 수:</strong> {buttonConfig.actions.length}개</div>
                        <div><strong>조건:</strong> {
                          Object.keys(buttonConfig.conditions).length > 0 
                            ? '설정됨' 
                            : '제한 없음'
                        }</div>
                      </div>
                    </Card>

                    <Card size="small" title="JSON 설정">
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
        />
      )}
    </>
  );
};