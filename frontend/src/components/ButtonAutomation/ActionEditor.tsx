import React, { useState, useEffect } from "react";
import {
    Card,
    Select,
    Input,
    InputNumber,
    Button,
    Space,
    Row,
    Col,
    Typography,
    Divider,
    Switch,
    Form,
    message,
    Tag,
} from "antd";
import {
    DeleteOutlined,
    PlusOutlined,
    DragOutlined,
    CopyOutlined,
} from "@ant-design/icons";
import { RefreshCw } from "lucide-react";
import { ActionConfig, ActionType, ACTION_TYPE_CONFIGS } from "../../types/buttonAutomation";
import {
    DISCORD_LIMITS,
    validateActionCount,
    isValidDiscordId,
} from "../../utils/validation";
import { MusicParameterEditor } from "./ActionParameters/MusicParameterEditor";
import {
    PERMISSION_CATEGORIES,
    PERMISSION_INFO,
    PermissionUtils,
    CHANNEL_TYPE_PERMISSIONS,
} from "../../constants/discordPermissions";
import { MultiChannelSelect } from "../ui/multi-channel-select";
import { MultiRoleSelect } from "../ui/multi-role-select";
import { EmojiPicker } from "../ui/EmojiPicker";
import { ChannelProvider } from "../../contexts/ChannelContext";
import { useChannels } from "../../hooks/useChannels";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 아이콘 매핑 헬퍼 함수 (유니코드 이모지)
const getActionIcon = (iconName: string) => {
  const iconMap: Record<string, string> = {
    'Terminal': '🤖',
    'UserPlus': '👥',
    'UserMinus': '👤',
    'Edit': '✏️',
    'MessageSquare': '💬',
    'Clock': '⏰',
    'ToggleRight': '🔄',
    'RotateCcw': '🔄',
    'RefreshCw': '🔄',
    'Shield': '🛡️',
    'ShieldOff': '🚫',
    'ShieldCheck': '✅',
    'Mail': '📨',
    'ArrowRightLeft': '↔️',
    'PhoneOff': '📞',
    'MicOff': '🔇',
    'MicToggle': '🔊',
    'HeadphonesOff': '🔊',
    'HeadphonesToggle': '🎧',
    'Megaphone': '📢',
    'UserCheck': '✅',
    'Settings': '⚙️',
  };
  
  return <span>{iconMap[iconName] || iconName}</span>;
};

// 봇 커맨드 인터페이스
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

interface ActionEditorProps {
    actions: ActionConfig[];
    onChange: (actions: ActionConfig[]) => void;
    maxActions?: number;
    guildId: string; // 필수로 변경
    userId?: string;
}

export const ActionEditor: React.FC<ActionEditorProps> = ({
    actions,
    onChange,
    maxActions = DISCORD_LIMITS.MAX_ACTIONS_PER_BUTTON,
    guildId,
    userId,
}) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const { channels } = useChannels();
    
    // 봇 커맨드 상태
    const [botCommands, setBotCommands] = useState<BotCommand[]>([]);
    const [loadingCommands, setLoadingCommands] = useState(false);
    const [commandsError, setCommandsError] = useState<string | null>(null);
    
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
        loadBotCommands();
    }, []);

    // 액션 추가
    const addAction = () => {
        if (actions.length >= maxActions) {
            message.warning(
                `최대 ${maxActions}개의 액션만 추가할 수 있습니다.`
            );
            return;
        }

        const newAction: ActionConfig = {
            type: "add_role",
            target: "executor",
            parameters: {},
            delay: 0,
            result: {
                message: "",
                visibility: "none",
            },
        };

        onChange([...actions, newAction]);
    };

    // 액션 제거
    const removeAction = (index: number) => {
        const newActions = actions.filter((_, i) => i !== index);
        onChange(newActions);
    };

    // 액션 복사
    const copyAction = (index: number) => {
        if (actions.length >= maxActions) {
            message.warning("최대 액션 개수에 도달했습니다.");
            return;
        }

        const actionToCopy = { ...actions[index] };
        const newActions = [...actions];
        newActions.splice(index + 1, 0, actionToCopy);
        onChange(newActions);
        message.success("액션이 복사되었습니다.");
    };

    // 액션 업데이트
    const updateAction = (index: number, updates: Partial<ActionConfig>) => {
        const newActions = [...actions];
        newActions[index] = { ...newActions[index], ...updates };
        onChange(newActions);
    };

    // 액션 파라미터 업데이트
    const updateActionParameter = (
        index: number,
        paramKey: string,
        value: any
    ) => {
        const newActions = [...actions];
        newActions[index] = {
            ...newActions[index],
            parameters: {
                ...newActions[index].parameters,
                [paramKey]: value,
            },
        };
        onChange(newActions);
    };

    // 액션 순서 변경 (드래그 앤 드롭)
    const moveAction = (fromIndex: number, toIndex: number) => {
        const newActions = [...actions];
        const movedAction = newActions.splice(fromIndex, 1)[0];
        newActions.splice(toIndex, 0, movedAction);
        onChange(newActions);
    };

    // 드래그 이벤트 핸들러
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== dropIndex) {
            moveAction(draggedIndex, dropIndex);
        }
        // 드래그 상태를 확실히 초기화
        setTimeout(() => setDraggedIndex(null), 100);
    };

    const handleDragEnd = () => {
        // 드래그가 끝나면 상태 초기화
        setDraggedIndex(null);
    };

    // 권한 옵션 렌더링 함수
    const renderPermissionOptions = (action: ActionConfig) => {
        // 액션 타입에 따라 적절한 권한 카테고리만 표시
        let relevantCategories: string[] = [];
        let specificPermissions: string[] = [];

        if (
            action.type === "grant_server_permission" ||
            action.type === "revoke_server_permission"
        ) {
            // 서버 권한 액션: 서버 레벨 권한만
            relevantCategories = [
                "admin",
                "server_management",
                "member_management",
                "events",
                "misc",
            ];
        } else if (
            action.type === "set_channel_permission" ||
            action.type === "remove_channel_permission" ||
            action.type === "override_channel_permission" ||
            action.type === "reset_channel_permission"
        ) {
            // 채널 권한 액션: 선택된 채널 타입에 따라 권한 결정
            const selectedChannelIds = action.parameters.channelId;
            if (selectedChannelIds && channels.length > 0) {
                // 여러 채널이 선택된 경우를 고려
                const channelIds = Array.isArray(selectedChannelIds)
                    ? selectedChannelIds
                    : [selectedChannelIds];
                const selectedChannels = channels.filter((ch) =>
                    channelIds.includes(ch.id)
                );

                if (selectedChannels.length > 0) {
                    // 선택된 채널들의 타입을 확인하여 공통 권한 결정
                    const channelTypes = selectedChannels.map(
                        (ch) => ch.typeKey || "text"
                    );
                    const hasVoice = channelTypes.some(
                        (type) => type === "voice" || type === "stage"
                    );
                    const hasText = channelTypes.some(
                        (type) => type === "text" || type === "announcement"
                    );
                    const hasCategory = channelTypes.some(
                        (type) => type === "category"
                    );

                    // 선택된 채널 타입에 따라 권한 카테고리 결정
                    if (hasVoice && hasText) {
                        // 음성과 텍스트 채널이 섞여있으면 공통 권한만 표시 (채널 보기, 관리 등)
                        relevantCategories = ["server_management"];
                        specificPermissions = [
                            "ViewChannel",
                            "ManageChannels",
                            "ManageRoles",
                        ];
                    } else if (hasVoice) {
                        // 음성 채널만 선택: 음성 관련 권한만
                        relevantCategories = ["voice_channel"];
                        specificPermissions =
                            CHANNEL_TYPE_PERMISSIONS.voice || [];
                    } else if (hasText) {
                        // 텍스트 채널만 선택: 텍스트 관련 권한만
                        relevantCategories = ["text_channel", "threads"];
                        specificPermissions =
                            CHANNEL_TYPE_PERMISSIONS.text || [];
                    } else if (hasCategory) {
                        relevantCategories = ["server_management"];
                        specificPermissions =
                            CHANNEL_TYPE_PERMISSIONS.category || [];
                    } else {
                        // 알 수 없는 타입: 기본 채널 권한만
                        relevantCategories = ["server_management"];
                        specificPermissions = ["ViewChannel", "ManageChannels"];
                    }
                } else {
                    // 기본값: 모든 채널 권한
                    relevantCategories = [
                        "text_channel",
                        "voice_channel",
                        "threads",
                    ];
                }
            } else {
                // 채널이 선택되지 않았으면 모든 채널 권한 표시
                relevantCategories = [
                    "text_channel",
                    "voice_channel",
                    "threads",
                ];
            }
        } else {
            // 기타 액션: 모든 권한 표시
            relevantCategories = Object.keys(PERMISSION_CATEGORIES);
        }

        return Object.entries(PERMISSION_CATEGORIES)
            .filter(([categoryKey]) => relevantCategories.includes(categoryKey))
            .map(([categoryKey, category]) => {
                // 특정 권한이 지정된 경우 해당 권한만 표시
                const permissionsToShow =
                    specificPermissions.length > 0
                        ? category.permissions.filter((p) =>
                              specificPermissions.includes(p)
                          )
                        : category.permissions;

                if (permissionsToShow.length === 0) return null;

                return (
                    <Select.OptGroup
                        key={categoryKey}
                        label={
                            <span
                                style={{
                                    fontWeight: "bold",
                                    color: category.color,
                                }}
                            >
                                {category.icon} {category.name}
                            </span>
                        }
                    >
                        {permissionsToShow.map((permission) => (
                            <Option
                                key={permission}
                                value={permission}
                                label={PermissionUtils.getPermissionName(
                                    permission as keyof typeof PERMISSION_INFO
                                )}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <span>
                                        {PermissionUtils.getPermissionName(
                                            permission as keyof typeof PERMISSION_INFO
                                        )}
                                    </span>
                                    <Tag color={category.color} size="small">
                                        {category.icon}
                                    </Tag>
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: "#666",
                                        marginTop: 2,
                                    }}
                                >
                                    {PermissionUtils.getPermissionDescription(
                                        permission as keyof typeof PERMISSION_INFO
                                    )}
                                </div>
                            </Option>
                        ))}
                    </Select.OptGroup>
                );
            })
            .filter(Boolean); // null 값 제거
    };

    // 액션 타입별 파라미터 렌더링
    const renderActionParameters = (action: ActionConfig, index: number) => {
        const actionType =
            ACTION_TYPE_CONFIGS[action.type as keyof typeof ACTION_TYPE_CONFIGS];
        if (!actionType) return null;

        // 음악 액션인 경우 전용 에디터 사용
        // ACTION_TYPE_CONFIGS에는 category 필드가 없으므로 music 액션 확인을 다른 방식으로 해야 함
        if (action.type === 'play_music' || action.type === 'stop_music' || action.type === 'pause_music') {
            return (
                <div style={{ marginTop: 16 }}>
                    <MusicParameterEditor
                        action={action}
                        onChange={(parameters) => {
                            const newActions = [...actions];
                            newActions[index] = { ...action, parameters };
                            onChange(newActions);
                        }}
                        guildId={guildId}
                        userId={userId}
                    />
                </div>
            );
        }

        // 봇 커맨드 실행 액션인 경우 특별 처리
        if (action.type === 'execute_bot_command') {
            return (
                <div style={{ marginTop: 16 }}>
                    {/* 커맨드 선택 */}
                    <Form.Item label="실행할 커맨드" style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Select
                                value={action.parameters?.commandName || ''}
                                onChange={(value) => updateActionParameter(index, 'commandName', value)}
                                placeholder="커맨드를 선택하세요"
                                style={{ flex: 1 }}
                                loading={loadingCommands}
                                disabled={loadingCommands}
                            >
                                {botCommands.map((command) => (
                                    <Option key={command.name} value={command.name}>
                                        /{command.name} - {command.description}
                                    </Option>
                                ))}
                            </Select>
                            <Button
                                type="default"
                                onClick={loadBotCommands}
                                disabled={loadingCommands}
                                title="커맨드 목록 새로고침"
                                icon={loadingCommands ? '🔄' : <RefreshCw size={16} />}
                            />
                        </div>
                        {loadingCommands && (
                            <p style={{ fontSize: 12, color: '#1890ff', margin: '4px 0 0 0' }}>🔄 커맨드 목록을 불러오는 중...</p>
                        )}
                        {commandsError && (
                            <p style={{ fontSize: 12, color: '#ff4d4f', margin: '4px 0 0 0' }}>❌ {commandsError}</p>
                        )}
                        {!loadingCommands && !commandsError && botCommands.length === 0 && (
                            <p style={{ fontSize: 12, color: '#faad14', margin: '4px 0 0 0' }}>⚠️ 사용 가능한 커맨드가 없습니다</p>
                        )}
                        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
                            봇에서 사용 가능한 커맨드를 선택하세요
                        </Text>
                    </Form.Item>
                    
                    {/* 타임아웃 설정 */}
                    <Form.Item label="실행 타임아웃 (초)" style={{ marginBottom: 12 }}>
                        <InputNumber
                            value={action.parameters?.timeout || 30}
                            onChange={(value) => updateActionParameter(index, 'timeout', value || 30)}
                            min={1}
                            max={300}
                            style={{ width: "100%" }}
                            placeholder="30"
                        />
                        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
                            커맨드 실행 제한 시간 (1-300초)
                        </Text>
                    </Form.Item>
                    
                    {/* 조용히 실행 설정 */}
                    <Form.Item label="조용히 실행" style={{ marginBottom: 12 }}>
                        <Switch
                            checked={action.parameters?.silent || false}
                            onChange={(checked) => updateActionParameter(index, 'silent', checked)}
                            checkedChildren="ON"
                            unCheckedChildren="OFF"
                        />
                        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
                            실패해도 오류 메시지를 표시하지 않습니다
                        </Text>
                    </Form.Item>
                </div>
            );
        }
        
        // 기존 액션들의 파라미터 렌더링
        return (
            <div style={{ marginTop: 16 }}>
                {actionType.parameters.some(param => param.name === "roleId") && (
                    <Form.Item label="대상 역할" style={{ marginBottom: 12 }}>
                        <MultiRoleSelect
                            value={
                                action.parameters.roleIds ||
                                (action.parameters.roleId
                                    ? [action.parameters.roleId]
                                    : [])
                            }
                            onChange={(roles) => {
                                // 다중 역할 지원: 한 번에 두 파라미터 모두 업데이트
                                const newActions = [...actions];
                                newActions[index] = {
                                    ...newActions[index],
                                    parameters: {
                                        ...newActions[index].parameters,
                                        roleIds: roles,
                                        roleId: roles[0] || "", // 하위 호환성
                                    },
                                };
                                onChange(newActions);
                            }}
                            guildId={guildId}
                            placeholder="역할을 선택하세요 (다중 선택 가능)"
                            maxSelections={undefined}
                        />
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 12,
                                marginTop: 4,
                                display: "block",
                            }}
                        >
                            💡 여러 역할을 선택할 수 있습니다. 역할의 색상과
                            위치가 표시됩니다.
                        </Text>
                    </Form.Item>
                )}

                {actionType.parameters.some(param => param.name === "channelId") && (
                    <Form.Item label="대상 채널" style={{ marginBottom: 12 }}>
                        <ChannelProvider guildId={guildId}>
                            <MultiChannelSelect
                                value={
                                    // 먼저 channelIds를 확인하고, 없으면 channelId 사용 (하위 호환성)
                                    action.parameters.channelIds 
                                        ? action.parameters.channelIds
                                        : action.parameters.channelId
                                        ? Array.isArray(action.parameters.channelId)
                                            ? action.parameters.channelId
                                            : [action.parameters.channelId]
                                        : []
                                }
                                onChange={(channels) => {
                                    // 채널 권한 액션과 메시지 전송 액션은 여러 채널 선택 가능
                                    if (
                                        action.type.includes("channel_permission") ||
                                        action.type === "send_message"
                                    ) {
                                        // 멀티 채널 지원: channelIds와 channelId 모두 업데이트
                                        const newActions = [...actions];
                                        newActions[index] = {
                                            ...newActions[index],
                                            parameters: {
                                                ...newActions[index].parameters,
                                                channelIds: channels,
                                                channelId: channels.length === 1 ? channels[0] : (channels.length > 0 ? channels : "") // 하위 호환성
                                            },
                                        };
                                        onChange(newActions);
                                    } else {
                                        // 기타 액션은 단일 채널만 선택
                                        updateActionParameter(
                                            index,
                                            "channelId",
                                            channels[0] || ""
                                        );
                                    }
                                }}
                                placeholder="채널을 선택하세요"
                                maxSelections={
                                    action.type.includes("channel_permission") ||
                                    action.type === "send_message"
                                        ? undefined
                                        : 1
                                }
                                channelTypes={
                                    action.type.includes("channel_permission")
                                        ? [
                                              "text",
                                              "voice",
                                              "category",
                                              "announcement",
                                              "stage",
                                          ]
                                        : action.type === "send_message"
                                        ? [
                                              "text",
                                              "announcement", 
                                              "category"
                                          ]
                                        : undefined
                                }
                            />
                        </ChannelProvider>

                        {/* 채널별 적용 가능한 권한 안내 */}
                        {action.type.includes("channel_permission") && (
                            <div
                                style={{
                                    marginTop: 8,
                                    padding: 8,
                                    backgroundColor: "#f0f8ff",
                                    borderRadius: 4,
                                }}
                            >
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    💡 <strong>채널 타입별 권한:</strong>
                                    <br />
                                    📝 텍스트: 메시지, 스레드, 이모지 관련 권한
                                    <br />
                                    🔊 음성: 연결, 말하기, 음소거 관련 권한
                                    <br />
                                    🎭 스테이지: 스테이지 채널 관련 권한
                                    <br />
                                    📁{" "}
                                    <strong style={{ color: "#1890ff" }}>
                                        카테고리: 하위 모든 채널에 자동으로
                                        적용됩니다
                                    </strong>
                                    <br />
                                    📢 공지: 공지 채널 관련 권한
                                    <br />
                                    🔢 <strong>여러 채널 선택 가능:</strong> 한
                                    번에 여러 채널에 같은 권한을 적용할 수
                                    있습니다
                                </Text>
                            </div>
                        )}
                        
                        {/* 메시지 전송 액션 안내 */}
                        {action.type === "send_message" && (
                            <div
                                style={{
                                    marginTop: 8,
                                    padding: 8,
                                    backgroundColor: "#f0fff0",
                                    borderRadius: 4,
                                }}
                            >
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    💡 <strong>멀티 채널 메시지 전송:</strong>
                                    <br />
                                    📝 <strong>텍스트 채널:</strong> 일반 메시지 전송
                                    <br />
                                    📢 <strong>공지 채널:</strong> 공지 메시지 전송
                                    <br />
                                    📁 <strong style={{ color: "#52c41a" }}>
                                        카테고리 채널: 카테고리 내 모든 텍스트 채널에 
                                        자동으로 메시지를 전송합니다
                                    </strong>
                                    <br />
                                    🎭 <strong>역할별 채널:</strong> 사용자 역할에 따라 
                                    자동 생성된 채널에 전송
                                    <br />
                                    📤 <strong>여러 채널 선택 가능:</strong> 한 번에 
                                    여러 채널에 같은 메시지를 전송할 수 있습니다
                                </Text>
                            </div>
                        )}
                    </Form.Item>
                )}

                {actionType.parameters.some(param => param.name === "nickname") && (
                    <Form.Item label="새 닉네임" style={{ marginBottom: 12 }}>
                        <Input
                            value={action.parameters.nickname || ""}
                            onChange={(e) =>
                                updateActionParameter(
                                    index,
                                    "nickname",
                                    e.target.value
                                )
                            }
                            placeholder="🎮 {username}"
                            maxLength={32}
                            showCount
                        />
                        <div
                            style={{
                                marginTop: 4,
                                padding: 6,
                                backgroundColor: "#f0f8ff",
                                borderRadius: 4,
                                fontSize: 11,
                            }}
                        >
                            <Text type="secondary">
                                💡 <strong>사용 가능한 변수:</strong> {"{user}"}{" "}
                                (사용자 멘션), {"{username}"} (사용자명),
                                {"{guild}"} (서버명), {"{channel}"} (현재
                                채널명), {"{button}"} (버튼명)
                            </Text>
                        </div>
                    </Form.Item>
                )}

                {actionType.parameters.some(param => param.name === "message" || param.name === "messageContent") && (
                    <Form.Item label="메시지 내용" style={{ marginBottom: 12 }}>
                        <TextArea
                            value={action.parameters.message || action.parameters.messageContent || ""}
                            onChange={(e) => {
                                // message 또는 messageContent 필드에 저장
                                const paramName = actionType.parameters.find(p => p.name === "messageContent") ? "messageContent" : "message";
                                updateActionParameter(
                                    index,
                                    paramName,
                                    e.target.value
                                );
                            }}
                            placeholder="안녕하세요, {user}님!"
                            rows={3}
                            maxLength={2000}
                            showCount
                        />
                        <div
                            style={{
                                marginTop: 4,
                                padding: 6,
                                backgroundColor: "#f0f8ff",
                                borderRadius: 4,
                                fontSize: 11,
                            }}
                        >
                            <Text type="secondary">
                                💡 <strong>사용 가능한 변수:</strong> {"{user}"}{" "}
                                (사용자 멘션), {"{username}"} (사용자명),
                                {"{guild}"} (서버명), {"{channel}"} (현재
                                채널명), {"{button}"} (버튼명)
                            </Text>
                        </div>
                    </Form.Item>
                )}

                {actionType.parameters.some(param => param.name === "reactions") && (
                    <Form.Item label="이모지 반응" style={{ marginBottom: 12 }}>
                        <EmojiPicker
                            value={action.parameters.reactions || []}
                            onChange={(value) =>
                                updateActionParameter(index, "reactions", value)
                            }
                            maxCount={10}
                            placeholder="이모지를 선택하세요"
                        />
                        <div
                            style={{
                                marginTop: 4,
                                padding: 6,
                                backgroundColor: "#f0f8ff",
                                borderRadius: 4,
                                fontSize: 11,
                            }}
                        >
                            <Text type="secondary">
                                💡 <strong>이모지 반응 기능:</strong><br/>
                                • 메시지 전송 후 자동으로 선택한 이모지가 반응으로 추가됩니다<br/>
                                • 최대 10개까지 선택 가능<br/>
                                • 이모지를 클릭하여 쉽게 선택하고 관리할 수 있습니다
                            </Text>
                        </div>
                    </Form.Item>
                )}

                {actionType.parameters.some(param => param.name === "seconds") && (
                    <Form.Item label="시간 (초)" style={{ marginBottom: 12 }}>
                        <InputNumber
                            value={action.parameters.seconds || 0}
                            onChange={(value) =>
                                updateActionParameter(
                                    index,
                                    "seconds",
                                    value || 0
                                )
                            }
                            min={0}
                            max={21600} // 6시간
                            style={{ width: "100%" }}
                        />
                    </Form.Item>
                )}

                {actionType.parameters.some(param => param.name === "duration") && (
                    <Form.Item
                        label="지속 시간 (초)"
                        style={{ marginBottom: 12 }}
                    >
                        <InputNumber
                            value={action.parameters.duration || 0}
                            onChange={(value) =>
                                updateActionParameter(
                                    index,
                                    "duration",
                                    value || 0
                                )
                            }
                            min={0}
                            max={3600} // 1시간
                            style={{ width: "100%" }}
                            placeholder="0 (영구)"
                            addonAfter="초"
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            0으로 설정하면 영구적으로 적용됩니다
                        </Text>
                    </Form.Item>
                )}

                {actionType.parameters.some(param => param.name === "enable" || param.name === "enabled") && (
                    <Form.Item label="활성화" style={{ marginBottom: 12 }}>
                        <Switch
                            checked={action.parameters.enable !== false}
                            onChange={(checked) =>
                                updateActionParameter(index, "enable", checked)
                            }
                            checkedChildren="ON"
                            unCheckedChildren="OFF"
                        />
                    </Form.Item>
                )}

                {actionType.parameters.some(param => param.name === "permissions" || param.name === "permission") && (
                    <Form.Item label="권한 설정" style={{ marginBottom: 12 }}>
                        <div>
                            <Select
                                mode="multiple"
                                value={action.parameters.permissions || []}
                                onChange={(value) =>
                                    updateActionParameter(
                                        index,
                                        "permissions",
                                        value
                                    )
                                }
                                placeholder="권한을 선택하세요"
                                style={{ width: "100%", marginBottom: 12 }}
                                optionLabelProp="label"
                                filterOption={(input, option) =>
                                    option?.label
                                        ?.toString()
                                        .toLowerCase()
                                        .includes(input.toLowerCase()) ||
                                    false ||
                                    option?.value
                                        ?.toString()
                                        .toLowerCase()
                                        .includes(input.toLowerCase()) ||
                                    false
                                }
                            >
                                {renderPermissionOptions(action)}
                            </Select>

                            {/* 권한 범위 안내 */}
                            <div
                                style={{
                                    marginBottom: 8,
                                    padding: 8,
                                    backgroundColor: "#f0f8ff",
                                    borderRadius: 4,
                                }}
                            >
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {action.type ===
                                        "grant_server_permission" ||
                                    action.type ===
                                        "revoke_server_permission" ? (
                                        <>
                                            🏢 <strong>서버 권한:</strong> 서버
                                            전체에 적용되는 권한들입니다
                                        </>
                                    ) : action.type ===
                                          "set_channel_permission" ||
                                      action.type ===
                                          "remove_channel_permission" ||
                                      action.type ===
                                          "override_channel_permission" ||
                                      action.type ===
                                          "reset_channel_permission" ? (
                                        <>
                                            📝 <strong>채널 권한:</strong>{" "}
                                            선택한 채널에만 적용되는
                                            권한들입니다
                                        </>
                                    ) : (
                                        <>
                                            ⚙️ <strong>일반 권한:</strong>{" "}
                                            액션에 필요한 권한들입니다
                                        </>
                                    )}
                                </Text>
                            </div>

                            {/* 선택된 권한들 표시 */}
                            {action.parameters.permissions &&
                                action.parameters.permissions.length > 0 && (
                                    <div style={{ marginTop: 8 }}>
                                        <Text
                                            type="secondary"
                                            style={{
                                                fontSize: 12,
                                                marginBottom: 4,
                                                display: "block",
                                            }}
                                        >
                                            선택된 권한 (
                                            {
                                                action.parameters.permissions
                                                    .length
                                            }
                                            개):
                                        </Text>
                                        <div
                                            style={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: 4,
                                            }}
                                        >
                                            {action.parameters.permissions.map(
                                                (permission: string) => {
                                                    const categoryKey =
                                                        Object.keys(
                                                            PERMISSION_CATEGORIES
                                                        ).find((key) =>
                                                            PERMISSION_CATEGORIES[
                                                                key as keyof typeof PERMISSION_CATEGORIES
                                                            ].permissions.includes(
                                                                permission
                                                            )
                                                        );
                                                    const category = categoryKey
                                                        ? PERMISSION_CATEGORIES[
                                                              categoryKey as keyof typeof PERMISSION_CATEGORIES
                                                          ]
                                                        : null;

                                                    return (
                                                        <Tag
                                                            key={permission}
                                                            color={
                                                                category?.color ||
                                                                "default"
                                                            }
                                                            style={{
                                                                fontSize: 11,
                                                            }}
                                                        >
                                                            {category?.icon}{" "}
                                                            {PermissionUtils.getPermissionName(
                                                                permission as keyof typeof PERMISSION_INFO
                                                            )}
                                                        </Tag>
                                                    );
                                                }
                                            )}
                                        </div>
                                    </div>
                                )}
                        </div>
                    </Form.Item>
                )}

                {/* 버튼 설정 파라미터들 */}
                {actionType.parameters.some(param => param.name === "buttonStyle") && (
                    <Form.Item label="버튼 스타일" style={{ marginBottom: 12 }}>
                        <Select
                            value={action.parameters.buttonStyle || "primary"}
                            onChange={(value) =>
                                updateActionParameter(
                                    index,
                                    "buttonStyle",
                                    value
                                )
                            }
                            style={{ width: "100%" }}
                        >
                            <Option value="primary">Primary (파란색)</Option>
                            <Option value="secondary">Secondary (회색)</Option>
                            <Option value="success">Success (초록색)</Option>
                            <Option value="danger">Danger (빨간색)</Option>
                        </Select>
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 12,
                                marginTop: 4,
                                display: "block",
                            }}
                        >
                            액션 실행 후 버튼의 색상을 변경합니다
                        </Text>
                    </Form.Item>
                )}

                {actionType.parameters.some(param => param.name === "buttonLabel") && (
                    <Form.Item
                        label="새 버튼 라벨"
                        style={{ marginBottom: 12 }}
                    >
                        <Input
                            value={action.parameters.buttonLabel || ""}
                            onChange={(e) =>
                                updateActionParameter(
                                    index,
                                    "buttonLabel",
                                    e.target.value
                                )
                            }
                            placeholder="🎉 {username}님이 완료했습니다!"
                            maxLength={80}
                            showCount
                        />
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 12,
                                marginTop: 4,
                                display: "block",
                            }}
                        >
                            액션 실행 후 버튼의 텍스트를 변경합니다 (비워두면
                            변경하지 않음)
                        </Text>
                        <div
                            style={{
                                marginTop: 4,
                                padding: 6,
                                backgroundColor: "#f0f8ff",
                                borderRadius: 4,
                                fontSize: 11,
                            }}
                        >
                            <Text type="secondary">
                                💡 <strong>사용 가능한 변수:</strong> {"{user}"}{" "}
                                (사용자 멘션), {"{username}"} (사용자명),
                                {"{guild}"} (서버명), {"{channel}"} (현재
                                채널명), {"{button}"} (버튼명)
                            </Text>
                        </div>
                    </Form.Item>
                )}

                {actionType.parameters.some(param => param.name === "buttonDisabled") && (
                    <Form.Item
                        label="버튼 비활성화"
                        style={{ marginBottom: 12 }}
                    >
                        <Switch
                            checked={action.parameters.buttonDisabled === true}
                            onChange={(checked) =>
                                updateActionParameter(
                                    index,
                                    "buttonDisabled",
                                    checked
                                )
                            }
                            checkedChildren="비활성화"
                            unCheckedChildren="활성화 유지"
                        />
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 12,
                                marginTop: 4,
                                display: "block",
                            }}
                        >
                            액션 실행 후 버튼을 비활성화할지 선택합니다
                        </Text>
                    </Form.Item>
                )}

                {actionType.parameters.some(param => param.name === "buttonEmoji") && (
                    <Form.Item label="버튼 이모지" style={{ marginBottom: 12 }}>
                        <Input
                            value={action.parameters.buttonEmoji || ""}
                            onChange={(e) =>
                                updateActionParameter(
                                    index,
                                    "buttonEmoji",
                                    e.target.value
                                )
                            }
                            placeholder="😀 또는 <:name:id>"
                            maxLength={50}
                        />
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 12,
                                marginTop: 4,
                                display: "block",
                            }}
                        >
                            버튼에 표시할 이모지를 설정합니다 (유니코드 이모지
                            또는 Discord 커스텀 이모지)
                        </Text>
                    </Form.Item>
                )}
            </div>
        );
    };

    return (
        <div>
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
                    {actions.length} / {maxActions}개
                </Text>
            </div>

            {actions.map((action, index) => {
                const actionType =
                    ACTION_TYPE_CONFIGS[action.type as keyof typeof ACTION_TYPE_CONFIGS];

                return (
                    <Card
                        key={index}
                        size="small"
                        style={{
                            marginBottom: 16,
                            cursor: "move",
                            opacity: draggedIndex === index ? 0.5 : 1,
                        }}
                        title={
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <DragOutlined style={{ cursor: "grab" }} />
                                {getActionIcon(actionType?.icon || '')}
                                <span>
                                    액션 {index + 1}: {actionType?.label}
                                </span>
                            </div>
                        }
                        extra={
                            <Space>
                                <Button
                                    type="text"
                                    icon={<CopyOutlined />}
                                    onClick={() => copyAction(index)}
                                    disabled={actions.length >= maxActions}
                                    title="액션 복사"
                                />
                                {actions.length > 1 && (
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeAction(index)}
                                        title="액션 삭제"
                                    />
                                )}
                            </Space>
                        }
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                    >
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    label="액션 타입"
                                    style={{ marginBottom: 12 }}
                                >
                                    <Select
                                        value={action.type}
                                        onChange={(value) =>
                                            updateAction(index, {
                                                type: value,
                                                parameters: {},
                                            })
                                        }
                                        style={{ width: "100%" }}
                                    >
                                        {Object.entries(ACTION_TYPE_CONFIGS).map(
                                            ([key, config]) => (
                                                <Option key={key} value={key}>
                                                    <Space>
                                                        <span>
                                                            {getActionIcon(config.icon)}
                                                        </span>
                                                        <span>
                                                            {config.label}
                                                        </span>
                                                    </Space>
                                                </Option>
                                            )
                                        )}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item
                                    label="대상"
                                    style={{ marginBottom: 12 }}
                                >
                                    <Select
                                        value={action.target}
                                        onChange={(value) =>
                                            updateAction(index, {
                                                target: value,
                                            })
                                        }
                                        style={{ width: "100%" }}
                                    >
                                        <Option value="executor">
                                            버튼을 누른 사람
                                        </Option>
                                        <Option value="admin">관리자</Option>
                                        <Option value="role">
                                            특정 역할의 모든 사용자
                                        </Option>
                                        <Option value="specific">
                                            특정 사용자
                                        </Option>
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item
                                    label="지연 시간 (초)"
                                    style={{ marginBottom: 12 }}
                                >
                                    <InputNumber
                                        value={action.delay || 0}
                                        onChange={(value) =>
                                            updateAction(index, {
                                                delay: value || 0,
                                            })
                                        }
                                        min={0}
                                        max={3600}
                                        style={{ width: "100%" }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* 대상이 특정 역할인 경우 역할 선택 */}
                        {action.target === "role" && (
                            <Row gutter={16} style={{ marginTop: 8 }}>
                                <Col span={24}>
                                    <Form.Item
                                        label="대상 역할 선택"
                                        style={{ marginBottom: 12 }}
                                    >
                                        <MultiRoleSelect
                                            value={
                                                action.parameters
                                                    .targetRoleIds || []
                                            }
                                            onChange={(roles) =>
                                                updateActionParameter(
                                                    index,
                                                    "targetRoleIds",
                                                    roles
                                                )
                                            }
                                            guildId={guildId}
                                            placeholder="액션을 적용할 역할들을 선택하세요 (다중 선택 가능)"
                                            maxSelections={undefined}
                                        />
                                        <Text
                                            type="secondary"
                                            style={{
                                                fontSize: 12,
                                                marginTop: 4,
                                                display: "block",
                                            }}
                                        >
                                            💡 선택한 역할들을 가진 모든
                                            사용자에게 액션이 적용됩니다 (다중
                                            역할 선택 가능)
                                        </Text>
                                    </Form.Item>
                                </Col>
                            </Row>
                        )}

                        {/* 대상이 특정 사용자인 경우 사용자 ID 입력 */}
                        {action.target === "specific" && (
                            <Row gutter={16} style={{ marginTop: 8 }}>
                                <Col span={24}>
                                    <Form.Item
                                        label="대상 사용자 ID"
                                        style={{ marginBottom: 12 }}
                                    >
                                        <Input
                                            value={
                                                action.parameters
                                                    .targetUserId || ""
                                            }
                                            onChange={(e) =>
                                                updateActionParameter(
                                                    index,
                                                    "targetUserId",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="123456789012345678"
                                            status={
                                                action.parameters
                                                    .targetUserId &&
                                                !isValidDiscordId(
                                                    action.parameters
                                                        .targetUserId
                                                )
                                                    ? "error"
                                                    : ""
                                            }
                                        />
                                        {action.parameters.targetUserId &&
                                            !isValidDiscordId(
                                                action.parameters.targetUserId
                                            ) && (
                                                <Text
                                                    type="danger"
                                                    style={{ fontSize: 12 }}
                                                >
                                                    올바른 사용자 ID를
                                                    입력해주세요
                                                </Text>
                                            )}
                                        <Text
                                            type="secondary"
                                            style={{
                                                fontSize: 12,
                                                marginTop: 4,
                                                display: "block",
                                            }}
                                        >
                                            👤 특정 사용자의 Discord ID를
                                            입력하세요
                                        </Text>
                                    </Form.Item>
                                </Col>
                            </Row>
                        )}

                        {actionType && (
                            <div
                                style={{
                                    marginTop: 8,
                                    padding: 8,
                                    backgroundColor: "#f5f5f5",
                                    borderRadius: 4,
                                }}
                            >
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {actionType.description}
                                </Text>
                            </div>
                        )}

                        {renderActionParameters(action, index)}

                        <Divider style={{ margin: "16px 0" }} />

                        {/* 결과 설정 */}
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="결과 메시지 표시"
                                    style={{ marginBottom: 12 }}
                                >
                                    <Select
                                        value={
                                            action.result?.visibility ?? "none"
                                        }
                                        onChange={(value) =>
                                            updateAction(index, {
                                                result: {
                                                    ...action.result,
                                                    visibility: value,
                                                },
                                            })
                                        }
                                        style={{ width: "100%" }}
                                    >
                                        <Option value="none">표시 안함</Option>
                                        <Option value="ephemeral">
                                            개인에게만 (임시 메시지)
                                        </Option>
                                        <Option value="private">
                                            개인에게만 (DM)
                                        </Option>
                                        <Option value="current_channel">
                                            현재 채널
                                        </Option>
                                        <Option value="specific_channel">
                                            특정 채널
                                        </Option>
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Form.Item
                                    label="결과 메시지"
                                    style={{ marginBottom: 12 }}
                                >
                                    <Input
                                        value={action.result?.message || ""}
                                        onChange={(e) =>
                                            updateAction(index, {
                                                result: {
                                                    ...action.result,
                                                    message: e.target.value,
                                                },
                                            })
                                        }
                                        placeholder="🎉 {username}님이 {channel}에서 작업을 완료했습니다!"
                                        maxLength={200}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* 특정 채널 선택 (결과 메시지가 특정 채널인 경우) */}
                        {action.result?.visibility === "specific_channel" && (
                            <Row gutter={16} style={{ marginTop: 8 }}>
                                <Col span={24}>
                                    <Form.Item
                                        label="메시지를 보낼 채널"
                                        style={{ marginBottom: 12 }}
                                    >
                                        <ChannelProvider guildId={guildId}>
                                            <MultiChannelSelect
                                                value={
                                                    action.result?.channelId
                                                        ? [
                                                              action.result
                                                                  .channelId,
                                                          ]
                                                        : []
                                                }
                                                onChange={(channels) =>
                                                    updateAction(index, {
                                                        result: {
                                                            ...action.result,
                                                            channelId:
                                                                channels[0] ||
                                                                "",
                                                        },
                                                    })
                                                }
                                                placeholder="결과 메시지를 보낼 채널을 선택하세요"
                                                maxSelections={1}
                                                channelTypes={[
                                                    "text",
                                                    "announcement",
                                                ]} // 텍스트 채널만
                                            />
                                        </ChannelProvider>
                                        <Text
                                            type="secondary"
                                            style={{
                                                fontSize: 12,
                                                marginTop: 4,
                                                display: "block",
                                            }}
                                        >
                                            📝 텍스트 채널과 공지 채널만 선택할
                                            수 있습니다
                                        </Text>
                                    </Form.Item>
                                </Col>
                            </Row>
                        )}

                        {/* 변수 사용 가이드 */}
                        <div
                            style={{
                                marginTop: 8,
                                padding: 8,
                                backgroundColor: "#f0f8ff",
                                borderRadius: 4,
                                fontSize: 12,
                            }}
                        >
                            <Text type="secondary">
                                💡 <strong>사용 가능한 변수:</strong> {"{user}"}{" "}
                                (사용자 멘션), {"{username}"} (사용자명),
                                {"{guild}"} (서버명), {"{channel}"} (현재
                                채널명), {"{button}"} (버튼명)
                            </Text>
                        </div>
                    </Card>
                );
            })}

            <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addAction}
                disabled={actions.length >= maxActions}
                style={{ width: "100%" }}
            >
                액션 추가 {actions.length >= maxActions && "(최대 도달)"}
            </Button>
        </div>
    );
};
