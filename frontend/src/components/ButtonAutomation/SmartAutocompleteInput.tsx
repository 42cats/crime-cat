import React, { useCallback } from 'react';
import { AutoComplete, Input, Switch } from 'antd';
import { useAutocompleteOptions, hasAutocomplete, isMultiSelect } from '../../hooks/useAutocomplete';

/**
 * 자동완성 타입에서 파라미터명 매핑 (컴포넌트 외부로 이동하여 재생성 방지)
 */
function getParameterNameFromType(autocompleteType: string): string {
  switch (autocompleteType) {
    case 'group-names': return 'groupname';
    case 'button-groups': return '자동화_그룹';
    case 'log-files': return '파일명';
    default: return autocompleteType;
  }
}

interface SmartAutocompleteInputProps {
  commandName: string;
  subcommand?: string;
  parameterName: string;
  parameterType?: string; // 파라미터 타입 추가
  guildId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean; // 필수 여부 추가
  // Enhanced API 메타데이터 (우선적으로 사용)
  hasAutocomplete?: boolean;
  isMultiSelect?: boolean;
  autocompleteType?: string;
}

/**
 * 스마트 자동완성 입력 컴포넌트
 * Discord 봇 커맨드의 파라미터에 따라 자동완성을 적용하거나 일반 텍스트 입력을 제공
 */
export const SmartAutocompleteInput: React.FC<SmartAutocompleteInputProps> = ({
  commandName,
  subcommand,
  parameterName,
  parameterType,
  guildId,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  hasAutocomplete: enhancedHasAutocomplete,
  isMultiSelect: enhancedIsMultiSelect,
  autocompleteType: enhancedAutocompleteType
}) => {

  // Enhanced 메타데이터가 있으면 우선 사용, 없으면 기존 로직 사용
  const hasAutocompletion = enhancedHasAutocomplete ?? hasAutocomplete(parameterName);
  const isMultiSelectParam = enhancedIsMultiSelect ?? isMultiSelect(parameterName);
  
  // 자동완성 데이터 조회 (Enhanced 메타데이터 기반)
  const autocompleteParameterName = enhancedAutocompleteType ? 
    getParameterNameFromType(enhancedAutocompleteType) : 
    parameterName;
    
  const { data: options = [], isLoading, error } = useAutocompleteOptions(
    autocompleteParameterName,
    guildId,
    value
  );

  // 불리언 타입인 경우 토글 스위치 반환
  if (parameterType === 'boolean') {
    const booleanValue = value === 'true' || (typeof value === 'boolean' && value);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Switch
          checked={booleanValue}
          onChange={(checked) => onChange(checked ? 'true' : 'false')}
          checkedChildren="참"
          unCheckedChildren="거짓"
          disabled={disabled}
        />
        <span style={{ fontSize: '14px', color: '#666' }}>
          {booleanValue ? '참 (true)' : '거짓 (false)'}
        </span>
        {required && <span style={{ color: 'red', marginLeft: 4 }}>*</span>}
      </div>
    );
  }

  // 숫자 타입인 경우 숫자 입력 반환
  if (parameterType === 'number') {
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || `${parameterName} 입력`}
        disabled={disabled}
      />
    );
  }

  // 자동완성이 없는 경우 일반 Input 반환
  if (!hasAutocompletion) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || `${parameterName} 입력`}
        disabled={disabled}
      />
    );
  }

  // 자동완성 옵션 포맷팅
  const formattedOptions = options.map(option => ({
    value: option.value,
    label: option.name
  }));

  // 멀티 선택인 경우 쉼표 분리 처리
  const handleMultiSelectChange = (newValue: string) => {
    if (isMultiSelectParam) {
      // groupnames의 경우 쉼표로 구분된 마지막 부분만 교체
      const parts = value.split(',');
      parts[parts.length - 1] = newValue;
      onChange(parts.join(','));
    } else {
      onChange(newValue);
    }
  };

  // 현재 입력값 (멀티 선택인 경우 마지막 부분만)
  const currentInputValue = isMultiSelectParam 
    ? value.split(',').pop()?.trim() || ''
    : value;

  const getPlaceholderText = () => {
    if (placeholder) return placeholder;
    
    const baseText = `${parameterName} 입력 또는 선택`;
    if (isMultiSelectParam) {
      return `${baseText} (쉼표로 구분)`;
    }
    return baseText;
  };

  return (
    <AutoComplete
      value={currentInputValue}
      onChange={handleMultiSelectChange}
      options={formattedOptions}
      placeholder={getPlaceholderText()}
      disabled={disabled}
      showSearch
      filterOption={false} // 백엔드에서 필터링 수행
      notFoundContent={
        error ? '자동완성 로드 실패' : 
        isLoading ? '로딩 중...' : 
        '옵션 없음'
      }
      style={{ width: '100%' }}
    />
  );
};

/**
 * 봇 커맨드 파라미터 입력 컴포넌트
 * 커맨드 메타데이터를 기반으로 적절한 입력 컴포넌트 렌더링
 */
interface BotCommandParameterInputProps {
  commandName: string;
  subcommand: string;
  parameterName: string;
  parameterType: string;
  description: string;
  required: boolean;
  guildId: string;
  value: any;
  onChange: (value: any) => void;
  // Enhanced API 메타데이터 (선택적)
  hasAutocomplete?: boolean;
  isMultiSelect?: boolean;
  autocompleteType?: string;
}

export const BotCommandParameterInput: React.FC<BotCommandParameterInputProps> = ({
  commandName,
  subcommand,
  parameterName,
  parameterType,
  description,
  required,
  guildId,
  value,
  onChange,
  hasAutocomplete,
  isMultiSelect,
  autocompleteType
}) => {
  const renderInput = () => {
    switch (parameterType) {
      case 'string':
        return (
          <SmartAutocompleteInput
            commandName={commandName}
            subcommand={subcommand}
            parameterName={parameterName}
            guildId={guildId}
            value={value || ''}
            onChange={onChange}
            placeholder={description}
            hasAutocomplete={hasAutocomplete}
            isMultiSelect={isMultiSelect}
            autocompleteType={autocompleteType}
          />
        );
      
      case 'boolean':
        const booleanValue = value === 'true' || value === true;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Switch
              checked={booleanValue}
              onChange={(checked) => onChange(checked ? 'true' : 'false')}
              checkedChildren="참"
              unCheckedChildren="거짓"
            />
            <span style={{ fontSize: '14px', color: '#666' }}>
              {booleanValue ? '참 (true)' : '거짓 (false)'}
            </span>
          </div>
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={description}
          />
        );
      
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={description}
          />
        );
    }
  };

  return (
    <div>
      <label style={{ fontWeight: required ? 'bold' : 'normal' }}>
        {parameterName} {required && <span style={{ color: 'red' }}>*</span>}
      </label>
      <div style={{ marginTop: 4 }}>
        {renderInput()}
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
        {description}
      </div>
    </div>
  );
};