import React, { useState } from 'react';
import { Card, Select, Form, Button, Space, Divider, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useBotCommandsMetadata } from '../../hooks/useAutocomplete';
import { BotCommandParameterInput } from './SmartAutocompleteInput';

const { Title, Text } = Typography;
const { Option } = Select;

interface BotCommandAction {
  id: string;
  commandName: string;
  subcommand?: string;
  parameters: Record<string, any>;
}

interface BotCommandSelectorProps {
  guildId: string;
  actions: BotCommandAction[];
  onChange: (actions: BotCommandAction[]) => void;
}

/**
 * 봇 커맨드 선택 및 구성 컴포넌트
 * 캐시된 봇 커맨드 메타데이터를 기반으로 자동완성 지원
 */
export const BotCommandSelector: React.FC<BotCommandSelectorProps> = ({
  guildId,
  actions,
  onChange
}) => {
  const { data: commandsMetadata = [], isLoading, error } = useBotCommandsMetadata();
  const [selectedCommand, setSelectedCommand] = useState<string>('');

  // 사용 가능한 커맨드 목록 (isCacheCommand: true이고 자동완성이 있는 커맨드들)
  const availableCommands = Array.from(
    new Set(commandsMetadata.map(meta => meta.commandName))
  );

  // 선택된 커맨드의 서브커맨드 목록
  const getSubcommands = (commandName: string) => {
    const commandMetadata = commandsMetadata.filter(meta => meta.commandName === commandName);
    return Array.from(new Set(commandMetadata.map(meta => meta.subcommand)));
  };

  // 선택된 커맨드+서브커맨드의 파라미터 목록
  const getParameters = (commandName: string, subcommand: string) => {
    return commandsMetadata.filter(
      meta => meta.commandName === commandName && meta.subcommand === subcommand
    );
  };

  // 새 액션 추가
  const addAction = () => {
    if (!selectedCommand) return;

    const newAction: BotCommandAction = {
      id: `action_${Date.now()}`,
      commandName: selectedCommand,
      parameters: {}
    };

    onChange([...actions, newAction]);
    setSelectedCommand('');
  };

  // 액션 삭제
  const removeAction = (actionId: string) => {
    onChange(actions.filter(action => action.id !== actionId));
  };

  // 액션 업데이트
  const updateAction = (actionId: string, updates: Partial<BotCommandAction>) => {
    onChange(actions.map(action => 
      action.id === actionId ? { ...action, ...updates } : action
    ));
  };

  // 파라미터 값 업데이트
  const updateParameter = (actionId: string, parameterName: string, value: any) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    const newParameters = { ...action.parameters, [parameterName]: value };
    updateAction(actionId, { parameters: newParameters });
  };

  if (isLoading) {
    return <div>봇 커맨드 정보를 불러오는 중...</div>;
  }

  if (error) {
    return <div>봇 커맨드 정보를 불러오는데 실패했습니다.</div>;
  }

  return (
    <div>
      <Title level={4}>봇 커맨드 액션 설정</Title>
      <Text type="secondary">
        Discord 봇 커맨드를 버튼 클릭 시 실행되도록 설정합니다. 자동완성을 지원하는 파라미터는 드롭다운으로 표시됩니다.
      </Text>

      <Divider />

      {/* 새 액션 추가 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Form.Item label="커맨드 선택">
            <Select
              value={selectedCommand}
              onChange={setSelectedCommand}
              placeholder="봇 커맨드 선택"
              style={{ width: 200 }}
            >
              {availableCommands.map(command => (
                <Option key={command} value={command}>
                  /{command}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={addAction}
              disabled={!selectedCommand}
            >
              액션 추가
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 추가된 액션들 */}
      <Space direction="vertical" style={{ width: '100%' }}>
        {actions.map((action, index) => (
          <Card
            key={action.id}
            size="small"
            title={`액션 ${index + 1}: /${action.commandName}`}
            extra={
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeAction(action.id)}
              >
                삭제
              </Button>
            }
          >
            {/* 서브커맨드 선택 */}
            <Form.Item label="서브커맨드">
              <Select
                value={action.subcommand}
                onChange={(subcommand) => updateAction(action.id, { subcommand })}
                placeholder="서브커맨드 선택"
                style={{ width: '100%' }}
              >
                {getSubcommands(action.commandName).map(subcommand => (
                  <Option key={subcommand} value={subcommand}>
                    {subcommand}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* 파라미터 입력 */}
            {action.subcommand && (
              <div style={{ marginTop: 16 }}>
                <Text strong>파라미터 설정</Text>
                <div style={{ marginTop: 8, display: 'grid', gap: 16 }}>
                  {getParameters(action.commandName, action.subcommand).map(paramMeta => (
                    <BotCommandParameterInput
                      key={`${action.id}_${paramMeta.parameterName}`}
                      commandName={action.commandName}
                      subcommand={action.subcommand!}
                      parameterName={paramMeta.parameterName}
                      parameterType="string" // 현재는 string만 지원
                      description={`${paramMeta.parameterName} 값을 입력하세요`}
                      required={true}
                      guildId={guildId}
                      value={action.parameters[paramMeta.parameterName]}
                      onChange={(value) => updateParameter(action.id, paramMeta.parameterName, value)}
                    />
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </Space>

      {actions.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <Text>설정된 봇 커맨드 액션이 없습니다.</Text>
            <br />
            <Text type="secondary">위에서 커맨드를 선택하여 액션을 추가해보세요.</Text>
          </div>
        </Card>
      )}
    </div>
  );
};