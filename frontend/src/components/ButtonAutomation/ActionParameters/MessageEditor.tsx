import React, { useState } from 'react';
import { Input, Button, Space, Typography, Card, Tag, Tooltip, Switch, Row, Col } from 'antd';
import { InfoCircleOutlined, UserOutlined, HomeOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text, Title } = Typography;

// 사용 가능한 변수 목록
const AVAILABLE_VARIABLES = [
  {
    variable: '{user}',
    description: '버튼을 누른 사용자 멘션',
    example: '@username',
    icon: <UserOutlined />
  },
  {
    variable: '{username}',
    description: '버튼을 누른 사용자의 이름',
    example: 'username',
    icon: <UserOutlined />
  },
  {
    variable: '{guild}',
    description: '서버 이름',
    example: '우리 서버',
    icon: <HomeOutlined />
  },
  {
    variable: '{date}',
    description: '현재 날짜',
    example: '2024-01-21',
    icon: <CalendarOutlined />
  },
  {
    variable: '{time}',
    description: '현재 시간',
    example: '14:30:25',
    icon: <ClockCircleOutlined />
  },
  {
    variable: '{datetime}',
    description: '현재 날짜와 시간',
    example: '2024-01-21 14:30:25',
    icon: <CalendarOutlined />
  }
];

// 미리 정의된 메시지 템플릿
const MESSAGE_TEMPLATES = [
  {
    name: '환영 메시지',
    content: '환영합니다, {user}님! {guild}에 오신 것을 환영합니다! 🎉'
  },
  {
    name: '역할 획득',
    content: '{user}님이 새로운 역할을 획득했습니다! ✨'
  },
  {
    name: '완료 알림',
    content: '✅ 작업이 완료되었습니다!'
  },
  {
    name: '오류 메시지',
    content: '❌ 죄송합니다. 문제가 발생했습니다. 관리자에게 문의해주세요.'
  },
  {
    name: '시간 알림',
    content: '⏰ 현재 시간: {datetime}'
  }
];

interface MessageEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  showTemplates?: boolean;
  showVariables?: boolean;
}

export const MessageEditor: React.FC<MessageEditorProps> = ({
  value = '',
  onChange,
  placeholder = "메시지 내용을 입력하세요...",
  maxLength = 2000,
  rows = 4,
  showTemplates = true,
  showVariables = true
}) => {
  const [showHelp, setShowHelp] = useState(false);

  // 변수 삽입
  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.slice(0, start) + variable + value.slice(end);
      onChange?.(newValue);
      
      // 커서 위치 조정
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  // 템플릿 적용
  const applyTemplate = (template: string) => {
    onChange?.(template);
  };

  // 메시지 미리보기 (변수 치환)
  const getPreview = () => {
    return value
      .replace('{user}', '@username')
      .replace('{username}', 'username')
      .replace('{guild}', '우리 서버')
      .replace('{date}', new Date().toISOString().split('T')[0])
      .replace('{time}', new Date().toTimeString().split(' ')[0])
      .replace('{datetime}', new Date().toLocaleString('ko-KR'));
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      {/* 도움말 토글 */}
      <Row justify="space-between" align="middle">
        <Col>
          <Text strong>메시지 내용</Text>
        </Col>
        <Col>
          <Switch
            size="small"
            checked={showHelp}
            onChange={setShowHelp}
            checkedChildren="도움말"
            unCheckedChildren="도움말"
          />
        </Col>
      </Row>

      {/* 메시지 입력 영역 */}
      <TextArea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        showCount
        style={{ resize: 'vertical' }}
      />

      {/* 도움말 영역 */}
      {showHelp && (
        <Card size="small" style={{ backgroundColor: '#f8f9fa' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            
            {/* 변수 목록 */}
            {showVariables && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  <Text strong style={{ fontSize: 13 }}>사용 가능한 변수</Text>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {AVAILABLE_VARIABLES.map(({ variable, description, example, icon }) => (
                    <Tooltip 
                      key={variable}
                      title={
                        <div>
                          <div>{description}</div>
                          <div style={{ fontSize: 11, opacity: 0.8 }}>예시: {example}</div>
                        </div>
                      }
                    >
                      <Tag
                        style={{ cursor: 'pointer', margin: 2 }}
                        onClick={() => insertVariable(variable)}
                      >
                        <Space size={4}>
                          {icon}
                          <span style={{ fontSize: 11 }}>{variable}</span>
                        </Space>
                      </Tag>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}

            {/* 템플릿 목록 */}
            {showTemplates && (
              <div>
                <Text strong style={{ fontSize: 13 }}>메시지 템플릿</Text>
                <div style={{ marginTop: 8 }}>
                  <Space wrap size={[4, 4]}>
                    {MESSAGE_TEMPLATES.map((template, index) => (
                      <Button
                        key={index}
                        size="small"
                        type="dashed"
                        onClick={() => applyTemplate(template.content)}
                        style={{ fontSize: 11 }}
                      >
                        {template.name}
                      </Button>
                    ))}
                  </Space>
                </div>
              </div>
            )}

            {/* 미리보기 */}
            {value && (
              <div>
                <Text strong style={{ fontSize: 13 }}>미리보기</Text>
                <div 
                  style={{ 
                    marginTop: 8,
                    padding: 8,
                    backgroundColor: '#ffffff',
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    fontSize: 13,
                    minHeight: 32,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {getPreview() || (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      메시지가 여기에 표시됩니다...
                    </Text>
                  )}
                </div>
              </div>
            )}
          </Space>
        </Card>
      )}

      {/* 빠른 액션 버튼들 */}
      <Row gutter={8}>
        <Col>
          <Button 
            size="small" 
            type="text"
            onClick={() => insertVariable('{user}')}
          >
            + 사용자 멘션
          </Button>
        </Col>
        <Col>
          <Button 
            size="small" 
            type="text"
            onClick={() => insertVariable('{guild}')}
          >
            + 서버 이름
          </Button>
        </Col>
        <Col>
          <Button 
            size="small" 
            type="text"
            onClick={() => insertVariable('{datetime}')}
          >
            + 현재 시간
          </Button>
        </Col>
        <Col>
          <Button 
            size="small" 
            type="text"
            onClick={() => onChange?.('')}
            danger
          >
            지우기
          </Button>
        </Col>
      </Row>
    </Space>
  );
};