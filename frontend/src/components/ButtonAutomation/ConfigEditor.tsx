import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, Eye, Code, Save, Terminal, RefreshCw } from 'lucide-react';
import { ButtonConfig, ActionConfig, ACTION_TYPE_CONFIGS } from '../../types/buttonAutomation';
import { validateButtonConfig, createExampleConfig } from '../../utils/buttonAutomationPreview';
import ButtonPreview from './ButtonPreview';

interface BotCommand {
  name: string;
  description: string;
  type: 'slash' | 'prefix';
  parameters?: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'user' | 'channel' | 'role';
    description: string;
    required: boolean;
    choices?: { name: string; value: string }[];
  }[];
}

interface ConfigEditorProps {
  config: Partial<ButtonConfig>;
  onChange: (config: Partial<ButtonConfig>) => void;
  buttonLabel?: string;
  roles?: any[];
  channels?: any[];
  users?: any[];
  onSave?: () => void;
  className?: string;
}

const ConfigEditor: React.FC<ConfigEditorProps> = ({
  config,
  onChange,
  buttonLabel = '새 버튼',
  roles = [],
  channels = [],
  users = [],
  onSave,
  className = ''
}) => {
  console.log('🚀 [Debug] ConfigEditor 렌더링 시작:', {
    config,
    buttonLabel,
    hasActions: !!config.actions,
    actionsCount: config.actions?.length || 0,
    firstActionType: config.actions?.[0]?.type
  });
  
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'json'>('editor');
  const [jsonText, setJsonText] = useState('');
  const [botCommands, setBotCommands] = useState<BotCommand[]>([]);
  const [loadingCommands, setLoadingCommands] = useState(false);
  const [commandsError, setCommandsError] = useState<string | null>(null);

  // JSON 텍스트 동기화
  useEffect(() => {
    setJsonText(JSON.stringify(config, null, 2));
  }, [config]);

  // 봇 커맨드 로드
  const loadBotCommands = async () => {
    setLoadingCommands(true);
    setCommandsError(null);
    
    try {
      const response = await fetch('/api/v1/automations/bot-commands');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setBotCommands(data.commands);
      } else {
        throw new Error(data.error || '알 수 없는 오류가 발생했습니다');
      }
    } catch (error) {
      console.error('봇 커맨드 로드 실패:', error);
      setCommandsError(error instanceof Error ? error.message : '커맨드를 불러올 수 없습니다');
      setBotCommands([]);
    } finally {
      setLoadingCommands(false);
    }
  };

  // 컴포넌트 마운트 시 봇 커맨드 로드
  useEffect(() => {
    console.log('🚀 [Debug] ConfigEditor 마운트됨');
    console.log('📋 [Debug] ACTION_TYPE_CONFIGS 확인:', {
      configs: ACTION_TYPE_CONFIGS,
      keys: Object.keys(ACTION_TYPE_CONFIGS),
      hasBotCommand: 'execute_bot_command' in ACTION_TYPE_CONFIGS
    });
    loadBotCommands();
  }, []);

  // 기본 설정 로드
  const loadExample = () => {
    const example = createExampleConfig();
    onChange(example);
  };

  // JSON 직접 편집
  const handleJsonChange = (value: string) => {
    setJsonText(value);
    try {
      const parsed = JSON.parse(value);
      onChange(parsed);
    } catch (e) {
      // JSON 파싱 오류는 무시 (사용자가 입력 중일 수 있음)
    }
  };

  // 트리거 설정 업데이트
  const updateTrigger = (updates: Partial<ButtonConfig['trigger']>) => {
    onChange({
      ...config,
      trigger: { ...config.trigger, ...updates }
    });
  };

  // 액션 추가
  const addAction = () => {
    const newAction: ActionConfig = {
      type: 'add_role',
      order: (config.actions?.length || 0) + 1,
      target: 'executor',
      parameters: {}
    };

    onChange({
      ...config,
      actions: [...(config.actions || []), newAction]
    });
  };

  // 액션 업데이트
  const updateAction = (index: number, updates: Partial<ActionConfig>) => {
    console.log('🔄 [Debug] updateAction 호출됨:', {
      index,
      updates,
      currentAction: config.actions?.[index],
      newType: updates.type
    });
    
    const newActions = [...(config.actions || [])];
    newActions[index] = { ...newActions[index], ...updates };
    
    console.log('📝 [Debug] 액션 업데이트 후:', {
      index,
      oldAction: config.actions?.[index],
      newAction: newActions[index],
      allActions: newActions
    });
    
    onChange({
      ...config,
      actions: newActions
    });
  };

  // 액션 삭제
  const removeAction = (index: number) => {
    const newActions = config.actions?.filter((_, i) => i !== index) || [];
    onChange({
      ...config,
      actions: newActions
    });
  };

  // 옵션 업데이트
  const updateOptions = (updates: Partial<ButtonConfig['options']>) => {
    onChange({
      ...config,
      options: { ...config.options, ...updates }
    });
  };

  // UI 설정 업데이트
  const updateUI = (updates: Partial<ButtonConfig['ui']>) => {
    onChange({
      ...config,
      ui: { ...config.ui, ...updates }
    });
  };

  // 선택된 봇 커맨드 정보 가져오기
  const getSelectedCommand = (commandName: string): BotCommand | null => {
    return botCommands.find(cmd => cmd.name === commandName) || null;
  };

  // 봇 커맨드 파라미터 렌더링
  const renderBotCommandParameters = (action: ActionConfig, actionIndex: number) => {
    console.log('🔍 [Debug] renderBotCommandParameters 호출됨', {
      actionIndex,
      commandName: action.parameters?.commandName,
      botCommandsCount: botCommands.length,
      actionParameters: action.parameters,
      botCommandsLoaded: botCommands.length > 0
    });

    const selectedCommandName = action.parameters?.commandName;
    if (!selectedCommandName) {
      console.log('❌ [Debug] selectedCommandName이 없음');
      return null;
    }

    console.log('🔍 [Debug] 선택된 커맨드명:', selectedCommandName);
    console.log('🔍 [Debug] 사용 가능한 커맨드들:', botCommands.map(cmd => ({ name: cmd.name, hasParams: !!cmd.parameters, paramCount: cmd.parameters?.length || 0 })));

    const selectedCommand = getSelectedCommand(selectedCommandName);
    console.log('🔍 [Debug] getSelectedCommand 결과:', {
      selectedCommandName,
      found: !!selectedCommand,
      selectedCommand: selectedCommand ? {
        name: selectedCommand.name,
        description: selectedCommand.description,
        hasParameters: !!selectedCommand.parameters,
        parametersCount: selectedCommand.parameters?.length || 0,
        parameters: selectedCommand.parameters
      } : null
    });

    if (!selectedCommand) {
      console.log('❌ [Debug] selectedCommand가 null임');
      return null;
    }

    if (!selectedCommand.parameters) {
      console.log('❌ [Debug] selectedCommand.parameters가 없음');
      return null;
    }

    if (selectedCommand.parameters.length === 0) {
      console.log('❌ [Debug] selectedCommand.parameters가 빈 배열임');
      return null;
    }

    console.log('✅ [Debug] 파라미터 폼 렌더링 시작', {
      commandName: selectedCommand.name,
      parameterCount: selectedCommand.parameters.length,
      parameters: selectedCommand.parameters.map(p => ({ name: p.name, type: p.type, required: p.required }))
    });

    return (
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            커맨드 파라미터: {selectedCommand.name}
          </span>
        </div>
        <div className="space-y-3">
          {selectedCommand.parameters.map((param) => (
            <div key={param.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {param.name}
                {param.required && <span className="text-red-500 ml-1">*</span>}
                <span className="text-xs text-gray-500 ml-2">({param.type})</span>
              </label>
              <p className="text-xs text-gray-600 mb-2">{param.description}</p>
              
              {param.choices ? (
                <select
                  value={action.parameters?.[param.name] || ''}
                  onChange={(e) => updateAction(actionIndex, {
                    parameters: { ...action.parameters, [param.name]: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">선택해주세요</option>
                  {param.choices.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.name}
                    </option>
                  ))}
                </select>
              ) : param.type === 'boolean' ? (
                <select
                  value={action.parameters?.[param.name] || ''}
                  onChange={(e) => updateAction(actionIndex, {
                    parameters: { ...action.parameters, [param.name]: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">선택해주세요</option>
                  <option value="true">참 (True)</option>
                  <option value="false">거짓 (False)</option>
                </select>
              ) : param.type === 'number' ? (
                <input
                  type="number"
                  value={action.parameters?.[param.name] || ''}
                  onChange={(e) => updateAction(actionIndex, {
                    parameters: { ...action.parameters, [param.name]: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder={`숫자를 입력하세요`}
                />
              ) : param.type === 'user' ? (
                <select
                  value={action.parameters?.[param.name] || ''}
                  onChange={(e) => updateAction(actionIndex, {
                    parameters: { ...action.parameters, [param.name]: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">사용자를 선택하세요</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              ) : param.type === 'channel' ? (
                <select
                  value={action.parameters?.[param.name] || ''}
                  onChange={(e) => updateAction(actionIndex, {
                    parameters: { ...action.parameters, [param.name]: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">채널을 선택하세요</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
              ) : param.type === 'role' ? (
                <select
                  value={action.parameters?.[param.name] || ''}
                  onChange={(e) => updateAction(actionIndex, {
                    parameters: { ...action.parameters, [param.name]: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">역할을 선택하세요</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={action.parameters?.[param.name] || ''}
                  onChange={(e) => updateAction(actionIndex, {
                    parameters: { ...action.parameters, [param.name]: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="텍스트를 입력하세요"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const validation = validateButtonConfig(config);

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* 탭 헤더 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6 py-3">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'editor'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            설정 편집
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            미리보기
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'json'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Code className="w-4 h-4" />
            JSON 편집
          </button>
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="p-6">
        {activeTab === 'editor' && (
          <div className="space-y-6">
            {/* 도구 모음 */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">버튼 자동화 설정</h3>
              <div className="flex gap-2">
                <button
                  onClick={loadExample}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  예시 불러오기
                </button>
                {onSave && (
                  <button
                    onClick={onSave}
                    disabled={!validation.isValid}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    저장
                  </button>
                )}
              </div>
            </div>

            {/* 트리거 설정 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">🎯 실행 조건 (누가)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    실행 권한
                  </label>
                  <select
                    value={config.trigger?.type || 'everyone'}
                    onChange={(e) => updateTrigger({ type: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="everyone">모든 사람</option>
                    <option value="role">특정 역할</option>
                    <option value="user">특정 사용자</option>
                    <option value="admin">관리자만</option>
                  </select>
                </div>
                {(config.trigger?.type === 'role' || config.trigger?.type === 'user') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {config.trigger.type === 'role' ? '대상 역할' : '대상 사용자'}
                    </label>
                    <select
                      value={config.trigger?.value || ''}
                      onChange={(e) => updateTrigger({ value: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">선택해주세요</option>
                      {(config.trigger.type === 'role' ? roles : users).map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name || item.username}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* 액션 설정 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">⚡ 실행 동작 (무엇을)</h4>
                <button
                  onClick={addAction}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  액션 추가
                </button>
              </div>

              <div className="space-y-4">
                {config.actions?.map((action, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-900">액션 {index + 1}</span>
                      <button
                        onClick={() => removeAction(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          액션 종류
                        </label>
                        <select
                          value={action.type}
                          onChange={(e) => {
                            console.log('🎯 [Debug] 액션 타입 선택됨:', {
                              selectedValue: e.target.value,
                              currentType: action.type,
                              actionIndex: index
                            });
                            updateAction(index, { 
                              type: e.target.value as any,
                              parameters: {} // 타입 변경 시 파라미터 초기화
                            });
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          {Object.entries(ACTION_TYPE_CONFIGS).map(([type, config]) => (
                            <option key={type} value={type}>
                              {config.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          실행 대상
                        </label>
                        <select
                          value={action.target}
                          onChange={(e) => updateAction(index, { target: e.target.value as any })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          <option value="executor">버튼을 누른 사람</option>
                          <option value="specific">특정 사용자</option>
                          <option value="admin">관리자</option>
                        </select>
                      </div>
                    </div>

                    {/* 액션별 파라미터 */}
                    {action.type === 'execute_bot_command' ? (
                      <>
                        {/* 봇 커맨드 선택 */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            실행할 커맨드
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={action.parameters?.commandName || ''}
                              onChange={(e) => {
                                // 커맨드 변경 시 기존 커맨드별 파라미터 초기화
                                const baseParams = {
                                  commandName: e.target.value,
                                  timeout: action.parameters?.timeout || 30,
                                  silent: action.parameters?.silent || false
                                };
                                updateAction(index, { parameters: baseParams });
                              }}
                              className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                              disabled={loadingCommands}
                            >
                              <option value="">커맨드를 선택하세요</option>
                              {botCommands.map((command) => (
                                <option key={command.name} value={command.name}>
                                  /{command.name} - {command.description}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={loadBotCommands}
                              disabled={loadingCommands}
                              className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
                              title="커맨드 목록 새로고침"
                            >
                              <RefreshCw className={`w-4 h-4 ${loadingCommands ? 'animate-spin' : ''}`} />
                            </button>
                          </div>
                          {loadingCommands && (
                            <p className="text-sm text-gray-500 mt-1">커맨드 목록을 불러오는 중...</p>
                          )}
                          {commandsError && (
                            <p className="text-sm text-red-600 mt-1">❌ {commandsError}</p>
                          )}
                        </div>

                        {/* 기본 봇 커맨드 파라미터 (timeout, silent) */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            실행 타임아웃 (초)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="300"
                            value={action.parameters?.timeout || 30}
                            onChange={(e) => updateAction(index, {
                              parameters: { ...action.parameters, timeout: parseInt(e.target.value) || 30 }
                            })}
                            placeholder="30"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                          />
                        </div>

                        <div className="mt-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={action.parameters?.silent || false}
                              onChange={(e) => updateAction(index, {
                                parameters: { ...action.parameters, silent: e.target.checked }
                              })}
                              className="rounded"
                            />
                            <span className="text-sm text-gray-700">조용히 실행 (실패해도 오류 표시 안함)</span>
                          </label>
                        </div>

                        {/* 동적 커맨드 파라미터 */}
                        {renderBotCommandParameters(action, index)}
                      </>
                    ) : (
                      /* 기존 액션 타입들 */
                      ACTION_TYPE_CONFIGS[action.type]?.parameters.map((param) => (
                        <div key={param.name} className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {param.label}
                            {param.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {param.type === 'select' ? (
                            <select
                              value={action.parameters?.[param.name] || ''}
                              onChange={(e) => updateAction(index, {
                                parameters: { ...action.parameters, [param.name]: e.target.value }
                              })}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                            >
                              <option value="">{param.placeholder}</option>
                              {(param.name.includes('role') ? roles : 
                                param.name.includes('channel') ? channels : 
                                param.options || []).map((item) => (
                                <option key={item.id || item.value} value={item.id || item.value}>
                                  {item.name || item.username || item.label}
                                </option>
                              ))}
                            </select>
                          ) : param.type === 'number' ? (
                            <input
                              type="number"
                              value={action.parameters?.[param.name] || ''}
                              onChange={(e) => updateAction(index, {
                                parameters: { ...action.parameters, [param.name]: parseInt(e.target.value) || 0 }
                              })}
                              placeholder={param.placeholder}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                          ) : param.type === 'boolean' ? (
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={action.parameters?.[param.name] || false}
                                onChange={(e) => updateAction(index, {
                                  parameters: { ...action.parameters, [param.name]: e.target.checked }
                                })}
                                className="rounded"
                              />
                              <span className="text-sm text-gray-700">{param.placeholder}</span>
                            </label>
                          ) : (
                            <input
                              type="text"
                              value={action.parameters?.[param.name] || ''}
                              onChange={(e) => updateAction(index, {
                                parameters: { ...action.parameters, [param.name]: e.target.value }
                              })}
                              placeholder={param.placeholder}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                          )}
                        </div>
                      ))
                    )}

                    {/* 지연 시간 설정 */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        지연 시간 (초)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={action.delay || 0}
                        onChange={(e) => updateAction(index, { delay: parseInt(e.target.value) || 0 })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                ))}

                {(!config.actions || config.actions.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    아직 액션이 없습니다. "액션 추가" 버튼을 클릭해주세요.
                  </div>
                )}
              </div>
            </div>

            {/* 옵션 설정 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">⚙️ 추가 옵션</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.options?.oncePerUser || false}
                      onChange={(e) => updateOptions({ oncePerUser: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">한 번만 실행 가능</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.ui?.disableAfter || false}
                      onChange={(e) => updateUI({ disableAfter: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">실행 후 버튼 비활성화</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      쿨다운 (초)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={config.options?.cooldownSeconds || 0}
                      onChange={(e) => updateOptions({ cooldownSeconds: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      버튼 스타일
                    </label>
                    <select
                      value={config.ui?.style || 'primary'}
                      onChange={(e) => updateUI({ style: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="primary">파란색 (기본)</option>
                      <option value="secondary">회색</option>
                      <option value="success">초록색</option>
                      <option value="danger">빨간색</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 오류 표시 */}
            {!validation.isValid && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-700 mb-2">설정 오류</h4>
                <ul className="text-red-600 text-sm space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'preview' && (
          <ButtonPreview
            config={config}
            buttonLabel={buttonLabel}
            roles={roles}
            channels={channels}
            users={users}
          />
        )}

        {activeTab === 'json' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">JSON 설정 편집</h3>
              <div className="text-sm text-gray-600">
                직접 JSON을 편집할 수 있습니다
              </div>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="w-full h-96 font-mono text-sm border border-gray-300 rounded-md p-3"
              placeholder="JSON 설정을 입력하세요..."
            />
            {!validation.isValid && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm font-medium">JSON 설정에 오류가 있습니다:</p>
                <ul className="text-red-600 text-sm mt-1 space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigEditor;