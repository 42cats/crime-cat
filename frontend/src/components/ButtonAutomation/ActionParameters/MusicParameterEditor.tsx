import React, { useState, useEffect } from 'react';
import { Input, InputNumber, Select, Switch, Card, Row, Col, Typography, Slider, Alert } from 'antd';
import { Music, Volume2, Clock, Settings, Repeat, Shuffle } from 'lucide-react';
import { MusicSelector } from '../MusicSelector';

const { Title, Text } = Typography;
const { Option } = Select;

interface MusicParameterEditorProps {
    action: any;
    onChange: (parameters: any) => void;
    guildId?: string;
    userId?: string;
}

export const MusicParameterEditor: React.FC<MusicParameterEditorProps> = ({
    action,
    onChange,
    guildId,
    userId
}) => {
    const parameters = action.parameters || {};

    // 음악 선택 처리
    const handleMusicSelection = (selection: any) => {
        console.log('MusicParameterEditor - 음악 선택됨:', selection);
        if (selection) {
            const newParameters = {
                ...parameters,
                source: selection.source,
                trackId: selection.trackId,
                trackTitle: selection.title
            };
            console.log('MusicParameterEditor - 새 parameters:', newParameters);
            onChange(newParameters);
        }
    };

    // 파라미터 업데이트
    const updateParameter = (key: string, value: any) => {
        const newParameters = { ...parameters, [key]: value };
        onChange(newParameters);
    };

    // 액션 타입별 렌더링
    const renderParameterFields = () => {
        switch (action.type) {
            case 'play_music':
                return (
                    <div className="space-y-6">
                        {/* 음악 선택 */}
                        <Card size="small" title={
                            <div className="flex items-center gap-2">
                                <Music className="w-4 h-4" />
                                <span>음악 선택</span>
                            </div>
                        }>
                            <MusicSelector
                                guildId={guildId || ''}
                                userId={userId}
                                value={parameters.source && parameters.trackId ? {
                                    source: parameters.source,
                                    trackId: parameters.trackId,
                                    title: parameters.trackTitle || '선택된 음악'
                                } : undefined}
                                onChange={handleMusicSelection}
                                placeholder="재생할 음악을 선택하세요"
                            />
                            
                            {parameters.trackTitle && (
                                <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                                    <Text className="text-sm text-blue-700">
                                        선택된 음악: <strong>{parameters.trackTitle}</strong>
                                    </Text>
                                </div>
                            )}
                        </Card>

                        {/* 재생 설정 */}
                        <Card size="small" title={
                            <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                <span>재생 설정</span>
                            </div>
                        }>
                            <div className="space-y-4">
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} sm={12}>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">재생 시간 (초)</label>
                                            <InputNumber
                                                min={0}
                                                max={3600}
                                                value={parameters.duration || 0}
                                                onChange={(value) => updateParameter('duration', value)}
                                                placeholder="0 = 끝까지"
                                                style={{ width: '100%' }}
                                                addonAfter="초"
                                            />
                                            <Text type="secondary" className="text-xs">
                                                0이면 음악이 끝날 때까지 재생
                                            </Text>
                                        </div>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">볼륨</label>
                                            <div className="flex items-center gap-3">
                                                <Volume2 className="w-4 h-4 text-gray-400" />
                                                <Slider
                                                    min={0}
                                                    max={100}
                                                    value={parameters.volume || 50}
                                                    onChange={(value) => updateParameter('volume', value)}
                                                    className="flex-1"
                                                />
                                                <span className="w-12 text-xs text-gray-500">
                                                    {parameters.volume || 50}%
                                                </span>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        </Card>

                        {/* 기존 음악 처리 */}
                        <Card size="small" title={
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>기존 음악 처리</span>
                            </div>
                        }>
                            <Select
                                value={parameters.stopBehavior || 'stop_current'}
                                onChange={(value) => updateParameter('stopBehavior', value)}
                                style={{ width: '100%' }}
                                optionLabelProp="label"
                            >
                                <Option value="stop_current" label="정지하고 재생">
                                    <div className="py-2">
                                        <div className="font-medium">정지하고 재생</div>
                                        <div className="text-xs text-gray-500 mt-1">기존 음악을 정지하고 새 음악을 재생합니다</div>
                                    </div>
                                </Option>
                                <Option value="skip_if_playing" label="재생 중이면 건너뛰기">
                                    <div className="py-2">
                                        <div className="font-medium">재생 중이면 건너뛰기</div>
                                        <div className="text-xs text-gray-500 mt-1">다른 음악이 재생 중이면 이 액션을 건너뜁니다</div>
                                    </div>
                                </Option>
                                <Option value="queue_after" label="대기열에 추가 (준비 중)" disabled>
                                    <div className="py-2">
                                        <div className="font-medium text-gray-400">대기열에 추가 (준비 중)</div>
                                        <div className="text-xs text-gray-400 mt-1">현재 음악 후에 재생하도록 대기열에 추가합니다</div>
                                    </div>
                                </Option>
                            </Select>
                        </Card>

                        {/* 재생 모드 선택 */}
                        <Card size="small" title={
                            <div className="flex items-center gap-2">
                                <Repeat className="w-4 h-4" />
                                <span>재생 모드</span>
                            </div>
                        }>
                            <Select
                                value={parameters.playMode || 'single-track'}
                                onChange={(value) => updateParameter('playMode', value)}
                                style={{ width: '100%' }}
                                optionLabelProp="label"
                            >
                                <Option value="single-track" label="1회 재생">
                                    <div className="py-2">
                                        <div className="font-medium">1회 재생</div>
                                        <div className="text-xs text-gray-500 mt-1">한 번만 재생하고 정지합니다</div>
                                    </div>
                                </Option>
                                <Option value="normal" label="일반 재생">
                                    <div className="py-2">
                                        <div className="font-medium">일반 재생</div>
                                        <div className="text-xs text-gray-500 mt-1">일반적인 재생 모드입니다</div>
                                    </div>
                                </Option>
                                <Option value="repeat-one" label="한 곡 반복">
                                    <div className="flex items-start gap-2 py-2">
                                        <Repeat className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="font-medium">한 곡 반복</div>
                                            <div className="text-xs text-gray-500 mt-1">현재 곡을 계속 반복 재생합니다</div>
                                        </div>
                                    </div>
                                </Option>
                                <Option value="repeat-all" label="전체 반복">
                                    <div className="flex items-start gap-2 py-2">
                                        <Repeat className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="font-medium">전체 반복</div>
                                            <div className="text-xs text-gray-500 mt-1">재생 목록 전체를 반복 재생합니다</div>
                                        </div>
                                    </div>
                                </Option>
                                <Option value="shuffle" label="셔플 재생">
                                    <div className="flex items-start gap-2 py-2">
                                        <Shuffle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="font-medium">셔플 재생</div>
                                            <div className="text-xs text-gray-500 mt-1">무작위 순서로 재생합니다</div>
                                        </div>
                                    </div>
                                </Option>
                            </Select>
                            
                            {parameters.playMode && parameters.playMode !== 'single-track' && (
                                <Alert
                                    type="info"
                                    message={
                                        parameters.playMode === 'repeat-one' 
                                            ? "한 곡 반복 모드로 설정됨"
                                            : parameters.playMode === 'repeat-all'
                                            ? "전체 반복 모드로 설정됨"
                                            : parameters.playMode === 'shuffle'
                                            ? "셔플 재생 모드로 설정됨"
                                            : "일반 재생 모드로 설정됨"
                                    }
                                    className="mt-3"
                                    showIcon
                                    size="small"
                                />
                            )}
                        </Card>

                        {/* 주의사항 */}
                        <Alert
                            type="info"
                            message="음악 재생 주의사항"
                            description={
                                <ul className="text-sm space-y-1 mt-2">
                                    <li>• 버튼을 누른 사용자가 음성 채널에 있어야 합니다</li>
                                    <li>• 봇이 해당 음성 채널에 접근할 권한이 있어야 합니다</li>
                                    <li>• YouTube 음악은 길드에 등록된 목록에서만 선택 가능합니다</li>
                                    <li>• 로컬 파일은 해당 사용자가 업로드한 파일만 재생 가능합니다</li>
                                </ul>
                            }
                            className="text-xs"
                        />
                    </div>
                );

            case 'stop_music':
            case 'pause_music':
                return (
                    <div className="space-y-4">
                        <Alert
                            type="info"
                            message={action.type === 'stop_music' ? '음악 정지' : '음악 일시정지/재개'}
                            description={
                                action.type === 'stop_music'
                                    ? '현재 재생 중인 음악을 완전히 정지합니다. 추가 설정이 필요하지 않습니다.'
                                    : '현재 재생 중인 음악을 일시정지하거나, 일시정지된 음악을 재개합니다.'
                            }
                            showIcon
                        />
                        
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <Text type="secondary" className="text-sm">
                                이 액션은 추가 설정이 필요하지 않습니다. 
                                {action.type === 'stop_music' 
                                    ? ' 현재 재생 중인 모든 음악이 정지됩니다.'
                                    : ' 음악의 현재 상태에 따라 일시정지하거나 재개됩니다.'
                                }
                            </Text>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div>
            {renderParameterFields()}
        </div>
    );
};