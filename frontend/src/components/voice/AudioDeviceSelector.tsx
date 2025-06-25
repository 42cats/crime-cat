import React, { useState, useEffect } from 'react';

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

interface AudioDeviceSelectorProps {
  currentInputDevice?: string;
  currentOutputDevice?: string;
  onInputDeviceChange: (deviceId: string) => void;
  onOutputDeviceChange: (deviceId: string) => void;
  onTestMicrophone: () => void;
  onTestSpeaker: () => void;
  className?: string;
}

export const AudioDeviceSelector: React.FC<AudioDeviceSelectorProps> = ({
  currentInputDevice,
  currentOutputDevice,
  onInputDeviceChange,
  onOutputDeviceChange,
  onTestMicrophone,
  onTestSpeaker,
  className = ''
}) => {
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // 디바이스 목록 로드
  const loadDevices = async () => {
    try {
      // 먼저 권한 요청
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionGranted(true);

      // 디바이스 목록 가져오기
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `마이크 ${device.deviceId.slice(0, 8)}`,
          kind: device.kind
        }));

      const audioOutputs = devices
        .filter(device => device.kind === 'audiooutput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `스피커 ${device.deviceId.slice(0, 8)}`,
          kind: device.kind
        }));

      setInputDevices(audioInputs);
      setOutputDevices(audioOutputs);

    } catch (error) {
      console.error('오디오 디바이스 목록 로드 실패:', error);
      setPermissionGranted(false);
    }
  };

  useEffect(() => {
    loadDevices();

    // 디바이스 변경 감지
    const handleDeviceChange = () => {
      loadDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, []);

  if (!permissionGranted) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="text-center">
          <div className="text-yellow-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-white font-medium mb-2">마이크 권한이 필요합니다</h3>
          <p className="text-gray-400 text-sm mb-4">
            오디오 디바이스를 설정하려면 마이크 권한을 허용해주세요.
          </p>
          <button
            onClick={loadDevices}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            권한 허용
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-4 space-y-4 ${className}`}>
      <h3 className="text-white font-medium text-lg">오디오 디바이스 설정</h3>
      
      {/* 입력 디바이스 (마이크) */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          입력 디바이스 (마이크)
        </label>
        <div className="flex space-x-2">
          <select
            value={currentInputDevice || ''}
            onChange={(e) => onInputDeviceChange(e.target.value)}
            className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">기본 디바이스</option>
            {inputDevices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
          <button
            onClick={onTestMicrophone}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            title="마이크 테스트"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* 출력 디바이스 (스피커) */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          출력 디바이스 (스피커)
        </label>
        <div className="flex space-x-2">
          <select
            value={currentOutputDevice || ''}
            onChange={(e) => onOutputDeviceChange(e.target.value)}
            className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">기본 디바이스</option>
            {outputDevices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
          <button
            onClick={onTestSpeaker}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            title="스피커 테스트"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.168 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.168l4.215-3.824z" clipRule="evenodd" />
              <path d="M11.5 7.5a2.5 2.5 0 000 5m2.5-7a5 5 0 000 10" />
            </svg>
          </button>
        </div>
      </div>

      {/* 새로고침 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={loadDevices}
          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          <span>새로고침</span>
        </button>
      </div>
    </div>
  );
};

export default AudioDeviceSelector;