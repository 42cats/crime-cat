import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
    Card,
    Button,
    Table,
    Typography,
    Space,
    Popconfirm,
    message,
    Tag,
    Tooltip,
    Modal,
    Dropdown,
    Empty,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    PlayCircleOutlined,
    ArrowLeftOutlined,
    SettingOutlined,
    MoreOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageTransition from "@/components/PageTransition";
import { AdvancedButtonForm } from "@/components/ButtonAutomation/AdvancedButtonForm";
import {
    GroupForm,
    GroupFormData,
} from "@/components/ButtonAutomation/GroupForm";
import { buttonAutomationApi } from "@/lib/api/buttonAutomation";

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

    // 그룹 관리 상태
    const [showGroupForm, setShowGroupForm] = useState(false);
    const [editingGroup, setEditingGroup] = useState<any>(null);

    // 버튼 그룹 목록 조회
    const { data: groups, isLoading: isLoadingGroups } = useQuery({
        queryKey: ["button-automation-groups", guildId],
        queryFn: () => buttonAutomationApi.getGroups(guildId!),
        enabled: !!guildId,
    });

    // 선택된 그룹의 버튼 목록 조회
    const { data: buttons, isLoading: isLoadingButtons } = useQuery({
        queryKey: ["button-automation-buttons", guildId, selectedGroupId],
        queryFn: () =>
            selectedGroupId
                ? buttonAutomationApi.getButtonsByGroup(
                      guildId!,
                      selectedGroupId
                  )
                : buttonAutomationApi.getButtons(guildId!),
        enabled: !!guildId && !!selectedGroupId,
    });

    // 버튼 생성/수정 뮤테이션
    const buttonMutation = useMutation({
        mutationFn: (data: any) => {
            if (editingButton) {
                return buttonAutomationApi.updateButton(
                    guildId!,
                    editingButton.id,
                    data
                );
            }
            return buttonAutomationApi.createButton(guildId!, data);
        },
        onSuccess: () => {
            // 관련된 쿼리들만 정확하게 무효화
            queryClient.invalidateQueries({
                queryKey: ["button-automation-buttons", guildId],
            });
            queryClient.invalidateQueries({
                queryKey: ["button-automation-groups", guildId],
            });

            setShowForm(false);
            setEditingButton(null);
            message.success(
                editingButton
                    ? "버튼이 수정되었습니다."
                    : "버튼이 생성되었습니다."
            );
        },
        onError: (error: any) => {
            message.error(error.message || "작업 중 오류가 발생했습니다.");
        },
    });

    // 버튼 삭제 뮤테이션
    const deleteMutation = useMutation({
        mutationFn: (buttonId: string) =>
            buttonAutomationApi.deleteButton(guildId!, buttonId),
        onSuccess: () => {
            // 관련된 쿼리들만 정확하게 무효화
            queryClient.invalidateQueries({
                queryKey: ["button-automation-buttons", guildId],
            });
            queryClient.invalidateQueries({
                queryKey: ["button-automation-groups", guildId],
            });
            message.success("버튼이 삭제되었습니다.");
        },
        onError: (error: any) => {
            message.error(error.message || "삭제 중 오류가 발생했습니다.");
        },
    });

    // 그룹 생성/수정 뮤테이션
    const groupMutation = useMutation({
        mutationFn: (data: GroupFormData) => {
            if (editingGroup) {
                return buttonAutomationApi.updateGroup(
                    guildId!,
                    editingGroup.id,
                    data
                );
            }
            return buttonAutomationApi.createGroup(guildId!, data);
        },
        onSuccess: (newGroup) => {
            // 그룹 목록 무효화
            queryClient.invalidateQueries({
                queryKey: ["button-automation-groups", guildId],
            });

            // 새로 생성된 그룹이 있고 현재 선택된 그룹이 없다면 자동 선택
            if (!editingGroup && !selectedGroupId && newGroup) {
                setSelectedGroupId(newGroup.id);
            }

            setShowGroupForm(false);
            setEditingGroup(null);
            message.success(
                editingGroup
                    ? "그룹이 수정되었습니다."
                    : "그룹이 생성되었습니다."
            );
        },
        onError: (error: any) => {
            message.error(error.message || "그룹 작업 중 오류가 발생했습니다.");
        },
    });

    // 그룹 삭제 뮤테이션
    const deleteGroupMutation = useMutation({
        mutationFn: (groupId: string) =>
            buttonAutomationApi.deleteGroup(guildId!, groupId),
        onSuccess: (_, deletedGroupId) => {
            // 관련된 쿼리들 무효화
            queryClient.invalidateQueries({
                queryKey: ["button-automation-groups", guildId],
            });
            queryClient.invalidateQueries({
                queryKey: ["button-automation-buttons", guildId],
            });

            // 삭제된 그룹이 선택되어 있었다면 다른 그룹으로 자동 전환
            if (selectedGroupId === deletedGroupId) {
                const remainingGroups = groups?.filter(
                    (g) => g.id !== deletedGroupId
                );
                setSelectedGroupId(
                    remainingGroups && remainingGroups.length > 0
                        ? remainingGroups[0].id
                        : null
                );
            }

            setEditingGroup(null);
            message.success("그룹이 삭제되었습니다.");
        },
        onError: (error: any) => {
            message.error(error.message || "그룹 삭제 중 오류가 발생했습니다.");
            setEditingGroup(null);
        },
    });

    // 기본 그룹 선택 및 상태 동기화
    useEffect(() => {
        if (groups && groups.length > 0) {
            // 선택된 그룹이 없거나, 선택된 그룹이 더 이상 존재하지 않는 경우
            if (
                !selectedGroupId ||
                !groups.find((g) => g.id === selectedGroupId)
            ) {
                // 활성화된 그룹 중 표시 순서가 가장 낮은 것을 선택
                const activeGroups = groups.filter((g) => g.isActive);
                const sortedGroups =
                    activeGroups.length > 0 ? activeGroups : groups;
                const firstGroup = sortedGroups.sort(
                    (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
                )[0];
                setSelectedGroupId(firstGroup?.id || null);
            }
        } else if (groups && groups.length === 0) {
            // 그룹이 없으면 선택 해제
            setSelectedGroupId(null);
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

    // 그룹 폼 제출 처리
    const handleGroupFormSubmit = async (data: GroupFormData) => {
        await groupMutation.mutateAsync(data);
    };

    // 그룹 편집
    const handleEditGroup = (group: any) => {
        setEditingGroup(group);
        setShowGroupForm(true);
    };

    // 그룹 삭제
    const handleDeleteGroup = (group: any) => {
        Modal.confirm({
            title: "그룹 삭제",
            content: `"${group.name}" 그룹을 삭제하시겠습니까? 이 그룹에 속한 모든 버튼도 함께 삭제됩니다.`,
            okText: "삭제",
            okType: "danger",
            cancelText: "취소",
            onOk: () => {
                setEditingGroup(group);
                deleteGroupMutation.mutate(group.id);
            },
        });
    };

    // 새 그룹 생성
    const handleCreateGroup = () => {
        setEditingGroup(null);
        setShowGroupForm(true);
    };

    // 테이블 컬럼 정의
    const columns = [
        {
            title: "버튼명",
            dataIndex: "buttonLabel",
            key: "buttonLabel",
            render: (text: string, record: any) => (
                <div>
                    <div className="font-medium">{text}</div>
                    <div className="text-xs text-gray-500">ID: {record.id}</div>
                </div>
            ),
        },
        {
            title: "상태",
            dataIndex: "isActive",
            key: "isActive",
            width: 80,
            render: (isActive: boolean) => (
                <Tag color={isActive ? "green" : "red"}>
                    {isActive ? "활성" : "비활성"}
                </Tag>
            ),
        },
        {
            title: "액션 수",
            key: "actionCount",
            width: 100,
            render: (_, record: any) => {
                try {
                    const config = JSON.parse(record.config);
                    return (
                        <Tag color="blue">{config.actions?.length || 0}개</Tag>
                    );
                } catch {
                    return <Tag color="red">오류</Tag>;
                }
            },
        },
        {
            title: "순서",
            dataIndex: "displayOrder",
            key: "displayOrder",
            width: 80,
            render: (order: number) => order || 0,
        },
        {
            title: "생성일",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 120,
            render: (date: string) =>
                new Date(date).toLocaleDateString("ko-KR"),
        },
        {
            title: "작업",
            key: "actions",
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
                        guildId={guildId!}
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
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate("/dashboard/guilds")}
                    >
                        길드 목록
                    </Button>
                    <div className="text-center">
                        <Title level={2} className="mb-0">
                            버튼 자동화
                        </Title>
                        <Text type="secondary" className="text-5xl">{guildName || guildId}</Text>
                    </div>
                    <div style={{ width: '88px' }}></div>
                </div>

                {/* 그룹 선택 */}
                <Card
                    className="mb-6"
                    title={
                        <div>
                            <div
                                className="flex justify-between items-center"
                                style={{ paddingTop: "15px" }}
                            >
                                <span>버튼 그룹</span>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    size="small"
                                    onClick={handleCreateGroup}
                                >
                                    새 그룹 추가
                                </Button>
                            </div>
                            <div
                                style={{
                                    borderTop: "1px solid #f0f0f0",
                                    paddingTop: "8px",
                                    marginTop: "8px",
                                    fontSize: "14px",
                                    color: "#666",
                                    fontWeight: "normal",
                                }}
                            >
                                버튼이 속할 그룹을 선택하세요. 하나의 그룹은
                                최대 25개의 버튼을 가질 수 있습니다.
                            </div>
                        </div>
                    }
                >
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
                                            ? "border-blue-500 bg-blue-50"
                                            : "hover:border-gray-400"
                                    }`}
                                    onClick={() => setSelectedGroupId(group.id)}
                                    extra={
                                        <Dropdown
                                            menu={{
                                                items: [
                                                    {
                                                        key: "edit",
                                                        label: "그룹 편집",
                                                        icon: <EditOutlined />,
                                                        onClick: (e) => {
                                                            e.domEvent.stopPropagation();
                                                            handleEditGroup(
                                                                group
                                                            );
                                                        },
                                                    },
                                                    {
                                                        key: "delete",
                                                        label: "그룹 삭제",
                                                        icon: (
                                                            <DeleteOutlined />
                                                        ),
                                                        danger: true,
                                                        onClick: (e) => {
                                                            e.domEvent.stopPropagation();
                                                            handleDeleteGroup(
                                                                group
                                                            );
                                                        },
                                                    },
                                                ],
                                            }}
                                            trigger={["click"]}
                                        >
                                            <Button
                                                type="text"
                                                icon={<MoreOutlined />}
                                                size="small"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            />
                                        </Dropdown>
                                    }
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1 mr-2">
                                            <div className="font-medium text-base">
                                                {group.name}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {(() => {
                                                    try {
                                                        const settings =
                                                            group.settings
                                                                ? JSON.parse(
                                                                      group.settings
                                                                  )
                                                                : null;
                                                        const content =
                                                            settings
                                                                ?.messageConfig
                                                                ?.content;
                                                        return content
                                                            ? content.length >
                                                              50
                                                                ? content.substring(
                                                                      0,
                                                                      50
                                                                  ) + "..."
                                                                : content
                                                            : "설명 없음";
                                                    } catch {
                                                        return "설명 없음";
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Tag
                                                color={
                                                    group.isActive
                                                        ? "green"
                                                        : "red"
                                                }
                                                size="small"
                                            >
                                                {group.buttons?.length || 0}/25
                                            </Tag>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Tag color="blue" size="small">
                                                순서: {group.displayOrder || 0}
                                            </Tag>
                                            {selectedGroupId === group.id && (
                                                <Tag
                                                    color="orange"
                                                    size="small"
                                                >
                                                    선택됨
                                                </Tag>
                                            )}
                                        </div>
                                        <Text
                                            type="secondary"
                                            className="text-xs"
                                        >
                                            {new Date(
                                                group.createdAt
                                            ).toLocaleDateString("ko-KR")}
                                        </Text>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Empty
                                description="버튼 그룹이 없습니다"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            >
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={handleCreateGroup}
                                >
                                    첫 번째 그룹 만들기
                                </Button>
                            </Empty>
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
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        size="small"
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
                                    ? "버튼이 없습니다. 새 버튼을 추가해보세요."
                                    : "그룹을 선택해주세요.",
                            }}
                        />
                    </Card>
                )}

                {/* 그룹 관리 모달 */}
                <Modal
                    title={editingGroup ? "그룹 수정" : "새 그룹 생성"}
                    open={showGroupForm}
                    onCancel={() => {
                        setShowGroupForm(false);
                        setEditingGroup(null);
                    }}
                    footer={null}
                    width={800}
                    destroyOnHidden
                >
                    <GroupForm
                        group={editingGroup}
                        onSubmit={handleGroupFormSubmit}
                        onCancel={() => {
                            setShowGroupForm(false);
                            setEditingGroup(null);
                        }}
                        loading={groupMutation.isPending}
                    />
                </Modal>
            </div>
        </PageTransition>
    );
};

export default ButtonAutomationPage;
