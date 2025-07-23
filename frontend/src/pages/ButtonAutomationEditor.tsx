import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Space, message, Tabs, Modal, Empty, Alert } from 'antd';
import { PlusOutlined, SettingOutlined, PlayCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { ButtonAutomationGroup, ButtonAutomation } from '../types/buttonAutomation';
import { ConfigEditor } from '../components/ButtonAutomation/ConfigEditor';
import { ButtonPreview } from '../components/ButtonAutomation/ButtonPreview';
import { GroupForm, GroupFormData } from '../components/ButtonAutomation/GroupForm';
import { ButtonForm, ButtonFormData } from '../components/ButtonAutomation/ButtonForm';
import { buttonAutomationApi, withErrorHandling } from '../lib/api/buttonAutomation';
import { DISCORD_LIMITS, validateButtonCount } from '../utils/validation';

const { Title, Text } = Typography;

interface ButtonAutomationEditorProps {}

export const ButtonAutomationEditor: React.FC<ButtonAutomationEditorProps> = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();
  
  // 상태 관리
  const [groups, setGroups] = useState<ButtonAutomationGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ButtonAutomationGroup | null>(null);
  const [selectedButton, setSelectedButton] = useState<ButtonAutomation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 모달 상태
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [isButtonModalVisible, setIsButtonModalVisible] = useState(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    if (guildId) {
      loadGroups();
    }
  }, [guildId]);

  // API 호출 함수들
  const loadGroups = async () => {
    if (!guildId) return;
    
    try {
      setLoading(true);
      const data = await withErrorHandling(
        () => buttonAutomationApi.getGroups(guildId),
        '그룹 데이터를 불러오는데 실패했습니다.'
      );
      
      setGroups(data);
      if (data.length > 0) {
        setSelectedGroup(data[0]);
      }
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (groupData: GroupFormData) => {
    if (!guildId) return;
    
    try {
      setSaving(true);
      await withErrorHandling(
        () => buttonAutomationApi.createGroup(guildId, groupData),
        '그룹 생성에 실패했습니다.'
      );
      
      await loadGroups();
      setIsGroupModalVisible(false);
    } catch (error: any) {
      message.error(error.message);
      throw error; // GroupForm에서 에러 처리
    } finally {
      setSaving(false);
    }
  };

  const handleCreateButton = async (buttonData: ButtonFormData) => {
    if (!guildId) return;
    
    // 그룹당 버튼 수 제한 검증
    const groupId = buttonData.groupId || selectedGroup?.id;
    const allButtons = groups.flatMap(g => g.buttons || []);
    const buttonCountValidation = validateButtonCount(groupId, allButtons, true);
    
    if (!buttonCountValidation.isValid) {
      message.error(buttonCountValidation.error);
      throw new Error(buttonCountValidation.error);
    }
    
    try {
      setSaving(true);
      const finalButtonData = {
        ...buttonData,
        groupId: groupId
      };
      
      await withErrorHandling(
        () => buttonAutomationApi.createButton(guildId, finalButtonData),
        '버튼 생성에 실패했습니다.'
      );
      
      await loadGroups();
      setIsButtonModalVisible(false);
    } catch (error: any) {
      message.error(error.message);
      throw error; // ButtonForm에서 에러 처리
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateButton = async (buttonId: string, config: string) => {
    if (!guildId || !selectedButton) return;
    
    try {
      setSaving(true);
      const buttonData: ButtonFormData = {
        groupId: selectedButton.groupId,
        buttonLabel: selectedButton.buttonLabel,
        displayOrder: selectedButton.displayOrder,
        config: config,
        isActive: selectedButton.isActive
      };
      
      await withErrorHandling(
        () => buttonAutomationApi.updateButton(guildId, buttonId, buttonData),
        '버튼 업데이트에 실패했습니다.'
      );
      
      await loadGroups();
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  // 렌더링 함수들
  const renderGroupList = () => (
    <Card 
      title=\"자동화 그룹\" 
      extra={
        <Button 
          type=\"primary\" 
          icon={<PlusOutlined />} 
          onClick={() => setIsGroupModalVisible(true)}
        >
          그룹 추가
        </Button>
      }
      style={{ marginBottom: 16 }}
    >
      {groups.length === 0 ? (
        <Empty description=\"생성된 그룹이 없습니다\" />
      ) : (
        <Tabs 
          activeKey={selectedGroup?.id} 
          onChange={(key) => {
            const group = groups.find(g => g.id === key);
            setSelectedGroup(group || null);
            setSelectedButton(null);
          }}
          items={groups.map(group => ({
            key: group.id,
            label: `${group.name} (${group.buttons?.length || 0})`,
            children: renderButtonList(group)
          }))}
        />
      )}
    </Card>
  );

  const renderButtonList = (group: ButtonAutomationGroup) => {
    const allButtons = groups.flatMap(g => g.buttons || []);
    const buttonCountValidation = validateButtonCount(group.id, allButtons, false);
    const canAddButton = buttonCountValidation.currentCount < DISCORD_LIMITS.MAX_BUTTONS_PER_GROUP;
    
    return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>버튼 목록</Title>
          <Text type="secondary">
            {buttonCountValidation.currentCount} / {DISCORD_LIMITS.MAX_BUTTONS_PER_GROUP}개
          </Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsButtonModalVisible(true)}
          disabled={!canAddButton}
        >
          버튼 추가 {!canAddButton && '(최대 도달)'}
        </Button>
      </div>
      
      {!canAddButton && (
        <Alert
          type="warning"
          message={`그룹당 최대 ${DISCORD_LIMITS.MAX_BUTTONS_PER_GROUP}개의 버튼까지만 생성할 수 있습니다.`}
          description="Discord의 한 메시지당 버튼 제한으로 인한 제약입니다."
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}
      
      {!group.buttons || group.buttons.length === 0 ? (
        <Empty description=\"생성된 버튼이 없습니다\" />
      ) : (
        <Space direction=\"vertical\" style={{ width: '100%' }}>
          {group.buttons.map(button => (
            <Card 
              key={button.id}
              size=\"small\"
              actions={[
                <SettingOutlined 
                  key=\"edit\" 
                  onClick={() => setSelectedButton(button)} 
                />,
                <PlayCircleOutlined 
                  key=\"preview\" 
                  onClick={() => {
                    setSelectedButton(button);
                    setIsPreviewModalVisible(true);
                  }} 
                />
              ]}
            >
              <Card.Meta 
                title={button.buttonLabel}
                description={
                  <Text type=\"secondary\">
                    활성: {button.isActive ? '예' : '아니오'} | 
                    순서: {button.displayOrder}
                  </Text>
                }
              />
            </Card>
          ))}
        </Space>
      )}
    </div>
    );
  };

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>로딩 중...</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Discord 자동화 버튼 관리</Title>
        <Text type=\"secondary\">
          사용자가 버튼을 클릭했을 때 자동으로 실행될 작업들을 설정합니다.
        </Text>
      </div>

      {renderGroupList()}

      {/* 버튼 설정 에디터 */}
      {selectedButton && !isPreviewModalVisible && (
        <ConfigEditor 
          button={selectedButton}
          onSave={(config) => handleUpdateButton(selectedButton.id, config)}
          onCancel={() => setSelectedButton(null)}
          loading={saving}
        />
      )}

      {/* 그룹 생성 모달 */}
      <Modal
        title="새 그룹 생성"
        visible={isGroupModalVisible}
        onCancel={() => setIsGroupModalVisible(false)}
        footer={null}
        width={700}
        destroyOnHidden
      >
        <GroupForm 
          onSubmit={handleCreateGroup}
          onCancel={() => setIsGroupModalVisible(false)}
          loading={saving}
        />
      </Modal>

      {/* 버튼 생성 모달 */}
      <Modal
        title="새 버튼 생성"
        visible={isButtonModalVisible}
        onCancel={() => setIsButtonModalVisible(false)}
        footer={null}
        width={900}
        destroyOnHidden
      >
        <ButtonForm 
          groupId={selectedGroup?.id}
          guildId={guildId}
          onSubmit={handleCreateButton}
          onCancel={() => setIsButtonModalVisible(false)}
          loading={saving}
        />
      </Modal>

      {/* 미리보기 모달 */}
      <Modal
        title=\"버튼 실행 미리보기\"
        visible={isPreviewModalVisible}
        onCancel={() => {
          setIsPreviewModalVisible(false);
          setSelectedButton(null);
        }}
        footer={null}
        width={800}
      >
        {selectedButton && (
          <ButtonPreview 
            button={selectedButton}
          />
        )}
      </Modal>
    </div>
  );
};