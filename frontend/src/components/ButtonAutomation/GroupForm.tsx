import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Switch, Button, Space, Card, Typography, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { EmojiPicker } from '../ui/EmojiPicker';
import { ButtonAutomationGroup } from '../../types/buttonAutomation';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface GroupFormProps {
  group?: ButtonAutomationGroup;
  onSubmit: (data: GroupFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export interface GroupFormData {
  name: string;
  displayOrder?: number;
  settings?: {
    messageConfig?: {
      content?: string;
      emojis?: string[];
      embed?: {
        title?: string;
        color?: string;
        description?: string;
      };
    };
    permissions?: {
      allowedRoles?: string[];
      deniedRoles?: string[];
    };
  };
  isActive?: boolean;
}

export const GroupForm: React.FC<GroupFormProps> = ({
  group,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [form] = Form.useForm();
  const [messageEnabled, setMessageEnabled] = useState(false);
  const [embedEnabled, setEmbedEnabled] = useState(false);
  const [emojis, setEmojis] = useState<string[]>([]);

  // 기존 그룹 데이터 로드
  useEffect(() => {
    if (group) {
      let settings;
      try {
        settings = group.settings ? JSON.parse(group.settings) : {};
      } catch (error) {
        console.error('Failed to parse group settings:', error);
        settings = {};
      }

      form.setFieldsValue({
        name: group.name,
        displayOrder: group.displayOrder,
        isActive: group.isActive,
        messageContent: settings.messageConfig?.content || '',
        embedTitle: settings.messageConfig?.embed?.title || '',
        embedColor: settings.messageConfig?.embed?.color || '#5865F2',
        embedDescription: settings.messageConfig?.embed?.description || '',
      });

      // 이모지 설정
      if (settings.messageConfig?.emojis) {
        setEmojis(settings.messageConfig.emojis);
      }

      // 메시지 및 임베드 활성화 상태
      setMessageEnabled(!!settings.messageConfig?.content);
      setEmbedEnabled(!!settings.messageConfig?.embed?.title);
    }
  }, [group, form]);

  const handleSubmit = async (values: any) => {
    try {
      const formData: GroupFormData = {
        name: values.name,
        displayOrder: values.displayOrder,
        isActive: values.isActive ?? true,
        settings: {
          messageConfig: messageEnabled ? {
            content: values.messageContent,
            emojis: emojis.filter(emoji => emoji.trim() !== ''),
            embed: embedEnabled ? {
              title: values.embedTitle,
              color: values.embedColor,
              description: values.embedDescription,
            } : undefined,
          } : undefined,
        },
      };

      await onSubmit(formData);
      message.success(group ? '그룹이 수정되었습니다.' : '그룹이 생성되었습니다.');
    } catch (error) {
      console.error('Form submission error:', error);
      message.error('저장 중 오류가 발생했습니다.');
    }
  };


  return (
    <Card title={group ? '그룹 수정' : '새 그룹 생성'} style={{ maxWidth: 600 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          isActive: true,
          displayOrder: 0,
          embedColor: '#5865F2'
        }}
      >
        {/* 기본 정보 */}
        <Title level={5}>기본 정보</Title>
        
        <Form.Item
          name="name"
          label="그룹 이름"
          rules={[
            { required: true, message: '그룹 이름을 입력해주세요.' },
            { max: 100, message: '그룹 이름은 100자 이하로 입력해주세요.' }
          ]}
        >
          <Input placeholder="예: 역할 선택 그룹" />
        </Form.Item>

        <Form.Item
          name="displayOrder"
          label="표시 순서"
          tooltip="숫자가 작을수록 위에 표시됩니다."
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="isActive"
          label="활성화"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        {/* 메시지 설정 */}
        <Title level={5} style={{ marginTop: 24 }}>메시지 설정</Title>
        
        <Form.Item label="그룹 메시지 사용">
          <Switch 
            checked={messageEnabled}
            onChange={setMessageEnabled}
            checkedChildren="사용"
            unCheckedChildren="미사용"
          />
          <Text type="secondary" style={{ marginLeft: 8 }}>
            버튼과 함께 표시될 설명 메시지
          </Text>
        </Form.Item>

        {messageEnabled && (
          <>
            <Form.Item
              name="messageContent"
              label="메시지 내용"
              rules={[
                { required: messageEnabled, message: '메시지 내용을 입력해주세요.' }
              ]}
            >
              <TextArea 
                rows={3}
                placeholder="아래 버튼들을 사용하여 역할을 설정하세요."
                maxLength={2000}
                showCount
              />
            </Form.Item>

            {/* 이모지 설정 */}
            <Form.Item label="이모지">
              <EmojiPicker
                value={emojis}
                onChange={setEmojis}
                maxCount={10}
                placeholder="그룹 메시지에 표시할 이모지를 선택하세요"
              />
            </Form.Item>

            {/* 임베드 설정 */}
            <Form.Item label="임베드 메시지 사용">
              <Switch 
                checked={embedEnabled}
                onChange={setEmbedEnabled}
                checkedChildren="사용"
                unCheckedChildren="미사용"
              />
              <Text type="secondary" style={{ marginLeft: 8 }}>
                더 예쁜 메시지 형식
              </Text>
            </Form.Item>

            {embedEnabled && (
              <>
                <Form.Item
                  name="embedTitle"
                  label="임베드 제목"
                  rules={[
                    { required: embedEnabled, message: '임베드 제목을 입력해주세요.' }
                  ]}
                >
                  <Input placeholder="역할 선택" maxLength={256} />
                </Form.Item>

                <Form.Item
                  name="embedColor"
                  label="임베드 색상"
                >
                  <Input type="color" style={{ width: 100 }} />
                </Form.Item>

                <Form.Item
                  name="embedDescription"
                  label="임베드 설명"
                >
                  <TextArea 
                    rows={2}
                    placeholder="원하는 역할을 선택해주세요."
                    maxLength={4096}
                  />
                </Form.Item>
              </>
            )}
          </>
        )}

        {/* 버튼들 */}
        <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {group ? '수정' : '생성'}
            </Button>
            <Button onClick={onCancel}>
              취소
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};