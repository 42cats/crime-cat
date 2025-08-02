import React, { useState, useEffect } from "react";
import {
    Plus,
    Trash2,
    Settings,
    Eye,
    Code,
    Save,
    Terminal,
    RefreshCw,
    InfoIcon,
} from "lucide-react";
import {
    ButtonConfig,
    ActionConfig,
    ACTION_TYPE_CONFIGS,
    BotCommand,
} from "../../types/buttonAutomation";
import {
    validateButtonConfig,
    createExampleConfig,
} from "../../utils/buttonAutomationPreview";
import ButtonPreview from "./ButtonPreview";
import { BotCommandParameterInput } from "./SmartAutocompleteInput";
import { useEnhancedBotCommands, EnhancedBotCommand } from "../../hooks/useEnhancedBotCommands";

interface BotCommand {
    name: string;
    description: string;
    type: "slash" | "prefix";
    category?: string;
    parameters?: {
        name: string;
        type: "string" | "number" | "boolean" | "user" | "channel" | "role";
        description: string;
        required: boolean;
        choices?: { name: string; value: string }[];
    }[];
}

interface ConfigEditorProps {
    config?: Partial<ButtonConfig>;
    onChange?: (config: Partial<ButtonConfig>) => void;
    buttonLabel?: string;
    roles?: any[];
    channels?: any[];
    users?: any[];
    onSave?: () => void;
    className?: string;
    // ButtonAutomationEditor 호환성을 위한 추가 props
    button?: any;
    onCancel?: () => void;
    loading?: boolean;
    guildId?: string;
}

const ConfigEditor: React.FC<ConfigEditorProps> = ({
    config: configProp,
    onChange: onChangeProp,
    buttonLabel = "새 버튼",
    roles = [],
    channels = [],
    users = [],
    onSave,
    className = "",
    // ButtonAutomationEditor 호환성
    button,
    onCancel,
    loading,
    guildId,
}) => {
    // ButtonAutomationEditor에서 온 경우 button prop에서 config 추출
    const actualConfig = configProp || button?.config || {};
    const actualButtonLabel =
        buttonLabel !== "새 버튼"
            ? buttonLabel
            : button?.buttonLabel || "새 버튼";

    console.log("🚀 [Debug] ConfigEditor 렌더링 시작:", {
        configProp,
        button,
        actualConfig,
        actualButtonLabel,
        hasActions: !!actualConfig.actions,
        actionsCount: actualConfig.actions?.length || 0,
        firstActionType: actualConfig.actions?.[0]?.type,
        isButtonMode: !!button,
    });

    const [activeTab, setActiveTab] = useState<"editor" | "preview" | "json">(
        "editor"
    );
    const [jsonText, setJsonText] = useState("");
    
    // 향상된 봇 커맨드 조회 (자동완성 메타데이터 포함)
    const { 
        data: enhancedCommandsData, 
        isLoading: loadingCommands, 
        error: commandsError,
        refetch: refetchBotCommands
    } = useEnhancedBotCommands(guildId || "");
    
    const botCommands = enhancedCommandsData?.commands || [];

    // ButtonAutomationEditor 호환성을 위한 onChange 래퍼
    const handleConfigChange = (newConfig: Partial<ButtonConfig>) => {
        if (onChangeProp) {
            onChangeProp(newConfig);
        }
        // ButtonAutomationEditor 모드에서는 내부 상태로만 관리
    };

    // JSON 텍스트 동기화
    useEffect(() => {
        setJsonText(JSON.stringify(actualConfig, null, 2));
    }, [actualConfig]);

    // 기본 설정 로드
    const loadExample = () => {
        const example = createExampleConfig();
        handleConfigChange(example);
    };

    // JSON 직접 편집
    const handleJsonChange = (value: string) => {
        setJsonText(value);
        try {
            const parsed = JSON.parse(value);
            handleConfigChange(parsed);
        } catch (e) {
            // JSON 파싱 오류는 무시 (사용자가 입력 중일 수 있음)
        }
    };

    // 트리거 설정 업데이트
    const updateTrigger = (updates: Partial<ButtonConfig["trigger"]>) => {
        handleConfigChange({
            ...actualConfig,
            trigger: { ...actualConfig.trigger, ...updates },
        });
    };

    // 액션 추가
    const addAction = () => {
        const newAction: ActionConfig = {
            type: "add_role",
            order: (actualConfig.actions?.length || 0) + 1,
            target: "executor",
            parameters: {},
        };

        handleConfigChange({
            ...actualConfig,
            actions: [...(actualConfig.actions || []), newAction],
        });
    };

    // 액션 업데이트
    const updateAction = (index: number, updates: Partial<ActionConfig>) => {
        console.log("🔄 [Debug] updateAction 호출됨:", {
            index,
            updates,
            currentAction: actualConfig.actions?.[index],
            newType: updates.type,
        });

        const newActions = [...(actualConfig.actions || [])];
        newActions[index] = { ...newActions[index], ...updates };

        console.log("📝 [Debug] 액션 업데이트 후:", {
            index,
            oldAction: actualConfig.actions?.[index],
            newAction: newActions[index],
            allActions: newActions,
        });

        handleConfigChange({
            ...actualConfig,
            actions: newActions,
        });
    };

    // 액션 삭제
    const removeAction = (index: number) => {
        const newActions =
            actualConfig.actions?.filter((_, i) => i !== index) || [];
        handleConfigChange({
            ...actualConfig,
            actions: newActions,
        });
    };

    // 옵션 업데이트
    const updateOptions = (updates: Partial<ButtonConfig["options"]>) => {
        handleConfigChange({
            ...actualConfig,
            options: { ...actualConfig.options, ...updates },
        });
    };

    // UI 설정 업데이트
    const updateUI = (updates: Partial<ButtonConfig["ui"]>) => {
        handleConfigChange({
            ...actualConfig,
            ui: { ...actualConfig.ui, ...updates },
        });
    };

    // 선택된 봇 커맨드 정보 가져오기
    const getSelectedCommand = (commandName: string): EnhancedBotCommand | null => {
        return botCommands.find((cmd) => cmd.name === commandName) || null;
    };

    // 봇 커맨드 파라미터 렌더링 (스마트 자동완성 적용)
    const renderBotCommandParameters = (
        action: ActionConfig,
        actionIndex: number
    ) => {
        const selectedCommandName = action.parameters?.commandName;
        if (!selectedCommandName || !guildId) {
            return null;
        }

        const selectedCommand = getSelectedCommand(selectedCommandName);
        if (!selectedCommand) {
            return null;
        }

        // Enhanced command structure의 첫 번째 서브커맨드를 사용
        // 실제로는 UI에서 서브커맨드 선택 기능이 필요하지만, 현재는 첫 번째를 사용
        const subcommandNames = Object.keys(selectedCommand.subcommands);
        if (subcommandNames.length === 0) {
            return (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                            커맨드 "{selectedCommand.name}"에는 사용 가능한 서브커맨드가 없습니다.
                        </span>
                    </div>
                </div>
            );
        }

        const firstSubcommandName = subcommandNames[0];
        const firstSubcommand = selectedCommand.subcommands[firstSubcommandName];

        if (!firstSubcommand.parameters || firstSubcommand.parameters.length === 0) {
            return (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                            서브커맨드 "{firstSubcommandName}"에는 추가 파라미터가 필요하지 않습니다.
                        </span>
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                    <Terminal className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                        파라미터: {selectedCommand.name}/{firstSubcommandName}
                        {firstSubcommand.autocompleteParameterCount > 0 && (
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                자동완성 지원: {firstSubcommand.autocompleteParameterCount}개
                            </span>
                        )}
                    </span>
                </div>
                <div className="space-y-3">
                    {firstSubcommand.parameters.map((param) => (
                        <BotCommandParameterInput
                            key={param.name}
                            commandName={selectedCommand.name}
                            subcommand={firstSubcommandName}
                            parameterName={param.name}
                            parameterType={param.type}
                            description={param.description}
                            required={param.required}
                            guildId={guildId}
                            value={action.parameters?.[param.name] || ""}
                            onChange={(value) =>
                                updateAction(actionIndex, {
                                    parameters: {
                                        ...action.parameters,
                                        [param.name]: value,
                                    },
                                })
                            }
                            hasAutocomplete={param.hasAutocomplete}
                            isMultiSelect={param.isMultiSelect}
                            autocompleteType={param.autocompleteType}
                        />
                    ))}
                </div>
            </div>
        );
    };

    const validation = validateButtonConfig(actualConfig);

    return (
        <div className={`bg-white rounded-lg border ${className}`}>
            {/* 탭 헤더 */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6 py-3">
                    <button
                        onClick={() => setActiveTab("editor")}
                        className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === "editor"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <Settings className="w-4 h-4" />
                        설정 편집
                    </button>
                    <button
                        onClick={() => setActiveTab("preview")}
                        className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === "preview"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <Eye className="w-4 h-4" />
                        미리보기
                    </button>
                    <button
                        onClick={() => setActiveTab("json")}
                        className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === "json"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <Code className="w-4 h-4" />
                        JSON 편집
                    </button>
                </nav>
            </div>

            {/* 탭 콘텐츠 */}
            <div className="p-6">
                {activeTab === "editor" && (
                    <div className="space-y-6">
                        {/* 도구 모음 */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                버튼 자동화 설정
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={loadExample}
                                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                >
                                    예시 불러오기
                                </button>
                                {onSave && (
                                    <button
                                        onClick={onSave}
                                        disabled={!validation.isValid}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Save className="w-4 h-4" />
                                        저장
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 트리거 설정 */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">
                                🎯 실행 조건 (누가)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        실행 권한
                                    </label>
                                    <select
                                        value={
                                            actualConfig.trigger?.type ||
                                            "everyone"
                                        }
                                        onChange={(e) =>
                                            updateTrigger({
                                                type: e.target.value as any,
                                            })
                                        }
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    >
                                        <option value="everyone">
                                            모든 사람
                                        </option>
                                        <option value="role">특정 역할</option>
                                        <option value="user">
                                            특정 사용자
                                        </option>
                                        <option value="admin">관리자만</option>
                                    </select>
                                </div>
                                {(actualConfig.trigger?.type === "role" ||
                                    actualConfig.trigger?.type === "user") && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {actualConfig.trigger?.type ===
                                            "role"
                                                ? "대상 역할"
                                                : "대상 사용자"}
                                        </label>
                                        <select
                                            value={
                                                actualConfig.trigger?.value ||
                                                ""
                                            }
                                            onChange={(e) =>
                                                updateTrigger({
                                                    value: e.target.value,
                                                })
                                            }
                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        >
                                            <option value="">
                                                선택해주세요
                                            </option>
                                            {(config.trigger.type === "role"
                                                ? roles
                                                : users
                                            ).map((item) => (
                                                <option
                                                    key={item.id}
                                                    value={item.id}
                                                >
                                                    {item.name || item.username}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 시스템 상태 정보 */}
                        {enhancedCommandsData?.message && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <InfoIcon className="w-4 h-4 text-yellow-600" />
                                    <span className="text-sm text-yellow-800">
                                        {enhancedCommandsData.message}
                                    </span>
                                </div>
                                {enhancedCommandsData.autocompleteSummary.commandsWithAutocomplete === 0 && (
                                    <div className="text-xs text-yellow-700 mt-1">
                                        자동완성 기능이 일시적으로 비활성화되었습니다.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 액션 설정 */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-900">
                                    ⚡ 실행 동작 (무엇을)
                                </h4>
                                <button
                                    onClick={addAction}
                                    className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    액션 추가
                                </button>
                            </div>

                            <div className="space-y-4">
                                {actualConfig.actions?.map((action, index) => (
                                    <div
                                        key={index}
                                        className="bg-white rounded-lg p-4 border"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-medium text-gray-900">
                                                액션 {index + 1}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    removeAction(index)
                                                }
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    액션 종류
                                                </label>
                                                <select
                                                    value={action.type}
                                                    onChange={(e) => {
                                                        console.log(
                                                            "🎯 [Debug] 액션 타입 선택됨:",
                                                            {
                                                                selectedValue:
                                                                    e.target
                                                                        .value,
                                                                currentType:
                                                                    action.type,
                                                                actionIndex:
                                                                    index,
                                                            }
                                                        );
                                                        updateAction(index, {
                                                            type: e.target
                                                                .value as any,
                                                            parameters: {}, // 타입 변경 시 파라미터 초기화
                                                        });
                                                    }}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                                >
                                                    {Object.entries(
                                                        ACTION_TYPE_CONFIGS
                                                    ).map(([type, config]) => (
                                                        <option
                                                            key={type}
                                                            value={type}
                                                        >
                                                            {config.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    실행 대상
                                                </label>
                                                <select
                                                    value={action.target}
                                                    onChange={(e) =>
                                                        updateAction(index, {
                                                            target: e.target
                                                                .value as any,
                                                        })
                                                    }
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                                >
                                                    <option value="executor">
                                                        버튼을 누른 사람
                                                    </option>
                                                    <option value="specific">
                                                        특정 사용자
                                                    </option>
                                                    <option value="admin">
                                                        관리자
                                                    </option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* 액션별 파라미터 */}
                                        {action.type ===
                                        "execute_bot_command" ? (
                                            <>
                                                {/* 봇 커맨드 선택 */}
                                                <div className="mt-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        실행할 커맨드
                                                        <span className="text-red-500 ml-1">
                                                            *
                                                        </span>
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={
                                                                action
                                                                    .parameters
                                                                    ?.commandName ||
                                                                ""
                                                            }
                                                            onChange={(e) => {
                                                                console.log(
                                                                    "🎯 [Debug] 커맨드 선택 변경:",
                                                                    {
                                                                        selectedCommand:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        availableCommands:
                                                                            botCommands.length,
                                                                        selectedCommandDetails:
                                                                            botCommands.find(
                                                                                (
                                                                                    cmd
                                                                                ) =>
                                                                                    cmd.name ===
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                            ),
                                                                    }
                                                                );

                                                                // 커맨드 변경 시 기존 커맨드별 파라미터 초기화
                                                                const baseParams =
                                                                    {
                                                                        commandName:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        timeout:
                                                                            action
                                                                                .parameters
                                                                                ?.timeout ||
                                                                            30,
                                                                        silent:
                                                                            action
                                                                                .parameters
                                                                                ?.silent ||
                                                                            false,
                                                                    };
                                                                updateAction(
                                                                    index,
                                                                    {
                                                                        parameters:
                                                                            baseParams,
                                                                    }
                                                                );
                                                            }}
                                                            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                                                            disabled={
                                                                loadingCommands
                                                            }
                                                        >
                                                            <option value="">
                                                                커맨드를
                                                                선택하세요
                                                            </option>
                                                            {botCommands.map(
                                                                (command) => (
                                                                    <option
                                                                        key={
                                                                            command.name
                                                                        }
                                                                        value={
                                                                            command.name
                                                                        }
                                                                    >
                                                                        /
                                                                        {
                                                                            command.name
                                                                        }{" "}
                                                                        -{" "}
                                                                        {
                                                                            command.description
                                                                        }
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                        <button
                                                            type="button"
                                                            onClick={() => refetchBotCommands()}
                                                            disabled={
                                                                loadingCommands
                                                            }
                                                            className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
                                                            title="커맨드 목록 새로고침"
                                                        >
                                                            <RefreshCw
                                                                className={`w-4 h-4 ${
                                                                    loadingCommands
                                                                        ? "animate-spin"
                                                                        : ""
                                                                }`}
                                                            />
                                                        </button>
                                                    </div>
                                                    {loadingCommands && (
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            커맨드 목록을
                                                            불러오는 중...
                                                        </p>
                                                    )}
                                                    {commandsError && (
                                                        <p className="text-sm text-red-600 mt-1">
                                                            ❌ {commandsError.message || '커맨드를 불러올 수 없습니다'}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* 기본 봇 커맨드 파라미터 (timeout, silent) */}
                                                <div className="mt-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        실행 타임아웃 (초)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="300"
                                                        value={
                                                            action.parameters
                                                                ?.timeout || 30
                                                        }
                                                        onChange={(e) =>
                                                            updateAction(
                                                                index,
                                                                {
                                                                    parameters:
                                                                        {
                                                                            ...action.parameters,
                                                                            timeout:
                                                                                parseInt(
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                ) ||
                                                                                30,
                                                                        },
                                                                }
                                                            )
                                                        }
                                                        placeholder="30"
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                                    />
                                                </div>

                                                <div className="mt-4">
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                action
                                                                    .parameters
                                                                    ?.silent ||
                                                                false
                                                            }
                                                            onChange={(e) =>
                                                                updateAction(
                                                                    index,
                                                                    {
                                                                        parameters:
                                                                            {
                                                                                ...action.parameters,
                                                                                silent: e
                                                                                    .target
                                                                                    .checked,
                                                                            },
                                                                    }
                                                                )
                                                            }
                                                            className="rounded"
                                                        />
                                                        <span className="text-sm text-gray-700">
                                                            조용히 실행
                                                            (실패해도 오류 표시
                                                            안함)
                                                        </span>
                                                    </label>
                                                </div>

                                                {/* 동적 커맨드 파라미터 */}
                                                {(() => {
                                                    const shouldRender =
                                                        action.parameters
                                                            ?.commandName &&
                                                        botCommands.length > 0;
                                                    console.log(
                                                        "🎯 [Debug] 동적 파라미터 렌더링 조건 확인:",
                                                        {
                                                            actionIndex: index,
                                                            hasCommandName:
                                                                !!action
                                                                    .parameters
                                                                    ?.commandName,
                                                            commandName:
                                                                action
                                                                    .parameters
                                                                    ?.commandName,
                                                            hasBotCommands:
                                                                botCommands.length >
                                                                0,
                                                            botCommandsCount:
                                                                botCommands.length,
                                                            shouldRender,
                                                            actionParameters:
                                                                action.parameters,
                                                        }
                                                    );

                                                    return shouldRender ? (
                                                        renderBotCommandParameters(
                                                            action,
                                                            index
                                                        )
                                                    ) : action.parameters
                                                          ?.commandName ? (
                                                        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                                            <span className="text-sm text-yellow-800">
                                                                커맨드 목록을
                                                                불러오는
                                                                중이거나 선택된
                                                                커맨드를 찾을 수
                                                                없습니다.
                                                            </span>
                                                        </div>
                                                    ) : null;
                                                })()}
                                            </>
                                        ) : (
                                            /* 기존 액션 타입들 */
                                            ACTION_TYPE_CONFIGS[
                                                action.type
                                            ]?.parameters.map((param) => (
                                                <div
                                                    key={param.name}
                                                    className="mt-4"
                                                >
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        {param.label}
                                                        {param.required && (
                                                            <span className="text-red-500 ml-1">
                                                                *
                                                            </span>
                                                        )}
                                                    </label>
                                                    {param.type === "select" ? (
                                                        <select
                                                            value={
                                                                action
                                                                    .parameters?.[
                                                                    param.name
                                                                ] || ""
                                                            }
                                                            onChange={(e) =>
                                                                updateAction(
                                                                    index,
                                                                    {
                                                                        parameters:
                                                                            {
                                                                                ...action.parameters,
                                                                                [param.name]:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            },
                                                                    }
                                                                )
                                                            }
                                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                                        >
                                                            <option value="">
                                                                {
                                                                    param.placeholder
                                                                }
                                                            </option>
                                                            {(param.name.includes(
                                                                "role"
                                                            )
                                                                ? roles
                                                                : param.name.includes(
                                                                      "channel"
                                                                  )
                                                                ? channels
                                                                : param.options ||
                                                                  []
                                                            ).map((item) => (
                                                                <option
                                                                    key={
                                                                        item.id ||
                                                                        item.value
                                                                    }
                                                                    value={
                                                                        item.id ||
                                                                        item.value
                                                                    }
                                                                >
                                                                    {item.name ||
                                                                        item.username ||
                                                                        item.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : param.type ===
                                                      "number" ? (
                                                        <input
                                                            type="number"
                                                            value={
                                                                action
                                                                    .parameters?.[
                                                                    param.name
                                                                ] || ""
                                                            }
                                                            onChange={(e) =>
                                                                updateAction(
                                                                    index,
                                                                    {
                                                                        parameters:
                                                                            {
                                                                                ...action.parameters,
                                                                                [param.name]:
                                                                                    parseInt(
                                                                                        e
                                                                                            .target
                                                                                            .value
                                                                                    ) ||
                                                                                    0,
                                                                            },
                                                                    }
                                                                )
                                                            }
                                                            placeholder={
                                                                param.placeholder
                                                            }
                                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                                        />
                                                    ) : param.type ===
                                                      "boolean" ? (
                                                        <label className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    action
                                                                        .parameters?.[
                                                                        param
                                                                            .name
                                                                    ] || false
                                                                }
                                                                onChange={(e) =>
                                                                    updateAction(
                                                                        index,
                                                                        {
                                                                            parameters:
                                                                                {
                                                                                    ...action.parameters,
                                                                                    [param.name]:
                                                                                        e
                                                                                            .target
                                                                                            .checked,
                                                                                },
                                                                        }
                                                                    )
                                                                }
                                                                className="rounded"
                                                            />
                                                            <span className="text-sm text-gray-700">
                                                                {
                                                                    param.placeholder
                                                                }
                                                            </span>
                                                        </label>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={
                                                                action
                                                                    .parameters?.[
                                                                    param.name
                                                                ] || ""
                                                            }
                                                            onChange={(e) =>
                                                                updateAction(
                                                                    index,
                                                                    {
                                                                        parameters:
                                                                            {
                                                                                ...action.parameters,
                                                                                [param.name]:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            },
                                                                    }
                                                                )
                                                            }
                                                            placeholder={
                                                                param.placeholder
                                                            }
                                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                                        />
                                                    )}
                                                </div>
                                            ))
                                        )}

                                        {/* 지연 시간 설정 */}
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                지연 시간 (초)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={action.delay || 0}
                                                onChange={(e) =>
                                                    updateAction(index, {
                                                        delay:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 0,
                                                    })
                                                }
                                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                            />
                                        </div>
                                    </div>
                                ))}

                                {(!actualConfig.actions ||
                                    actualConfig.actions.length === 0) && (
                                    <div className="text-center py-8 text-gray-500">
                                        아직 액션이 없습니다. "액션 추가" 버튼을
                                        클릭해주세요.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 옵션 설정 */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">
                                ⚙️ 추가 옵션
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={
                                                actualConfig.options
                                                    ?.oncePerUser || false
                                            }
                                            onChange={(e) =>
                                                updateOptions({
                                                    oncePerUser:
                                                        e.target.checked,
                                                })
                                            }
                                            className="rounded"
                                        />
                                        <span className="text-sm text-gray-700">
                                            한 번만 실행 가능
                                        </span>
                                    </label>

                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={
                                                actualConfig.ui?.disableAfter ||
                                                false
                                            }
                                            onChange={(e) =>
                                                updateUI({
                                                    disableAfter:
                                                        e.target.checked,
                                                })
                                            }
                                            className="rounded"
                                        />
                                        <span className="text-sm text-gray-700">
                                            실행 후 버튼 비활성화
                                        </span>
                                    </label>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            쿨다운 (초)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={
                                                actualConfig.options
                                                    ?.cooldownSeconds || 0
                                            }
                                            onChange={(e) =>
                                                updateOptions({
                                                    cooldownSeconds:
                                                        parseInt(
                                                            e.target.value
                                                        ) || 0,
                                                })
                                            }
                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            버튼 스타일
                                        </label>
                                        <select
                                            value={
                                                actualConfig.ui?.style ||
                                                "primary"
                                            }
                                            onChange={(e) =>
                                                updateUI({
                                                    style: e.target
                                                        .value as any,
                                                })
                                            }
                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        >
                                            <option value="primary">
                                                파란색 (기본)
                                            </option>
                                            <option value="secondary">
                                                회색
                                            </option>
                                            <option value="success">
                                                초록색
                                            </option>
                                            <option value="danger">
                                                빨간색
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 오류 표시 */}
                        {!validation.isValid && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <h4 className="font-semibold text-red-700 mb-2">
                                    설정 오류
                                </h4>
                                <ul className="text-red-600 text-sm space-y-1">
                                    {validation.errors.map((error, index) => (
                                        <li key={index}>• {error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "preview" && (
                    <ButtonPreview
                        config={actualConfig}
                        buttonLabel={actualButtonLabel}
                        roles={roles}
                        channels={channels}
                        users={users}
                    />
                )}

                {activeTab === "json" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                JSON 설정 편집
                            </h3>
                            <div className="text-sm text-gray-600">
                                직접 JSON을 편집할 수 있습니다
                            </div>
                        </div>
                        <textarea
                            value={jsonText}
                            onChange={(e) => handleJsonChange(e.target.value)}
                            className="w-full h-96 font-mono text-sm border border-gray-300 rounded-md p-3"
                            placeholder="JSON 설정을 입력하세요..."
                        />
                        {!validation.isValid && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-red-700 text-sm font-medium">
                                    JSON 설정에 오류가 있습니다:
                                </p>
                                <ul className="text-red-600 text-sm mt-1 space-y-1">
                                    {validation.errors.map((error, index) => (
                                        <li key={index}>• {error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConfigEditor;
