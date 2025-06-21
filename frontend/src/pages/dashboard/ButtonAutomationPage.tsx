import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, Table, Typography, Space, Popconfirm, message, Tag, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined, PlayCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageTransition from '@/components/PageTransition';
import { AdvancedButtonForm } from '@/components/ButtonAutomation/AdvancedButtonForm';
import { buttonAutomationApi } from '@/lib/api/buttonAutomation';

const { Title, Text } = Typography;

interface LocationState {
    guildName: string;
    guildId: string;
}

const ButtonAutomationPage: React.FC = () => {
    const { guildId } = useParams<{ guildId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const { guildName } = (location.state as LocationState) || {};
    
    const [showForm, setShowForm] = useState(false);
    const [editingButton, setEditingButton] = useState<any>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    // 버튼 그룹 목록 조회
    const { data: groups, isLoading: isLoadingGroups } = useQuery({
        queryKey: ['button-automation-groups', guildId],
        queryFn: () => buttonAutomationApi.getGroups(guildId!),
        enabled: !!guildId,
    });

    // 선택된 그룹의 버튼 목록 조회
    const { data: buttons, isLoading: isLoadingButtons } = useQuery({
        queryKey: ['button-automation-buttons', guildId, selectedGroupId],
        queryFn: () => buttonAutomationApi.getButtons(guildId!, selectedGroupId!),
        enabled: !!guildId && !!selectedGroupId,
    });

    // 버튼 생성/수정 뮤테이션
    const buttonMutation = useMutation({
        mutationFn: (data: any) => {
            if (editingButton) {
                return buttonAutomationApi.updateButton(editingButton.id, data);
            }
            return buttonAutomationApi.createButton(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['button-automation-buttons'] });
            queryClient.invalidateQueries({ queryKey: ['button-automation-groups'] });
            setShowForm(false);
            setEditingButton(null);
            message.success(editingButton ? '버튼이 수정되었습니다.' : '버튼이 생성되었습니다.');
        },
        onError: (error: any) => {
            message.error(error.message || '작업 중 오류가 발생했습니다.');
        },
    });

    // 버튼 삭제 뮤테이션
    const deleteMutation = useMutation({
        mutationFn: (buttonId: string) => buttonAutomationApi.deleteButton(buttonId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['button-automation-buttons'] });
            queryClient.invalidateQueries({ queryKey: ['button-automation-groups'] });
            message.success('버튼이 삭제되었습니다.');
        },
        onError: (error: any) => {
            message.error(error.message || '삭제 중 오류가 발생했습니다.');
        },
    });

    // 기본 그룹 선택
    useEffect(() => {
        if (groups && groups.length > 0 && !selectedGroupId) {
            setSelectedGroupId(groups[0].id);
        }
    }, [groups, selectedGroupId]);

    // 폼 제출 처리
    const handleFormSubmit = async (data: any) => {
        await buttonMutation.mutateAsync({
            ...data,
            groupId: selectedGroupId,
        });
    };

    // 버튼 편집
    const handleEditButton = (button: any) => {
        setEditingButton(button);
        setShowForm(true);
    };

    // 버튼 삭제
    const handleDeleteButton = (buttonId: string) => {
        deleteMutation.mutate(buttonId);
    };

    // 테이블 컬럼 정의
    const columns = [
        {
            title: '버튼명',
            dataIndex: 'buttonLabel',
            key: 'buttonLabel',
            render: (text: string, record: any) => (
                <div>
                    <div className="font-medium">{text}</div>
                    <div className="text-xs text-gray-500">ID: {record.id}</div>
                </div>
            ),
        },
        {
            title: '상태',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 80,
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? '활성' : '비활성'}
                </Tag>
            ),
        },
        {
            title: '액션 수',
            key: 'actionCount',
            width: 100,
            render: (_, record: any) => {
                try {
                    const config = JSON.parse(record.config);
                    return (
                        <Tag color="blue">
                            {config.actions?.length || 0}개
                        </Tag>
                    );
                } catch {
                    return <Tag color="red">오류</Tag>;
                }
            },
        },
        {
            title: '순서',
            dataIndex: 'displayOrder',
            key: 'displayOrder',
            width: 80,
            render: (order: number) => order || 0,
        },
        {
            title: '생성일',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 120,
            render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
        },
        {
            title: '작업',
            key: 'actions',
            width: 120,
            render: (_, record: any) => (
                <Space size="small">
                    <Tooltip title="편집">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEditButton(record)}
                            size="small"
                        />
                    </Tooltip>
                    <Tooltip title="테스트">
                        <Button
                            type="text"
                            icon={<PlayCircleOutlined />}
                            size="small"
                            disabled
                        />
                    </Tooltip>
                    <Popconfirm
                        title="버튼을 삭제하시겠습니까?"
                        onConfirm={() => handleDeleteButton(record.id)}
                        okText="삭제"
                        cancelText="취소"
                    >
                        <Tooltip title="삭제">
                            <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                danger
                                size="small"
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    if (!guildId) {
        return (
            <PageTransition>
                <div className="text-center py-8">
                    <Text type="danger">길드 ID가 없습니다.</Text>
                </div>
            </PageTransition>
        );
    }

    if (showForm) {
        return (
            <PageTransition>
                <div className="container mx-auto px-6 py-8">
                    <AdvancedButtonForm
                        button={editingButton}
                        groupId={selectedGroupId}
                        onSubmit={handleFormSubmit}
                        onCancel={() => {
                            setShowForm(false);
                            setEditingButton(null);
                        }}
                        loading={buttonMutation.isPending}
                    />
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <div className="container mx-auto px-6 py-8">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button 
                            icon={<ArrowLeftOutlined />} 
                            onClick={() => navigate('/dashboard/guilds')}
                        >
                            길드 목록
                        </Button>
                        <div>
                            <Title level={2} className="mb-0">버튼 자동화</Title>
                            <Text type="secondary">{guildName || guildId}</Text>
                        </div>
                    </div>
                    <Space>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingButton(null);
                                setShowForm(true);
                            }}
                            disabled={!selectedGroupId}
                        >
                            새 버튼 추가
                        </Button>
                    </Space>
                </div>

                {/* 그룹 선택 */}
                <Card className="mb-6">
                    <div className="mb-4">
                        <Title level={4}>버튼 그룹</Title>
                        <Text type="secondary">
                            버튼이 속할 그룹을 선택하세요. 하나의 그룹은 최대 25개의 버튼을 가질 수 있습니다.
                        </Text>
                    </div>
                    
                    {isLoadingGroups ? (
                        <div className="text-center py-4">
                            <Text>그룹 목록을 불러오는 중...</Text>
                        </div>
                    ) : groups && groups.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groups.map((group: any) => (
                                <Card
                                    key={group.id}
                                    size="small"
                                    className={`cursor-pointer transition-all ${
                                        selectedGroupId === group.id 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'hover:border-gray-400'
                                    }`}
                                    onClick={() => setSelectedGroupId(group.id)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium">{group.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {group.description || '설명 없음'}
                                            </div>
                                        </div>
                                        <Tag color={group.isActive ? 'green' : 'red'} size="small">
                                            {group.buttonCount || 0}/25
                                        </Tag>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Text type="secondary">
                                버튼 그룹이 없습니다. 웹 관리자에서 그룹을 먼저 생성해주세요.
                            </Text>
                        </div>
                    )}
                </Card>

                {/* 버튼 목록 */}
                {selectedGroupId && (
                    <Card
                        title={
                            <div className="flex justify-between items-center">
                                <span>버튼 목록</span>
                                <Space>
                                    <Button 
                                        icon={<SendOutlined />} 
                                        size="small"
                                        disabled={!buttons || buttons.length === 0}
                                    >
                                        Discord에 전송
                                    </Button>
                                </Space>
                            </div>
                        }
                    >
                        <Table
                            columns={columns}
                            dataSource={buttons || []}
                            loading={isLoadingButtons}
                            rowKey="id"
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: false,
                                showQuickJumper: true,
                            }}
                            locale={{
                                emptyText: selectedGroupId 
                                    ? '버튼이 없습니다. 새 버튼을 추가해보세요.'
                                    : '그룹을 선택해주세요.'
                            }}
                        />
                    </Card>
                )}
            </div>
        </PageTransition>
    );
};

export default ButtonAutomationPage;