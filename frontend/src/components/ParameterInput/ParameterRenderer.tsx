/**
 * 스마트 파라미터 렌더러 - 타입별 최적화된 입력 컴포넌트
 */

import React from 'react';
import { Input, Select, Switch, InputNumber, AutoComplete, Tag, Space, Spin } from 'antd';
import { UserOutlined, CommentOutlined, TeamOutlined, SettingOutlined } from '@ant-design/icons';
import { EnhancedBotCommandParameter, ParameterContext, AutocompleteChoice } from '../../types/parameterAutocomplete';
import { useParameterAutocomplete } from '../../hooks/useParameterAutocomplete';

const { Option } = Select;
const { TextArea } = Input;

interface ParameterRendererProps {
  parameter: EnhancedBotCommandParameter;
  value: any;
  onChange: (value: any) => void;
  commandName: string;
  context: ParameterContext;
  disabled?: boolean;
  size?: 'small' | 'middle' | 'large';
}

/**
 * 메인 파라미터 렌더러
 */
export const ParameterRenderer: React.FC<ParameterRendererProps> = ({
  parameter,
  value,
  onChange,
  commandName,
  context,
  disabled = false,
  size = 'middle'
}) => {
  // 파라미터 타입에 따른 렌더링 결정
  const getRenderType = () => {
    if (parameter.type === 'boolean') return 'switch';
    if (parameter.type === 'number') return 'number';
    if (parameter.type === 'user') return 'user_picker';
    if (parameter.type === 'channel') return 'channel_picker';
    if (parameter.type === 'role') return 'role_picker';
    if (parameter.choices?.length) return 'select';
    if (parameter.autocomplete) return 'autocomplete';
    if (parameter.ui?.maxLength && parameter.ui.maxLength > 100) return 'textarea';
    return 'input';
  };

  const renderType = getRenderType();

  // 공통 props
  const commonProps = {
    disabled,
    size,
    placeholder: parameter.ui?.placeholder || parameter.description,
    style: { width: '100%' }
  };

  switch (renderType) {
    case 'switch':
      return <BooleanParameter {...commonProps} value={value} onChange={onChange} />;
      
    case 'number':
      return <NumberParameter {...commonProps} parameter={parameter} value={value} onChange={onChange} />;
      
    case 'select':
      return <SelectParameter {...commonProps} parameter={parameter} value={value} onChange={onChange} />;
      
    case 'autocomplete':
      return (
        <AutocompleteParameter 
          {...commonProps} 
          parameter={parameter}
          commandName={commandName}
          context={context}
          value={value} 
          onChange={onChange} 
        />
      );
      
    case 'user_picker':
      return (
        <UserPickerParameter 
          {...commonProps} 
          context={context}
          value={value} 
          onChange={onChange} 
        />
      );
      
    case 'channel_picker':
      return (
        <ChannelPickerParameter 
          {...commonProps} 
          context={context}
          value={value} 
          onChange={onChange} 
        />
      );
      
    case 'role_picker':
      return (
        <RolePickerParameter 
          {...commonProps} 
          context={context}
          value={value} 
          onChange={onChange} 
        />
      );
      
    case 'textarea':
      return <TextAreaParameter {...commonProps} parameter={parameter} value={value} onChange={onChange} />;
      
    default:
      return <InputParameter {...commonProps} parameter={parameter} value={value} onChange={onChange} />;
  }
};

/**
 * 불린 파라미터 컴포넌트
 */
const BooleanParameter: React.FC<any> = ({ value, onChange, disabled }) => (
  <Switch 
    checked={Boolean(value)}
    onChange={onChange}
    disabled={disabled}
  />
);

/**
 * 숫자 파라미터 컴포넌트
 */
const NumberParameter: React.FC<any> = ({ parameter, value, onChange, ...props }) => (
  <InputNumber
    {...props}
    value={value}
    onChange={onChange}
    min={parameter.ui?.pattern ? parseInt(parameter.ui.pattern.split('-')[0]) : undefined}
    max={parameter.ui?.pattern ? parseInt(parameter.ui.pattern.split('-')[1]) : undefined}
  />
);

/**
 * 선택 파라미터 컴포넌트
 */
const SelectParameter: React.FC<any> = ({ parameter, value, onChange, ...props }) => {
  const isMultiple = parameter.autocomplete?.multiple;
  
  return (
    <Select
      {...props}
      value={value}
      onChange={onChange}
      mode={isMultiple ? 'multiple' : undefined}
      allowClear
      showSearch
      optionFilterProp="children"
    >
      {parameter.choices?.map((choice: AutocompleteChoice) => (
        <Option 
          key={choice.value} 
          value={choice.value}
          disabled={choice.disabled}
        >
          <Space>
            {choice.icon && <span>{choice.icon}</span>}
            <span>{choice.name}</span>
            {choice.description && (
              <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
                {choice.description}
              </span>
            )}
          </Space>
        </Option>
      ))}
    </Select>
  );
};

/**
 * 자동완성 파라미터 컴포넌트
 */
const AutocompleteParameter: React.FC<any> = ({ 
  parameter, 
  commandName, 
  context, 
  value, 
  onChange, 
  ...props 
}) => {
  const [searchValue, setSearchValue] = React.useState('');
  
  const { 
    data: choices, 
    isLoading, 
    filteredChoices 
  } = useParameterAutocomplete(
    commandName,
    parameter,
    context,
    searchValue
  );

  const handleSearch = (val: string) => {
    setSearchValue(val);
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setSearchValue('');
  };

  const options = filteredChoices.map(choice => ({
    value: choice.value,
    label: (
      <Space>
        {choice.icon && <span>{choice.icon}</span>}
        <span>{choice.name}</span>
        {choice.description && (
          <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
            {choice.description}
          </span>
        )}
      </Space>
    )
  }));

  return (
    <AutoComplete
      {...props}
      value={value}
      options={options}
      onSearch={handleSearch}
      onSelect={handleSelect}
      onChange={onChange}
      notFoundContent={isLoading ? <Spin size="small" /> : '검색 결과 없음'}
      filterOption={false} // 서버사이드 필터링 사용
    />
  );
};

/**
 * 사용자 선택 파라미터 컴포넌트
 */
const UserPickerParameter: React.FC<any> = ({ context, value, onChange, ...props }) => {
  // TODO: 사용자 선택 구현 (Discord API 연동 필요)
  return (
    <AutoComplete
      {...props}
      value={value}
      onChange={onChange}
      placeholder="사용자 이름 또는 ID 입력"
      prefix={<UserOutlined />}
    />
  );
};

/**
 * 채널 선택 파라미터 컴포넌트  
 */
const ChannelPickerParameter: React.FC<any> = ({ context, value, onChange, ...props }) => {
  const { data: channels, isLoading } = useParameterAutocomplete(
    'channel_picker',
    { 
      name: 'channel',
      type: 'channel',
      description: '채널 선택',
      required: false,
      autocomplete: { type: 'guild_channels' }
    } as EnhancedBotCommandParameter,
    context,
    ''
  );

  return (
    <Select
      {...props}
      value={value}
      onChange={onChange}
      loading={isLoading}
      showSearch
      optionFilterProp="children"
      prefix={<CommentOutlined />}
    >
      {channels?.map((channel: AutocompleteChoice) => (
        <Option key={channel.value} value={channel.value}>
          <Space>
            <span>{channel.icon}</span>
            <span>{channel.name}</span>
          </Space>
        </Option>
      ))}
    </Select>
  );
};

/**
 * 역할 선택 파라미터 컴포넌트
 */
const RolePickerParameter: React.FC<any> = ({ context, value, onChange, ...props }) => {
  const { data: roles, isLoading } = useParameterAutocomplete(
    'role_picker',
    { 
      name: 'role',
      type: 'role',
      description: '역할 선택',
      required: false,
      autocomplete: { type: 'guild_roles' }
    } as EnhancedBotCommandParameter,
    context,
    ''
  );

  return (
    <Select
      {...props}
      value={value}
      onChange={onChange}
      loading={isLoading}
      showSearch
      optionFilterProp="children"
      prefix={<TeamOutlined />}
    >
      {roles?.map((role: AutocompleteChoice) => (
        <Option key={role.value} value={role.value} disabled={role.disabled}>
          <Space>
            <span>{role.icon}</span>
            <span>{role.name}</span>
            {role.description && (
              <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
                {role.description}
              </span>
            )}
          </Space>
        </Option>
      ))}
    </Select>
  );
};

/**
 * 텍스트 영역 파라미터 컴포넌트
 */
const TextAreaParameter: React.FC<any> = ({ parameter, value, onChange, ...props }) => (
  <TextArea
    {...props}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    rows={4}
    maxLength={parameter.ui?.maxLength}
    showCount={Boolean(parameter.ui?.maxLength)}
  />
);

/**
 * 기본 입력 파라미터 컴포넌트
 */
const InputParameter: React.FC<any> = ({ parameter, value, onChange, ...props }) => (
  <Input
    {...props}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    maxLength={parameter.ui?.maxLength}
    showCount={Boolean(parameter.ui?.maxLength)}
  />
);