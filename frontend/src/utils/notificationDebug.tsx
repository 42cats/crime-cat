import React, { Component, ReactNode, ErrorInfo } from 'react';

/**
 * 알림 시스템 디버깅용 유틸리티
 */

// 개발 환경에서만 사용할 디버깅 함수
export const debugNotifications = {
  // 현재 알림 상태 확인
  logCurrentState: () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('알림 디버깅 정보:');
      console.log('- localStorage:', localStorage.getItem('notifications'));
      console.log('- 현재 시간:', new Date().toISOString());
    }
  },
  
  // 테스트용 알림 데이터 생성
  createTestNotification: (type: string) => {
    return {
      id: `test-${Date.now()}`,
      type,
      title: `테스트 ${type} 알림`,
      message: '테스트용 알림 메시지',
      status: 'UNREAD',
      createdAt: new Date().toISOString(),
    };
  },
  
  // API 호출 로그
  logApiCall: (endpoint: string, method: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`API 호출: ${method} ${endpoint}`, data);
    }
  },
};

// 에러 바운더리 컴포넌트
interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

export class NotificationErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('알림 시스템 에러:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold">알림 시스템 오류</h3>
          <p className="text-red-600 text-sm">알림을 불러오는 중 오류가 발생했습니다.</p>
        </div>
      );
    }
    
    return this.props.children;
  }
}
