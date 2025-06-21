import React, { useState } from 'react';
import { Card, Button, Space, Typography, Steps, Alert, Spin, Timeline, Tag, Modal, message } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { ButtonAutomation, ActionConfig } from '../../types/buttonAutomation';
import { ACTION_TYPES } from '../../constants/actionTypes';
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
}

export const TestRunner: React.FC<TestRunnerProps> = ({
  button,
  visible,
  onClose
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

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
    const actionType = ACTION_TYPES[action.type as keyof typeof ACTION_TYPES];
    
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

  // 액션 파라미터 검증
  const validateActionParameters = (action: ActionConfig): { isValid: boolean; error?: string } => {
    const actionType = ACTION_TYPES[action.type as keyof typeof ACTION_TYPES];
    
    if (!actionType) {
      return { isValid: false, error: '알 수 없는 액션 타입입니다.' };
    }

    for (const param of actionType.parameters) {
      if (!action.parameters[param]) {
        return { isValid: false, error: `필수 파라미터 '${param}'가 누락되었습니다.` };
      }
    }

    return { isValid: true };
  };

  // 시뮬레이션 결과 생성
  const generateSimulationResult = (action: ActionConfig, actionType: any) => {
    // 시뮬레이션이므로 항상 성공으로 처리 (실제로는 Discord API 호출)
    const messages = {
      add_role: `역할 ID ${action.parameters.roleId}를 사용자에게 추가했습니다.`,
      remove_role: `역할 ID ${action.parameters.roleId}를 사용자로부터 제거했습니다.`,
      toggle_role: `역할 ID ${action.parameters.roleId}를 토글했습니다.`,
      change_nickname: `닉네임을 "${action.parameters.nickname}"로 변경했습니다.`,
      reset_nickname: '닉네임을 초기화했습니다.',
      send_message: `채널 ID ${action.parameters.channelId}에 메시지를 전송했습니다.`,
      send_dm: '사용자에게 DM을 전송했습니다.',
      move_voice_channel: `음성 채널 ID ${action.parameters.channelId}로 이동했습니다.`,
      disconnect_voice: '음성 채널에서 연결을 해제했습니다.',
      set_slowmode: `슬로우모드를 ${action.parameters.seconds}초로 설정했습니다.`
    };

    return {
      status: 'success' as const,
      message: messages[action.type as keyof typeof messages] || `${actionType?.label} 액션을 실행했습니다.`,
      details: {
        target: action.target,
        parameters: action.parameters,
        resultMessage: action.result?.message
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
      visible={visible}
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
                const actionType = ACTION_TYPES[action.type as keyof typeof ACTION_TYPES];
                return (
                  <Step 
                    key={index}
                    title={`액션 ${index + 1}`} 
                    description={actionType?.label}
                  />
                );
              })}
            </Steps>
          </Card>
        )}

        {/* 테스트 결과 */}
        {testResults.length > 0 && (
          <Card size="small" title="실행 결과">
            <Timeline>
              {testResults.map((result, index) => (
                <Timeline.Item
                  key={index}
                  dot={getStatusIcon(result.status)}
                  color={result.status === 'success' ? 'green' : result.status === 'error' ? 'red' : 'orange'}
                >
                  <div>
                    <Text strong>
                      {result.actionIndex === -1 
                        ? '조건 검증' 
                        : `액션 ${result.actionIndex + 1}`}
                    </Text>
                    {result.executionTime && (
                      <Tag size="small" style={{ marginLeft: 8 }}>
                        {result.executionTime}ms
                      </Tag>
                    )}
                    <br />
                    <Text type={result.status === 'error' ? 'danger' : 'secondary'}>
                      {result.message}
                    </Text>
                    {result.details && (
                      <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                        대상: {result.details.target} | 
                        파라미터: {JSON.stringify(result.details.parameters)}
                        {result.details.resultMessage && (
                          <>
                            <br />
                            결과 메시지: "{result.details.resultMessage}"
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
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