import React from 'react';
import { ChevronRight, Play, Settings, AlertCircle } from 'lucide-react';
import { ButtonConfig } from '../../types/buttonAutomation';
import { generateButtonPreview, validateButtonConfig } from '../../utils/buttonAutomationPreview';

interface ButtonPreviewProps {
  config: Partial<ButtonConfig>;
  buttonLabel?: string;
  roles?: any[];
  channels?: any[];
  users?: any[];
  className?: string;
}

const ButtonPreview: React.FC<ButtonPreviewProps> = ({
  config,
  buttonLabel = '버튼',
  roles = [],
  channels = [],
  users = [],
  className = ''
}) => {
  const validation = validateButtonConfig(config);
  
  if (!validation.isValid) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
          <AlertCircle className="w-5 h-5" />
          설정 오류
        </div>
        <ul className="text-red-600 text-sm space-y-1">
          {validation.errors.map((error, index) => (
            <li key={index}>• {error}</li>
          ))}
        </ul>
      </div>
    );
  }

  const preview = generateButtonPreview(config as ButtonConfig, roles, channels, users);

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-500 text-white p-2 rounded-lg">
          <Play className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">실행 미리보기</h3>
          <p className="text-sm text-gray-600">버튼 "{buttonLabel}"이 실행될 때의 동작</p>
        </div>
      </div>

      {/* 메인 플로우 */}
      <div className="bg-white rounded-lg p-4 mb-4 border-l-4 border-blue-500">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-blue-500" />
          실행 흐름
        </h4>
        <div className="whitespace-pre-line text-gray-700 leading-relaxed">
          {preview.flowText}
        </div>
      </div>

      {/* 단계별 액션 */}
      {preview.actions.length > 0 && (
        <div className="bg-white rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4 text-green-500" />
            실행 단계
          </h4>
          <div className="space-y-3">
            {preview.actions.map((action, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-gray-900">
                    {action.who && <span className="text-blue-600 font-medium">{action.who}</span>}
                    {action.who && ' '}
                    <span className="text-purple-600 font-medium">{action.what}</span>
                    {' '}
                    <span className="text-gray-700">{action.how}</span>
                  </div>
                  {action.result && (
                    <div className="text-sm text-gray-600 mt-1 pl-4 border-l-2 border-gray-200">
                      {action.result}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 버튼 스타일 미리보기 */}
      <div className="bg-white rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">버튼 미리보기</h4>
        <div className="flex items-center gap-4">
          <button
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              config.ui?.style === 'primary' ? 'bg-blue-500 text-white hover:bg-blue-600' :
              config.ui?.style === 'secondary' ? 'bg-gray-500 text-white hover:bg-gray-600' :
              config.ui?.style === 'success' ? 'bg-green-500 text-white hover:bg-green-600' :
              config.ui?.style === 'danger' ? 'bg-red-500 text-white hover:bg-red-600' :
              'bg-blue-500 text-white hover:bg-blue-600'
            } ${config.ui?.disableAfter ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            disabled={config.ui?.disableAfter}
          >
            {config.ui?.disableAfter && config.ui?.renameAfter ? 
              config.ui.renameAfter : 
              buttonLabel
            }
          </button>
          <div className="text-sm text-gray-600">
            {config.ui?.disableAfter ? '실행 후 비활성화됨' : '클릭 가능'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ButtonPreview;