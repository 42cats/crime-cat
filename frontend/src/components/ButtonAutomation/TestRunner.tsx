import React, { useState } from 'react';
import { Card, Button, Space, Typography, Steps, Alert, Spin, Timeline, Tag, Modal, message } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { ButtonAutomation, ActionConfig, ACTION_TYPE_CONFIGS } from '../../types/buttonAutomation';
import { buttonAutomationApi } from '../../lib/api/buttonAutomation';

const { Title, Text } = Typography;
const { Step } = Steps;

interface TestResult {
  actionIndex: number;
  actionType: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  executionTime?: number;
  details?: any;
}

interface TestRunnerProps {
  button: ButtonAutomation;
  visible: boolean;
  onClose: () => void;
  roles?: any[];
  channels?: any[];
  users?: any[];
}

export const TestRunner: React.FC<TestRunnerProps> = ({
  button,
  visible,
  onClose,
  roles = [],
  channels = [],
  users = []
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  // 헬퍼 함수들
  const getRoleName = (roleId: string): string => {
    const role = roles.find(r => r.id === roleId);
    return role ? `"${role.name}"` : `역할(${roleId.slice(0, 8)}...)`;
  };

  const getChannelName = (channelId: string): string => {
    const channel = channels.find(c => c.id === channelId);
    return channel ? `#${channel.name}` : `채널(${channelId.slice(0, 8)}...)`;
  };

  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user ? `@${user.username}` : `사용자(${userId.slice(0, 8)}...)`;
  };

  const getTargetText = (action: ActionConfig): string => {
    switch (action.target) {
      case 'executor': 
        return '버튼을 누른 사용자';
      case 'role': 
        if (action.parameters.targetRoleIds) {
          const roleNames = action.parameters.targetRoleIds.map((id: string) => getRoleName(id)).join(', ');
          return `${roleNames} 역할을 가진 사용자들`;
        }
        return '특정 역할을 가진 사용자들';
      case 'admin': 
        return '관리자 권한을 가진 사용자들';
      case 'all': 
        return '모든 사용자';
      case 'specific':
        if (action.parameters.targetUserId) {
          return getUserName(action.parameters.targetUserId);
        }
        return '특정 사용자';
      default: 
        return '지정된 대상';
    }
  };

  const getVisibilityText = (visibility: string): string => {
    switch (visibility) {
      case 'none': return '';
      case 'ephemeral': return '🔒 개인 알림';
      case 'private': return '📨 개인 메시지';
      case 'current_channel': return '💬 공개 알림';
      case 'specific_channel': return '📢 채널 알림';
      default: return '💬 알림';
    }
  };

  // 버튼 설정 파싱
  const parseButtonConfig = () => {
    try {
      return JSON.parse(button.config);
    } catch (error) {
      return null;
    }
  };

  // 테스트 실행
  const runTest = async () => {
    const config = parseButtonConfig();
    if (!config || !config.actions) {
      message.error('버튼 설정을 읽을 수 없습니다.');
      return;
    }

    setIsRunning(true);
    setCurrentStep(0);
    setTestResults([]);
    setOverallStatus('running');

    const results: TestResult[] = [];

    try {
      // 1. 조건 검증 단계
      const conditionResult = await testConditions(config.conditions);
      results.push({
        actionIndex: -1,
        actionType: 'conditions',
        status: conditionResult.status,
        message: conditionResult.message,
        executionTime: conditionResult.executionTime
      });

      if (conditionResult.status === 'error') {
        setTestResults(results);
        setOverallStatus('error');
        setIsRunning(false);
        return;
      }

      // 2. 액션 실행 시뮬레이션
      for (let i = 0; i < config.actions.length; i++) {
        setCurrentStep(i + 1);
        
        const action = config.actions[i];
        const result = await testAction(action, i);
        results.push(result);
        
        // 실시간 결과 업데이트
        setTestResults([...results]);
        
        // 지연 시간 시뮬레이션
        if (action.delay && action.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, Math.min(action.delay * 100, 2000)));
        }
        
        // 에러 발생 시 중단
        if (result.status === 'error') {
          setOverallStatus('error');
          setIsRunning(false);
          return;
        }
      }

      setOverallStatus('success');
      message.success('테스트가 성공적으로 완료되었습니다!');
      
    } catch (error) {
      console.error('Test execution error:', error);
      results.push({
        actionIndex: -1,
        actionType: 'system',
        status: 'error',
        message: '테스트 실행 중 시스템 오류가 발생했습니다.'
      });
      setTestResults(results);
      setOverallStatus('error');
    } finally {
      setIsRunning(false);
      setCurrentStep(-1);
    }
  };

  // 조건 테스트
  const testConditions = async (conditions: any): Promise<{
    status: 'success' | 'warning' | 'error';
    message: string;
    executionTime: number;
  }> => {
    const startTime = Date.now();
    
    await new Promise(resolve => setTimeout(resolve, 500)); // 시뮬레이션 지연
    
    const executionTime = Date.now() - startTime;
    
    if (!conditions) {
      return {
        status: 'warning',
        message: '설정된 조건이 없습니다. 모든 사용자가 버튼을 사용할 수 있습니다.',
        executionTime
      };
    }

    const checks = [];
    
    if (conditions.requiredRoles?.length > 0) {
      checks.push(`필수 역할 ${conditions.requiredRoles.length}개 확인`);
    }
    
    if (conditions.deniedRoles?.length > 0) {
      checks.push(`차단 역할 ${conditions.deniedRoles.length}개 확인`);
    }
    
    if (conditions.requiredChannel) {
      checks.push('채널 제한 확인');
    }
    
    if (conditions.cooldown > 0) {
      checks.push(`쿨다운 ${conditions.cooldown}초 확인`);
    }

    return {
      status: 'success',
      message: checks.length > 0 
        ? `조건 검증 완료: ${checks.join(', ')}`
        : '조건 검증을 통과했습니다.',
      executionTime
    };
  };

  // 액션 테스트
  const testAction = async (action: ActionConfig, index: number): Promise<TestResult> => {
    const startTime = Date.now();
    const actionType = ACTION_TYPE_CONFIGS[action.type as keyof typeof ACTION_TYPE_CONFIGS];
    
    // 액션 타입별 시뮬레이션 지연 시간
    const simulationTime = Math.random() * 800 + 200;
    await new Promise(resolve => setTimeout(resolve, simulationTime));
    
    const executionTime = Date.now() - startTime;

    // 파라미터 검증
    const parameterValidation = validateActionParameters(action);
    if (!parameterValidation.isValid) {
      return {
        actionIndex: index,
        actionType: action.type,
        status: 'error',
        message: `파라미터 오류: ${parameterValidation.error}`,
        executionTime
      };
    }

    // 랜덤 에러 시뮬레이션 (10% 확률)
    const shouldSimulateError = Math.random() < 0.1;
    if (shouldSimulateError) {
      const errorScenarios = getErrorScenarios(action.type);
      if (errorScenarios.length > 0) {
        const error = errorScenarios[Math.floor(Math.random() * errorScenarios.length)];
        return {
          actionIndex: index,
          actionType: action.type,
          status: error.status as 'error' | 'warning',
          message: error.message,
          executionTime,
          details: {
            target: action.target,
            parameters: action.parameters,
            error: error.code
          }
        };
      }
    }

    // 시뮬레이션 결과 생성
    const simulationResult = generateSimulationResult(action, actionType);
    
    return {
      actionIndex: index,
      actionType: action.type,
      status: simulationResult.status,
      message: simulationResult.message,
      executionTime,
      details: simulationResult.details
    };
  };

  // 액션별 에러 시나리오
  const getErrorScenarios = (actionType: string) => {
    const scenarios: { [key: string]: Array<{status: string, message: string, code: string}> } = {
      add_role: [
        { status: 'error', message: '봇의 역할보다 높은 역할은 추가할 수 없습니다.', code: 'ROLE_HIERARCHY' },
        { status: 'warning', message: '사용자가 이미 해당 역할을 가지고 있습니다.', code: 'ROLE_EXISTS' }
      ],
      move_voice_channel: [
        { status: 'error', message: '사용자가 음성 채널에 연결되어 있지 않습니다.', code: 'NOT_IN_VOICE' },
        { status: 'error', message: '대상 음성 채널이 가득 찼습니다.', code: 'CHANNEL_FULL' }
      ],
      send_dm: [
        { status: 'error', message: '사용자가 DM을 차단했습니다.', code: 'DM_BLOCKED' }
      ],
      set_channel_permission: [
        { status: 'error', message: '봇에게 채널 권한 관리 권한이 없습니다.', code: 'MISSING_PERMISSIONS' }
      ],
      play_music: [
        { status: 'error', message: '사용자가 음성 채널에 없습니다.', code: 'USER_NOT_IN_VOICE' },
        { status: 'warning', message: '이미 음악이 재생 중입니다.', code: 'ALREADY_PLAYING' }
      ]
    };

    return scenarios[actionType] || [];
  };

  // 액션 파라미터 검증
  const validateActionParameters = (action: ActionConfig): { isValid: boolean; error?: string } => {
    const actionType = ACTION_TYPE_CONFIGS[action.type as keyof typeof ACTION_TYPE_CONFIGS];
    
    if (!actionType) {
      return { isValid: false, error: '알 수 없는 액션 타입입니다.' };
    }

    // 필수 파라미터 검증
    for (const param of actionType.parameters) {
      if (!action.parameters[param]) {
        // 일부 파라미터는 선택사항일 수 있음
        const optionalParams = ['duration', 'reason', 'trackTitle', 'buttonLabel', 'buttonEmoji', 'volume', 'stopBehavior'];
        if (!optionalParams.includes(param)) {
          return { isValid: false, error: `필수 파라미터 '${param}'가 누락되었습니다.` };
        }
      }
    }

    // 액션별 추가 검증
    switch (action.type) {
      case 'set_voice_mute':
      case 'set_voice_deafen':
      case 'add_timeout':
        if (action.parameters.duration && action.parameters.duration < 0) {
          return { isValid: false, error: 'Duration은 0 이상이어야 합니다.' };
        }
        break;
        
      case 'play_music':
        if (!action.parameters.source || !action.parameters.trackId) {
          return { isValid: false, error: '음악 소스와 트랙 ID가 필요합니다.' };
        }
        break;
        
      case 'set_channel_permission':
      case 'remove_channel_permission':
      case 'override_channel_permission':
        if (!action.parameters.permissions || action.parameters.permissions.length === 0) {
          return { isValid: false, error: '최소 하나 이상의 권한이 필요합니다.' };
        }
        break;
        
      case 'toggle_role':
        if (Array.isArray(action.parameters.roleId) && action.parameters.roleId.length === 0) {
          return { isValid: false, error: '최소 하나 이상의 역할이 필요합니다.' };
        }
        break;
    }

    return { isValid: true };
  };

  // 시뮬레이션 결과 생성
  const generateSimulationResult = (action: ActionConfig, actionType: any) => {
    let message = '';
    
    // 액션별 사용자 친화적 메시지 생성
    switch (action.type) {
      // 역할 관리
      case 'add_role': {
        // roleIds 배열을 우선적으로 사용 (멀티 역할 추가)
        const roleNames = action.parameters.roleIds && Array.isArray(action.parameters.roleIds)
          ? action.parameters.roleIds.map((id: string) => getRoleName(id)).join(', ')
          : action.parameters.roleId ? getRoleName(action.parameters.roleId) : '역할';
        message = `${roleNames} 역할을 추가했습니다.`;
        break;
      }
      case 'remove_role': {
        // roleIds 배열을 우선적으로 사용 (멀티 역할 제거)
        const roleNames = action.parameters.roleIds && Array.isArray(action.parameters.roleIds)
          ? action.parameters.roleIds.map((id: string) => getRoleName(id)).join(', ')
          : action.parameters.roleId ? getRoleName(action.parameters.roleId) : '역할';
        message = `${roleNames} 역할을 제거했습니다.`;
        break;
      }
      case 'toggle_role': {
        // roleIds 배열을 우선적으로 사용 (멀티 역할 토글)
        const roleNames = action.parameters.roleIds && Array.isArray(action.parameters.roleIds)
          ? action.parameters.roleIds.map((id: string) => getRoleName(id)).join(', ')
          : action.parameters.roleId ? getRoleName(action.parameters.roleId) : '역할';
        message = `${roleNames} 역할을 토글했습니다.`;
        break;
      }
      
      // 닉네임 관리
      case 'change_nickname':
        message = `닉네임을 "${action.parameters.nickname}"로 변경했습니다.`;
        break;
      case 'reset_nickname':
        message = '닉네임을 초기화했습니다.';
        break;
      
      // 메시지 관리
      case 'send_message': {
        const channelName = action.parameters.channelId ? getChannelName(action.parameters.channelId) : '채널';
        message = `${channelName}에 메시지를 전송했습니다.`;
        break;
      }
      case 'send_dm':
        message = '개인 메시지를 전송했습니다.';
        break;
      
      // 음성 채널 이동
      case 'move_voice_channel': {
        const channelName = action.parameters.channelId ? getChannelName(action.parameters.channelId) : '음성 채널';
        message = `${channelName}로 이동했습니다.`;
        break;
      }
      case 'disconnect_voice':
        message = '음성 채널에서 연결을 해제했습니다.';
        break;
      
      // 음성 제어
      case 'set_voice_mute':
        message = `${action.parameters.duration || '무제한'}초 동안 음소거했습니다.`;
        break;
      case 'set_voice_deafen':
        message = `${action.parameters.duration || '무제한'}초 동안 스피커를 차단했습니다.`;
        break;
      case 'toggle_voice_mute':
        message = '마이크 상태를 토글했습니다.';
        break;
      case 'toggle_voice_deafen':
        message = '스피커 상태를 토글했습니다.';
        break;
      case 'set_priority_speaker':
        message = `우선 발언자 권한을 ${action.parameters.enable ? '활성화' : '비활성화'}했습니다.`;
        break;
      
      // 채널 권한 관리
      case 'set_channel_permission': {
        const channelName = action.parameters.channelId ? getChannelName(action.parameters.channelId) : '채널';
        message = `${channelName}에 권한을 설정했습니다.`;
        break;
      }
      case 'remove_channel_permission': {
        const channelName = action.parameters.channelId ? getChannelName(action.parameters.channelId) : '채널';
        message = `${channelName}의 권한을 제거했습니다.`;
        break;
      }
      case 'override_channel_permission': {
        const channelName = action.parameters.channelId ? getChannelName(action.parameters.channelId) : '채널';
        message = `${channelName}의 권한을 오버라이드했습니다.`;
        break;
      }
      case 'reset_channel_permission': {
        const channelName = action.parameters.channelId ? getChannelName(action.parameters.channelId) : '채널';
        message = `${channelName}의 권한을 초기화했습니다.`;
        break;
      }
      
      // 모더레이션
      case 'remove_timeout':
        message = '타임아웃을 해제했습니다.';
        break;
      case 'kick_member':
        message = `서버에서 추방했습니다${action.parameters.reason ? ` (사유: ${action.parameters.reason})` : ''}.`;
        break;
      case 'ban_member':
        message = `서버에서 차단했습니다${action.parameters.reason ? ` (사유: ${action.parameters.reason})` : ''}.`;
        break;
      case 'warn_member':
        message = `경고를 부여했습니다${action.parameters.reason ? ` (사유: ${action.parameters.reason})` : ''}.`;
        break;
      case 'add_timeout':
        message = `${action.parameters.duration}초 동안 타임아웃했습니다.`;
        break;
      
      // 음악 관리
      case 'play_music':
        message = `"${action.parameters.trackTitle || '선택된 음악'}"을 재생했습니다.`;
        break;
      case 'stop_music':
        message = '음악 재생을 정지했습니다.';
        break;
      case 'pause_music':
        message = '음악을 일시정지/재개했습니다.';
        break;
      
      // 버튼 설정
      case 'button_setting':
        message = `버튼 설정을 변경했습니다${action.parameters.buttonLabel ? `: ${action.parameters.buttonLabel}` : ''}.`;
        break;
      
      // 기타
      case 'set_slowmode':
        message = `슬로우모드를 ${action.parameters.seconds}초로 설정했습니다.`;
        break;
        
      default:
        message = `${actionType?.label || action.type} 액션을 실행했습니다.`;
    }

    return {
      status: 'success' as const,
      message,
      details: {
        target: getTargetText(action),
        resultMessage: action.result?.message,
        visibility: action.result?.visibility
      }
    };
  };

  // 상태별 아이콘
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  // 액션 카테고리 가져오기
  const getActionCategory = (actionType: string): string => {
    const categories: { [key: string]: string } = {
      // 역할 관리
      add_role: '역할',
      remove_role: '역할',
      toggle_role: '역할',
      
      // 닉네임 관리
      change_nickname: '닉네임',
      reset_nickname: '닉네임',
      
      // 메시지 관리
      send_message: '메시지',
      send_dm: '메시지',
      
      // 음성 채널
      move_voice_channel: '음성',
      disconnect_voice: '음성',
      set_voice_mute: '음성',
      set_voice_deafen: '음성',
      toggle_voice_mute: '음성',
      toggle_voice_deafen: '음성',
      set_priority_speaker: '음성',
      
      // 채널 권한
      set_channel_permission: '권한',
      remove_channel_permission: '권한',
      override_channel_permission: '권한',
      reset_channel_permission: '권한',
      
      // 모더레이션
      remove_timeout: '관리',
      kick_member: '관리',
      ban_member: '관리',
      warn_member: '관리',
      add_timeout: '관리',
      
      // 음악
      play_music: '음악',
      stop_music: '음악',
      pause_music: '음악',
      
      // 버튼
      button_setting: '버튼',
      
      // 기타
      set_slowmode: '채널'
    };
    
    return categories[actionType] || '기타';
  };

  const config = parseButtonConfig();

  return (
    <Modal
      title={
        <Space>
          <PlayCircleOutlined />
          <span>버튼 테스트 실행</span>
          <Tag color="blue">{button.buttonLabel}</Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          닫기
        </Button>,
        <Button 
          key="test" 
          type="primary" 
          icon={<PlayCircleOutlined />}
          loading={isRunning}
          onClick={runTest}
          disabled={!config}
        >
          {isRunning ? '테스트 실행 중...' : '테스트 실행'}
        </Button>
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        
        {/* 테스트 개요 */}
        <Alert
          type="info"
          message="시뮬레이션 테스트"
          description="실제 Discord 액션은 실행되지 않으며, 설정 검증과 흐름만 테스트됩니다."
          showIcon
        />

        {/* 진행 상황 */}
        {config && (
          <Card size="small" title="테스트 진행 상황">
            <Steps 
              current={currentStep} 
              status={overallStatus === 'error' ? 'error' : 'process'}
              size="small"
            >
              <Step title="조건 검증" description="실행 조건 확인" />
              {config.actions?.map((action: ActionConfig, index: number) => {
                const actionType = ACTION_TYPE_CONFIGS[action.type as keyof typeof ACTION_TYPE_CONFIGS];
                const category = getActionCategory(action.type);
                return (
                  <Step 
                    key={index}
                    title={`액션 ${index + 1}`} 
                    description={
                      <div>
                        <Tag size="small" color="blue">{category}</Tag>
                        <span style={{ marginLeft: 4 }}>{actionType?.label}</span>
                      </div>
                    }
                  />
                );
              })}
            </Steps>
          </Card>
        )}

        {/* 테스트 결과 */}
        {testResults.length > 0 && (
          <Card size="small" title="실행 결과">
            <Timeline
              items={testResults.map((result, index) => ({
                key: index,
                dot: getStatusIcon(result.status),
                color: result.status === 'success' ? 'green' : result.status === 'error' ? 'red' : 'orange',
                children: (
                  <div>
                    <Space>
                      <Text strong>
                        {result.actionIndex === -1 
                          ? '조건 검증' 
                          : `액션 ${result.actionIndex + 1}`}
                      </Text>
                      {result.actionIndex !== -1 && (
                        <Tag size="small" color="blue">
                          {getActionCategory(result.actionType)}
                        </Tag>
                      )}
                      {result.executionTime && (
                        <Tag size="small" style={{ marginLeft: 8 }}>
                          {result.executionTime}ms
                        </Tag>
                      )}
                    </Space>
                    <br />
                    <Text type={result.status === 'error' ? 'danger' : result.status === 'warning' ? 'warning' : 'secondary'}>
                      {result.message}
                    </Text>
                    {result.details && (
                      <div style={{ marginTop: 8, fontSize: 12 }}>
                        <div style={{ color: '#666', marginBottom: 4 }}>
                          <strong>대상:</strong> {result.details.target}
                        </div>
                        {result.details.error && (
                          <div style={{ marginBottom: 4 }}>
                            <Tag size="small" color="red">에러 코드: {result.details.error}</Tag>
                          </div>
                        )}
                        {result.details.resultMessage && result.details.visibility !== 'none' && (
                          <div style={{ marginTop: 4, padding: '4px 8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                              <span>{getVisibilityText(result.details.visibility || 'none')}</span>
                            </div>
                            <div style={{ color: '#666' }}>
                              "{result.details.resultMessage}"
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              }))}
            />
          </Card>
        )}

        {/* 로딩 상태 */}
        {isRunning && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>테스트 실행 중...</Text>
            </div>
          </div>
        )}

        {/* 설정이 없는 경우 */}
        {!config && (
          <Alert
            type="error"
            message="버튼 설정 오류"
            description="버튼 설정을 읽을 수 없습니다. 설정을 다시 확인해주세요."
            showIcon
          />
        )}
      </Space>
    </Modal>
  );
};