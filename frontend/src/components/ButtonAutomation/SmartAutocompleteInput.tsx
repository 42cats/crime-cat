import React from 'react';
import { AutoComplete, Input } from 'antd';
import { useAutocompleteOptions, hasAutocomplete, isMultiSelect } from '../../hooks/useAutocomplete';

interface SmartAutocompleteInputProps {
  commandName: string;
  subcommand?: string;
  parameterName: string;
  guildId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
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
  guildId,
  value,
  onChange,
  placeholder,
  disabled = false,
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
  
  /**
   * 자동완성 타입에서 파라미터명 매핑
   */
  function getParameterNameFromType(autocompleteType: string): string {
    switch (autocompleteType) {
      case 'group-names': return 'groupname';
      case 'button-groups': return '자동화_그룹';
      case 'log-files': return '파일명';
      default: return autocompleteType;
    }
  }
    
  const { data: options = [], isLoading, error } = useAutocompleteOptions(
    autocompleteParameterName,
    guildId,
    value
  );

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
        return (
          <AutoComplete
            value={value?.toString() || ''}
            onChange={onChange}
            options={[
              { value: 'true', label: '예 (true)' },
              { value: 'false', label: '아니오 (false)' }
            ]}
            placeholder="true 또는 false 선택"
            style={{ width: '100%' }}
          />
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