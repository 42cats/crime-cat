import React, { useState, useEffect } from "react";
import {
    Form,
    Input,
    InputNumber,
    Switch,
    Button,
    Space,
    Card,
    Typography,
    Select,
    Row,
    Col,
    Divider,
    message,
    Alert,
} from "antd";
import {
    PlusOutlined,
    DeleteOutlined,
    InfoCircleOutlined,
} from "@ant-design/icons";
import {
    ButtonAutomation,
    ButtonConfig,
    ActionConfig,
    TriggerConfig,
    ConditionConfig,
} from "../../types/buttonAutomation";
import { DISCORD_LIMITS, validateActionCount } from "../../utils/validation";

const { Title, Text } = Typography;
const { Option } = Select;

interface ButtonFormProps {
    button?: ButtonAutomation;
    groupId?: string;
    onSubmit: (data: ButtonFormData) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

export interface ButtonFormData {
    groupId?: string;
    buttonLabel: string;
    displayOrder?: number;
    config: string; // JSON string
    isActive?: boolean;
}

interface SimpleActionConfig {
    type: string;
    target: string;
    parameters: {
        roleId?: string;
        channelId?: string;
        message?: string;
        nickname?: string;
    };
    delay?: number;
    resultMessage?: string;
    resultVisibility?: string;
}

export const ButtonForm: React.FC<ButtonFormProps> = ({
    button,
    groupId,
    onSubmit,
    onCancel,
    loading = false,
}) => {
    const [form] = Form.useForm();
    const [actions, setActions] = useState<SimpleActionConfig[]>([
        {
            type: "add_role",
            target: "executor",
            parameters: {},
            delay: 0,
            resultMessage: "",
            resultVisibility: "private",
        },
    ]);

    // 기존 버튼 데이터 로드
    useEffect(() => {
        if (button) {
            let config: ButtonConfig;
            try {
                config = JSON.parse(button.config);
            } catch (error) {
                console.error("Failed to parse button config:", error);
                config = {
                    trigger: { type: "everyone", roles: [], users: [] },
                    actions: [],
                    buttonSettings: {
                        style: "primary",
                        disableAfterUse: false,
                    },
                    options: { oncePerUser: false, logEnabled: true },
                };
            }

            form.setFieldsValue({
                buttonLabel: button.buttonLabel,
                displayOrder: button.displayOrder,
                isActive: button.isActive,
                triggerType: config.trigger?.type || "everyone",
                cooldown: config.conditions?.cooldown || 0,
                buttonStyle: config.buttonSettings?.style || "primary",
                disableAfterUse:
                    config.buttonSettings?.disableAfterUse || false,
                oncePerUser: config.options?.oncePerUser || false,
                logEnabled: config.options?.logEnabled !== false,
            });

            // 액션 데이터 변환
            if (config.actions && config.actions.length > 0) {
                const simpleActions = config.actions.map((action) => ({
                    type: action.type,
                    target: action.target || "executor",
                    parameters: action.parameters || {},
                    delay: action.delay || 0,
                    resultMessage: action.result?.message || "",
                    resultVisibility: action.result?.visibility || "private",
                }));
                setActions(simpleActions);
            }
        } else if (groupId) {
            form.setFieldValue("groupId", groupId);
        }
    }, [button, groupId, form]);

    const handleSubmit = async (values: any) => {
        try {
            // ButtonConfig 형식으로 변환
            const config: ButtonConfig = {
                trigger: {
                    type: values.triggerType || "everyone",
                    roles: [], // 나중에 고급 설정에서 추가
                    users: [],
                },
                conditions: {
                    requiredRoles: [], // 나중에 고급 설정에서 추가
                    deniedRoles: [],
                    requiredChannel: null,
                    cooldown: values.cooldown || 0,
                },
                actions: actions.map((action, index) => ({
                    type: action.type,
                    target: action.target,
                    parameters: action.parameters,
                    delay: action.delay || 0,
                    result: {
                        message: action.resultMessage,
                        visibility: action.resultVisibility || "private",
                    },
                })),
                buttonSettings: {
                    style: values.buttonStyle || "primary",
                    disableAfterUse: values.disableAfterUse || false,
                    renameAfterUse: null,
                },
                options: {
                    oncePerUser: values.oncePerUser || false,
                    logEnabled: values.logEnabled !== false,
                },
            };

            const formData: ButtonFormData = {
                groupId: values.groupId || groupId,
                buttonLabel: values.buttonLabel,
                displayOrder: values.displayOrder,
                config: JSON.stringify(config),
                isActive: values.isActive ?? true,
            };

            await onSubmit(formData);
            message.success(
                button ? "버튼이 수정되었습니다." : "버튼이 생성되었습니다."
            );
        } catch (error) {
            console.error("Form submission error:", error);
            message.error("저장 중 오류가 발생했습니다.");
        }
    };

    const addAction = () => {
        // 액션 수 제한 검증
        if (actions.length >= DISCORD_LIMITS.MAX_ACTIONS_PER_BUTTON) {
            message.warning(
                `버튼당 최대 ${DISCORD_LIMITS.MAX_ACTIONS_PER_BUTTON}개의 액션만 추가할 수 있습니다.`
            );
            return;
        }

        setActions([
            ...actions,
            {
                type: "add_role",
                target: "executor",
                parameters: {},
                delay: 0,
                resultMessage: "",
                resultVisibility: "private",
            },
        ]);
    };

    const updateAction = (index: number, field: string, value: any) => {
        const newActions = [...actions];
        if (field.startsWith("parameters.")) {
            const paramField = field.split(".")[1];
            newActions[index].parameters = {
                ...newActions[index].parameters,
                [paramField]: value,
            };
        } else {
            (newActions[index] as any)[field] = value;
        }
        setActions(newActions);
    };

    const removeAction = (index: number) => {
        setActions(actions.filter((_, i) => i !== index));
    };

    const renderActionParameters = (
        action: SimpleActionConfig,
        index: number
    ) => {
        switch (action.type) {
            case "add_role":
            case "remove_role":
            case "toggle_role":
                return (
                    <Form.Item label="역할 ID">
                        <Input
                            value={action.parameters.roleId || ""}
                            onChange={(e) =>
                                updateAction(
                                    index,
                                    "parameters.roleId",
                                    e.target.value
                                )
                            }
                            placeholder="123456789012345678"
                        />
                    </Form.Item>
                );

            case "change_nickname":
                return (
                    <Form.Item label="새 닉네임">
                        <Input
                            value={action.parameters.nickname || ""}
                            onChange={(e) =>
                                updateAction(
                                    index,
                                    "parameters.nickname",
                                    e.target.value
                                )
                            }
                            placeholder="🎮 {username}"
                        />
                    </Form.Item>
                );

            case "send_message":
            case "send_dm":
                return (
                    <>
                        {action.type === "send_message" && (
                            <Form.Item label="채널 ID">
                                <Input
                                    value={action.parameters.channelId || ""}
                                    onChange={(e) =>
                                        updateAction(
                                            index,
                                            "parameters.channelId",
                                            e.target.value
                                        )
                                    }
                                    placeholder="123456789012345678"
                                />
                            </Form.Item>
                        )}
                        <Form.Item label="메시지 내용">
                            <Input.TextArea
                                value={action.parameters.message || ""}
                                onChange={(e) =>
                                    updateAction(
                                        index,
                                        "parameters.message",
                                        e.target.value
                                    )
                                }
                                placeholder="안녕하세요, {user}님!"
                                rows={3}
                            />
                        </Form.Item>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <Card
            title={button ? "버튼 수정" : "새 버튼 생성"}
            style={{ maxWidth: 800 }}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    isActive: true,
                    displayOrder: 0,
                    triggerType: "everyone",
                    buttonStyle: "primary",
                    disableAfterUse: false,
                    oncePerUser: false,
                    logEnabled: true,
                    cooldown: 0,
                }}
            >
                {/* 기본 정보 */}
                <Title level={5}>기본 정보</Title>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="buttonLabel"
                            label="버튼 텍스트"
                            rules={[
                                {
                                    required: true,
                                    message: "버튼 텍스트를 입력해주세요.",
                                },
                                {
                                    max: 80,
                                    message:
                                        "버튼 텍스트는 80자 이하로 입력해주세요.",
                                },
                            ]}
                        >
                            <Input
                                placeholder="역할 받기"
                                maxLength={80}
                                showCount
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="displayOrder" label="표시 순서">
                            <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    name="isActive"
                    label="활성화"
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>

                {/* 트리거 설정 */}
                <Divider />
                <Title level={5}>트리거 설정</Title>

                <Form.Item
                    name="triggerType"
                    label="누가 버튼을 사용할 수 있나요?"
                >
                    <Select>
                        <Option value="everyone">모든 사람</Option>
                        <Option value="role">특정 역할만</Option>
                        <Option value="admin">관리자만</Option>
                    </Select>
                </Form.Item>

                {/* 버튼 스타일 설정 */}
                <Divider />
                <Title level={5}>버튼 스타일</Title>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="buttonStyle" label="버튼 색상">
                            <Select>
                                <Option value="primary">
                                    파란색 (Primary)
                                </Option>
                                <Option value="secondary">
                                    회색 (Secondary)
                                </Option>
                                <Option value="success">
                                    초록색 (Success)
                                </Option>
                                <Option value="danger">빨간색 (Danger)</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="cooldown"
                            label="쿨다운 (초)"
                            tooltip="버튼 사용 후 재사용까지의 대기시간"
                        >
                            <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name="disableAfterUse"
                            label="사용 후 비활성화"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="oncePerUser"
                            label="사용자당 1회만"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="logEnabled"
                            label="로그 기록"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                    </Col>
                </Row>

                {/* 액션 설정 */}
                <Divider />
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 16,
                    }}
                >
                    <Title level={5} style={{ margin: 0 }}>
                        액션 설정
                    </Title>
                    <Text type="secondary">
                        {actions.length} /{" "}
                        {DISCORD_LIMITS.MAX_ACTIONS_PER_BUTTON}개
                    </Text>
                </div>

                {actions.length >= DISCORD_LIMITS.MAX_ACTIONS_PER_BUTTON && (
                    <Alert
                        type="warning"
                        message={`최대 ${DISCORD_LIMITS.MAX_ACTIONS_PER_BUTTON}개의 액션까지만 설정할 수 있습니다.`}
                        style={{ marginBottom: 16 }}
                        showIcon
                    />
                )}

                {actions.map((action, index) => (
                    <Card
                        key={index}
                        size="small"
                        title={`액션 ${index + 1}`}
                        extra={
                            actions.length > 1 && (
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => removeAction(index)}
                                />
                            )
                        }
                        style={{ marginBottom: 16 }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="액션 타입">
                                    <Select
                                        value={action.type}
                                        onChange={(value) =>
                                            updateAction(index, "type", value)
                                        }
                                    >
                                        <Option value="add_role">
                                            역할 추가
                                        </Option>
                                        <Option value="remove_role">
                                            역할 제거
                                        </Option>
                                        <Option value="toggle_role">
                                            역할 토글
                                        </Option>
                                        <Option value="change_nickname">
                                            닉네임 변경
                                        </Option>
                                        <Option value="send_message">
                                            메시지 전송
                                        </Option>
                                        <Option value="send_dm">DM 전송</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="대상">
                                    <Select
                                        value={action.target}
                                        onChange={(value) =>
                                            updateAction(index, "target", value)
                                        }
                                    >
                                        <Option value="executor">
                                            버튼을 누른 사람
                                        </Option>
                                        <Option value="admin">관리자</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        {renderActionParameters(action, index)}

                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item label="지연 시간 (초)">
                                    <InputNumber
                                        value={action.delay}
                                        onChange={(value) =>
                                            updateAction(
                                                index,
                                                "delay",
                                                value || 0
                                            )
                                        }
                                        min={0}
                                        style={{ width: "100%" }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="결과 메시지 표시">
                                    <Select
                                        value={action.resultVisibility}
                                        onChange={(value) =>
                                            updateAction(
                                                index,
                                                "resultVisibility",
                                                value
                                            )
                                        }
                                    >
                                        <Option value="none">표시 안함</Option>
                                        <Option value="private">
                                            개인에게만
                                        </Option>
                                        <Option value="public">
                                            채널에 공개
                                        </Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="결과 메시지">
                                    <Input
                                        value={action.resultMessage}
                                        onChange={(e) =>
                                            updateAction(
                                                index,
                                                "resultMessage",
                                                e.target.value
                                            )
                                        }
                                        placeholder="완료되었습니다!"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                ))}

                <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={addAction}
                    disabled={
                        actions.length >= DISCORD_LIMITS.MAX_ACTIONS_PER_BUTTON
                    }
                    style={{ width: "100%", marginBottom: 24 }}
                >
                    액션 추가{" "}
                    {actions.length >= DISCORD_LIMITS.MAX_ACTIONS_PER_BUTTON &&
                        "(최대 도달)"}
                </Button>

                {/* 버튼들 */}
                <Form.Item style={{ marginBottom: 0 }}>
                    <Space>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                        >
                            {button ? "수정" : "생성"}
                        </Button>
                        <Button onClick={onCancel}>취소</Button>
                    </Space>
                </Form.Item>
            </Form>
        </Card>
    );
};
