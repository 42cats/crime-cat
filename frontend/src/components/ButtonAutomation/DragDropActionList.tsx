import React, { useState } from 'react';
import { Card, Typography, message } from 'antd';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { DragOutlined } from '@ant-design/icons';
import { ActionConfig } from '../../types/buttonAutomation';
import { ACTION_TYPES } from './ActionEditor';

const { Text } = Typography;

interface DragDropActionListProps {
  actions: ActionConfig[];
  onChange: (actions: ActionConfig[]) => void;
  children: (action: ActionConfig, index: number, dragHandleProps: any) => React.ReactNode;
}

export const DragDropActionList: React.FC<DragDropActionListProps> = ({
  actions,
  onChange,
  children
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // 드래그 시작
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // 드래그 종료
  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);

    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return;
    }

    // 액션 순서 변경
    const newActions = Array.from(actions);
    const [movedAction] = newActions.splice(sourceIndex, 1);
    newActions.splice(destinationIndex, 0, movedAction);

    onChange(newActions);
    
    message.success(`액션이 ${sourceIndex + 1}번째에서 ${destinationIndex + 1}번째로 이동되었습니다.`);
  };

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Droppable droppableId="actions">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              backgroundColor: snapshot.isDraggingOver ? '#f0f2f5' : 'transparent',
              borderRadius: 8,
              transition: 'background-color 0.2s ease'
            }}
          >
            {actions.map((action, index) => (
              <Draggable
                key={`action-${index}`}
                draggableId={`action-${index}`}
                index={index}
              >
                {(provided, snapshot) => {
                  const actionType = ACTION_TYPES[action.type as keyof typeof ACTION_TYPES];
                  
                  return (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        ...provided.draggableProps.style,
                        marginBottom: 16,
                        transform: snapshot.isDragging 
                          ? `${provided.draggableProps.style?.transform} rotate(5deg)`
                          : provided.draggableProps.style?.transform,
                        opacity: snapshot.isDragging ? 0.9 : 1,
                        transition: 'transform 0.2s ease, opacity 0.2s ease'
                      }}
                    >
                      <Card
                        size="small"
                        style={{
                          border: snapshot.isDragging ? '2px dashed #1890ff' : '1px solid #d9d9d9',
                          boxShadow: snapshot.isDragging 
                            ? '0 8px 16px rgba(0,0,0,0.15)' 
                            : '0 2px 4px rgba(0,0,0,0.1)',
                          borderRadius: 8,
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              {...provided.dragHandleProps}
                              style={{
                                cursor: 'grab',
                                padding: '4px 8px',
                                borderRadius: 4,
                                backgroundColor: '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 12
                              }}
                            >
                              <DragOutlined />
                              <Text style={{ fontSize: 12, color: '#666' }}>
                                {index + 1}
                              </Text>
                            </div>
                            <span>{actionType?.icon}</span>
                            <span>액션 {index + 1}: {actionType?.label}</span>
                            {snapshot.isDragging && (
                              <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
                                드래그하여 순서 변경
                              </Text>
                            )}
                          </div>
                        }
                      >
                        {children(action, index, provided.dragHandleProps)}
                        
                        {/* 드래그 중일 때 오버레이 */}
                        {snapshot.isDragging && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: 'rgba(24, 144, 255, 0.1)',
                              borderRadius: 8,
                              pointerEvents: 'none'
                            }}
                          />
                        )}
                      </Card>
                    </div>
                  );
                }}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {/* 드롭 영역 안내 */}
            {isDragging && actions.length > 1 && (
              <div
                style={{
                  padding: 16,
                  textAlign: 'center',
                  border: '2px dashed #d9d9d9',
                  borderRadius: 8,
                  backgroundColor: '#fafafa',
                  color: '#666',
                  fontSize: 12
                }}
              >
                여기에 놓으면 맨 마지막으로 이동됩니다
              </div>
            )}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};